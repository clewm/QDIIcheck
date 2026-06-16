"use client";

import type { QDIIFund } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { Pct, statusConfig, formatLimit, limitColor } from "@/components/shared";

interface FundCardProps {
  fund: QDIIFund;
  following?: boolean;
  onToggleFollow?: (code: string) => void;
  onClick?: (fund: QDIIFund) => void;
}

export function FundCard({
  fund,
  following,
  onToggleFollow,
  onClick,
}: FundCardProps) {
  const st = statusConfig[fund.purchaseStatus];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(fund);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      title={fund.name}
      className="hover:bg-accent/50 transition-colors duration-150 h-full relative group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={() => onClick?.(fund)}
      onKeyDown={handleKeyDown}
    >
      {/* Follow button */}
      {onToggleFollow && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFollow(fund.code);
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1 rounded-full hover:bg-background/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          title={following ? "取消关注" : "关注"}
          aria-label={following ? "取消关注" : "关注"}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              following
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground/50 group-hover:text-muted-foreground"
            )}
          />
        </button>
      )}

      <CardContent className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
        {/* Name */}
        <div className="flex items-start gap-1.5 sm:gap-2 pr-5 sm:pr-6">
          <span
            className={cn(
              "mt-1 inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0",
              st.dot
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-3">
              {fund.name}
            </p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono">
              {fund.code}
            </p>
          </div>
        </div>

        {/* Limit */}
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "font-mono text-base sm:text-xl font-bold tabular-nums truncate",
              limitColor(fund.limitAmount, fund.purchaseStatus)
            )}
          >
            {fund.purchaseStatus === "open"
              ? "不限额"
              : formatLimit(fund.limitAmount, fund.purchaseStatus)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 shrink-0",
              st.dot.replace("bg-", "border-")
            )}
          >
            {st.label}
          </Badge>
        </div>

        {/* Returns */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-muted-foreground">1月</span>
            <Pct value={fund.month1} className="text-xs sm:text-sm font-medium" />
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-muted-foreground">日跌</span>
            <Pct value={fund.dayChange} className="text-xs sm:text-sm font-medium" />
          </div>
        </div>

        {/* Categories — hidden on mobile to reduce clutter */}
        {fund.categories.length > 0 && (
          <div className="hidden sm:flex gap-1 flex-wrap">
            {fund.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
