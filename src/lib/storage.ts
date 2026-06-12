/**
 * Storage layer — S3-compatible object storage
 *
 * All environments (local + production) read/write from the S3 bucket.
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

// ---------------------------------------------------------------------------
// Singleton instance — uses async dynamic import to avoid a circular
// dependency cycle at module-evaluation time:
//   storage.ts → storage-s3.ts → storage.ts (type-only, but some bundlers
//   may not erase import type correctly).
// ---------------------------------------------------------------------------

let _instance: StorageProvider | null = null;
let _initPromise: Promise<StorageProvider> | null = null;

export async function getStorage(): Promise<StorageProvider> {
  if (_instance) return _instance;
  if (_initPromise) return _initPromise;

  _initPromise = import("./storage-s3").then((mod) => {
    _instance = new mod.S3StorageProvider();
    return _instance;
  });

  return _initPromise;
}
