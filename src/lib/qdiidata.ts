/**
 * 天天基金 QDII 基金列表 API
 * 一次请求获取全部 QDII 基金的净值、涨跌幅、申购状态
 */

import { batchFetchF10 } from "./scraper";
import { getStorage } from "./storage";

export interface QDIIFund {
  code: string;
  name: string;
  navDate: string;
  nav: number; // 单位净值
  dayChange: number; // 日涨跌 %
  week1: number; // 近1周 %
  month1: number; // 近1月 %
  month3: number; // 近3月 %
  month6: number; // 近6月 %
  year1: number; // 近1年 %
  year2: number; // 近2年 %
  year3: number; // 近3年 %
  ytd: number; // 今年以来 %
  sinceInception: number; // 成立以来 %
  purchaseStatus: "open" | "limited" | "suspended";
  minPurchase: string; // 起购金额文本，如 "10元"
  limitAmount: number; // 限额数值（元），0 表示不限额或无法解析
  categories: string[]; // 细分行业标签
  feeRate: string; // 优惠费率
}

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
    limitAmount: parseLimitAmount(f[24]),
    categories,
    feeRate: f[27] || "",
  };
}

/** 本地内存缓存（local 模式直接使用，edge-kv 模式用于存 updateTs） */
let _cache: { data: QDIIFund[]; ts: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 小时

/** 获取上次数据更新时间戳（毫秒），0 表示尚未更新 */
export function getLastUpdateTime(): number {
  return _cache?.ts ?? 0;
}

interface CachePayload {
  data: QDIIFund[];
  ts: number;
}

/**
 * 获取全部 QDII 基金列表（带 F10 准确限额数据）
 * 自动批量抓取 F10 页面覆盖 API 的不准确状态
 */
export async function fetchQDIIFunds(): Promise<QDIIFund[]> {
  const storage = getStorage();

  // 本地内存缓存命中（edge-kv 模式下 TTL 由 KV 自身管理，此处 ts 仅用于 getLastUpdateTime）
  if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
    return _cache.data;
  }

  // 尝试从存储层读取缓存
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

  const funds = records.map(parseRecord);

  // 批量抓取 F10 获取准确的申购状态和限额
  try {
    const f10Data = await batchFetchF10(
      funds.map((f) => f.code),
      5
    );

    for (const fund of funds) {
      const f10 = f10Data.get(fund.code);
      if (f10) {
        fund.purchaseStatus = f10.purchaseStatus;
        fund.limitAmount = f10.dailyLimit ?? 0;
      }
    }
  } catch {
    // F10 抓取失败时保留 API 原始数据
  }

  const ts = Date.now();
  const payload: CachePayload = { data: funds, ts };
  _cache = payload;

  // 写入存储层，TTL 1小时
  await storage.saveQDIICache(JSON.stringify(payload), 3600);

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
