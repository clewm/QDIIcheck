<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deployment & scheduling — read this before touching cron/storage

- **Platform**: Tencent EdgeOne Pages (NOT Vercel). Do not assume Vercel semantics.
- **No platform cron**: data fetching + subscription emails are driven by an external scheduler — [EasyCron](https://www.easycron.com/cron-jobs) calling `GET /api/cron/fetch` with header `Authorization: Bearer $CRON_SECRET`. There is **no `vercel.json`** in the repo; the schedule lives in EasyCron, not in code.
- **Email dedup**: `GET /api/cron/fetch` deduplicates notification emails per **Beijing calendar day** (`StorageProvider.getLastEmailDate` / `saveLastEmailDate`, stored as the S3 object `last-email-date.json`). However often EasyCron fires, at most one email goes out per Beijing day. Do not reintroduce an hour-based window (e.g. `beijingHour === 12`) — it silently breaks when the schedule doesn't hit that exact hour.
- **Storage**: S3-compatible object storage (`src/lib/storage-s3.ts`), not the local filesystem. All persistent state (subscriptions, fund cache, history, last-email date) is S3 objects — never read/write `data/db.json`.
