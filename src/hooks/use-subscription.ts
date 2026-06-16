"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "qdii_subscription";

interface Subscription {
  email: string;
}

function loadSubscription(): Subscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSubscription(sub: Subscription | null) {
  if (sub) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    setSubscription(loadSubscription());
  }, []);

  const subscribe = useCallback(async (email: string, fundCodes: string[]) => {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fundCodes }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "订阅失败");
    }
    const sub = { email };
    saveSubscription(sub);
    setSubscription(sub);
  }, []);

  const unsubscribe = useCallback(async () => {
    const sub = loadSubscription();
    if (sub) {
      const res = await fetch("/api/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sub.email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "取消订阅失败");
      }
    }
    saveSubscription(null);
    setSubscription(null);
  }, []);

  return { subscription, subscribe, unsubscribe };
}
