import nodemailer from "nodemailer";
import type { QDIIFund } from "./qdiidata";

/**
 * Create a nodemailer transporter using 163 SMTP.
 * Connection is lazily created on first use.
 */
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || "smtp.163.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be configured");
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return _transporter;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FundChangeInfo {
  oldStatus?: "open" | "limited" | "suspended";
  oldLimit?: number;
}

// ---------------------------------------------------------------------------
// Design tokens — monochrome
// ---------------------------------------------------------------------------

const FONTS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const MONO = "'SF Mono',SFMono-Regular,ui-monospace,Consolas,'Courier New',monospace";

const C = {
  black: "#111111",
  text: "#333333",
  secondary: "#666666",
  muted: "#999999",
  hint: "#bbbbbb",
  border: "#e0e0e0",
  bg: "#f5f5f5",
  white: "#ffffff",
  red: "#dc2626",    // 红涨
  green: "#16a34a",  // 绿跌
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLimitText(amount: number, status: string): string {
  if (status === "open") return "不限额";
  if (status === "suspended") return "—";
  if (amount <= 0) return "—";
  if (amount >= 10000) {
    const wan = amount / 10000;
    return `${Number.isInteger(wan) ? wan : wan.toFixed(1)}万`;
  }
  return amount.toLocaleString("zh-CN");
}

function statusLabel(s: string): string {
  if (s === "open") return "开放申购";
  if (s === "limited") return "限大额";
  return "暂停申购";
}

function weekdayZH(d: Date): string {
  return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildHeader(date: Date): string {
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  return `
  <tr>
    <td style="background:${C.white};padding:48px 40px 0">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:${FONTS};font-size:11px;font-weight:500;color:${C.hint};letter-spacing:2px;text-transform:uppercase">
            Daily Report
          </td>
        </tr>
        <tr><td style="height:10px"></td></tr>
        <tr>
          <td style="font-family:${FONTS};font-size:28px;font-weight:700;color:${C.black};letter-spacing:-0.5px;line-height:1.1">
            QDII Watch
          </td>
        </tr>
        <tr><td style="height:6px"></td></tr>
        <tr>
          <td style="font-family:${FONTS};font-size:13px;color:${C.secondary}">
            ${dateStr}  星期${weekdayZH(date)}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildDivider(padding = "28px 40px"): string {
  return `
  <tr>
    <td style="padding:${padding}">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="border-top:1px solid ${C.border};font-size:0;height:1px">&nbsp;</td></tr>
      </table>
    </td>
  </tr>`;
}

function buildSummary(funds: QDIIFund[], changes: Map<string, FundChangeInfo>): string {
  const open = funds.filter((f) => f.purchaseStatus === "open").length;
  const limited = funds.filter((f) => f.purchaseStatus === "limited").length;
  const suspended = funds.filter((f) => f.purchaseStatus === "suspended").length;

  const items: string[] = [];
  if (open > 0) items.push(`<span style="color:${C.black};font-weight:600">${open}</span> <span style="color:${C.muted}">开放</span>`);
  if (limited > 0) items.push(`<span style="color:${C.black};font-weight:600">${limited}</span> <span style="color:${C.muted}">限额</span>`);
  if (suspended > 0) items.push(`<span style="color:${C.black};font-weight:600">${suspended}</span> <span style="color:${C.muted}">暂停</span>`);
  if (changes.size > 0) items.push(`<span style="color:${C.black};font-weight:600">${changes.size}</span> <span style="color:${C.muted}">变化</span>`);

  return `
  <tr>
    <td style="background:${C.white};padding:0 40px 0">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:${FONTS};font-size:13px;color:${C.secondary};line-height:1">
            ${items.join(`<td style="padding:0 14px;color:${C.hint}">·</td>`)}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildChangeSummary(funds: QDIIFund[], changes: Map<string, FundChangeInfo>): string {
  if (changes.size === 0) return "";

  const rows = funds
    .filter((f) => changes.has(f.code))
    .map((f) => {
      const ch = changes.get(f.code)!;
      const isNewLimit = ch.oldStatus === "open" && f.purchaseStatus === "limited";
      const isOpened = ch.oldStatus !== "open" && f.purchaseStatus === "open";
      const isSuspended = f.purchaseStatus === "suspended";
      const limitChanged = ch.oldLimit !== undefined && ch.oldLimit !== f.limitAmount && f.limitAmount > 0;

      let arrow = "";
      let from = "";
      let to = "";

      if (isSuspended && ch.oldStatus !== "suspended") {
        arrow = "↓";
        from = statusLabel(ch.oldStatus ?? "open");
        to = "暂停申购";
      } else if (isOpened) {
        arrow = "↑";
        from = ch.oldLimit ? formatLimitText(ch.oldLimit, "limited") : "限额";
        to = "不限额";
      } else if (isNewLimit) {
        arrow = "↓";
        from = "不限额";
        to = formatLimitText(f.limitAmount, f.purchaseStatus);
      } else if (limitChanged) {
        arrow = f.limitAmount > (ch.oldLimit ?? 0) ? "↑" : "↓";
        from = formatLimitText(ch.oldLimit!, "limited");
        to = formatLimitText(f.limitAmount, f.purchaseStatus);
      } else if (ch.oldStatus && ch.oldStatus !== f.purchaseStatus) {
        arrow = "→";
        from = statusLabel(ch.oldStatus);
        to = statusLabel(f.purchaseStatus);
      }

      if (!arrow) return "";

      return `
        <tr>
          <td style="padding:10px 0;font-family:${MONO};font-size:12px;color:${C.muted};white-space:nowrap;vertical-align:top">
            ${f.code}
          </td>
          <td style="padding:10px 12px;font-family:${FONTS};font-size:13px;color:${C.text};vertical-align:top">
            ${f.name}
          </td>
          <td style="padding:10px 0;font-family:${MONO};font-size:12px;color:${C.secondary};text-align:right;white-space:nowrap;vertical-align:top">
            <span style="font-weight:600;color:${C.black}">${arrow}</span>
            &nbsp;${from} → ${to}
          </td>
        </tr>`;
    })
    .filter(Boolean)
    .join("");

  if (!rows) return "";

  return `
  <tr>
    <td style="background:${C.white};padding:20px 40px 0">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:${FONTS};font-size:11px;font-weight:600;color:${C.black};letter-spacing:1px">
            限额变化
          </td>
        </tr>
        <tr><td style="height:12px"></td></tr>
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rows}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildFundCard(fund: QDIIFund, change?: FundChangeInfo): string {
  const hasChange = change !== undefined;

  // Build change line
  let changeHtml = "";
  if (hasChange) {
    const isNewLimit = change.oldStatus === "open" && fund.purchaseStatus === "limited";
    const isOpened = change.oldStatus !== "open" && fund.purchaseStatus === "open";
    const limitChanged = change.oldLimit !== undefined && change.oldLimit !== fund.limitAmount && fund.limitAmount > 0;

    let arrow = "";
    let from = "";
    let to = "";

    if (isOpened) {
      arrow = "↑";
      from = change.oldLimit ? formatLimitText(change.oldLimit, "limited") : "限额";
      to = "不限额";
    } else if (isNewLimit) {
      arrow = "↓";
      from = "不限额";
      to = formatLimitText(fund.limitAmount, fund.purchaseStatus);
    } else if (limitChanged) {
      arrow = fund.limitAmount > (change.oldLimit ?? 0) ? "↑" : "↓";
      from = formatLimitText(change.oldLimit!, "limited");
      to = formatLimitText(fund.limitAmount, fund.purchaseStatus);
    } else if (fund.purchaseStatus === "suspended" && change.oldStatus !== "suspended") {
      arrow = "↓";
      from = statusLabel(change.oldStatus ?? "open");
      to = "暂停申购";
    } else if (change.oldStatus && change.oldStatus !== fund.purchaseStatus) {
      arrow = "→";
      from = statusLabel(change.oldStatus);
      to = statusLabel(fund.purchaseStatus);
    }

    if (arrow) {
      changeHtml = `
              <div style="margin-top:4px;font-family:${MONO};font-size:11px;color:${C.secondary}">
                <span style="font-weight:700;color:${C.black}">${arrow}</span>&nbsp;${from} → ${to}
              </div>`;
    }
  }

  const limitDisplay = formatLimitText(fund.limitAmount, fund.purchaseStatus);
  const limitColor = fund.purchaseStatus === "suspended" ? C.muted : C.black;
  const borderStyle = hasChange ? `border-left:3px solid ${C.black};` : "";

  return `
          <tr>
            <td style="padding:0 0 1px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="${borderStyle}padding:${hasChange ? "20px 20px 20px 17px" : "20px 20px"};border-bottom:1px solid ${C.border}">
                    <!-- Name row -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:${FONTS};font-size:14px;font-weight:500;color:${C.black};line-height:1.3;max-width:400px">
                          ${fund.name}
                        </td>
                        <td align="right" style="font-family:${MONO};font-size:11px;color:${C.hint};white-space:nowrap;vertical-align:bottom;padding-left:12px">
                          ${fund.code}
                        </td>
                      </tr>
                    </table>

                    <!-- Limit -->
                    <div style="margin-top:10px">
                      <span style="font-family:${MONO};font-size:24px;font-weight:700;color:${limitColor};letter-spacing:-0.5px">
                        ${limitDisplay}
                      </span>
                      <span style="margin-left:10px;font-family:${FONTS};font-size:11px;color:${C.muted};font-weight:400">
                        ${statusLabel(fund.purchaseStatus)}
                      </span>
                      ${changeHtml}
                    </div>

                    <!-- Performance -->
                    <div style="margin-top:10px;font-family:${MONO};font-size:11px;color:${C.muted}">
                      近1月 <span style="color:${fund.month1 >= 0 ? C.red : C.green}">${fund.month1 >= 0 ? "+" : ""}${fund.month1.toFixed(2)}%</span>
                      <span style="margin:0 8px;color:${C.border}">|</span>
                      日 <span style="color:${fund.dayChange >= 0 ? C.red : C.green}">${fund.dayChange >= 0 ? "+" : ""}${fund.dayChange.toFixed(2)}%</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function buildNewFundsSection(newFunds: QDIIFund[]): string {
  if (newFunds.length === 0) return "";

  const rows = newFunds
    .map(
      (f) => `
    <tr>
      <td style="padding:5px 0;font-family:${MONO};font-size:12px;color:${C.hint}">${f.code}</td>
      <td style="padding:5px 12px;font-family:${FONTS};font-size:13px;color:${C.text}">${f.name}</td>
    </tr>`,
    )
    .join("");

  return `
  <tr>
    <td style="background:${C.white};padding:20px 40px 0">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:${FONTS};font-size:11px;font-weight:600;color:${C.black};letter-spacing:1px">
            新增基金
          </td>
        </tr>
        <tr><td style="height:12px"></td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${rows}
          </table>
        </td></tr>
      </table>
    </td>
  </tr>`;
}

function buildFooter(unsubUrl: string): string {
  return `
  <tr>
    <td style="background:${C.white};padding:36px 40px 48px">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-top:1px solid ${C.border};padding-top:20px;font-family:${FONTS};font-size:11px;color:${C.hint};line-height:2.2;text-align:center">
            QDII Watch · 数据来源：天天基金网<br>
            <a href="${unsubUrl}" style="color:${C.secondary};text-decoration:underline" target="_blank">取消订阅</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

function buildEmailHtml(
  funds: QDIIFund[],
  newFunds: QDIIFund[],
  changes: Map<string, FundChangeInfo>,
  unsubUrl: string,
): string {
  const date = new Date();

  // Sort: changed → suspended → limited → open
  const sorted = [...funds].sort((a, b) => {
    const ac = changes.has(a.code) ? 0 : 1;
    const bc = changes.has(b.code) ? 0 : 1;
    if (ac !== bc) return ac - bc;
    const order: Record<string, number> = { suspended: 0, limited: 1, open: 2 };
    return (order[a.purchaseStatus] ?? 3) - (order[b.purchaseStatus] ?? 3);
  });

  const fundCards = sorted.map((f) => buildFundCard(f, changes.get(f.code))).join("");

  const changeSection = buildChangeSummary(funds, changes);
  const newSection = buildNewFundsSection(newFunds);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>QDII Watch 每日限额报告</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONTS}">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg}">
    <tr>
      <td align="center" style="padding:24px 12px">

        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;background:${C.white};border-radius:8px;overflow:hidden">

          ${buildHeader(date)}
          ${buildDivider("24px 40px 20px")}
          ${buildSummary(funds, changes)}
          ${changeSection ? buildDivider("20px 40px") : ""}
          ${changeSection}
          ${buildDivider("24px 40px 16px")}

          <!-- Fund list -->
          <tr>
            <td style="background:${C.white};padding:0 40px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONTS};font-size:11px;font-weight:600;color:${C.black};letter-spacing:1px;padding-bottom:4px">
                    关注基金
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${C.white};padding:4px 40px 0">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${fundCards}
              </table>
            </td>
          </tr>

          ${newSection ? buildDivider("20px 40px") : ""}
          ${newSection}
          ${buildFooter(unsubUrl)}

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendNotificationEmail(
  to: string,
  funds: QDIIFund[],
  newFunds: QDIIFund[],
  changes: Map<string, FundChangeInfo> = new Map(),
) {
  const transporter = getTransporter();

  // Lazy import to avoid top-level await issues
  const { buildUnsubUrl } = await import("./unsubscribe-token");
  const unsubUrl = buildUnsubUrl(to);

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;
  const date = new Date();
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
  const changeTag = changes.size > 0 ? ` · ${changes.size}只变化` : "";
  const subject = `QDII额度监控工具——今日报告${changeTag}`;
  const html = buildEmailHtml(funds, newFunds, changes, unsubUrl);

  await transporter.sendMail({ from, to, subject, html });
}
