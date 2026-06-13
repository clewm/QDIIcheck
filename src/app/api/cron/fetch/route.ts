import { NextResponse } from "next/server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchQDIIFunds, enrichWithF10, getLastUpdateTime } from "@/lib/qdiidata";
import { getAllSubscriptions } from "@/lib/subscriptions";
import { sendNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/fetch
 * 定时任务入口 — 每日执行
 * 1. 从 API 快速拉取基础数据（~2 秒）→ 立即写入 S3 → 立即响应
 * 2. 响应后，后台用 F10 补充准确限额 → 更新 S3 → 刷新 ISR
 * 3. 向订阅者发送邮件
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 阶段 1：快速拉取 API 数据 + 保存到 S3（~2 秒）
    const allFunds = await fetchQDIIFunds(true);
    const fundCount = allFunds.length;
    const lastUpdate = new Date(getLastUpdateTime()).toISOString();

    // 阶段 2：响应后，后台补充 F10 准确限额数据
    after(async () => {
      try {
        await enrichWithF10(allFunds);

        // F10 数据更新后刷新 ISR 缓存
        revalidatePath("/");
        revalidatePath("/fund/[code]", "page");

        // 发送邮件通知
        const subscriptions = await getAllSubscriptions();
        for (const sub of subscriptions) {
          try {
            const followedFunds = allFunds.filter((f) =>
              sub.fundCodes.includes(f.code)
            );
            const newFunds = allFunds
              .filter((f) => f.sinceInception === 0)
              .slice(0, 10);

            await sendNotificationEmail(
              sub.email,
              followedFunds.length > 0 ? followedFunds : allFunds.slice(0, 20),
              newFunds,
              sub.notifyTime
            );
          } catch (error) {
            console.error(`Email failed for ${sub.email}:`, error);
          }
        }
      } catch (error) {
        console.error("Background enrichment failed:", error);
      }
    });

    // 立即返回，不等待 F10 爬取
    return NextResponse.json({
      funds: fundCount,
      lastUpdate,
      message: "API data saved, F10 enrichment running in background",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
