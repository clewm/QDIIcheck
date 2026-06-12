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
// Singleton instance
// ---------------------------------------------------------------------------

let _instance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (_instance) return _instance;
  const { S3StorageProvider } =
    require("./storage-s3") as typeof import("./storage-s3");
  _instance = new S3StorageProvider();
  return _instance;
}
