import { Suspense } from "react";
import { fetchQDIIFunds, extractAllCategories, getLastUpdateTime, type QDIIFund } from "@/lib/qdiidata";
import { DashboardClient } from "@/components/dashboard-client";
import { LoadingIndicator } from "@/components/loading-indicator";

export const dynamic = "force-dynamic";

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
