# QDII Watch

每日自动监控美股 QDII 基金申购限额/状态，第一时间推送通知。

## 技术栈

- **框架**: Next.js 15 (App Router, RSC, Server Actions)
- **UI**: Tailwind CSS 4 + shadcn/ui + Geist 字体
- **存储**: S3 兼容对象存储（见 `src/lib/storage-s3.ts`）
- **抓取**: fetch + cheerio (HTML 解析)
- **调度**: [EasyCron](https://www.easycron.com/cron-jobs) 定时调用 `/api/cron/fetch` 接口
- **通知**: 邮件订阅 + Bark (iOS) / Server酱 (微信)
- **部署**: 腾讯云 EdgeOne Pages

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，前往「设置」页添加要监控的基金。

## 环境变量（可选）

复制 `.env.local.example` 为 `.env.local`：

```env
CRON_SECRET=your-random-secret    # Cron 接口验证
BARK_URL=https://api.day.app/KEY  # iOS 推送
SERVERCHAN_KEY=your-key           # 微信推送
SETTINGS_PASSPHRASE=your-pass     # 设置页密码
```

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── cron/fetch/route.ts   # 定时抓取接口
│   │   └── funds/route.ts        # 基金 CRUD API
│   ├── fund/[code]/page.tsx      # 基金详情页
│   ├── settings/page.tsx         # 设置页
│   ├── layout.tsx                # 全局布局
│   └── page.tsx                  # 首页 Dashboard
├── components/                   # UI 组件
└── lib/
    ├── data.ts                   # JSON 文件读写
    ├── notify.ts                 # 通知推送
    ├── scraper.ts                # 基金数据抓取
    └── utils.ts                  # 工具函数
data/
└── db.json                       # 本地数据文件（自动创建）
```

## 部署到腾讯云 EdgeOne

1. Push 代码到代码仓库
2. 在腾讯云 EdgeOne Pages 导入项目并部署（Next.js 应用）
3. 配置环境变量（至少需要 `S3_*`、`SMTP_*`、`CRON_SECRET`）
4. 配置定时任务：在 [EasyCron](https://www.easycron.com/cron-jobs) 新建任务，定时调用部署后的 `https://<你的域名>/api/cron/fetch`，请求头带 `Authorization: Bearer $CRON_SECRET`。建议每个交易日调用一次。

> **注意**: 本项目**不依赖部署平台自带的 cron**，数据抓取与订阅邮件完全由 EasyCron 触发 `/api/cron/fetch` 驱动，仓库里**没有 `vercel.json`**。订阅邮件按「北京自然日」去重，一天内无论接口被调用几次都只会发一封。数据存储在 S3 兼容对象存储，不依赖本地文件系统。

## License

MIT
