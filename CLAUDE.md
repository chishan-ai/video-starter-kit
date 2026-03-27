# Mozoria - AI Animation SaaS

## 项目概述
Mozoria (mozoria.com) 是面向 YouTube/TikTok AI 动画创作者的分镜级编辑 SaaS。
目标用户: 100-1000 付费用户，独立开发者项目。

## 技术栈
- **前端**: Next.js 14 (App Router) + React 18 + Tailwind CSS + shadcn/ui
- **状态管理**: React Query v5 (服务端数据) + Zustand (仅 UI 状态)
- **数据库**: Supabase Postgres + Drizzle ORM
- **认证**: Supabase Auth (Google OAuth + Magic Link)
- **文件存储**: Supabase Storage (bucket: character-images)
- **AI 视频生成**: fal.ai (Vidu Q3, Kling 3 Pro)
- **AI 文本**: Gemini API (角色分析 + 分镜拆分)
- **视频合成**: Remotion 4 (SSR 导出)
- **部署**: Vercel

## 项目结构
```
src/
├── app/                    # Next.js App Router 页面和 API
│   ├── api/               # API 路由 (17 个端点)
│   │   ├── projects/      # 项目 CRUD + shots + generate
│   │   ├── characters/    # 角色 CRUD + 上传 + AI 分析
│   │   ├── credits/       # 积分余额查询
│   │   └── generation/    # 视频生成状态轮询
│   ├── auth/              # OAuth 回调
│   ├── dashboard/         # 项目列表
│   ├── login/             # 登录页
│   └── projects/          # 项目编辑器
├── components/
│   ├── storyboard/        # 分镜编辑器组件
│   │   ├── project-editor.tsx
│   │   ├── storyboard-grid.tsx
│   │   ├── shot-card.tsx
│   │   ├── shot-detail-panel.tsx
│   │   └── script-editor.tsx
│   └── providers.tsx      # React Query Provider
├── db/
│   ├── schema.ts          # Drizzle schema (7 表, 8 枚举)
│   └── index.ts           # DB 客户端
├── hooks/
│   └── use-project.ts     # React Query hooks
└── lib/
    ├── supabase/          # Supabase 客户端 (browser/server/middleware/storage)
    ├── auth.ts            # 认证工具
    ├── credits.ts         # 积分系统 (扣费/退款/余额)
    ├── fal-server.ts      # fal.ai 服务端客户端
    ├── gemini.ts          # Gemini API 客户端
    ├── character-analysis.ts  # AI 角色特征提取
    ├── script-splitter.ts     # AI 剧本分镜拆分
    └── prompt-enhancer.ts     # Prompt 增强合成
docs/
└── planning/              # 产品规划文档
    ├── product-design.md
    ├── competitors.md
    ├── market-research.md
    └── ...
```

## 数据库表
- `users` - 用户 (creditsBalance)
- `projects` - 项目 (name, style, script, aspectRatio)
- `characters` - 角色 (description, referenceImages, features)
- `shots` - 分镜 (order, description, cameraType, duration)
- `shot_versions` - 分镜版本 (videoUrl, model, creditsUsed)
- `exports` - 导出记录
- `credit_transactions` - 积分流水

## 开发约定
- API 路由统一使用 Zod 验证输入
- 所有 API 路由先校验 Supabase Auth
- 视频生成采用异步队列模式 (fal.queue.submit → 轮询状态)
- 积分扣费原子化，失败自动退款
- 前端数据获取统一通过 use-project.ts 的 React Query hooks

## 环境变量
配置在 `.env.local` 中：
- `FAL_KEY` - fal.ai API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - Postgres 连接字符串 (Shared Pooler)
- `GEMINI_API_KEY` - Google Gemini API key

## Supabase 项目
- Project ID: `owkhlcqhjahbulqjtjjv`
- Region: ap-southeast-2 (Sydney)
- URL: `https://owkhlcqhjahbulqjtjjv.supabase.co`

## 开发命令
```bash
npm run dev          # 启动开发服务器
npm run db:push      # 推送 schema 到数据库
npm run db:studio    # 打开 Drizzle Studio
npm run build        # 构建生产版本
```

## 当前进度
- Week 1-4 代码已完成 (基础层 + 角色管理 + 视频生成管道 + 分镜编辑器 UI)
- 待开始: Week 5-6 (Stripe 计费 + TTS + Landing Page)

## 要求
1. 你每次回答都要称呼我为【持山】
2. 你要优先使用gstack的skills协助我进行开发