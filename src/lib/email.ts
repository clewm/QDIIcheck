import { Resend } from "resend";
import type { QDIIFund } from "./qdiidata";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  return new Resend(apiKey);
}

function formatLimit(amount: number, status: string): string {
  if (status === "open") return "不限额";
  if (amount <= 0) return "—";
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万元`;
  return `${amount}元`;
}

function statusLabel(s: string): string {
  if (s === "open") return "不限额";
  if (s === "limited") return "限额";
  return "暂停买入";
}

function buildEmailHtml(
  funds: QDIIFund[],
  newFunds: QDIIFund[]
): string {
  const rows = funds
    .map(
      (f) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:13px;color:#666">${f.code}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${f.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;background:${f.purchaseStatus === "open" ? "#22c55e" : f.purchaseStatus === "limited" ? "#eab308" : "#ef4444"}"></span>
        ${statusLabel(f.purchaseStatus)}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:right;font-weight:600;color:${f.purchaseStatus === "open" ? "#22c55e" : "#f97316"}">${formatLimit(f.limitAmount, f.purchaseStatus)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:right;color:${f.month1 >= 0 ? "#22c55e" : "#ef4444"}">${f.month1 >= 0 ? "+" : ""}${f.month1.toFixed(2)}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:right;color:${f.dayChange >= 0 ? "#22c55e" : "#ef4444"}">${f.dayChange >= 0 ? "+" : ""}${f.dayChange.toFixed(2)}%</td>
    </tr>`
    )
    .join("");

  const newSection =
    newFunds.length > 0
      ? `<h3 style="margin:24px 0 12px;font-size:14px;color:#999">🆕 新增 QDII 基金</h3>
       <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
         <tr style="background:#f9f9f9">
           <th style="padding:6px 12px;text-align:left;font-size:12px;color:#999">代码</th>
           <th style="padding:6px 12px;text-align:left;font-size:12px;color:#999">名称</th>
         </tr>
         ${newFunds.map((f) => `<tr><td style="padding:6px 12px;font-family:monospace;font-size:13px">${f.code}</td><td style="padding:6px 12px;font-size:13px">${f.name}</td></tr>`).join("")}
       </table>`
      : "";

  return `
  <div style="max-width:700px;margin:0 auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333">
    <h2 style="margin:0 0 4px;font-size:18px">QDII Watch · 每日限额报告</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#999">${new Date().toLocaleDateString("zh-CN")} 关注基金限额情况</p>

    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f9f9f9">
        <th style="padding:6px 12px;text-align:left;font-size:12px;color:#999">代码</th>
        <th style="padding:6px 12px;text-align:left;font-size:12px;color:#999">名称</th>
        <th style="padding:6px 12px;text-align:center;font-size:12px;color:#999">状态</th>
        <th style="padding:6px 12px;text-align:right;font-size:12px;color:#999">限额</th>
        <th style="padding:6px 12px;text-align:right;font-size:12px;color:#999">近1月</th>
        <th style="padding:6px 12px;text-align:right;font-size:12px;color:#999">日涨跌</th>
      </tr>
      ${rows}
    </table>

    ${newSection}

    <p style="margin-top:32px;font-size:11px;color:#bbb;text-align:center">
      QDII Watch — 数据来源：天天基金网<br>
      如需取消订阅，请访问网站点击「订阅」按钮进行取消
    </p>
  </div>`;
}

export async function sendNotificationEmail(
  to: string,
  funds: QDIIFund[],
  newFunds: QDIIFund[],
  notifyTime: string
) {
  const resend = getResend();

  const subject = `QDII 限额日报 · ${new Date().toLocaleDateString("zh-CN")}`;
  const html = buildEmailHtml(funds, newFunds);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "QDII Watch <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}
