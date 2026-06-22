/**
 * 一次性修复脚本：强制重新抓取 QDII 全量数据 + F10 enrichment + 写入 S3
 *
 * 适用场景：网站数据出问题（限额基金全显示"不限额"/"—"）、
 * S3 缓存被脏数据污染、或想手动刷新而不等 cron。
 *
 * 前置条件：
 *   1. 项目根目录创建 .env.local，填入 S3 凭证：
 *        S3_ENDPOINT=...
 *        S3_REGION=...
 *        S3_BUCKET=...
 *        S3_ACCESS_KEY=...
 *        S3_SECRET_KEY=...
 *   2. 已执行 npm install
 *
 * 用法: npx tsx scripts/refresh-s3.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { fetchFundsFromAPI, enrichWithF10 } from "../src/lib/qdiidata";
import { getStorage } from "../src/lib/storage";

function fmtLimit(amount: number, status: string): string {
  if (status === "suspended") return "暂停申购";
  if (amount <= 0) return status === "limited" ? "限额(金额未知)" : "不限额";
  if (amount >= 10000) {
    const wan = amount / 10000;
    return `${Number.isInteger(wan) ? wan : wan.toFixed(2)}万元`;
  }
  return `${amount}元`;
}

async function main() {
  console.log("=== QDII Watch S3 数据强制刷新 ===\n");

  console.log("[1/3] 从天天基金 API 抓取 QDII 基础数据…");
  const funds = await fetchFundsFromAPI();
  console.log(`    → 获取 ${funds.length} 只基金\n`);

  console.log("[2/3] F10 enrichment（补充准确申购状态 + 日累计限额，约 15-25 秒）…");
  const t0 = Date.now();
  await enrichWithF10(funds); // 内部会在成功率 ≥ 50% 时写入 S3
  console.log(`    → 完成，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  const limited = funds.filter((f) => f.purchaseStatus === "limited");
  const open = funds.filter((f) => f.purchaseStatus === "open");
  const suspended = funds.filter((f) => f.purchaseStatus === "suspended");

  console.log("[3/3] 汇总：");
  console.log(`    开放申购（不限额）: ${open.length}`);
  console.log(`    限大额           : ${limited.length}`);
  console.log(`    暂停申购         : ${suspended.length}\n`);

  // 抽样展示几只限额基金，确认数据正确
  console.log("限额基金抽样（前 10 只）:");
  for (const f of limited.slice(0, 10)) {
    console.log(
      `    ${f.code}  ${f.name.slice(0, 24).padEnd(26)} ${fmtLimit(f.limitAmount, f.purchaseStatus)}`,
    );
  }

  // 校验 S3 里现在确实有 enriched 数据
  console.log("\n校验 S3 缓存…");
  const cached = await getStorage().getQDIICache();
  if (!cached) {
    console.error("    ❌ S3 读取为空 —— enrichment 可能大面积失败，未写入。检查上方日志。");
    process.exit(1);
  }
  const payload = JSON.parse(cached);
  const cachedFunds: typeof funds = payload.data;
  const cachedLimited = cachedFunds.filter(
    (f) => f.purchaseStatus === "limited" && f.limitAmount > 0,
  ).length;
  console.log(
    `    ✅ S3 已写入：${cachedFunds.length} 只基金，其中 ${cachedLimited} 只有明确限额` +
      `，更新时间 ${new Date(payload.ts).toISOString()}`,
  );

  console.log("\n=== 完成。网站首页会在 ISR 重新生成后显示正确数据 ===");
}

main().catch((err) => {
  console.error("❌ 刷新失败:", err);
  process.exit(1);
});
