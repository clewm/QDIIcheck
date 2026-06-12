/**
 * Shared types — no runtime imports, safe for both server and client bundles.
 */

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
