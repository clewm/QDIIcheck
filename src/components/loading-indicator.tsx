export function LoadingIndicator() {
  return (
    <div role="status" aria-live="polite" aria-label="正在加载 QDII 基金数据" className="flex flex-1 flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Animated rings */}
      <div className="relative h-16 w-16" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-foreground/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-foreground/20 animate-spin" style={{ animationDuration: "2s" }} />
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          正在加载 QDII 基金数据
        </p>
        <p className="text-xs text-muted-foreground">
          首次加载需抓取各基金限额信息，请稍候…
        </p>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}
