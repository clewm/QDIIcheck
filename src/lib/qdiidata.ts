/**
 * 天天基金 QDII 基金列表 API
 * 一次请求获取全部 QDII 基金的净值、涨跌幅、申购状态
 */

import { batchFetchF10 } from "./scraper";
import { getStorage } from "./storage";
import type { QDIIFund } from "./types";

// Re-export from the shared types file so existing imports keep working.
// The canonical definition lives in types.ts (no runtime deps → safe for client bundle).
export type { QDIIFund } from "./types";

/**
 * 从基金名称提取赛道/行业标签
 * 优先级：细分赛道 > 行业大类 > 市场宽基 > 地区
 */
const SECTOR_RULES: [RegExp, string][] = [
  // 细分赛道
  [/半导体|芯片/, "半导体"],
  [/人工智能|AI(?!\w)/, "AI"],
  [/机器人/, "机器人"],
  [/云计算|SaaS/, "云计算"],
  [/5G|6G|通信/, "通信"],
  [/区块链|比特币|数字币/, "区块链"],
  [/光伏|太阳能/, "光伏"],
  [/锂电|电池/, "锂电池"],
  [/新能源车|电动.*车|汽车/, "新能源车"],
  [/军工|国防/, "军工"],
  [/农业|种业/, "农业"],
  [/CPO|光模块|光通信/, "CPO"],
  [/游戏|电竞/, "游戏"],
  [/REIT/, "REIT"],
  [/原油|石油/, "石油"],
  [/黄金/, "黄金"],
  [/白银/, "白银"],
  [/有色|铜|矿/, "有色金属"],

  // 行业大类
  [/科技|技术|Tech/, "科技"],
  [/医药|医疗|健康|生物|创新药|CXO/, "医药"],
  [/消费|食品|饮料|白酒|零售/, "消费"],
  [/能源|电力|碳中和|油气/, "能源"],
  [/金融|银行|证券|保险/, "金融"],
  [/地产|房地产|物业/, "地产"],
  [/传媒|文化|娱乐|影视/, "传媒"],
  [/基建|建筑|建材/, "基建"],
  [/环保|绿色|ESG/, "环保"],
  [/债|固收|信用/, "债券"],
  [/互联|网/, "互联网"],
  [/高端制造|智造|工业/, "高端制造"],

  // 宽基指数
  [/纳斯达克|纳指|NASDAQ/, "纳指"],
  [/标普|S&P/, "标普"],
  [/道琼斯|道指/, "道指"],
  [/恒生|港股|恒指/, "恒生"],
  [/中概|中国互联/, "中概股"],
  [/日经|日本/, "日本"],
  [/德国|DAX/, "德国"],
  [/越南/, "越南"],
  [/印度/, "印度"],
  [/全球.*精选|全球.*优质|全球.*配置|全球.*成长/, "全球配置"],
  [/亚太|亚洲/, "亚太"],
  [/欧洲/, "欧洲"],
  [/新兴市场/, "新兴市场"],
];

function extractSectors(name: string): string[] {
  const tags: string[] = [];
  for (const [pattern, tag] of SECTOR_RULES) {
    if (pattern.test(name) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  // 最多保留 3 个最具体的标签
  return tags.slice(0, 3);
}

function parseStatus(
  f15: string,
  f16: string
): "open" | "limited" | "suspended" {
  const s15 = parseInt(f15);
  const s16 = parseInt(f16);
  if (s15 === 3 && s16 === 1) return "open";
  if (s15 === 3 && s16 === 0) return "limited";
  if (s15 === 0 && s16 === 1) return "limited";
  return "suspended";
}

function parseFloatSafe(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

/** 解析 "10元" / "1000元" / "100万元" → 数值（元） */
function parseLimitAmount(text: string): number {
  if (!text) return 0;
  const m = text.match(/([\d,.]+)\s*(万元|元)/);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(",", ""));
  return isNaN(n) ? 0 : m[2] === "万元" ? n * 10000 : n;
}

function parseRecord(record: string): QDIIFund {
  const f = record.split("|");
  const categories = extractSectors(f[1]);

  return {
    code: f[0],
    name: f[1],
    navDate: f[3],
    nav: parseFloatSafe(f[4]),
    dayChange: parseFloatSafe(f[5]),
    week1: parseFloatSafe(f[6]),
    month1: parseFloatSafe(f[7]),
    month3: parseFloatSafe(f[8]),
    month6: parseFloatSafe(f[9]),
    year1: parseFloatSafe(f[10]),
    year2: parseFloatSafe(f[11]),
    year3: parseFloatSafe(f[12]),
    ytd: parseFloatSafe(f[13]),
    sinceInception: parseFloatSafe(f[14]),
    purchaseStatus: parseStatus(f[15], f[16]),
    minPurchase: f[24] || "",
    limitAmount: 0, // API 不提供日累计限额，由 F10 enrichment 填充
    categories,
    feeRate: f[27] || "",
  };
}

/** 进程内内存缓存，避免高频请求时重复调 S3 */
let _cache: { data: QDIIFund[]; ts: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 小时
const S3_CACHE_TTL_S = 24 * 3600; // S3 缓存 24 小时，覆盖两次 cron 之间的间隔

/** 获取上次数据更新时间戳（毫秒），0 表示尚未更新 */
export function getLastUpdateTime(): number {
  return _cache?.ts ?? 0;
}

interface CachePayload {
  data: QDIIFund[];
  ts: number;
}

/**
 * 仅从天天基金 API 拉取基础数据（快速，~2 秒）
 * 不包含 F10 准确限额，用于先快速返回可用数据
 */
export async function fetchFundsFromAPI(): Promise<QDIIFund[]> {
  const url = `https://fundapi.eastmoney.com/fundtradenew.aspx?ft=qdii&sc=1n&st=desc&pi=1&pn=500&cp=&ct=&cd=&ms=&fr=&plession=&fst=&ftype=&fr1=&fl=0&is498=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "http://fund.eastmoney.com/",
    },
  });

  if (!response.ok) throw new Error(`QDII API HTTP ${response.status}`);

  const text = await response.text();
  const match = text.match(/datas:\[(.+)\]/);
  if (!match) return [];

  const raw = match[1];
  const records: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuote) {
        records.push(current);
        current = "";
        inQuote = false;
      } else {
        inQuote = true;
      }
    } else if (inQuote) {
      current += ch;
    }
  }

  return records.map(parseRecord);
}

/**
 * 用 F10 数据补充准确的申购状态和限额，然后更新 S3 缓存
 * 只有此函数才写入 S3 缓存，确保 S3 中永远是经过 enrichment 的正确数据
 *
 * 安全机制：只有当大部分基金成功拿到 F10 数据时才写入 S3。
 * 否则保留上一次的好缓存 —— 避免用未 enrichment 的 API 原始数据
 * （limitAmount 全为 0、purchaseStatus 不可靠）覆盖正确数据，
 * 那会让整站显示成"不限额"或"—"。
 */
export async function enrichWithF10(funds: QDIIFund[]): Promise<QDIIFund[]> {
  let enriched = 0;
  try {
    const f10Data = await batchFetchF10(
      funds.map((f) => f.code),
      20
    );

    for (const fund of funds) {
      const f10 = f10Data.get(fund.code);
      if (f10) {
        fund.purchaseStatus = f10.purchaseStatus;
        // dailyLimit 为 null 时（解析失败）不覆盖，保留原值（API 默认 0）
        if (f10.dailyLimit !== null) {
          fund.limitAmount = f10.dailyLimit;
        }
        enriched++;
      }
    }
  } catch (error) {
    // batchFetchF10 本身 per-fund catch，不应抛出；防御性记录
    console.error("enrichWithF10: batchFetchF10 threw:", error);
  }

  const ratio = funds.length > 0 ? enriched / funds.length : 1;
  const ts = Date.now();
  const payload: CachePayload = { data: funds, ts };
  // 内存缓存始终更新（本次请求内可用，不持久化）
  _cache = payload;

  if (ratio >= 0.5) {
    const storage = getStorage();
    await storage.saveQDIICache(JSON.stringify(payload), S3_CACHE_TTL_S);
  } else {
    // enrichment 大面积失败 → 不写 S3，保留旧的好缓存
    console.warn(
      `enrichWithF10: only ${enriched}/${funds.length} enriched (ratio=${ratio.toFixed(2)}) — skipping S3 write to preserve previous cache`
    );
  }

  return funds;
}

/**
 * 获取全部 QDII 基金列表
 * @param forceRefresh 跳过缓存，强制重新抓取（cron 调用时使用）
 *
 * ⚠️ 此函数不写入 S3 缓存 — 只有 enrichWithF10 才会写入 S3，
 *    避免未 enrich 的 API 数据（limitAmount 全为 0）覆盖已有的 F10 正确数据。
 */
export async function fetchQDIIFunds(forceRefresh = false): Promise<QDIIFund[]> {
  const storage = getStorage();

  // 非强制刷新时，优先使用进程内缓存
  if (!forceRefresh && _cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
    return _cache.data;
  }

  // 非强制刷新时，尝试从 S3 读取缓存（enriched 数据）
  if (!forceRefresh) {
    const cached = await storage.getQDIICache();
    if (cached) {
      try {
        const payload: CachePayload = JSON.parse(cached);
        _cache = payload;
        return payload.data;
      } catch {
        // 缓存数据损坏，继续重新抓取
      }
    }
  }

  // 从 API 拉取基础数据（快速，~2秒）
  // 注意：只更新内存缓存，不写入 S3（避免覆盖 enriched 数据）
  const funds = await fetchFundsFromAPI();
  const ts = Date.now();
  const payload: CachePayload = { data: funds, ts };
  _cache = payload;

  return funds;
}

/**
 * 获取所有分类标签（去重）
 */
export function extractAllCategories(funds: QDIIFund[]): string[] {
  const set = new Set<string>();
  funds.forEach((f) => f.categories.forEach((c) => set.add(c)));
  return Array.from(set).sort();
}
