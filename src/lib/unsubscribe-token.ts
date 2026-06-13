/**
 * 邮件退订 token 生成与验证
 * 使用 HMAC-SHA256，无需存储额外状态
 */

import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.UNSUB_SECRET || process.env.CRON_SECRET;
  if (!secret) throw new Error("UNSUB_SECRET or CRON_SECRET must be set");
  return secret;
}

/** 为邮箱生成退订 token */
export function generateUnsubToken(email: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(email.toLowerCase().trim())
    .digest("base64url");
}

/** 验证退订 token 是否有效 */
export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = generateUnsubToken(email);
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/** 生成完整的退订 URL */
export function buildUnsubUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://qdii-watch.vercel.app";
  const token = generateUnsubToken(email);
  const params = new URLSearchParams({ email, token });
  return `${base}/api/unsubscribe?${params}`;
}
