/**
 * 调试脚本：检查单只基金在 API 原始数据、F10 直抓、enrichment 后三阶段的状态
 * 用法: npx tsx scripts/debug-fund.ts 012920
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { fetchFundsFromAPI, enrichWithF10 } from "../src/lib/qdiidata";
import { batchFetchF10 } from "../src/lib/scraper";

const targetCode = process.argv[2] || "012920";

async function main() {
  console.log(`=== 调试基金 ${targetCode} ===\n`);

  console.log("[1] API 原始数据（fetchFundsFromAPI）：");
  const funds = await fetchFundsFromAPI();
  const apiFund = funds.find((f) => f.code === targetCode);
  if (!apiFund) {
    console.log(`    ❌ API 返回里没有 ${targetCode}！`);
    console.log(`    （这本身可能就是问题——代码不在 QDII 列表里）`);
    // 列出相近代码
    const similar = funds.filter((f) => f.code.startsWith(targetCode.slice(0, 3))).slice(0, 5);
    console.log(`    相近代码: ${similar.map((f) => f.code).join(", ")}`);
  } else {
    console.log(`    名称: ${apiFund.name}`);
    console.log(`    purchaseStatus: ${apiFund.purchaseStatus}`);
    console.log(`    limitAmount: ${apiFund.limitAmount}`);
  }
  console.log();

  console.log("[2] F10 直抓（batchFetchF10 单只）：");
  const f10 = await batchFetchF10([targetCode], 1);
  console.log(`    结果:`, f10.get(targetCode) ?? "（未返回——抓取抛错被跳过）");
  console.log();

  console.log("[3] enrichWithF10 全量后该基金状态：");
  await enrichWithF10(funds);
  const after = funds.find((f) => f.code === targetCode);
  if (after) {
    console.log(`    purchaseStatus: ${after.purchaseStatus}`);
    console.log(`    limitAmount: ${after.limitAmount}`);
    const display =
      after.purchaseStatus === "open"
        ? "不限额"
        : after.limitAmount > 0
          ? `${after.limitAmount}元`
          : "—";
    console.log(`    页面会显示: ${display}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
