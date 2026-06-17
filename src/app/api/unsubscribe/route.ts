import { NextResponse } from "next/server";
import { verifyUnsubToken } from "@/lib/unsubscribe-token";
import { deactivateSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/**
 * GET /api/unsubscribe?email=xxx&token=xxx
 * 邮件中的退订链接 — 点击后取消订阅，重定向到首页
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const base = process.env.NEXT_PUBLIC_BASE_URL || "/";

  if (!email || !token) {
    return NextResponse.redirect(
      `${base}?unsub=error&msg=${encodeURIComponent("链接无效")}`,
    );
  }

  if (!verifyUnsubToken(email, token)) {
    return NextResponse.redirect(
      `${base}?unsub=error&msg=${encodeURIComponent("链接已过期或无效")}`,
    );
  }

  try {
    const ok = await deactivateSubscription(email);
    if (ok) {
      return NextResponse.redirect(`${base}?unsub=success`);
    }
    return NextResponse.redirect(
      `${base}?unsub=error&msg=${encodeURIComponent("未找到订阅记录，可能已退订")}`,
    );
  } catch {
    return NextResponse.redirect(
      `${base}?unsub=error&msg=${encodeURIComponent("操作失败，请稍后重试")}`,
    );
  }
}
