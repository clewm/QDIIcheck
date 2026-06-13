/**
 * 测试邮件发送脚本
 * 模拟真实 cron 流程：先写入历史快照，再对比变化，发送邮件
 *
 * 用法: npx tsx scripts/test-email.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { upsertSubscription } from "../src/lib/subscriptions";
import { fetchFundsFromAPI, enrichWithF10 } from "../src/lib/qdiidata";
import { sendNotificationEmail } from "../src/lib/email";
import type { FundChangeInfo } from "../src/lib/email";
import { getStorage } from "../src/lib/storage";

const TEST_EMAIL = "1012293663@qq.com";

// 热门 QDII 基金
const POPULAR_FUNDS = [
  "005698", // 华夏全球科技先锋混合(QDII)A
  "024239", // 华夏全球科技先锋混合(QDII)C
  "012920", // 易方达全球成长精选混合(QDII)A
  "164212", // 天弘全球新能源汽车股票(QDII-LOF)A
  "501225", // 景顺长城全球半导体芯片股票A(QDII-LOF)
  "006373", // 国富全球科技互联混合(QDII)A
  "002891", // 华夏移动互联混合人民币
  "100055", // 富国全球科技互联网股票(QDII)A
];

async function main() {
  console.log("=== QDII Watch 邮件发送测试 ===\n");

  // Step 1: 订阅
  console.log(`[1/5] 订阅 ${TEST_EMAIL}，关注 ${POPULAR_FUNDS.length} 只基金...`);
  await upsertSubscription(TEST_EMAIL, "09:00", POPULAR_FUNDS);
  console.log("  ✅ 订阅成功\n");

  // Step 2: 拉取 + enrich 数据
  console.log("[2/5] 拉取基金数据 + F10 限额...");
  const funds = await fetchFundsFromAPI();
  await enrichWithF10(funds);
  const followed = funds.filter((f) => POPULAR_FUNDS.includes(f.code));
  console.log(`  ✅ ${funds.length} 只基金，关注 ${followed.length} 只\n`);

  // Step 3: 读取现有历史快照
  console.log("[3/5] 读取历史快照...");
  let history: { snapshots: any[] };
  try {
    const raw = await getStorage().getFundHistory();
    history = JSON.parse(raw);
  } catch {
    history = { snapshots: [] };
  }
  const latestSnapshot = history.snapshots?.[0];
  if (latestSnapshot) {
    console.log(`  最新快照: ${latestSnapshot.date}，${Object.keys(latestSnapshot.funds).length} 只基金`);
  } else {
    console.log("  无历史快照（首次运行）");
  }
  console.log();

  // Step 4: 生成变化 — 优先真实变化，无变化时注入模拟数据以展示邮件效果
  console.log("[4/5] 计算限额变化...");
  const changes = new Map<string, FundChangeInfo>();

  if (latestSnapshot) {
    for (const f of followed) {
      const old = latestSnapshot.funds[f.code];
      if (old && (old.purchaseStatus !== f.purchaseStatus || old.limitAmount !== f.limitAmount)) {
        changes.set(f.code, { oldStatus: old.purchaseStatus, oldLimit: old.limitAmount });
        console.log(`  ${f.code}: ${statusText(old.purchaseStatus, old.limitAmount)} → ${statusText(f.purchaseStatus, f.limitAmount)}`);
      }
    }
  }

  if (changes.size === 0) {
    console.log("  无真实变化，注入模拟数据以展示邮件效果");
    changes.set("005698", { oldStatus: "open", oldLimit: 0 });
    changes.set("006373", { oldStatus: "limited", oldLimit: 5000 });
    changes.set("501225", { oldStatus: "limited", oldLimit: 10000 });
    changes.set("002891", { oldStatus: "limited", oldLimit: 2000 });
  }
  console.log();

  // Step 5: 发送邮件
  console.log(`[5/5] 发送邮件到 ${TEST_EMAIL}...`);
  await sendNotificationEmail(TEST_EMAIL, followed, [], "09:00", changes);
  console.log("  ✅ 邮件发送成功！\n");

  // 保存今天的历史快照（模拟 cron 的行为）
  const today = new Date().toISOString().slice(0, 10);
  const toSnapshot = (fundList: typeof funds) => {
    const entries: Record<string, { purchaseStatus: string; limitAmount: number }> = {};
    for (const f of fundList) {
      entries[f.code] = { purchaseStatus: f.purchaseStatus, limitAmount: f.limitAmount };
    }
    return { date: today, funds: entries };
  };
  history.snapshots = [toSnapshot(funds), ...(history.snapshots ?? [])].slice(0, 3);
  await getStorage().saveFundHistory(JSON.stringify(history));
  console.log(`  📦 已保存快照 ${today}（共 ${history.snapshots.length} 个）\n`);

  console.log("=== 测试完成 ===");
}

function statusText(status: string, limit: number): string {
  if (status === "open") return "不限额";
  if (limit <= 0) return "暂停申购";
  return `${limit}元`;
}

main().catch((err) => {
  console.error("❌ 测试失败:", err);
  process.exit(1);
});
