import { cn } from "@/lib/utils";

/** 百分比显示组件 */
export function Pct({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const color =
    value > 0
      ? "text-green-500"
      : value < 0
        ? "text-red-500"
        : "text-muted-foreground";
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        size === "lg" ? "text-2xl" : "text-sm",
        color,
        className
      )}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

/** 申购状态配置 */
export const statusConfig = {
  open: { label: "不限额", dot: "bg-green-500" },
  limited: { label: "限额", dot: "bg-yellow-500" },
  suspended: { label: "暂停买入", dot: "bg-red-500" },
};

/** 格式化限额金额 */
export function formatLimit(amount: number): string {
  if (amount <= 0) return "—";
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万元`;
  return `${amount}元`;
}

/** 限额颜色 */
export function limitColor(amount: number, status: string): string {
  if (status === "open") return "text-green-400";
  if (amount >= 100000) return "text-green-400";
  if (amount >= 10000) return "text-yellow-400";
  if (amount > 0) return "text-orange-400";
  return "text-red-400";
}
