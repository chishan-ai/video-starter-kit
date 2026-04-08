# Mozoria Agent UX 设计方案

> 将 V2 架构的 7 个智能原则映射到用户可感知的交互变化

## ⚠️ 文档版本说明

本文档经历了 v1→v2→v3 三次迭代。**v3（审核反馈整合章节）是唯一权威的实现规范。**

- **原则 1-7 的详细设计（v1）**: 保留为参考和远期愿景，**不在 Wave 1 实现**
- **三层操作模型 + 用户旅程（v2）**: 正确方向，但操作数字和组件清单已被 v3 修正
- **审核反馈整合 + 最终 Wave 1 定义（v3）**: **唯一的实现规范**

开发者请直接跳到 [审核后的最终 Wave 1 定义](#审核后的最终-wave-1-定义)。

---

## 总览：当前 vs 智能化后

```
当前用户流程（线性、无智能）:
  写剧本 → 点 Split → 得到 5-8 个 shot → 手动调参数 → 一个个点 Generate → 选版本

智能化后的用户流程（AI 导演参与每一步）:
  写剧本 → AI 分析叙事结构（可视化） → Split 时每个 shot 带理由
  → AI 推荐参数（带解释）→ 用户微调/接受 → 生成时用智能 prompt
  → AI 评估质量（基于叙事意图）→ 系统学习用户偏好 → 下次更精准
```

---

## 原则 1: Tool 输出 = 决策 + 理由

> ⚠️ **SUPERSEDED**: 以下 1.1-1.3 的具体 UI 组件设计已被 v3 修正。
> NarrativeAnalysisBar、Director's Notes 等不在 Wave 1 范围。
> 保留为 Wave 2-4 远期参考。v3 将叙事分析合并到 splitScript() 单次调用中。

### 当前问题
- `Split to Shots` 输出纯数据：description + cameraType(默认) + duration(默认4s)
- 用户看不到 AI 为什么这样拆分，无法判断好坏
- camera type 和 duration 是机械默认值，没有创意意图

### UX 变化

#### 1.1 Split 结果带叙事分析卡片

Split 完成后，在 Storyboard Grid 顶部新增一个可折叠的 **Narrative Analysis Bar**：

```
┌─────────────────────────────────────────────────────────┐
│ 📖 Narrative Analysis                            [Hide] │
│                                                         │
│ Structure: 三幕剧 (Setup → Confrontation → Resolution)  │
│ Emotional Arc: 平静 → 紧张 → 高潮 → 释然                │
│ Characters: 2 main (Akira, Yuki), 1 supporting          │
│ Tone: Melancholic with hopeful undertone                 │
│ Suggested Shots: 7 (3 establishing, 2 action, 2 emotion)│
│                                                         │
│  [===平静===|==紧张==|====高潮====|==释然==]  ← 情感曲线 │
│    Shot 1,2    Shot 3   Shot 4,5    Shot 6,7             │
└─────────────────────────────────────────────────────────┘
```

**实现位置**: `storyboard-grid.tsx` 顶部，shots 列表之上

**数据来源**: `narrative-analyzer.ts` 输出的 `NarrativeAnalysis` 对象，存储在 `projects` 表新增 `narrativeAnalysis` JSONB 字段

#### 1.2 Shot Card 增加叙事意图标签

每个 ShotCard 的 info 区域，在现有的 `{shot.cameraType} · Shot {n}` 下方，新增：

```
┌──────────────────────┐
│    [video/number]     │
│  Done          4s     │
│                       │
│ close-up · Shot 4     │
│ 🎭 Emotional climax   │  ← 新增: narrativeIntent 标签
│ "Akira discovers the  │
│  truth about..."      │
│ 👤👤                   │
└──────────────────────┘
```

**标签类型和颜色**:
| Intent | 标签 | 颜色 |
|--------|------|------|
| establishing | 🌅 Establishing | blue |
| rising_action | 📈 Rising Action | yellow |
| emotional_climax | 🎭 Emotional Climax | red |
| action_peak | ⚡ Action Peak | orange |
| resolution | 🌊 Resolution | green |
| transition | 🔗 Transition | gray |

**实现位置**: `shot-card.tsx` 的 `<div className="p-2">` 区域

**数据来源**: `shots` 表新增 `narrativeIntent` 字段 (text)

#### 1.3 Shot Detail Panel 显示 AI 视觉推理

在右侧 ShotDetailPanel 中，Description 上方新增 **AI Director's Notes** 折叠区：

```
┌─ Shot 4 ──────────────────────┐
│ status: completed              │
│                                │
│ ┌─ 🎬 Director's Notes ──[▾]─┐│
│ │                             ││
│ │ Narrative Role:             ││
│ │   Emotional climax —        ││
│ │   character discovers truth ││
│ │                             ││
│ │ Visual Strategy:            ││
│ │   Close-up chosen because:  ││
│ │   → Captures micro-         ││
│ │     expressions at moment   ││
│ │     of revelation           ││
│ │   → Shallow DoF isolates    ││
│ │     character from world    ││
│ │                             ││
│ │ Duration (6s) because:      ││
│ │   → Emotional scenes need   ││
│ │     breathing room          ││
│ │   → Allows audience to      ││
│ │     process the revelation  ││
│ │                             ││
│ │ 💡 Tip: This is a pivotal   ││
│ │ moment. Consider using a    ││
│ │ contrasting color shift     ││
│ │ from warm→cold to amplify   ││
│ │ the emotional impact.       ││
│ └─────────────────────────────┘│
│                                │
│ Description                    │
│ [textarea...]                  │
│                                │
│ Camera  Duration  ...          │
└────────────────────────────────┘
```

**交互细节**:
- 默认折叠（只显示一行摘要），点击展开完整推理
- 推理内容只读，不可编辑
- 用户修改 camera/duration 后，推理自动标记为 "overridden by user"

**实现位置**: `shot-detail-panel.tsx`，在 video preview 和 description 之间

**数据来源**: `shots` 表新增 `visualReason` JSONB 字段

---

## 原则 2: Memory = 索引，不存储可推导的

> ⚠️ **SUPERSEDED**: Creative Memory 和偏好学习不在 Wave 1-2 范围。
> 推荐标记、模型智能排序、Footer AI insight 均推迟到 Wave 4。

### 当前问题
- 每次打开项目，AI 不记得用户的任何偏好
- 用户每次都要从头选模型、调参数
- 没有从历史行为中学习的机制

### UX 变化

#### 2.1 AI 推荐参数时显示学习来源

当 AI 推荐 camera type 或 duration 时，如果基于学习到的偏好，在推荐按钮旁显示小标签：

```
Camera
[wide] [medium✨] [close-up] [overhead] [low-angle]
         ↑
  "AI recommends: based on your style preference"  ← tooltip
```

**具体表现**:
- AI 推荐的选项带 ✨ 标记
- Hover 显示 tooltip: "Based on your preference for medium shots in dialogue scenes (accepted 4/5 times)"
- 用户可以忽略推荐，选其他选项（AI 记录这次选择）

**实现位置**: `shot-detail-panel.tsx` 的 Camera 选择区域

#### 2.2 Generate 按钮智能排序

当前模型按钮是固定顺序。智能化后根据用户偏好动态排序：

```
Generate Video
┌────────────────────────────────────────┐
│ ⭐ Kling 3.0 Pro — 30 credits          │  ← 用户最常选择的排第一
│   "Your go-to for this style"          │
├────────────────────────────────────────┤
│ Vidu Q3 — 10 credits                   │
│ Kling O1 Ref — 20 credits              │  ← 有角色时才显示
│ Vidu Q2 Ref — 15 credits               │
└────────────────────────────────────────┘
```

**逻辑**:
- 首次使用: 按价格从低到高排列（默认）
- 3 次使用后: 按用户最近选择频率排序
- 标记 ⭐ 给最常选择的模型
- 二级文案显示推荐原因: "Your go-to for anime style" / "Best for character consistency"

**实现位置**: `shot-detail-panel.tsx` 的 Generate 按钮区域

**数据来源**: `creative_memories` 表 (category: 'model_preference')

#### 2.3 Footer 显示 AI 学习状态（微妙提示）

在底部 footer 的左侧统计区，偶尔显示 AI 学习到的 insight：

```
┌──────────────────────────────────────────────────────────┐
│ 5/7 shots · 28s total                                    │
│ 🧠 AI noticed: you tend to extend durations +1.5s        │  ← 周期性提示
│                                              [Got it]    │
└──────────────────────────────────────────────────────────┘
```

**交互规则**:
- 最多每个会话显示 1 次 AI insight
- 用户点 "Got it" 后消失
- 只在 AI 首次学到高置信度偏好时显示
- 不打扰，不阻塞操作

**实现位置**: `project-editor.tsx` 的 footer 区域

---

## 原则 3: 分层知识系统

> ⚠️ **SUPERSEDED**: Camera 知识提示、Duration 上下文建议推迟到 Wave 2+。
> Script Pre-Analysis 已在 v3 中删除（auto-trigger 造成焦虑）。
> Wave 1 通过增强 splitScript() prompt 实现基础知识注入。

### 当前问题
- "Split to Shots" 使用硬编码的 prompt，不含任何视觉叙事知识
- prompt-enhancer.ts 用固定的 style modifier 字符串
- AI 不知道 "close-up 表达亲密/情感" 这类镜头语言

### UX 变化

#### 3.1 Camera 选择器增加知识提示

将 Camera Type 从纯文本按钮变成带描述的选择器：

```
Camera
┌──────────────────────────────┐
│ ○ wide                       │
│   Establishes environment,   │
│   conveys isolation/scale    │
│                              │
│ ● close-up  ← current       │
│   Emotional intimacy,        │
│   captures micro-expressions │
│                              │
│ ○ medium                     │
│   Conversational distance,   │
│   balances context & detail  │
│                              │
│ ○ overhead                   │
│   God's-eye perspective,     │
│   reveals spatial patterns   │
│                              │
│ ○ low-angle                  │
│   Power, dominance,          │
│   dramatic tension           │
└──────────────────────────────┘
```

**交互方式**:
- 默认仍然是紧凑的 pill 按钮视图（当前样式）
- 点击 "?" 或 hover 延迟 500ms 显示 popover 中的知识描述
- 知识描述来自 `knowledge/visual-storytelling.ts`，与当前 shot 的叙事意图关联

**实现位置**: `shot-detail-panel.tsx` Camera 区域

#### 3.2 Duration 滑块增加上下文建议

```
Duration: 6s
[====●==========]
 3s            10s

💡 For emotional climax scenes, 5-7s gives audience
   time to process. Current: 6s ✓
```

**逻辑**:
- 基于 shot 的 narrativeIntent，从知识库获取推荐区间
- 滑块上标记推荐区间（用浅色高亮背景）
- 下方显示一句话解释

**实现位置**: `shot-detail-panel.tsx` Duration 区域

#### 3.3 Script Editor 增加叙事结构预分析

用户写完剧本还没点 Split 时，提供轻量预分析：

```
Script                              [Save] [Split to Shots]
┌──────────────────────────────────────────────────────────┐
│ The morning sun cast long shadows across the empty       │
│ classroom. Akira sat alone, staring at the photograph... │
│                                                          │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
458 characters · ~3 min read

📖 Quick Analysis (auto):                        ← 新增
  Detected: 3 scenes, 2 characters, melancholic tone
  Estimated shots: 6-8
  Key moments: [reveal at para 3] [confrontation at para 5]
```

**触发条件**:
- 脚本长度 > 100 字符
- 用户停止输入 2 秒后自动分析（debounced）
- 使用轻量 Gemini 调用（不是完整 narrative analysis）

**实现位置**: `script-editor.tsx` textarea 下方

---

## 原则 4: 不委托理解

> ⚠️ **SUPERSEDED**: 两步 Analyze→Split 流程已在 v3 中删除（破坏信任）。
> Prompt Preview 推迟到 Wave 3（Manual Control 层）。
> Wave 1 将分析直接合并到 "Create My Video" 一键流程中。

### 当前问题
- `splitScript()` 把整个理解过程委托给 Gemini："把这个剧本拆成 5-8 段"
- 结果直接写入 shots，用户看不到中间的理解过程
- 无法验证 AI 是否真正理解了故事

### UX 变化

#### 4.1 Split 变成两步流程

将 "Split to Shots" 按钮变成两步操作：

**Step 1: Analyze（理解）**

```
[Analyze Script]  ← 第一个按钮

点击后出现 Narrative Analysis 面板（见 1.1）
用户可以审查 AI 对故事的理解：
  - 故事结构是否正确识别
  - 情感弧线是否合理
  - 角色是否被正确识别
```

**Step 2: Generate Shots（基于理解拆分）**

```
📖 Narrative Analysis              [Re-analyze] [✓ Looks good]
  Structure: 三幕剧
  Emotional Arc: 平静 → 紧张 → 高潮 → 释然
  Characters: Akira, Yuki
  ...

[Generate 7 Shots from Analysis]  ← 第二个按钮，基于确认的分析
```

**交互细节**:
- 用户可以在 Step 1 修改 AI 的理解（如: "这个不是三幕剧，是环形叙事"）
- Step 2 基于确认的分析结果生成 shots
- 快捷方式: 高信任用户可以跳过 Step 1，直接 "Split to Shots"（合并两步）

**实现位置**: `script-editor.tsx`，替换现有的单一 Split 按钮

#### 4.2 Prompt Preview（生成前可查看 AI 构建的 prompt）

在 Generate 按钮旁增加 "Preview Prompt" 链接：

```
Generate Video
┌────────────────────────────────────────┐
│ ⭐ Kling 3.0 Pro — 30 credits          │
│                          [View Prompt] │  ← 点击展开
└────────────────────────────────────────┘

展开后:
┌─ Generated Prompt ─────────────────────┐
│ A young anime girl in school uniform   │
│ sits alone in a sunlit classroom,      │
│ close-up shot capturing her pensive    │
│ expression as she holds an old         │
│ photograph. Shallow depth of field,    │
│ warm golden hour lighting gradually    │
│ shifting to cool blue tones. Subtle    │
│ dust particles float in the light...   │
│                                        │
│ 📝 Prompt crafted for:                 │
│ • Narrative: emotional climax          │
│ • Model: Kling 3.0 (longer desc)      │
│ • Style: anime (vibrant + expressive)  │
│ • Your pref: warm → cold color shift   │
│                                [Edit]  │
└────────────────────────────────────────┘
```

**交互细节**:
- 只读预览，显示 prompt-composer 生成的最终 prompt
- 标注 prompt 中哪些部分来自哪个知识层
- "Edit" 按钮允许用户手动微调（高级用户）
- 编辑后的 prompt 记入 prompt_journal，用于学习

**实现位置**: `shot-detail-panel.tsx` Generate 区域

---

## 原则 5: 渐进式信任

> ⚠️ **PARTIALLY SUPERSEDED**: "Create My Video" 一键流程提前到 Wave 1。
> 但信任引擎、信任级别设置推迟到 Wave 4。Wave 1 默认 "总是确认花费"。
> 下方 5.1 的 "Create My Video" 按钮已统一改名为 "Create My Video"。

### 当前问题
- 所有操作都需要手动逐一执行
- 没有批量智能操作
- "Generate All" 不区分用户信任级别

### UX 变化

#### 5.1 "Create My Video" 一键导演模式

在 footer 的 "Generate All" 旁增加高级模式按钮：

```
┌──────────────────────────────────────────────────────────┐
│ 5/7 shots · 28s total                                    │
│                                                          │
│                [Generate All (5)]  [🎬 Create My Video]  │
└──────────────────────────────────────────────────────────┘
```

点击 "Create My Video" 后，根据信任级别展示不同流程：

**Level 1 — 新用户（全确认）**:
```
┌─ AI Director Plan ─────────────────────────────────────┐
│                                                         │
│ I'll handle your video in 3 steps:                      │
│                                                         │
│ Step 1: Analyze script & design shots                   │
│   → 7 shots with narrative intent                       │
│   ⏱ ~10 seconds                                        │
│                                                         │
│ Step 2: Generate optimized prompts                      │
│   → Using Kling 3.0 Pro (your preferred model)          │
│   → Character-consistent with reference images          │
│                                                         │
│ Step 3: Generate all videos                             │
│   → 💰 Estimated cost: 210 credits                      │
│   → ⏱ ~3-5 minutes                                     │
│                                                         │
│ [Review Each Step]  [Approve & Start]                   │
└─────────────────────────────────────────────────────────┘
```

**Level 2 — 建立信任后（仅确认花费）**:
```
┌─ AI Director ──────────────────────────────────────────┐
│                                                         │
│ Ready to direct your video.                             │
│ 7 shots · Kling 3.0 Pro · 💰 210 credits                │
│                                                         │
│ [Cancel]  [Start Directing]                             │
└─────────────────────────────────────────────────────────┘
```

**实现位置**: 新组件 `src/components/storyboard/director-dialog.tsx`

#### 5.2 执行进度面板

"Create My Video" 执行时，在 Center Panel 上方显示实时进度：

```
┌─ 🎬 AI Director Working... ─────────────────────────────┐
│                                                          │
│ ✅ Script analyzed — 3-act structure, 2 characters       │
│ ✅ 7 shots designed — close-up for climax, wide for end  │
│ 🔄 Generating Shot 3/7 — "Akira confronts the truth"    │
│ ⏳ Shot 4-7 queued                                       │
│                                                          │
│ [===========●                        ] 42%               │
│                                                          │
│ 💰 Credits used: 90/210              [Pause] [Cancel]    │
└──────────────────────────────────────────────────────────┘
```

**交互细节**:
- 实时更新每个步骤的状态
- 用户可以随时 Pause（暂停后续生成）或 Cancel（已生成的保留）
- 每完成一个 shot，StoryboardGrid 实时更新显示结果
- 完成后自动折叠为一行总结

**实现位置**: `project-editor.tsx` 的 main 区域顶部，或新组件 `director-progress.tsx`

#### 5.3 信任级别设置

在项目 header 或 Settings 中，用户可以主动调整 AI 自主权：

```
AI Director Settings
┌───────────────────────────────────────┐
│ Automation Level:                     │
│                                       │
│ ○ Conservative                        │
│   Review every step before execution  │
│                                       │
│ ● Balanced (recommended)              │
│   Auto-execute low-risk, confirm      │
│   before spending credits             │
│                                       │
│ ○ Full Trust                          │
│   Auto-execute everything, only       │
│   confirm large credit expenses       │
│   (>100 credits)                      │
└───────────────────────────────────────┘
```

**实现位置**: Header 的 Settings popover，或项目级设置

---

## 原则 6: 跨会话持久智能

> ⚠️ **SUPERSEDED**: Director Briefing 自动弹出已在 v3 中删除（Clippy 反模式）。
> 全部偏好学习和���会话记忆推迟到 Wave 4。

### 当前问题
- 每次打开项目，AI 是全新状态
- 用户上次的所有偏好调整完全丢失
- 项目之间没有知识迁移

### UX 变化

#### 6.1 项目打开时的 "AI Director Briefing"

当用户打开一个项目时，如果 AI 有该项目的记忆，在顶部短暂显示：

```
┌─ 🧠 Director Briefing ────────────────────── [Dismiss] ─┐
│                                                          │
│ Welcome back to "Akira's Journey"                        │
│ Last session: 3 days ago                                 │
│                                                          │
│ 📌 Remembered preferences for this project:              │
│   • Style: warm color palette with cold contrast moments │
│   • Pacing: slightly slower than default (+1.5s avg)     │
│   • Model: Kling 3.0 Pro for main shots                  │
│                                                          │
│ 📊 Project health:                                        │
│   • 5/7 shots completed                                  │
│   • Shot 4 was regenerated 3 times — consider reviewing  │
│   • Overall tone consistency: good                       │
└──────────────────────────────────────────────────────────┘
```

**交互细节**:
- 打开项目时自动显示（如果有有意义的记忆）
- 5 秒后自动收起为小标签（但不消失）
- 点击可重新展开
- 首次使用的项目不显示

**实现位置**: `project-editor.tsx` header 下方

#### 6.2 Shot 重复生成的洞察提示

当用户第 3 次重新生成同一个 shot 时，AI 主动提供洞察：

```
┌─ 💡 Director Insight ─────────────────────────┐
│                                                │
│ This shot has been regenerated 3 times.        │
│                                                │
│ Pattern noticed:                               │
│ • v1 (rejected): prompt emphasized "running"   │
│ • v2 (rejected): prompt emphasized "motion"    │
│ • v3 (current): prompt emphasized "expression" │
│                                                │
│ Suggestion: The issue might be character       │
│ consistency rather than prompt wording.         │
│ Try using Kling O1 Ref for better identity     │
│ preservation.                                  │
│                                                │
│ [Try Suggested Approach]  [Dismiss]            │
└────────────────────────────────────────────────┘
```

**触发条件**: 同一 shot 生成 >= 3 次 且 前几次都未被选为 selectedVersion

**数据来源**: `prompt_journal` 表记录的 prompt → accepted 映射

**实现位置**: `shot-detail-panel.tsx` Generate 区域上方

#### 6.3 新项目创建时的偏好迁移

当用户创建新项目时，如果已有偏好记忆：

```
Create New Project
┌───────────────────────────────────────┐
│ Project Name: ___________             │
│ Style: [anime ▾]                      │
│ Aspect Ratio: [16:9 ▾]               │
│                                       │
│ 🧠 AI Director will use your learned  │
│    preferences from previous projects:│
│    • Preferred model: Kling 3.0 Pro   │
│    • Duration bias: +1.5s             │
│    • Color tendency: warm tones       │
│    [Customize] [Use as-is]            │
│                                       │
│ [Create Project]                      │
└───────────────────────────────────────┘
```

**实现位置**: 现有的项目创建 dialog/page

---

## 原则 7: Context Compaction — 最便宜策略优先

> ⚠️ **DEFERRED**: 按需加载和渐进分析是 Wave 2+ 的优化。
> Wave 1 使用最简单的方式：一次 Gemini 调用 + 轮询进度。

### 当前问题
- 每次 API 调用都发送完整数据
- 没有按需加载的概念
- Generate All 时所有 shot 都用相同深度的 AI 分析

### UX 变化

#### 7.1 Shot Detail 按需加载 AI 分析

不在 split 时就为每个 shot 做完整分析。而是:

- **Grid 视图**: 只显示轻量信息（narrativeIntent 标签 + description 摘要）
- **选中 shot 时**: 加载 Director's Notes（视觉推理 + 建议）
- **点击 Generate 时**: 执行完整的 prompt composition（最重的 AI 操作）

```
用户视角:
  浏览 Grid → 快速（只有标签和摘要）
  点击 Shot → 0.5s 后显示 Director's Notes（如果没有 cache）
  点击 Generate → 即时（prompt 在后台预生成）
```

**实现位置**: `shot-detail-panel.tsx`，Director's Notes 使用 React Query + lazy loading

#### 7.2 智能批量操作的渐进分析

"Generate All" 不需要每个 shot 都做 deep analysis。用分层策略:

```
Generate All (5 shots):

Shot 1 (establishing): Quick analysis → standard prompt
Shot 2 (dialogue):     Quick analysis → standard prompt
Shot 3 (transition):   Quick analysis → standard prompt
Shot 4 (climax):       Deep analysis → enhanced prompt  ← 关键 shot
Shot 5 (resolution):   Quick analysis → standard prompt

💡 Shot 4 is the emotional climax — investing more
   AI reasoning for better results.
```

**用户看到的**:
- 进度条中 Shot 4 会显示 "Deep analysis..." 而其他只是 "Generating..."
- 这对用户是透明的，不需要额外操作

---

## 交互组件清单

> ⚠️ **SUPERSEDED**: 以下为 v1 完整愿景清单。Wave 1 实际只需实现:
> 进度 UI + 费用确认 dialog。详见 v3 "审核后的最终 Wave 1 定义"。

### 新增组件

| 组件 | 位置 | 功能 |
|------|------|------|
| `NarrativeAnalysisBar` | StoryboardGrid 上方 | 显示叙事分析结果 |
| `DirectorNotes` | ShotDetailPanel 内 | 显示 AI 视觉推理 |
| `PromptPreview` | ShotDetailPanel Generate 区域 | 预览生成的 prompt |
| `DirectorDialog` | 全局 Dialog | "Create My Video" 流程确认 |
| `DirectorProgress` | Center Panel 顶部 | 实时执行进度 |
| `DirectorBriefing` | Header 下方 | 项目打开时的 AI 简报 |
| `InsightToast` | 浮动提示 | AI 学习洞察和建议 |
| `ScriptPreAnalysis` | ScriptEditor 下方 | 脚本轻量预分析 |

### 修改组件

| 组件 | 变化 |
|------|------|
| `ShotCard` | 新增 narrativeIntent 标签 |
| `ShotDetailPanel` | Camera 知识提示、Duration 上下文建议、模型智能排序、Director's Notes |
| `ScriptEditor` | Analyze → Split 两步流程、脚本预分析 |
| `ProjectEditor` | Director Briefing、Director Progress、Footer AI insight |
| `StoryboardGrid` | NarrativeAnalysisBar |

### 数据变化

| 表/字段 | 变化 |
|---------|------|
| `shots.narrativeIntent` | 新增 text: 叙事意图 |
| `shots.visualReason` | 新增 jsonb: 视觉推理 |
| `projects.narrativeAnalysis` | 新增 jsonb: 叙事分析结果 |
| `creative_memories` | 新增表: 用户偏好记忆 |
| `prompt_journal` | 新增表: prompt 日志 |

---

## 自我审视：操作步数分析

> **核心发现**：上述原则 1-7 的设计增加了 AI 透明度，但没有减少用户操作。
> 实际上操作步数从 ~60 增加到 ~78。这违背了 "AI 导演" 的核心价值。
> 以下重构将 "操作简化" 提升为第一优先级。

### 操作步数对比

| 流程 | 步骤 | 交互次数 |
|------|------|---------|
| **当前** | 写剧本 → Split → 逐个调参 → 逐个生成 → 逐个选版本 | **~60** |
| **原方案 (v1)** | 同上 + Analyze + 阅读推理 + View Prompt | **~78 (更差)** |
| **修正方案 (v2)** | 写剧本 → Create My Video → 等待 → 审查异常 shots → 微调 | **~12-20** |

### 根因分析

v1 方案犯了一个经典错误：**用 "让用户看到 AI 在做什么" 替代 "让用户少做事"**。

- Narrative Analysis Bar — 好看但用户不需要审查每次 split
- Director's Notes — 有价值但不应该是默认展示
- Prompt Preview — Power user 功能，不应在主流程中
- 两步 Split — 对 80% 的场景增加了无意义的一步

正确的设计应该是：**AI 默认做完全部决策，用户只在不满意时才介入**。

---

## 重构：三层操作模型

> ⚠️ **v2 设计 — 部分被 v3 修正**: 三层模型的方向正确，但以下细节已调整:
> - AI 质量自评（绿/黄点）: 从 Wave 1 推迟到 Wave 2（缺少校准数据）
> - Review 模式 + Quick Fixes: 从 Wave 1 推迟到 Wave 2
> - 按叙事重要性分配模型: 从 Wave 1 推迟到 Wave 2（Wave 1 统一模型）
> - Wave 1 完成后直接回到 Storyboard Grid，不进入 Review 模式
> - 具体 Wave 1 范围见 v3 "审核后的最终 Wave 1 定义"

### Layer 1: Autopilot（主流程 — 80% 使用场景）

**用户操作**: 写剧本 → 一键 → 完成

```
┌─────────────────────────────────────────────────────────────┐
│ Script                                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ The morning sun cast long shadows across the empty      │ │
│ │ classroom. Akira sat alone, staring at the old photo... │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 458 chars · 3 scenes · 2 characters detected                │
│                                                              │
│                              [🎬 Create My Video — 210 cr]  │
│                                                              │
│  ↑ 这是唯一的主按钮。替代 Split + Generate All              │
└─────────────────────────────────────────────────────────────┘
```

点击后发生的事（用户不需要介入）:
1. AI 分析叙事结构
2. 设计 7 个 shots（含 camera、duration、narrativeIntent）
3. 为每个 shot 生成智能 prompt
4. 按叙事重要性分配模型（高潮用 Kling Pro，过渡用 Vidu Q3）
5. 批量发起生成

用户看到的：

```
┌─ 🎬 Creating your video... ─────────────────────────────────┐
│                                                              │
│ ✅ Story analyzed — 3 acts, emotional climax at shot 4       │
│ ✅ 7 shots designed                                          │
│ 🔄 Generating 3/7 — "Akira confronts the truth"             │
│                                                              │
│ [============●                           ] 42%               │
│ 💰 90/210 credits                        [Pause] [Cancel]    │
└──────────────────────────────────────────────────────────────┘
```

完成后，直接进入 **Review 模式**（不是编辑模式）：

```
┌─ ✅ Video Draft Ready ──────────────────────────────────────┐
│                                                              │
│ 7 shots generated · 32s total · 210 credits used             │
│                                                              │
│ 🟢🟢🟢🟡🟢🟢🟢    ← AI 质量自评 (🟡 = 可能需要关注)      │
│  1  2  3  4  5  6  7                                        │
│                                                              │
│ Shot 4 may need attention:                                   │
│   Character consistency lower than expected                  │
│                                                              │
│ [Export as-is]  [Review & Tweak]                             │
└──────────────────────────────────────────────────────────────┘
```

**操作计数**: 写剧本 + 1 click + 确认 + 等待 + 审查 + 可能 review 1-2 shots = **12-20 次交互**
> 注: v1 的 "4-8 次" 低估了等待、审查、修复的实际交互成本。12-20 是诚实的数字，
> 相比当前 ~60 次仍是 3-5x 改善。

### Layer 2: Review & Tweak（异常处理 — 15% 使用场景）

只有当用户点击 "Review & Tweak" 或点击 🟡 标记的 shot 时，才进入详细视图。

此时才显示原方案中的 AI 推理信息：

```
┌─ Shot 4 ── 🟡 Needs Review ──────────────────────────────────┐
│                                                               │
│ [video preview]                                               │
│                                                               │
│ 🎬 Why this might need work:                                  │
│   AI detected: character face differs from reference          │
│   Confidence: 0.6 (your threshold: 0.7)                      │
│                                                               │
│ Quick fixes:                                                  │
│ [🔄 Regenerate same prompt]                                   │
│ [🎯 Regenerate with Ref model (better identity)]              │  ← AI 推荐
│ [✏️ Manual edit]                                               │
│                                                               │
│ ┌─ Director's Notes ────────────────────────── [Show] ┐      │
│ └─────────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

**关键变化**:
- Director's Notes 默认**隐藏**，只有 "Show" 链接
- AI 主动诊断问题并推荐修复方案（不是让用户自己找问题）
- "Quick fixes" 是一键操作，不需要用户手动调参数

**操作计数**: 点击问题 shot → 选择推荐修复 → 等待 = **2 次交互 per shot**

### Layer 3: Manual Control（完全控制 — 5% 使用场景）

只有当用户明确选择 "Manual edit" 时，才展开完整的参数控制面板：

```
┌─ Shot 4 ── Manual Mode ──────────────────────────────────────┐
│                                                               │
│ Description                                                   │
│ [textarea: editable]                                          │
│                                                               │
│ Camera  [wide] [medium] [close-up✨] [overhead] [low-angle]   │
│         AI recommends close-up for emotional climax           │
│                                                               │
│ Duration [====●==========] 6s                                 │
│          💡 Recommended: 5-7s for this scene type             │
│                                                               │
│ Characters  [Akira ✓] [Yuki]                                  │
│                                                               │
│ ┌─ Director's Notes ──────────────────────────────────┐      │
│ │ Narrative Role: Emotional climax                     │      │
│ │ Visual Strategy: Close-up for micro-expressions...   │      │
│ └──────────────────────────────────────────────────────┘      │
│                                                               │
│ [View Prompt]  [Generate — Kling 3.0 Pro ⭐ — 30 cr]         │
└───────────────────────────────────────────────────────────────┘
```

这里才展示原方案的全部 AI 辅助功能：
- Camera 知识提示
- Duration 推荐区间
- Director's Notes（默认展开）
- Prompt Preview
- 模型智能排序

---

## 重构后的用户旅程

### 新用户首次使用（~5 分钟 → 成品视频草稿）

```
1. 粘贴剧本
2. 点击 "Create My Video"
3. 确认费用 (210 credits)
4. 等待 3-5 分钟（看进度条）
5. 看到结果 + AI 质量评估
6. 如果满意 → Export（done!）
7. 如果 1-2 个 shot 不好 → 点击 → 选推荐修复 → 等待
8. Export

总交互: 4-10 次（vs 当前 60 次）
```

### 进阶用户（有偏好积累后）

```
1. 粘贴剧本
2. 点击 "Create My Video"
   → AI 自动使用学习到的偏好（模型、时长偏好、风格）
   → 一行确认: "7 shots · Kling Pro · 210 cr · warm palette"
3. 等待
4. 结果通常更好（因为偏好匹配）
5. Export 或微调 1 个 shot

总交互: 3-6 次
```

### Power 用户（要完全控制）

```
1. 写剧本
2. 可选: "Analyze Script" 查看叙事分析
3. "Split to Shots" 获得 shot 列表
4. 逐个 shot 进入 Manual Mode 精调
5. 逐个 Generate 或 Generate All

总交互: 与当前相同 ~60 次，但每步有 AI 辅助
```

---

## 修正后的实现优先级

> ⚠️ **v2 优先级 — 已被 v3 修正**: 下方 Wave 1 的 #3 #4 已在 v3 中推迟到 Wave 2。
> **权威 Wave 1 范围见 v3 "审核后的最终 Wave 1 定义"。**

### Wave 1 — 一键出片 ⭐ 最高优先级

> 用户感受: "我只需要写故事，3 分钟后就有视频草稿"

| # | 功能 | 操作减少 | Wave |
|---|------|---------|------|
| 1 | **"Create My Video" 主按钮** | 替代 Split + 逐个调参 + 逐个 Generate | **1** |
| 2 | **进度 UI（轮询）** | 用户知道在等什么 | **1** |
| 3 | ~~AI 质量自评 + Review 模式~~ | ~~用户只关注问题 shot~~ | ~~1~~ → **2** |
| 4 | ~~Quick Fixes（推荐修复）~~ | ~~一键修复 vs 手动调参~~ | ~~1~~ → **2** |

核心指标: **首次出片操作从 60 次 → ~15 次**

### Wave 2 — 智能参数默认值

> 用户感受: "AI 选的参数比我手动调的还好"

| # | 功能 | 价值 |
|---|------|------|
| 5 | Narrative-aware camera/duration 自动选择 | 替代手动选每个 shot 的 camera |
| 6 | 模型智能分配（高潮用好模型） | 替代逐个选模型 |
| 7 | Shot narrativeIntent 标签 | Grid 视图快速理解 |

核心指标: **AI 默认参数被用户接受率 > 70%**

### Wave 3 — 问题诊断智能

> 用户感受: "当 shot 不好时，AI 告诉我为什么并帮我修"

| # | 功能 | 价值 |
|---|------|------|
| 8 | 重复生成智能诊断 | 从 "重试" → "换方案" |
| 9 | Director's Notes（按需查看） | 理解 AI 决策逻辑 |
| 10 | PromptPreview（高级用户） | 精确控制生成 |

核心指标: **问题 shot 修复从 avg 3 次重试 → 1.5 次**

### Wave 4 — 学习与记忆

> 用户感受: "AI 越来越懂我了"

| # | 功能 | 价值 |
|---|------|------|
| 11 | Creative Memory 偏好学习 | 下次出片质量更高 |
| 12 | DirectorBriefing 项目简报 | 跨会话连续性 |
| 13 | 新项目偏好迁移 | 跨项目一致性 |
| 14 | 信任级别自适应 | 确认变少 |

核心指标: **第 5 个项目的首次出片满意率 > 80%**

---

## 修正后的设计原则

1. **操作最小化优先**: 减少操作步数是第一目标，AI 透明度是第二目标
2. **默认自动化**: AI 做所有决策，用户只审查结果
3. **异常驱动交互**: 只在出问题时才让用户介入
4. **渐进暴露复杂度**: Autopilot → Review → Manual 三层，用户按需深入
5. **推荐优于选择**: AI 给一个推荐方案 + 一键执行，而非展示 5 个选项让用户选
6. **后台分析、前台结果**: AI 的分析过程在后台完成，用户只看到结果和质量评估

---

## 审核反馈整合 (v3)

> 基于内部 UX/Product 审核 (5.7/10 CONDITIONAL PASS) 的反馈整合

### 修复 1: Wave 1 范围砍到最小可证明

**问题**: Wave 1 实际上是一个完整产品，solo dev 不可能在合理时间内完成。

**修复**: Wave 1 只做 3 件事：

| 保留 | 砍掉 | 理由 |
|------|------|------|
| ✅ "Create My Video" 按钮 + 基础编排 | ❌ quality-critic.ts (AI 质量自评) | 没有校准数据，v1 无法准确评估 |
| ✅ 增强版 splitScript()（返回 narrativeIntent + cameraType + 理由） | ❌ 信任引擎 | 默认 "总是确认花费" 即可 |
| ✅ 进度 UI（简化版，无 SSE，轮询即可） | ❌ Creative Memory | 偏好学习是 nice-to-have |
| | ❌ 独立的 narrative-analyzer.ts | 合并到 splitScript 一次 Gemini 调用 |
| | ❌ Script Pre-Analysis (debounce) | 写作中触发分析 = 焦虑制造器 |

**修正后的 Wave 1 实际范围**:

```
1. 修改 splitScript() prompt → Gemini 一次调用返回:
   - shots[]（含 description, cameraType, duration, narrativeIntent）
   - 每个 shot 的 cameraReason（一句话）
   约 1-2 天

2. "Create My Video" 按钮:
   - 调用增强版 splitScript()
   - 为每个 shot 调用 prompt-composer（简化版 prompt-enhancer）
   - 批量 fal.queue.submit()
   - 轮询进度，更新 UI
   约 3-4 天

3. 进度 UI:
   - 简单的 polling-based 进度条（不需要 SSE）
   - 完成后显示 shot grid（无质量评分）
   约 1-2 天

4. 基础费用预检:
   - 点击前计算总 credits
   - credits 不够时禁用按钮并提示
   约 0.5 天

总计: ~7-9 天（2 周 sprint）
```

### 修复 2: 支持非叙事类脚本

**问题**: "三幕剧"、"情感弧线"、"高潮" 只适用于故事类内容。教程、列表、产品展示等不适用。

**修复**: 脚本类型检测 + 适配策略

```
splitScript() 增强:

1. 先检测脚本类型:
   - narrative: 故事/剧情（→ 三幕剧分析、情感弧线）
   - tutorial: 教程/步骤（→ 按步骤拆分、知识点标注）
   - listicle: 列表/编号（→ 按条目拆分、独立镜头）
   - showcase: 产品展示（→ 特写/全景交替、功能标注）
   - freeform: 无法分类（→ 按段落/时长均匀拆分）

2. 根据类型选择分析策略:
   narrative → narrativeIntent: establishing/climax/resolution
   tutorial  → narrativeIntent: intro/step_1/step_2/summary
   listicle  → narrativeIntent: hook/item_1/item_2/outro
   showcase  → narrativeIntent: overview/feature/detail/cta
   freeform  → narrativeIntent: segment_1/segment_2/...

3. camera 选择策略也按类型变化:
   narrative → 电影镜头语言（close-up for emotion）
   tutorial  → 清晰为主（medium shots, steady）
   listicle  → 视觉多样性（交替 wide/close-up）
   showcase  → 产品特写（close-up + overhead）
```

**UI 变化**: "Create My Video" 按钮下方可选显示检测到的类型（可修正）:

```
458 chars · Detected: tutorial (5 steps)     [Change ▾]
                              [🎬 Create My Video — 150 cr]
```

### 修复 3: 积分与失败的边界设计

**问题**: 积分耗尽、生成失败中途、网络中断都没有设计。

**修复**:

#### 3a. 积分预检

```
点击 "Create My Video" 前:

if (estimatedCost > userBalance) {
  按钮变灰，显示:
  "Need 210 credits, you have 150. [Buy credits] or [Generate 5/7 shots for 150 cr]"
                                                     ↑ 部分生成选项
}

部分生成策略:
- 按 shot 顺序从 Shot 1 开始生成，直到积分用尽
- 理由: 视频是线性叙事，前 N 个 shot 比跳跃选择更有用
- 模型选择: 所有 shot 统一用同一模型（由用户预选或默认 Vidu Q3）
- 用户可见: "Will generate Shot 1-5 of 7 with remaining credits"
- 剩余 shot 保留为 pending，充值后可继续
- 不做智能选择（如"跳过过渡场景"）— 增加复杂度但用户难以理解
```

#### 3b. 生成失败处理

```
Shot 4/7 生成失败时:

进度面板更新:
  ✅ Shot 1-3 generated
  ❌ Shot 4 failed — "content policy violation"
  ⏸ Shot 5-7 paused

选项:
  [Skip Shot 4 & Continue]     ← 跳过，继续生成 5-7
  [Retry Shot 4]               ← 用相同 prompt 重试
  [Retry with safer prompt]    ← AI 自动调整 prompt 重试
  [Stop here]                  ← 保留 1-3，停止

积分策略: 失败的 shot 不扣费（已有的退款逻辑）
```

#### 3c. 积分耗尽中途

```
生成到 Shot 5/7 时积分耗尽:

进度面板:
  ✅ Shot 1-5 generated (150 credits used)
  ⛔ Insufficient credits for Shot 6-7

选项:
  [Buy credits & Continue]     ← 充值后从 Shot 6 继续
  [Export 5 shots as-is]       ← 导出已有的
  [Stop]                       ← 保留在项目中，稍后继续
```

#### 3d. 网络中断

```
SSE/轮询中断时:

检测方式: 连续 3 次 polling 失败

UI:
  ⚠️ Connection lost. Your videos are still generating.
  [Reconnect]  ← 重新开始轮询

设计原则: 生成是在 fal.ai 服务端进行的，网络中断不影响生成。
恢复连接后通过 fal.queue.status() 获取最新状态。
```

### 修复 4: 删除 Clippy 类反模式

| 原设计 | 问题 | 修复 |
|--------|------|------|
| Director Briefing 自动弹出 (6.1) | 打开项目时的不请自来的中断 | **删除自动弹出**。改为 Header 中一个小 🧠 图标，hover 显示记忆摘要 |
| Footer AI Insight "AI noticed..." (2.3) | Clippy 式的监视感 | **删除**。偏好数据只在 AI 做推荐时静默使用，不主动告诉用户 |
| Script Pre-Analysis 2s debounce (3.3) | 写作中的焦虑制造器 | **删除 auto-trigger**。只在用户点击 "Create My Video" 时触发分析 |
| "Re-analyze" 按钮 (4.1) | 暗示 AI 可能是错的 = 信任破坏 | **删除两步流程**。分析直接合并到 Create My Video，用户不需要审查分析结果 |
| Trust Level Setting (5.3) | 用户不理解 "低风险操作" | **简化为**: "花费超过 _____ credits 时提醒我" (一个数字输入框) |

### 修复 5: 无障碍 + 移动端基础考虑

**质量指示器无障碍**:
- 绿/黄点 → 改为图标: ✓ (通过) / ⚠ (需关注)，不仅依赖颜色
- 所有图标带 aria-label

**移动端**:
- v1 scope: 仅支持桌面端，移动端显示 "Please use desktop for editing"
- v2 scope: 考虑简化的移动端 Review 模式（只看结果，不编辑）
- 在 CLAUDE.md 中明确记录：Mozoria 是桌面优先产品

### 修复 6: API 调用成本控制

**问题**: 多次 Gemini 调用吃利润。

**修复**: 合并调用 + 缓存

```
v1 API 调用策略:

1. splitScript() — 一次 Gemini 调用（合并叙事分析 + shot 设计 + camera 推理）
   Cost: ~$0.01 per call

2. prompt-composer — 纯本地 string 拼接（不调 API）
   基于 splitScript 返回的 description + style + camera + 知识模板
   Cost: $0

3. fal.ai 生成 — 每 shot 一次（无法避免）
   Cost: 用户付费的 credits

总计每个项目: 1 次 Gemini call + N 次 fal.ai call
vs 当前: 1 次 Gemini call + N 次 fal.ai call
→ Gemini API 成本不变！只是 prompt 更智能。
```

**Wave 2+ 的缓存策略**:
- Director's Notes: 首次生成后缓存在 shots.visualReason，不重复调用
- 脚本未修改时，narrative analysis 不重新计算

---

## 审核后的最终 Wave 1 定义

```
Wave 1 = "一键出片 MVP"

用户可见的变化:
1. Script Editor 下方新增 "Create My Video" 按钮
2. 点击后显示费用确认 dialog（含积分预检）
3. 简单进度条（轮询刷新）
4. 完成后回到 Storyboard Grid 查看结果
5. 失败 shot 可重试

后端变化:
1. splitScript() prompt 增强（返回 narrativeIntent + cameraType + reason）
2. prompt-composer.ts（基于增强数据拼接更好的 prompt）
3. /api/agent/direct route（编排 split → compose → generate 全流程）
4. 积分预检 + 失败处理逻辑

不包含:
- 质量自评 (AI 不打分)
- 信任引擎 (总是确认花费)
- Creative Memory (不学习偏好)
- Director's Notes (不展示推理)
- 脚本预分析 (不在写作时分析)
- Director Briefing (不在开项目时弹窗)

预估工期: 2 周 (solo dev)
```
