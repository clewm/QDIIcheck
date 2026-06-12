# QDII Watch

每日自动监控美股 QDII 基金申购限额/状态，第一时间推送通知。

## 技术栈

- **框架**: Next.js 15 (App Router, RSC, Server Actions)
- **UI**: Tailwind CSS 4 + shadcn/ui + Geist 字体
- **存储**: 本地 JSON 文件 (`data/db.json`)
- **抓取**: fetch + cheerio (HTML 解析)
- **调度**: Vercel Cron + GitHub Actions (备用)
- **通知**: Bark (iOS) / Server酱 (微信)
- **部署**: Vercel 免费层

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

## 部署到 Vercel

1. Push 代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署完成后，Cron 任务自动每天 09:30 和 15:30 (CST) 执行

> **注意**: Vercel Serverless 的文件系统是临时的，每次冷启动后 `data/db.json` 会丢失。生产环境建议挂载 Vercel KV 或改用 Supabase。本地开发无此限制。

## License

MIT
