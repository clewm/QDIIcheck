/**
 * Edge KV storage provider for ESA production environment.
 *
 * Uses ESA Edge KV built-in API:
 *   const edgeKv = new EdgeKV({ namespace: "xxx" });
 *   await edgeKv.get(key) / edgeKv.put(key, value) / edgeKv.delete(key)
 *
 * Namespaces used:
 *   - "subscriptions" : subscription records
 *   - "fund-cache"    : QDII fund data cache
 */

import type { StorageProvider } from "./storage";

// EdgeKV is a built-in global in ESA edge runtime.
// Declare it here so TypeScript doesn't complain.
declare class EdgeKV {
  constructor(opts: { namespace: string });
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(opts?: { prefix?: string }): Promise<string[]>;
}

const SUBSCRIPTIONS_NS = "subscriptions";
const FUND_CACHE_NS = "fund-cache";
const FUND_CACHE_KEY = "fund:all";

export class EdgeKvStorageProvider implements StorageProvider {
  private subs = new EdgeKV({ namespace: SUBSCRIPTIONS_NS });
  private fundCache = new EdgeKV({ namespace: FUND_CACHE_NS });

  async getSubscriptions(): Promise<string> {
    const data = await this.subs.get("all");
    return data ?? '{"subscriptions":[]}';
  }

  async saveSubscriptions(data: string): Promise<void> {
    await this.subs.put("all", data);
  }

  async getQDIICache(): Promise<string | null> {
    return (await this.fundCache.get(FUND_CACHE_KEY)) ?? null;
  }

  async saveQDIICache(data: string, ttlSeconds: number): Promise<void> {
    await this.fundCache.put(FUND_CACHE_KEY, data, {
      expirationTtl: ttlSeconds,
    });
  }

  async invalidateQDIICache(): Promise<void> {
    await this.fundCache.delete(FUND_CACHE_KEY);
  }
}
