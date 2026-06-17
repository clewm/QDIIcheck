"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bell, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  followCount: number;
  subscription: { email: string } | null;
  onSubscribe: (email: string) => Promise<void>;
  onUnsubscribe: () => Promise<void>;
}

export function SubscribeModal({
  open,
  onClose,
  followCount,
  subscription,
  onSubscribe,
  onUnsubscribe,
}: SubscribeModalProps) {
  const [email, setEmail] = useState(subscription?.email ?? "");
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Sync state with props when modal opens
  useEffect(() => {
    if (open) {
      setEmail(subscription?.email ?? "");
      // Focus email input after open
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [open, subscription]);

  // Escape key + scroll lock
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("请输入有效邮箱");
      return;
    }
    if (followCount === 0) {
      toast.error("请先关注至少一只基金");
      return;
    }
    setLoading(true);
    try {
      await onSubscribe(email);
      toast.success("订阅成功！交易日 14:00 将收到邮件通知");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "订阅失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await onUnsubscribe();
      toast.success("已取消订阅");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "取消失败");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = () => {
    if (!loading) onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="邮件订阅"
          className="relative bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-5"
        >
          {/* Close */}
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="关闭"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">邮件订阅</h2>
              <p className="text-xs text-muted-foreground">
                已关注 {followCount} 只基金
              </p>
            </div>
          </div>

          {subscription && (
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p>当前订阅: {subscription.email}</p>
              <p>通知时间: 每交易日 14:00（北京时间）</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="subscribe-email"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                邮箱地址
              </label>
              <Input
                ref={emailInputRef}
                id="subscribe-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {subscription ? "更新订阅" : "订阅"}
              </Button>

              {subscription && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="w-full text-muted-foreground"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  取消订阅
                </Button>
              )}
            </div>
          </form>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            订阅后，每个交易日 14:00（北京时间）将收到邮件，
            <br />
            包含关注基金的限额情况及新增 QDII 基金。
          </p>
        </div>
      </div>
    </div>
  );
}
