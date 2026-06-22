import { Suspense } from "react";
import { fetchQDIIFunds, extractAllCategories, getLastUpdateTime } from "@/lib/qdiidata";
import type { QDIIFund } from "@/lib/types";
import { DashboardClient } from "@/components/dashboard-client";
import { LoadingIndicator } from "@/components/loading-indicator";

// 使用 ISR：页面缓存 5 分钟。cron 更新数据后会 revalidatePath 主动刷新；
// 但 EdgeOne CDN 不一定响应 revalidatePath，所以把窗口压到 5 分钟，
// 即使主动刷新失效，最坏情况几分钟内也会自动愈合（读到 S3 的最新 enriched 数据）。
export const revalidate = 300;

async function DashboardContent() {
  let funds: QDIIFund[] = [];
  try {
    funds = await fetchQDIIFunds();
  } catch {
    // fetch failed
  }

  const categories = extractAllCategories(funds);
  const lastUpdate = getLastUpdateTime();

  return (
    <DashboardClient
      initialFunds={funds}
      categories={categories}
      lastUpdate={lastUpdate}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <DashboardContent />
    </Suspense>
  );
}
