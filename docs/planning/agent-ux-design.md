# Mozoria Agent UX 设计方案

> 将 V2 架构的 7 个智能原则映射到用户可感知的交互变化

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

### 当前问题
- 所有操作都需要手动逐一执行
- 没有批量智能操作
- "Generate All" 不区分用户信任级别

### UX 变化

#### 5.1 "Direct My Video" 一键导演模式

在 footer 的 "Generate All" 旁增加高级模式按钮：

```
┌──────────────────────────────────────────────────────────┐
│ 5/7 shots · 28s total                                    │
│                                                          │
│                [Generate All (5)]  [🎬 Direct My Video]  │
└──────────────────────────────────────────────────────────┘
```

点击 "Direct My Video" 后，根据信任级别展示不同流程：

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

"Direct My Video" 执行时，在 Center Panel 上方显示实时进度：

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

### 新增组件

| 组件 | 位置 | 功能 |
|------|------|------|
| `NarrativeAnalysisBar` | StoryboardGrid 上方 | 显示叙事分析结果 |
| `DirectorNotes` | ShotDetailPanel 内 | 显示 AI 视觉推理 |
| `PromptPreview` | ShotDetailPanel Generate 区域 | 预览生成的 prompt |
| `DirectorDialog` | 全局 Dialog | "Direct My Video" 流程确认 |
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

## 实现优先级

### Wave 1（与 Phase 1 对齐）— 可感知智能
1. `NarrativeAnalysisBar` — Split 后显示叙事分析
2. `ShotCard` narrativeIntent 标签 — 每个 shot 有叙事意图
3. `DirectorNotes` — 视觉推理展示
4. Camera/Duration 知识提示 — 参数选择有理由

**用户感受**: "哦，AI 真的理解了我的故事"

### Wave 2（与 Phase 2 对齐）— 智能生成
5. `PromptPreview` — 生成前可查看 prompt
6. ScriptEditor 两步流程 — Analyze → Split
7. `ScriptPreAnalysis` — 实时脚本分析

**用户感受**: "AI 帮我做了更好的创意决策"

### Wave 3（与 Phase 3 对齐）— 学习型 AI
8. Camera/Model 智能推荐标记
9. `DirectorBriefing` — 项目记忆简报
10. 重复生成洞察提示
11. Footer AI insight
12. 新项目偏好迁移

**用户感受**: "AI 越来越懂我了"

### Wave 4（与 Phase 4 对齐）— 全自动导演
13. `DirectorDialog` — "Direct My Video" 全流程
14. `DirectorProgress` — 实时进度
15. 信任级别设置

**用户感受**: "我只需要写故事，AI 帮我做完剩下的"

---

## 设计原则

1. **渐显式智能**: AI 的存在感从轻到重，不一开始就压倒用户
2. **可选参与**: 所有 AI 建议都可以忽略，不强制用户接受
3. **透明推理**: AI 的每个决策都可以展开查看理由
4. **非阻塞提示**: AI 洞察用 toast/折叠区域，不弹窗打断工作流
5. **即时可用**: AI 分析在后台进行，用户看到时已完成（或< 1s 加载）
