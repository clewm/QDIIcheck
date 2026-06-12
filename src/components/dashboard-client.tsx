"use client";

import { useState, useMemo } from "react";
import type { QDIIFund } from "@/lib/qdiidata";
import { FundCard } from "@/components/fund-card";
import { FundDetailModal } from "@/components/fund-detail-modal";
import { SubscribeModal } from "@/components/subscribe-modal";
import { Input } from "@/components/ui/input";
import { Search, Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFollows } from "@/hooks/use-follows";
import { useSubscription } from "@/hooks/use-subscription";

type SortKey = "1n" | "6m" | "3m" | "day" | "ytd" | "limit";
type StatusFilter = "all" | "open" | "limited" | "suspended";
type ViewFilter = "all" | "followed";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "1n", label: "近1年" },
  { key: "6m", label: "近6月" },
  { key: "3m", label: "近3月" },
  { key: "ytd", label: "今年" },
  { key: "day", label: "日涨跌" },
  { key: "limit", label: "限额额度" },
];

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "open", label: "不限额" },
  { key: "limited", label: "限额" },
  { key: "suspended", label: "暂停买入" },
];

function formatUpdateTime(ts: number): string {
  if (!ts) return "尚未更新";
  const d = new Date(ts);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  initialFunds: QDIIFund[];
  categories: string[];
  lastUpdate: number;
}

export function DashboardClient({ initialFunds, categories, lastUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("1n");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [selectedFund, setSelectedFund] = useState<QDIIFund | null>(null);

  const { follows, toggle, isFollowing } = useFollows();
  const { subscription, subscribe, unsubscribe } = useSubscription();

  const filtered = useMemo(() => {
    let list = initialFunds;

    if (viewFilter === "followed") {
      list = list.filter((f) => follows.includes(f.code));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.code.includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.categories.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((f) => f.purchaseStatus === statusFilter);
    }

    if (catFilter !== "all") {
      list = list.filter((f) => f.categories.includes(catFilter));
    }

    const sortField: Record<SortKey, keyof QDIIFund> = {
      "1n": "year1",
      "6m": "month6",
      "3m": "month3",
      day: "dayChange",
      ytd: "ytd",
      limit: "limitAmount",
    };
    const key = sortField[sortBy];
    list = [...list].sort((a, b) => {
      // For limit sort: open (unlimited) funds go to the top
      if (sortBy === "limit") {
        const aOpen = a.purchaseStatus === "open" ? 1 : 0;
        const bOpen = b.purchaseStatus === "open" ? 1 : 0;
        if (aOpen !== bOpen) return bOpen - aOpen;
      }
      return (b[key] as number) - (a[key] as number);
    });

    return list;
  }, [initialFunds, search, sortBy, statusFilter, catFilter, viewFilter, follows]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: title + description */}
          <div>
            <h1 className="text-lg font-semibold tracking-tight">QDII Watch</h1>
            <p className="text-[11px] text-muted-foreground">
              每日自动监控 QDII 基金申购限额，支持邮件订阅推送
            </p>
          </div>

          {/* Center: last update */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center hidden md:block">
            <p className="text-[11px] text-muted-foreground">
              上次更新 {formatUpdateTime(lastUpdate)}
            </p>
          </div>

          {/* Right: subscribe + author */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSubscribe(true)}
              className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-lg border transition-colors",
                subscription
                  ? "border-green-500/50 text-green-500 hover:bg-green-500/10"
                  : "border-border hover:bg-accent"
              )}
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {subscription ? "已订阅" : "免费订阅"}
              </span>
            </button>

            <a
              href="https://link3.cc/hulab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="狐闹HuLab"
            >
              <img
                src="https://tencentcdna.production.link3.cc/profile_images/1739112885212"
                alt="狐闹HuLab"
                className="h-7 w-7 rounded-full object-cover border border-border"
              />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[10px] text-muted-foreground">「作者」</span>
                <span className="text-xs text-foreground">狐闹HuLab</span>
              </div>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-8">
        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索基金名称、代码、行业..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pt-3 flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1.5">
            {(["all", "followed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewFilter(v)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  viewFilter === v
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-accent"
                )}
              >
                {v === "all" ? "全部" : `关注 (${follows.length})`}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          {/* Sort */}
          <div className="flex gap-1.5 flex-wrap">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  sortBy === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          {/* Status */}
          <div className="flex gap-1.5">
            {statusOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  statusFilter === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-accent"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

          {/* Category dropdown */}
          <div className="relative">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              aria-label="筛选行业"
              className="appearance-none rounded-lg border border-border bg-background px-3 py-1.5 pr-7 text-xs cursor-pointer hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">全部行业</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Count */}
        <div className="px-6 pt-3 pb-2">
          <p className="text-xs text-muted-foreground">{filtered.length} 只基金</p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {viewFilter === "followed"
                ? "暂无关注基金，点击卡片上的 ♡ 添加"
                : "无匹配基金"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((fund) => (
              <FundCard
                key={fund.code}
                fund={fund}
                following={isFollowing(fund.code)}
                onToggleFollow={toggle}
                onClick={setSelectedFund}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <FundDetailModal
        fund={selectedFund}
        onClose={() => setSelectedFund(null)}
      />
      <SubscribeModal
        open={showSubscribe}
        onClose={() => setShowSubscribe(false)}
        followCount={follows.length}
        subscription={subscription}
        onSubscribe={(email, time) => subscribe(email, time, follows)}
        onUnsubscribe={unsubscribe}
      />
    </>
  );
}
