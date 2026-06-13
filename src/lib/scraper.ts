import * as cheerio from "cheerio";

/** 带重试和超时的 fetch 封装 */
async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
  retries = 3
): Promise<Response> {
  const { timeoutMs = 10_000, ...fetchOpts } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
      });
      return response;
    } catch (err) {
      const isAbort =
        err instanceof DOMException && err.name === "AbortError";
      const isReset =
        err instanceof TypeError &&
        (err.cause instanceof Error
          ? (err.cause as NodeJS.ErrnoException).code === "ECONNRESET"
          : false);
      const retriable = isAbort || isReset;

      if (!retriable || attempt === retries) throw err;

      // 指数退避: 1s, 2s, 4s …
      const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.warn(
        `fetchWithRetry: ${url} attempt ${attempt}/${retries} failed, retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      clearTimeout(timer);
    }
  }

  // 不应到达此处
  throw new Error(`fetchWithRetry: exhausted retries for ${url}`);
}

export interface FundStatus {
  code: string;
  name: string;
  purchaseStatus: "open" | "limited" | "suspended";
  dailyLimit: number | null; // 单位：元，null 表示不限额
  redeemStatus: "open" | "suspended";
}

/**
 * 从天天基金 F10 页面抓取基金申购状态
 * 数据源: fundf10.eastmoney.com/jjfl_XXXXXX.html
 */
export async function scrapeFundStatus(code: string): Promise<FundStatus> {
  const url = `http://fundf10.eastmoney.com/jjfl_${code}.html`;
  const response = await fetchWithRetry(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "http://fundf10.eastmoney.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for fund ${code}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const text = $.text();

  // 获取基金名称 — 从 title 标签提取，格式: "基金名称(代码)基金费率 _ ..."
  const titleText = $("title").text().trim();
  const titleMatch = titleText.match(/^(.+?)\(\d+\)/);
  const h4Name = $("h4").first().text().trim().replace(/\.{3}.*$/, "").trim();
  const name = titleMatch?.[1]?.trim() || h4Name || code;

  // 解析申购状态：优先从表格中的"申购状态"解析（可靠），再回退到侧边栏"交易状态："（不可靠）
  let purchaseStatus: "open" | "limited" | "suspended" = "open";
  let dailyLimit: number | null = null;
  let redeemStatus: "open" | "suspended" = "open";

  // 优先从表格解析"申购状态XXX"，这是 F10 表格中的标准字段
  const purchaseTableMatch = text.match(/申购状态\s*(限大额|暂停申购|开放申购)/);
  if (purchaseTableMatch) {
    const s = purchaseTableMatch[1];
    if (s === "暂停申购") purchaseStatus = "suspended";
    else if (s === "限大额") purchaseStatus = "limited";
    else purchaseStatus = "open";
  } else {
    // 回退：侧边栏 "交易状态：XXX"，注意该标签含义不固定（可能是赎回状态）
    const tradeMatch = text.match(/交易状态[：:]\s*(\S+)/);
    if (tradeMatch) {
      const status = tradeMatch[1];
      if (status === "暂停申购") {
        purchaseStatus = "suspended";
      } else if (status === "限大额") {
        purchaseStatus = "limited";
      } else {
        purchaseStatus = "open";
      }
    }
  }

  // 解析日累计申购限额
  const limitMatch = text.match(/日累计申购限额\s*([\d,.]+)\s*(万元|元)/);
  if (limitMatch) {
    const amount = parseFloat(limitMatch[1].replace(",", ""));
    dailyLimit = limitMatch[2] === "万元" ? amount * 10000 : amount;
  }

  // 解析赎回状态
  const redeemMatch = text.match(/赎回状态\s*(暂停)/);
  redeemStatus = redeemMatch ? "suspended" : "open";

  return { code, name: name || code, purchaseStatus, dailyLimit, redeemStatus };
}

/**
 * 抓取所有关注基金的状态
 */
export async function scrapeAllFunds(
  codes: string[]
): Promise<{ results: FundStatus[]; errors: { code: string; error: string }[] }> {
  const results: FundStatus[] = [];
  const errors: { code: string; error: string }[] = [];

  for (const code of codes) {
    try {
      const status = await scrapeFundStatus(code);
      results.push(status);
    } catch (error) {
      errors.push({
        code,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    if (codes.indexOf(code) < codes.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { results, errors };
}

export interface F10Status {
  code: string;
  purchaseStatus: "open" | "limited" | "suspended";
  dailyLimit: number | null;
}

/**
 * 轻量级 F10 抓取 — 只取交易状态和日累计限额，不解析名称
 */
async function fetchF10Lite(code: string): Promise<F10Status> {
  const url = `http://fundf10.eastmoney.com/jjfl_${code}.html`;
  const response = await fetchWithRetry(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "http://fundf10.eastmoney.com/",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const text = $.text();

  let purchaseStatus: "open" | "limited" | "suspended" = "open";
  let dailyLimit: number | null = null;

  // 优先从表格解析"申购状态XXX"
  const purchaseTableMatch = text.match(/申购状态\s*(限大额|暂停申购|开放申购)/);
  if (purchaseTableMatch) {
    const s = purchaseTableMatch[1];
    if (s === "暂停申购") purchaseStatus = "suspended";
    else if (s === "限大额") purchaseStatus = "limited";
    else purchaseStatus = "open";
  } else {
    // 回退：侧边栏 "交易状态：XXX"
    const tradeMatch = text.match(/交易状态[：:]\s*(\S+)/);
    if (tradeMatch) {
      const s = tradeMatch[1];
      if (s === "暂停申购") purchaseStatus = "suspended";
      else if (s === "限大额") purchaseStatus = "limited";
      else purchaseStatus = "open";
    }
  }

  const limitMatch = text.match(/日累计申购限额\s*([\d,.]+)\s*(万元|元)/);
  if (limitMatch) {
    const amount = parseFloat(limitMatch[1].replace(",", ""));
    dailyLimit = limitMatch[2] === "万元" ? amount * 10000 : amount;
  }

  return { code, purchaseStatus, dailyLimit };
}

/**
 * 批量抓取 F10 状态（并发控制 + 缓存）
 * @param codes 基金代码列表
 * @param concurrency 并发数（默认 5）
 */
export async function batchFetchF10(
  codes: string[],
  concurrency = 5
): Promise<Map<string, F10Status>> {
  const result = new Map<string, F10Status>();
  const queue = [...codes];

  async function worker() {
    while (queue.length > 0) {
      const code = queue.shift()!;
      try {
        const status = await fetchF10Lite(code);
        result.set(code, status);
      } catch {
        // 失败时跳过，保留 API 原始数据
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, codes.length) }, () => worker());
  await Promise.all(workers);
  return result;
}
