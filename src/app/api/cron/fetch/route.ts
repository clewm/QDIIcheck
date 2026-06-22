import { NextResponse } from "next/server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import {
  fetchQDIIFunds,
  enrichWithF10,
  getLastUpdateTime,
} from "@/lib/qdiidata";
import { getAllSubscriptions } from "@/lib/subscriptions";
import { sendNotificationEmail } from "@/lib/email";
import type { FundChangeInfo } from "@/lib/email";
import type { QDIIFund } from "@/lib/types";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// History helpers — 保留最近 3 个交易日的快照
// ---------------------------------------------------------------------------

interface SnapshotEntry {
  purchaseStatus: "open" | "limited" | "suspended";
  limitAmount: number;
}

interface Snapshot {
  date: string; // YYYY-MM-DD
  funds: Record<string, SnapshotEntry>;
}

interface HistoryPayload {
  snapshots: Snapshot[];
}

/** 只保留比较所需的字段，减小历史体积 */
function toSnapshot(funds: QDIIFund[], date: string): Snapshot {
  const entries: Record<string, SnapshotEntry> = {};
  for (const f of funds) {
    entries[f.code] = {
      purchaseStatus: f.purchaseStatus,
      limitAmount: f.limitAmount,
    };
  }
  return { date, funds: entries };
}

/** 读取历史 */
async function loadHistory(maxSnapshots = 3): Promise<HistoryPayload> {
  const raw = await getStorage().getFundHistory();
  try {
    const payload: HistoryPayload = JSON.parse(raw);
    return {
      snapshots: (payload.snapshots ?? []).slice(0, maxSnapshots),
    };
  } catch {
    return { snapshots: [] };
  }
}

/** 保存历史，裁剪到最近 N 个 */
async function saveHistory(history: HistoryPayload, maxSnapshots = 3) {
  history.snapshots = history.snapshots.slice(0, maxSnapshots);
  await getStorage().saveFundHistory(JSON.stringify(history));
}

/**
 * 对比当前数据 vs 最新快照，生成变化 Map
 */
function buildChangeMap(
  currentFunds: QDIIFund[],
  latestSnapshot: Snapshot | undefined,
): Map<string, FundChangeInfo> {
  const changes = new Map<string, FundChangeInfo>();
  if (!latestSnapshot) return changes;

  for (const fund of currentFunds) {
    const old = latestSnapshot.funds[fund.code];
    if (
      old &&
      (old.purchaseStatus !== fund.purchaseStatus ||
        old.limitAmount !== fund.limitAmount)
    ) {
      changes.set(fund.code, {
        oldStatus: old.purchaseStatus,
        oldLimit: old.limitAmount,
      });
    }
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Cron handler
// ---------------------------------------------------------------------------

/**
 * GET /api/cron/fetch
 * 定时任务入口 — 每日执行
 * 1. 读取历史快照（用于对比限额变化）
 * 2. 从 API 拉取基础数据（~2 秒）
 * 3. **同步** 用 F10 补充准确限额 → 写入 S3 缓存 + 历史快照 → 刷新 ISR
 * 4. 响应后，对比新旧数据，向订阅者发送带变化标记的邮件
 *
 * ⚠️ 第 3 步必须在响应前同步完成 —— 不能放进 after()。
 *    Tencent EdgeOne Pages 上 after() 不可靠（平台可能在响应后立即回收运行时），
 *    若 enrichment 放在 after() 里，S3 永远拿不到正确数据，旧缓存 24h TTL 到期后
 *    整站就会回退到未 enrichment 的 API 原始数据（限额基金全部显示"不限额"或"—"）。
 *    邮件发送（非关键）才放进 after()，被裁掉也不影响数据正确性。
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 邮件开关：默认发送；?email=false 时本次不发（用于手动触发刷新数据但不想打扰订阅者）
  const sendEmail =
    new URL(request.url).searchParams.get("email") !== "false";

  try {
    // 阶段 0：读取历史快照
    const history = await loadHistory();
    const latestSnapshot = history.snapshots[0]; // 最近一个交易日

    // 阶段 1：从 API 拉取基础数据（~2 秒）
    const allFunds = await fetchQDIIFunds(true);
    const fundCount = allFunds.length;

    // 阶段 2：同步 F10 enrichment + 写 S3 + 刷新 ISR（响应前必须完成）
    await enrichWithF10(allFunds);
    revalidatePath("/");
    revalidatePath("/fund/[code]", "page");

    // 保存当天快照到历史（保留最近 3 个交易日）
    const today = new Date().toISOString().slice(0, 10);
    history.snapshots.unshift(toSnapshot(allFunds, today));
    await saveHistory(history);

    const lastUpdate = new Date(getLastUpdateTime()).toISOString();

    // 对比当前 vs 最新快照，生成变化
    const changes = buildChangeMap(allFunds, latestSnapshot);

    // 阶段 3：邮件发送放进 after() —— 非关键路径，被平台裁掉也不影响数据正确性
    // sendEmail=false 时跳过（用于手动刷新数据但不想发邮件）
    if (sendEmail) {
      after(async () => {
        try {
          // 邮件按「北京自然日」去重 —— 每个北京日最多发一次，
          // 与 EasyCron 实际调用时刻/频次无关（同一天多次调用也只发一封）
          const beijingToday = new Date(Date.now() + 8 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
          const lastEmailDate = await getStorage().getLastEmailDate();

          if (lastEmailDate === beijingToday) return;

          const subscriptions = await getAllSubscriptions();
          for (const sub of subscriptions) {
            try {
              const followedFunds = allFunds.filter((f) =>
                sub.fundCodes.includes(f.code),
              );
              const newFunds = allFunds
                .filter((f) => f.sinceInception === 0)
                .slice(0, 10);

              // 邮件变化只包含该用户关注的基金
              const followedChanges = new Map<string, FundChangeInfo>();
              for (const [code, info] of changes) {
                if (sub.fundCodes.includes(code)) {
                  followedChanges.set(code, info);
                }
              }

              await sendNotificationEmail(
                sub.email,
                followedFunds.length > 0 ? followedFunds : allFunds.slice(0, 20),
                newFunds,
                followedChanges,
              );
            } catch (error) {
              console.error(`Email failed for ${sub.email}:`, error);
            }
          }

          // 标记今天已发送，避免同一天重复发送
          await getStorage().saveLastEmailDate(beijingToday);
        } catch (error) {
          console.error("Background email failed:", error);
        }
      });
    }

    return NextResponse.json({
      funds: fundCount,
      lastUpdate,
      emailScheduled: sendEmail,
      message: sendEmail
        ? "Data fetched + F10 enriched + S3 updated, email scheduled"
        : "Data fetched + F10 enriched + S3 updated, email skipped (email=false)",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
