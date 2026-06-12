import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchQDIIFunds } from "@/lib/qdiidata";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pct, statusConfig } from "@/components/shared";

export const dynamic = "force-dynamic";

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let funds;
  try {
    funds = await fetchQDIIFunds();
  } catch {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">加载失败</p>
      </div>
    );
  }

  const fund = funds.find((f) => f.code === code);
  if (!fund) notFound();

  const st = statusConfig[fund.purchaseStatus];

  const perfRows = [
    { label: "日涨跌", value: fund.dayChange },
    { label: "近1周", value: fund.week1 },
    { label: "近1月", value: fund.month1 },
    { label: "近3月", value: fund.month3 },
    { label: "近6月", value: fund.month6 },
    { label: "近1年", value: fund.year1 },
    { label: "近2年", value: fund.year2 },
    { label: "近3年", value: fund.year3 },
    { label: "今年以来", value: fund.ytd },
    { label: "成立以来", value: fund.sinceInception },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link
            href="/"
            aria-label="返回首页"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {fund.name}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              {fund.code} · QDII
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-8">
        {/* NAV + Change */}
        <div className="px-4 pt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full shrink-0",
                    st.dot
                  )}
                />
                <span className="text-lg font-medium">{st.label}</span>
              </div>

              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-mono text-3xl font-bold tabular-nums">
                  {fund.nav.toFixed(4)}
                </span>
                <Pct value={fund.dayChange} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground">
                净值日期: {fund.navDate}
              </p>

              {/* Tags */}
              <div className="flex gap-1.5 flex-wrap mt-4">
                {fund.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Info */}
        <div className="px-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">申购状态</p>
                  <p className="font-medium mt-1">{st.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">起购金额</p>
                  <p className="font-medium mt-1 font-mono">
                    {fund.minPurchase || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">优惠费率</p>
                  <p className="font-medium mt-1 font-mono">
                    {fund.feeRate || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <div className="px-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-medium mb-3">业绩表现</h2>
              <div className="space-y-2.5">
                {perfRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {row.label}
                    </span>
                    <Pct value={row.value} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
