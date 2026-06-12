/**
 * S3-compatible storage provider
 *
 * Uses AWS S3 SDK to read/write data in an S3-compatible bucket.
 * Works with any S3-compatible service (Tencent COS, RainS3, MinIO, etc.)
 *
 * S3 keys:
 *   - "subscriptions.json" : subscription records
 *   - "fund-cache.json"    : QDII fund data cache (with embedded TTL)
 *
 * Cache TTL is implemented at the application level by embedding an
 * expiry timestamp in the stored value, since S3 does not support
 * automatic object expiration per-key.
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageProvider } from "./storage";

// ---------------------------------------------------------------------------
// S3 client singleton
// ---------------------------------------------------------------------------

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_client) return _client;

  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3_ENDPOINT, S3_ACCESS_KEY, and S3_SECRET_KEY must be configured"
    );
  }

  _client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    // Force path-style addressing (required by many S3-compatible services)
    forcePathStyle: true,
  });

  return _client;
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET must be configured");
  return bucket;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function s3Get(key: string): Promise<string | null> {
  const client = getS3Client();
  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key })
    );
    if (!result.Body) return null;
    return await result.Body.transformToString("utf-8");
  } catch (err: unknown) {
    // NoSuchKey → return null
    if (err instanceof Error && err.name === "NoSuchKey") return null;
    if (err instanceof Error && err.name === "NotFound") return null;
    // Also check for status code 404 in the error message
    if (
      err instanceof Error &&
      (err.message.includes("404") || err.message.includes("NoSuchKey"))
    )
      return null;
    throw err;
  }
}

async function s3Put(key: string, data: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: data,
      ContentType: "application/json; charset=utf-8",
    })
  );
}

async function s3Delete(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

// ---------------------------------------------------------------------------
// Cache wrapper (S3 has no native per-key TTL)
// ---------------------------------------------------------------------------

interface CacheWrapper {
  data: string;
  expiry: number;
}

// ---------------------------------------------------------------------------
// Storage provider implementation
// ---------------------------------------------------------------------------

const SUBS_KEY = "subscriptions.json";
const FUND_CACHE_KEY = "fund-cache.json";

export class S3StorageProvider implements StorageProvider {
  async getSubscriptions(): Promise<string> {
    const data = await s3Get(SUBS_KEY);
    return data ?? '{"subscriptions":[]}';
  }

  async saveSubscriptions(data: string): Promise<void> {
    await s3Put(SUBS_KEY, data);
  }

  async getQDIICache(): Promise<string | null> {
    const raw = await s3Get(FUND_CACHE_KEY);
    if (!raw) return null;

    try {
      const wrapper: CacheWrapper = JSON.parse(raw);
      if (wrapper.expiry && Date.now() < wrapper.expiry) {
        return wrapper.data;
      }
      // Expired — clean up
      await s3Delete(FUND_CACHE_KEY);
      return null;
    } catch {
      return raw;
    }
  }

  async saveQDIICache(data: string, ttlSeconds: number): Promise<void> {
    const wrapper: CacheWrapper = {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    };
    await s3Put(FUND_CACHE_KEY, JSON.stringify(wrapper));
  }

  async invalidateQDIICache(): Promise<void> {
    await s3Delete(FUND_CACHE_KEY);
  }
}
