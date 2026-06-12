import { NextResponse } from "next/server";
import { getAllSubscriptions } from "@/lib/subscriptions";
import { fetchQDIIFunds } from "@/lib/qdiidata";
import { sendNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/fetch
 * Vercel Cron 入口 — 每个交易日执行
 * 1. 拉取最新 QDII 数据
 * 2. 向所有订阅者发送邮件
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 拉取最新数据（含 F10 准确限额）
    const allFunds = await fetchQDIIFunds();

    // 获取所有活跃订阅
    const subscriptions = await getAllSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({ message: "No active subscriptions" });
    }

    const now = new Date();
    // 简化：对所有订阅者都发送，实际可按 notifyTime 过滤

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        // 找到用户关注的基金
        const followedFunds = allFunds.filter((f) =>
          sub.fundCodes.includes(f.code)
        );

        // 找出新增的 QDII 基金（近 7 天内成立的）
        const newFunds = allFunds
          .filter((f) => {
            // 简单判断：sinceInception 为 0 可能是新基金
            return f.sinceInception === 0;
          })
          .slice(0, 10);

        await sendNotificationEmail(
          sub.email,
          followedFunds.length > 0 ? followedFunds : allFunds.slice(0, 20),
          newFunds,
          sub.notifyTime
        );
        sent++;
      } catch (error) {
        console.error(`Email failed for ${sub.email}:`, error);
        failed++;
      }
    }

    return NextResponse.json({ sent, failed, total: subscriptions.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
