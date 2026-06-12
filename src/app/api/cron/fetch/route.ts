import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAllSubscriptions } from "@/lib/subscriptions";
import { fetchQDIIFunds } from "@/lib/qdiidata";
import { sendNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/fetch
 * 定时任务入口 — 每日执行
 * 1. 拉取最新 QDII 数据（写入 S3 缓存）
 * 2. 刷新页面 ISR 缓存
 * 3. 向所有订阅者发送邮件
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 拉取最新数据（含 F10 准确限额）→ 自动写入 S3 缓存
    const allFunds = await fetchQDIIFunds();

    // 刷新首页和基金详情页的 ISR 缓存
    revalidatePath("/");
    revalidatePath("/fund/[code]", "page");

    // 获取所有活跃订阅
    const subscriptions = await getAllSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({ funds: allFunds.length, message: "Data refreshed, no active subscriptions" });
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const followedFunds = allFunds.filter((f) =>
          sub.fundCodes.includes(f.code)
        );

        const newFunds = allFunds
          .filter((f) => {
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

    return NextResponse.json({ funds: allFunds.length, sent, failed, total: subscriptions.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
