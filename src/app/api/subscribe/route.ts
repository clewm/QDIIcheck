import { NextResponse } from "next/server";
import {
  upsertSubscription,
  deactivateSubscription,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscribe
 * 创建或更新邮件订阅
 */
export async function POST(request: Request) {
  try {
    const { email, fundCodes } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
    }
    if (!Array.isArray(fundCodes) || fundCodes.length === 0) {
      return NextResponse.json(
        { error: "请至少关注一只基金" },
        { status: 400 }
      );
    }

    const sub = await upsertSubscription(email, fundCodes);
    return NextResponse.json({ ok: true, subscription: sub });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "订阅失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscribe
 * 取消订阅
 */
export async function DELETE(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "缺少邮箱" }, { status: 400 });
    }

    const ok = await deactivateSubscription(email);
    return NextResponse.json({ ok });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "取消失败" },
      { status: 500 }
    );
  }
}
