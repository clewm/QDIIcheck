"use client";

import { useEffect, useRef } from "react";
import type { QDIIFund } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pct, statusConfig, formatLimit } from "@/components/shared";

interface Props {
  fund: QDIIFund | null;
  onClose: () => void;
}

export function FundDetailModal({ fund, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape key + scroll lock
  useEffect(() => {
    if (!fund) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [fund, onClose]);

  if (!fund) return null;

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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${fund.name} 详情`}
          className="relative bg-card border border-border rounded-xl w-full max-w-md my-8 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="sticky top-0 z-10 flex items-start justify-between bg-card p-6 pb-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "inline-block h-3 w-3 rounded-full",
                    st.dot
                  )}
                />
                <Badge variant="outline" className="text-xs">
                  {st.label}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold leading-tight pr-2">
                {fund.name}
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {fund.code} · QDII
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="shrink-0 mt-1 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 pt-4 space-y-5">
            {/* NAV */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-3xl font-bold tabular-nums">
                  {fund.nav.toFixed(4)}
                </span>
                <Pct value={fund.dayChange} size="lg" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                净值日期 {fund.navDate}
              </p>
            </div>

            {/* Limit */}
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground mb-1">每日申购限额</p>
              <p
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums",
                  fund.purchaseStatus === "open"
                    ? "text-green-400"
                    : fund.limitAmount >= 100000
                      ? "text-green-400"
                      : fund.limitAmount >= 10000
                        ? "text-yellow-400"
                        : "text-orange-400"
                )}
              >
                {fund.purchaseStatus === "open"
                  ? "不限额"
                  : formatLimit(fund.limitAmount, fund.purchaseStatus)}
              </p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">起购金额</p>
                <p className="font-medium font-mono mt-0.5">
                  {fund.minPurchase || "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">优惠费率</p>
                <p className="font-medium font-mono mt-0.5">
                  {fund.feeRate || "—"}
                </p>
              </div>
            </div>

            {/* Categories */}
            {fund.categories.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {fund.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}

            {/* Performance */}
            <div>
              <h3 className="text-sm font-medium mb-3">业绩表现</h3>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
