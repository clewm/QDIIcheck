/**
 * Storage abstraction layer
 *
 * Local environment: file-based subscriptions + in-memory fund cache
 * Production (ESA): Edge KV for everything
 */

export interface StorageProvider {
  /** Get all subscriptions as JSON string */
  getSubscriptions(): Promise<string>;
  /** Save subscriptions data (JSON string) */
  saveSubscriptions(data: string): Promise<void>;
  /** Get cached QDII data JSON, returns null if not found or expired */
  getQDIICache(): Promise<string | null>;
  /** Save QDII data cache with TTL in seconds */
  saveQDIICache(data: string, ttlSeconds: number): Promise<void>;
  /** Invalidate QDII cache */
  invalidateQDIICache(): Promise<void>;
}

/** Resolve the storage provider based on environment */
export function getStorage(): StorageProvider {
  const backend = process.env.STORAGE_BACKEND;

  if (backend === "edge-kv") {
    // Dynamic import to avoid bundling Edge KV SDK in local dev
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EdgeKvStorageProvider } =
      require("./storage-edge-kv") as typeof import("./storage-edge-kv");
    return new EdgeKvStorageProvider();
  }

  // Default: local file + memory cache
  return new LocalStorageProvider();
}

// ---------------------------------------------------------------------------
// Local implementation: fs for subscriptions, in-memory cache for fund data
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";

const SUBSCRIPTIONS_PATH = path.join(
  process.cwd(),
  "data",
  "subscriptions.json"
);

let _cache: { data: string; expiry: number } | null = null;

class LocalStorageProvider implements StorageProvider {
  async getSubscriptions(): Promise<string> {
    try {
      return fs.readFileSync(SUBSCRIPTIONS_PATH, "utf-8");
    } catch {
      return '{"subscriptions":[]}';
    }
  }

  async saveSubscriptions(data: string): Promise<void> {
    fs.writeFileSync(SUBSCRIPTIONS_PATH, data, "utf-8");
  }

  async getQDIICache(): Promise<string | null> {
    if (_cache && Date.now() < _cache.expiry) {
      return _cache.data;
    }
    return null;
  }

  async saveQDIICache(data: string, ttlSeconds: number): Promise<void> {
    _cache = { data, expiry: Date.now() + ttlSeconds * 1000 };
  }

  async invalidateQDIICache(): Promise<void> {
    _cache = null;
  }
}
