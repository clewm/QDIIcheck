"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "qdii_follows";

function loadFollows(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFollows(codes: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

export function useFollows() {
  const [follows, setFollows] = useState<string[]>([]);

  useEffect(() => {
    setFollows(loadFollows());
  }, []);

  const followSet = useMemo(() => new Set(follows), [follows]);

  const toggle = useCallback((code: string) => {
    setFollows((prev) => {
      const next = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      saveFollows(next);
      return next;
    });
  }, []);

  const isFollowing = useCallback(
    (code: string) => followSet.has(code),
    [followSet]
  );

  return { follows, toggle, isFollowing };
}
