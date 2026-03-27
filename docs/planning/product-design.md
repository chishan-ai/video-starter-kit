# AI 动画 SaaS — 产品设计文档

**版本**: v1.0 Draft
**日期**: 2026-03-26
**状态**: 待讨论

---

## 1. 产品定位

### 一句话定位

> **面向 YouTube/TikTok AI 动画创作者的分镜级编辑工作台** — 剧本输入，分镜输出，逐镜可控，角色一致。

### 定位象限

```
控制力 高
    │
    │   LTX Studio        ★ Mozoria
    │   Runway
    │                      MkAnime
    │
    │   Pika               AnimateAI.Pro
    │   DomoAI
    │
    └──────────────────────────── 端到端自动化 高
控制力 低
```

**差异化核心**：在端到端自动化（MkAnime 水平）的基础上，提供**分镜级精细控制**。竞品是"一次性梭哈生成"，我们是"逐镜可编辑、改了还一致"。

### 产品名称（已确认）

**Mozoria** — mozoria.com（域名已持有）

Tagline 候选：
- "AI Storyboard Studio for Anime Creators"
- "Script to Anime, Shot by Shot"

---

## 2. 目标用户（已确认）

### 主要用户

| 群体 | 画像 | 核心诉求 | 付费能力 |
|------|------|---------|---------|
| **A: 频道运营者** | YouTube/TikTok AI 动画频道，用 4-6 个工具拼接工作流 | 效率提升、产量提升 | 高（已付 Kling/ElevenLabs 等） |
| **B: 动漫系列创作者** | 做连续剧集的动漫创作者，需跨集角色一致 | 角色一致性、系列化生产 | 中高 |

### 用户场景

**场景 1：频道运营者的日常**
> Alex 经营一个 10 万订阅的 AI 动漫频道，每周发 3 条 Shorts。当前工作流：Claude 写脚本 → Midjourney 生角色图 → Kling 逐段生成视频 → CapCut 拼接+配音+字幕。每条视频耗时 3-4 小时。他希望缩短到 1 小时内。

**场景 2：动漫系列创作者的痛点**
> Yuki 正在做一个 12 集的动漫短剧。第 1 集的主角用 Vidu 生成效果很好，但到第 3 集时角色外观已经漂移了。她不得不反复生成、手动筛选最接近的版本。她需要"创建一次角色，所有集数自动保持一致"的功能。

### 排除的用户

- C: 内容营销 Agency（获客渠道不同，需求不匹配）
- D: 纯新手创作者（ARPU 低，需求太基础）

---

## 3. 核心用户流程（MVP）

### 主流程

```
┌─────────────────────────────────────────────────────────┐
│                     创作主流程                            │
│                                                          │
│  ① 新建项目                                              │
│     └→ 输入项目名 + 选择风格（动漫/写实/3D）               │
│        + 选择画幅（9:16 竖屏 / 16:9 横屏）                │
│                                                          │
│  ② 角色设定                                              │
│     └→ 上传角色参考图（1-7 张）                           │
│        + AI 自动提取特征描述                               │
│        + 保存为角色资产（可跨项目复用）                     │
│                                                          │
│  ③ 剧本输入                                              │
│     └→ 文本框输入剧本 / 粘贴脚本                          │
│        + 选择语言、语调                                    │
│        + [可选] AI 辅助扩写                                │
│                                                          │
│  ④ AI 分镜生成                                            │
│     └→ 一键拆分为 5-8 个分镜                              │
│        + 每个分镜显示：描述 + 预估时长 + 镜头类型           │
│        + 角色参考图自动注入每个分镜                         │
│                                                          │
│  ⑤ 分镜编辑（核心差异化）                                  │
│     └→ 分镜网格视图 + 拖拽排序                            │
│        + 单个分镜操作：                                    │
│          • 编辑描述 → 重新生成                             │
│          • 更换镜头类型（全景/中景/特写/俯拍...）           │
│          • 调整时长（3-10秒）                              │
│          • 删除 / 插入新分镜                               │
│          • 从多个生成结果中选择最佳版本                     │
│        + 全局操作：                                        │
│          • 一键全部生成                                    │
│          • 批量调整风格参数                                │
│                                                          │
│  ⑥ 预览与微调                                             │
│     └→ 全片连续预览（带 TTS 配音）                         │
│        + 标记需要修改的分镜                                │
│        + 重新生成标记的分镜                                │
│                                                          │
│  ⑦ 导出                                                  │
│     └→ 视频合成（分镜拼接 + TTS + 字幕 + BGM）            │
│        + 选择质量（720p/1080p）                            │
│        + 下载 MP4                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 辅助流程

```
角色资产管理
  └→ 角色列表 → 查看/编辑/删除
  └→ 创建新角色（上传图片 + 描述）
  └→ 跨项目复用角色

项目管理
  └→ 项目列表（草稿/已完成/已发布）
  └→ 复制项目（基于已有项目创建新集）
  └→ 删除项目

账户与计费
  └→ Credits 余额查看
  └→ 购买 Credits / 升级套餐
  └→ 使用历史
```

---

## 4. 功能规格（MVP 范围）

### MVP 必须有（P0）

| # | 功能 | 说明 | 依赖 |
|---|------|------|------|
| F1 | 项目创建 | 名称 + 风格 + 画幅 | — |
| F2 | 角色创建 | 上传 1-7 张参考图，AI 提取特征描述，保存为角色资产 | Vidu/Kling Reference API |
| F3 | 剧本输入 | 文本输入/粘贴，支持中英文 | — |
| F4 | AI 分镜拆分 | 剧本 → 5-8 个分镜，含描述+时长+镜头类型 | video-shot-agent |
| F5 | 分镜网格视图 | 网格展示所有分镜，拖拽排序 | 前端 |
| F6 | 单镜生成 | 为单个分镜生成视频（角色图自动注入） | Vidu API / Kling API |
| F7 | 批量生成 | 一键生成所有分镜 | 异步任务队列 |
| F8 | 单镜编辑 | 修改描述→重新生成，调整时长，删除/插入 | F6 |
| F9 | 多版本选择 | 每个分镜保留 2-3 个生成版本，用户选最佳 | 存储 |
| F10 | 全片预览 | 按顺序连续播放所有分镜 | 前端播放器 |
| F11 | 视频导出 | 合成最终视频（拼接 + 转场） | Editly / Remotion |
| F12 | 用户认证 | 注册/登录（Email + Google OAuth） | NextAuth/Clerk |
| F13 | Credits 计费 | 显示余额，每次生成扣除 Credits | Stripe |
| F14 | Landing Page | 产品介绍 + 定价 + CTA | — |

### MVP 之后（P1）

| # | 功能 | 说明 | 优先理由 |
|---|------|------|---------|
| F15 | TTS 配音 | AI 语音合成 + 逐镜配音 | 用户强需求 |
| F16 | AI 字幕 | 自动生成字幕叠加到视频 | 社交媒体必备 |
| F17 | BGM 选择 | 背景音乐库 + AI 生成 | 提升产出质量 |
| F18 | 角色资产库 | 跨项目复用角色，管理面板 | 系列化生产 |
| F19 | 项目模板 | 预设故事模板（逆袭/爱情/冒险...） | 降低使用门槛 |
| F20 | 批量项目 | 基于同一角色设定批量创建多集 | 系列化生产 |

### MVP 之后（P2）

| # | 功能 | 说明 |
|---|------|------|
| F21 | 高级时间线编辑器 | Twick SDK 集成，精细剪辑 |
| F22 | 口型同步 | 配音+角色口型对齐 |
| F23 | 自定义转场效果 | 多种转场选择 |
| F24 | 团队协作 | 多人编辑同一项目 |
| F25 | API 开放 | 第三方集成 |

---

## 5. 页面结构（信息架构）

```
/                           Landing Page（产品介绍 + 定价 + CTA）
├── /login                  登录
├── /signup                 注册
├── /dashboard              项目列表（我的项目）
│   ├── /new                新建项目
│   └── /[projectId]        项目工作台
│       ├── /characters     角色设定（步骤 2）
│       ├── /script         剧本输入（步骤 3）
│       ├── /storyboard     分镜编辑（步骤 4-5，核心页面）
│       ├── /preview        全片预览（步骤 6）
│       └── /export         导出（步骤 7）
├── /characters             角色资产库（全局）
├── /billing                账户计费
│   ├── /plans              套餐选择
│   └── /history            使用历史
└── /settings               账户设置
```

---

## 6. 核心页面设计

### 6.1 Landing Page（/）

**目标**: 30 秒内让访客理解产品价值，驱动注册

**结构**:
```
Hero Section
├── 标题: "Turn Scripts into Anime — Shot by Shot"
├── 副标题: "AI-powered storyboard editor with character consistency.
│            Edit any shot, keep every character on-model."
├── CTA: "Start Creating Free" → /signup
└── Hero 视频: 15 秒产品 demo（剧本→分镜→编辑→导出）

Pain Point Section
├── "Tired of juggling 4-6 tools?"
├── 3 列对比:
│   ├── ❌ 当前: Claude + Midjourney + Kling + CapCut + ElevenLabs
│   └── ✅ 我们: 一个工具，从脚本到成片

Core Feature Section
├── Feature 1: "AI Storyboard Generation"
│   └── 剧本输入 → 自动拆分分镜（动画演示）
├── Feature 2: "Shot-by-Shot Editing"
│   └── 分镜网格，单击重新生成（动画演示）
├── Feature 3: "Character Consistency"
│   └── 创建一次角色，全片保持一致（对比图）
└── Feature 4: "One-Click Export"
    └── 自动拼接+配音+字幕→下载（动画演示）

Social Proof Section（Beta 后补充）
├── 创作者推荐语
└── 产出作品展示

Pricing Section
├── 3 个套餐卡片
└── FAQ

Footer
├── 产品链接
├── Legal（Terms, Privacy）
└── 社交媒体（X, Discord）
```

### 6.2 项目工作台 — 分镜编辑页（核心页面）

**这是产品的核心体验页面，也是差异化所在。**

**布局**:
```
┌─────────────────────────────────────────────────────────┐
│  顶栏: [← 返回] 项目名称  [风格:动漫▾]  [Credits:150]  │
├─────────────┬───────────────────────────────────────────┤
│             │                                           │
│  左侧面板    │          分镜网格区域                      │
│  (可折叠)    │                                           │
│             │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  角色列表    │  │ Shot 1  │  │ Shot 2  │  │ Shot 3  │  │
│  ┌────────┐ │  │ [缩略图] │  │ [缩略图] │  │ [生成中] │  │
│  │ 角色 A │ │  │ 5s 全景 │  │ 3s 中景 │  │ 4s 特写 │  │
│  │ [头像] │ │  │ ✅ 已选  │  │ ✅ 已选  │  │ ⏳ 生成中│  │
│  ├────────┤ │  └─────────┘  └─────────┘  └─────────┘  │
│  │ 角色 B │ │                                           │
│  │ [头像] │ │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  └────────┘ │  │ Shot 4  │  │ Shot 5  │  │ + 新增   │  │
│             │  │ [缩略图] │  │ [缩略图] │  │  分镜    │  │
│  [+ 新角色] │  │ 5s 全景 │  │ 6s 俯拍 │  │         │  │
│             │  │ ❌ 待生成│  │ ❌ 待生成│  │         │  │
│  ──────────│  └─────────┘  └─────────┘  └─────────┘  │
│             │                                           │
│  分镜描述    │                                           │
│  ┌────────┐ │                                           │
│  │ 选中的  │ │                                           │
│  │ 分镜描述│ │                                           │
│  │        │ │                                           │
│  │ [编辑] │ │                                           │
│  │ [重新  │ │                                           │
│  │  生成] │ │                                           │
│  └────────┘ │                                           │
│             │                                           │
├─────────────┴───────────────────────────────────────────┤
│  底栏: [全部生成 ▶]  [预览全片 ▶]  [导出 ↓]  进度: 3/5  │
└─────────────────────────────────────────────────────────┘
```

**分镜卡片交互**:

| 操作 | 触发方式 | 效果 |
|------|---------|------|
| 选择分镜 | 单击卡片 | 左侧面板显示详情 |
| 排序 | 拖拽卡片 | 调整分镜顺序 |
| 生成视频 | 点击卡片上"生成"按钮 | 异步生成，显示进度 |
| 查看版本 | 点击已生成的卡片 | 展开 2-3 个版本供选择 |
| 编辑描述 | 左侧面板编辑区 | 修改 prompt 文字 |
| 重新生成 | 左侧面板"重新生成"按钮 | 基于新描述重新生成 |
| 删除分镜 | 右键 / 卡片菜单 | 删除该分镜 |
| 新增分镜 | 点击"+ 新增"卡片 | 在指定位置插入 |
| 调整时长 | 左侧面板滑块 | 3-10 秒 |
| 选择镜头类型 | 左侧面板下拉 | 全景/中景/特写/俯拍/仰拍 |

### 6.3 角色设定页

```
┌─────────────────────────────────────────────────────────┐
│  角色设定                                     [跳过 →]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │                  │    │ 角色名称: [小明]          │   │
│  │   [拖拽上传      │    │                          │   │
│  │    角色参考图]    │    │ 性别: [男 ▾]             │   │
│  │                  │    │                          │   │
│  │  支持 1-7 张图片  │    │ AI 提取的特征:           │   │
│  │  (正面/侧面/全身) │    │ ┌────────────────────┐   │   │
│  │                  │    │ │ 黑色短发、棕色眼睛、 │   │   │
│  └──────────────────┘    │ │ 蓝色校服、运动鞋    │   │   │
│                          │ └────────────────────┘   │   │
│  已上传:                  │ [编辑特征描述]           │   │
│  [img1] [img2] [img3]    │                          │   │
│                          │ [保存角色]  [保存到资产库]│   │
│                          └──────────────────────────┘   │
│                                                          │
│  ── 已保存的角色 ──                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐                    │
│  │ 小明   │  │ 小红   │  │+ 新角色│                    │
│  │ [头像] │  │ [头像] │  │        │                    │
│  │ 主角   │  │ 女主   │  │        │                    │
│  └────────┘  └────────┘  └────────┘                    │
│                                                          │
│                               [下一步: 输入剧本 →]      │
└─────────────────────────────────────────────────────────┘
```

---

## 7. 数据模型

### 核心实体

```typescript
// 用户
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  creditsBalance: number;
  plan: 'free' | 'starter' | 'pro' | 'studio';
  createdAt: Date;
}

// 角色资产（全局，可跨项目复用）
interface Character {
  id: string;
  userId: string;
  name: string;
  gender?: string;
  description: string;          // AI 提取 + 用户编辑的特征描述
  referenceImages: string[];    // 1-7 张参考图 URL
  thumbnailUrl: string;         // 头像缩略图
  createdAt: Date;
}

// 项目
interface Project {
  id: string;
  userId: string;
  name: string;
  style: 'anime' | 'realistic' | '3d' | 'mixed';
  aspectRatio: '9:16' | '16:9' | '1:1';
  status: 'draft' | 'generating' | 'completed' | 'exported';
  script: string;               // 原始剧本文本
  characters: string[];         // 关联的角色 ID 列表
  createdAt: Date;
  updatedAt: Date;
}

// 分镜
interface Shot {
  id: string;
  projectId: string;
  order: number;                // 排序位置
  description: string;          // 分镜描述（prompt）
  duration: number;             // 时长（秒），3-10
  cameraType: 'wide' | 'medium' | 'close-up' | 'overhead' | 'low-angle';
  characters: string[];         // 该分镜出现的角色 ID
  status: 'pending' | 'generating' | 'completed' | 'failed';
  selectedVersionId?: string;   // 用户选择的版本
  versions: ShotVersion[];      // 生成的多个版本
}

// 分镜版本（每次生成的结果）
interface ShotVersion {
  id: string;
  shotId: string;
  videoUrl: string;             // 生成的视频 URL
  thumbnailUrl: string;         // 缩略图
  prompt: string;               // 实际发送给 API 的 prompt
  model: string;                // fal.ai 模型 ID（如 'vidu/q3/image-to-video', 'kling-video/v3/pro/image-to-video'）
  creditsUsed: number;
  generatedAt: Date;
}

// 导出记录
interface Export {
  id: string;
  projectId: string;
  videoUrl: string;
  resolution: '720p' | '1080p';
  duration: number;
  fileSize: number;
  createdAt: Date;
}

// Credits 交易记录
interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;               // 正数=充入，负数=消耗
  type: 'purchase' | 'subscription' | 'generation' | 'export' | 'bonus';
  description: string;
  relatedId?: string;           // 关联的 shot/export ID
  createdAt: Date;
}
```

### 存储策略

| 数据 | MVP 存储 | 规模化 |
|------|---------|--------|
| 用户数据 | Vercel Postgres / PlanetScale | 同左 |
| 项目/分镜元数据 | 同上 | 同左 |
| 参考图片 | Cloudflare R2 | 同左（成本最低） |
| 生成的视频 | Cloudflare R2 | 同左 + CDN |
| 导出的视频 | Cloudflare R2（7 天过期） | 同左 |
| 会话状态 | IndexedDB（继承基座） | Redis |

---

## 8. API 设计

### 核心端点

```
# 项目管理
POST   /api/projects              创建项目
GET    /api/projects              列出用户项目
GET    /api/projects/:id          获取项目详情
PATCH  /api/projects/:id          更新项目
DELETE /api/projects/:id          删除项目

# 角色管理
POST   /api/characters            创建角色（含图片上传）
GET    /api/characters            列出用户角色
PATCH  /api/characters/:id        更新角色
DELETE /api/characters/:id        删除角色

# 分镜操作
POST   /api/projects/:id/generate-shots    AI 分镜拆分（剧本→分镜）
PATCH  /api/shots/:id                      更新分镜（描述、顺序、时长等）
DELETE /api/shots/:id                      删除分镜
POST   /api/shots/:id/generate-video       生成单个分镜视频
POST   /api/projects/:id/generate-all      批量生成所有分镜
GET    /api/shots/:id/versions             获取分镜的所有版本
PATCH  /api/shots/:id/select-version       选择最佳版本

# 预览与导出
GET    /api/projects/:id/preview           获取预览数据（所有选中版本的播放列表）
POST   /api/projects/:id/export            导出最终视频
GET    /api/exports/:id/status             查询导出状态

# 计费
GET    /api/billing/balance                当前余额
GET    /api/billing/transactions            交易历史
POST   /api/billing/checkout               创建 Stripe checkout session
POST   /api/webhooks/stripe                Stripe webhook
```

### 异步任务流

视频生成是异步的，采用以下模式：

```
客户端                   服务端                    视频API
  │                       │                         │
  │── POST generate ─────>│                         │
  │<── { taskId } ────────│                         │
  │                       │── 提交生成任务 ──────────>│
  │                       │<── { externalTaskId } ──│
  │                       │                         │
  │    (SSE/WebSocket)    │                         │
  │<── status: generating │                         │
  │                       │<── Webhook: completed ──│
  │<── status: completed  │                         │
  │<── { videoUrl }       │                         │
  │                       │                         │
```

**推荐方案**: Server-Sent Events (SSE) 推送生成状态，比轮询更实时、更省资源。

---

## 9. Credits 消耗模型

### 每个操作的 Credits 消耗

| 操作 | Credits 消耗 | 说明 |
|------|-------------|------|
| AI 分镜拆分 | 5 | 一次 LLM 调用，成本约 $0.05 |
| 单镜视频生成（Vidu 动漫） | 10-20 | 按时长，5 秒 ≈ 10 credits |
| 单镜视频生成（Kling 通用） | 15-30 | 按时长，成本略高 |
| 视频导出 | 5-10 | 服务端渲染成本 |
| TTS 配音（P1） | 5 | 每分钟 |

### 定价方案

| 套餐 | 月价 | Credits/月 | 约等于 | 目标用户 |
|------|------|-----------|--------|---------|
| **Free** | $0 | 50 | ~2 个分镜试用 | 体验/评估 |
| **Starter** | $29/月 | 500 | ~5-8 个完整视频 | 轻度创作者 |
| **Pro** | $79/月 | 1,500 | ~15-25 个完整视频 | 频道运营者 |
| **Studio** | $149/月 | 4,000 | ~40-65 个完整视频 | 重度/系列创作者 |

**定价逻辑**:
- 一个完整视频（5-8 个分镜）消耗约 60-100 credits
- 定价参考竞品专业版价格带（$70-130/月），略高于 MkAnime Pro（$49.9）
- 高定价策略匹配"分镜级控制"的高级功能定位
- 年付 8 折

**补充 Credits 包**:
- 200 credits / $15（不过期）
- 500 credits / $35（不过期）
- 1,000 credits / $60（不过期）

---

## 10. 技术架构（详见 tech-deep-dive.md）

### 架构概要（已确认：fal.ai 统一 API 层）

**核心简化**：所有 AI 模型调用统一走 fal.ai API，一个 API key 覆盖全部模型。

```
基座: fal-ai video-starter-kit (MIT)
├── Next.js 15 + App Router
├── Remotion (视频渲染)
├── fal.ai SDK — 统一 AI API 层（已内置）
├── Vercel AI SDK
└── Tailwind + shadcn/ui

fal.ai 提供的模型（一个 API 全覆盖）:
├── Vidu Q3 Pro — 动漫视频生成（image-to-video / text-to-video）
├── Vidu Q3 Turbo — 快速动漫生成
├── Kling 3.0 Pro — 通用视频生成（image-to-video / text-to-video）
├── Kling 2.5 Turbo — 风格化视频
├── Minimax — 备选视频模型
├── MMAudio — AI 音乐生成（基座已集成）
├── F5-TTS — AI 语音合成（基座已集成）
└── Flux / Nano Banana 2 — AI 图片生成

新增集成:
├── video-shot-agent (Python 微服务) — 分镜引擎
├── Editly — 服务端视频合成
├── Clerk/NextAuth — 认证
├── Stripe — 计费
├── Cloudflare R2 — 文件存储
└── Vercel Postgres — 数据库
```

**与之前方案的对比**：
| 维度 | 之前（多 API 分别接入） | 现在（fal.ai 统一） |
|------|----------------------|-------------------|
| API 集成数 | 3 个（Vidu + PiAPI + fal.ai） | **1 个（仅 fal.ai）** |
| API Key 管理 | 3 套 | **1 套** |
| 计费对账 | 3 个平台 | **1 个平台** |
| 模型切换 | 需改代码/配置 | **改 model ID 参数即可** |
| 基座兼容性 | 需额外适配 | **零改动（基座原生 fal.ai SDK）** |

### 部署架构

```
Vercel (前端 + API Routes)
├── Next.js SSR + Edge Functions
├── Serverless API Routes
└── Cron Jobs (过期视频清理)

Railway / Fly.io (微服务)
├── video-shot-agent (Python)
└── Editly render worker (Node.js)

Cloudflare R2 (存储)
├── 参考图片
├── 生成的视频片段
└── 导出的最终视频

外部 API
├── fal.ai — 所有 AI 模型（视频/图片/音频/TTS）
├── Stripe — 支付
└── Clerk — 认证
```

---

## 11. MVP 开发计划

### 时间线（6-8 周全职）

```
Week 1: 基座搭建 + 核心验证
├── Fork video-starter-kit，本地运行
├── 接入 Vidu API，验证动漫生成质量
├── 部署 video-shot-agent 微服务
└── 验证端到端: 文本 → 分镜 → 视频

Week 2: 数据层 + 角色系统
├── 数据库 schema（Vercel Postgres）
├── 文件存储（R2）
├── 角色上传 + 特征提取
└── 参考图注入测试

Week 3-4: 分镜编辑器（核心功能）
├── 分镜网格视图 UI
├── 单镜生成 + 状态管理
├── 拖拽排序 + 增删分镜
├── 多版本选择
├── 全片预览播放器
└── 视频导出（Remotion 渲染）

Week 5: 产品化
├── Auth（Clerk）
├── Credits 计费 + Stripe
├── Landing Page
└── 使用引导 / Onboarding

Week 6: 测试 + 优化
├── 端到端测试
├── 性能优化（生成速度、渲染速度）
├── 错误处理 + 重试机制
└── 移动端适配（基础）

Week 7-8: Beta
├── 邀请 20 个 beta tester（从 X 社区招募）
├── 收集反馈 + 快速迭代
├── 修 bug + 稳定性优化
└── 正式上线准备
```

---

## 12. 成功指标

### 上线首月（Beta）

| 指标 | 目标 |
|------|------|
| 注册用户 | 200+ |
| 付费转化 | 5-10 人 |
| 完成视频数 | 100+ |
| NPS | > 30 |

### 3 个月后

| 指标 | 目标 |
|------|------|
| 月活用户 | 500+ |
| 付费用户 | 50-100 |
| MRR | $2,000-5,000 |
| 留存率（月） | > 40% |

### 6 个月后

| 指标 | 目标 |
|------|------|
| 付费用户 | 200-500 |
| MRR | $10,000-25,000 |
| 平均视频/用户/月 | 5+ |

---

## 13. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 视频生成 API 质量不稳定 | 中 | 高 | 多模型备选（Vidu + Kling），用户可选择模型 |
| 角色一致性效果不够好 | 高 | 高 | 参考图 + 负面提示词 + 多版本供选择 |
| API 成本超出预期 | 中 | 中 | 严格 Credits 控制，成本监控告警 |
| 用户获取困难 | 中 | 高 | Build in Public + X 社区 + SEO |
| 竞品快速跟进分镜编辑 | 低 | 中 | 快速迭代，建立先发优势和用户粘性 |
| 底层模型重大升级 | 中 | 中 | 抽象 API 层，快速切换新模型 |

---

## 14. 开放问题讨论记录

### 已解决

1. ~~**产品名称**~~ → **Mozoria**（mozoria.com，域名已持有）
2. **免费版策略** → 跳过，待产品设计完成后统一制定定价策略
3. ~~**第一个视频生成模型**~~ → **fal.ai 统一接入，Vidu + Kling 全都有**。用户已有 fal.ai API key，基座原生支持。产品内让用户选择模型（动漫推荐 Vidu Q3，通用推荐 Kling 3.0）
4. **GSC 旧域名** → 不需要操作。仅 2 个旧页面、0 流量，新产品上线后自然覆盖

5. ~~**TTS 是否放入 MVP**~~ → **放入**。fal.ai 基座已内置 F5-TTS，集成成本低。MVP 范围：按分镜拆分旁白 → TTS 生成 → 合成叠加。不含口型同步和语音克隆（P2）
6. ~~**移动端**~~ → **不做**。仅桌面端。Landing Page 做响应式即可
7. ~~**多语言**~~ → **纯英文**。后期按用户分布再考虑
8. ~~**SEO 关键词策略**~~ → 已确认优先级：
   - P1: "AI anime maker" + "AI storyboard generator"
   - P2: "AI animation generator" + "text to anime video"
   - P3: "AI video maker for YouTube Shorts"
   - 不攻: "AI video generator"（太泛，大玩家占据）
   - 首页主攻 P1 词，功能页分攻长尾，后期博客做教程类内容

---

*本文档基于以下调研成果编写：*
- *`competitors.md` — 竞品分析*
- *`market-research.md` — 市场调研*
- *`open-source-research.md` — 开源工具调研*
- *`tech-deep-dive.md` — 技术深度分析*
- *`office-hours-record.md` — Office Hours 讨论记录*
