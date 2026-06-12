import { Suspense } from "react";
import { fetchQDIIFunds, extractAllCategories, getLastUpdateTime } from "@/lib/qdiidata";
import type { QDIIFund } from "@/lib/types";
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
