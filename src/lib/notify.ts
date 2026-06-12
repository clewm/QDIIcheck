import type { FundStatus } from "./scraper";

interface NotifyResult {
  channel: string;
  success: boolean;
  error?: string;
}

/**
 * 格式化限额金额
 */
function formatLimit(limit: number | null): string {
  if (limit === null) return "不限额";
  if (limit >= 10000) return `${(limit / 10000).toFixed(0)}万元`;
  return `${limit}元`;
}

/**
 * 格式化状态中文
 */
function formatStatus(status: "open" | "limited" | "suspended"): string {
  switch (status) {
    case "open":
      return "开放申购";
    case "limited":
      return "限制大额";
    case "suspended":
      return "暂停申购";
  }
}

/**
 * 构建通知内容
 */
function buildMessage(
  fundName: string,
  code: string,
  oldStatus: string,
  newStatus: FundStatus
): { title: string; body: string } {
  const title = `QDII 状态变化：${fundName}`;
  const body = `${code} ${fundName}\n申购：${formatStatus(newStatus.purchaseStatus)}${newStatus.dailyLimit ? `（限额 ${formatLimit(newStatus.dailyLimit)}）` : ""}\n赎回：${newStatus.redeemStatus === "open" ? "开放赎回" : "暂停赎回"}`;
  return { title, body };
}

/**
 * 发送 Bark 推送（iOS）
 */
async function sendBark(title: string, body: string): Promise<NotifyResult> {
  const barkUrl = process.env.BARK_URL;
  if (!barkUrl) {
    return { channel: "bark", success: false, error: "BARK_URL not configured" };
  }

  try {
    const url = `${barkUrl}/${encodeURIComponent(title)}/${encodeURIComponent(body)}?group=QDII&isArchive=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Bark HTTP ${response.status}`);
    }
    return { channel: "bark", success: true };
  } catch (error) {
    return {
      channel: "bark",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 发送 Server酱 推送（微信）
 */
async function sendServerChan(
  title: string,
  body: string
): Promise<NotifyResult> {
  const key = process.env.SERVERCHAN_KEY;
  if (!key) {
    return {
      channel: "serverchan",
      success: false,
      error: "SERVERCHAN_KEY not configured",
    };
  }

  try {
    const response = await fetch(
      `https://sctapi.ftqq.com/${key}.send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ title, desp: body.replace(/\n/g, "\n\n") }),
      }
    );
    if (!response.ok) {
      throw new Error(`Server酱 HTTP ${response.status}`);
    }
    return { channel: "serverchan", success: true };
  } catch (error) {
    return {
      channel: "serverchan",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 发送所有已配置渠道的通知
 */
export async function notifyStatusChange(
  fundName: string,
  code: string,
  oldStatus: string,
  newStatus: FundStatus
): Promise<NotifyResult[]> {
  const { title, body } = buildMessage(fundName, code, oldStatus, newStatus);

  const results = await Promise.all([sendBark(title, body), sendServerChan(title, body)]);

  return results;
}
