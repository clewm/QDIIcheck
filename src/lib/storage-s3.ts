/**
 * S3-compatible storage provider — zero external dependencies
 *
 * Uses native fetch() + AWS Signature V4 to read/write S3.
 * Works with any S3-compatible service (RainS3, MinIO, Tencent COS, etc.)
 */

import type { StorageProvider } from "./storage";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getConfig() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY must be configured"
    );
  }

  return { endpoint, region, accessKeyId, secretAccessKey, bucket };
}

// ---------------------------------------------------------------------------
// AWS Signature V4 (minimal — only covers the operations we use)
// ---------------------------------------------------------------------------

async function hmac(key: Buffer | string, data: string): Promise<Buffer> {
  const crypto = await import("crypto");
  return crypto.createHmac("sha256", key).update(data).digest();
}

async function sha256Hex(data: string): Promise<string> {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function signV4(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: string | Buffer | null,
  region: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<Record<string, string>> {
  const date = new Date();
  const dateStamp = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dateDay = dateStamp.slice(0, 8);
  const service = "s3";

  const payloadHash = body
    ? await sha256Hex(typeof body === "string" ? body : body.toString("utf-8"))
    : "UNSIGNED-PAYLOAD";

  const signedHeaders: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": dateStamp,
    ...headers,
  };

  // Canonical request
  const sortedHeaderKeys = Object.keys(signedHeaders).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k}:${signedHeaders[k]}`)
    .join("\n");
  const signedHeadersList = sortedHeaderKeys.join(";");

  const canonicalRequest = [
    method,
    url.pathname,
    url.search,
    canonicalHeaders + "\n",
    signedHeadersList,
    payloadHash,
  ].join("\n");

  // String to sign
  const credentialScope = `${dateDay}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateStamp,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  // Signing key
  const kDate = await hmac("AWS4" + secretAccessKey, dateDay);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");

  // Signature
  const crypto = await import("crypto");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  return {
    ...signedHeaders,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersList}, Signature=${signature}`,
  };
}

// ---------------------------------------------------------------------------
// S3 operations via fetch
// ---------------------------------------------------------------------------

async function s3Request(
  method: string,
  key: string,
  body?: string,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const { endpoint, region, accessKeyId, secretAccessKey, bucket } = getConfig();
  const url = new URL(`/${bucket}/${key}`, endpoint);

  const headers: Record<string, string> = { ...extraHeaders };
  if (body) {
    headers["content-type"] = "application/json; charset=utf-8";
  }

  const signed = await signV4(
    method,
    url,
    headers,
    body ?? null,
    region,
    accessKeyId,
    secretAccessKey
  );

  const res = await fetch(url.toString(), {
    method,
    headers: signed,
    body: body || undefined,
  });

  return res;
}

async function s3Get(key: string): Promise<string | null> {
  const res = await s3Request("GET", key);
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 GET ${key} failed: ${res.status} ${text}`);
  }
  return res.text();
}

async function s3Put(key: string, data: string): Promise<void> {
  const res = await s3Request("PUT", key, data);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 PUT ${key} failed: ${res.status} ${text}`);
  }
}

async function s3Delete(key: string): Promise<void> {
  const res = await s3Request("DELETE", key);
  // S3 delete is idempotent — 204 or 404 both OK
  if (res.status !== 204 && res.status !== 404 && !res.ok) {
    const text = await res.text();
    throw new Error(`S3 DELETE ${key} failed: ${res.status} ${text}`);
  }
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
    return data ?? "[]";
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
