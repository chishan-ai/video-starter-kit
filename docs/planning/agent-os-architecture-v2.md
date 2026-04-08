# Mozoria Agent OS 智能化架构方案 v2

## 为什么 v1 方案不够

v1 方案的本质是"用 Gemini 替代硬编码常量 + 加个任务管理 UI"。这不是智能化，只是**自动化**。

Claude Code 的核心洞察（来自源码分析和 X 上 @rohit4verse、@himanshustwts、@AITrailblazerQ 等深度分析）：

> **"LLMs are no longer the product. They're just compute nodes inside a larger system. We're building operating systems for cognition."**

Mozoria 要做的不是"帮用户填参数的工具"，而是一个**理解叙事、拥有视觉语言知识、能做创意决策的 AI 导演系统**。

---

## Claude Code 的 7 个设计理念 → 映射到 Mozoria

### 理念 1: "Tools are the core product, not features"

**Claude Code**: 每个 Tool 是一个独立的、可测试的能力单元，有 schema、权限、进度报告。Tool 不是辅助功能——Tool 本身就是产品。

**Mozoria 映射**: 当前的 `splitScript()`, `buildVideoPrompt()`, `analyzeCharacterImage()` 都是简单的函数调用。它们应该变成**带有领域知识的智能 Tool**——不是"执行一个操作"，而是"做一个创意决策并解释为什么"。

```
当前: splitScript() → "把脚本切成 5-8 段"（机械操作）
目标: StoryAnalysisTool → "这个脚本讲的是一个失去记忆的少年寻找过去的故事。
      它有 3 个情感转折点，叙事结构是 起承转合。
      我建议用 7 个镜头：
      - 开场用 wide shot 建立孤独感（establishing shot 原则）
      - 转折点用 close-up 强化情感冲击（Hitchcock 的情感距离理论）
      - 结尾用 wide shot 呼应开头形成叙事闭环
      理由：这个结构参考了经典短片叙事模板..."
```

**关键区别**: Tool 的输出不是数据，是**决策 + 理由**。

---

### 理念 2: "Memory = index, not storage; what you don't store is the real insight"

**Claude Code**:
- MEMORY.md 是索引（每行 <150 字符），实际知识按需加载
- **可推导的不存储**（代码结构、git 历史不记）
- **自愈式记忆**——后台 autoDream 合并、去重、修正矛盾
- 记忆是提示而非真理，使用前必须验证

**Mozoria 映射**: Mozoria 需要一个**项目级 Creative Memory 系统**——记住的不是"Shot 3 用了 close-up"（可推导），而是：

```
不记忆（可推导）:
  - 当前有几个 shot，每个 shot 的参数
  - 角色有哪些图片
  - 项目用什么 style

记忆（不可推导的创意决策）:
  - "用户偏好 Kling 而非 Vidu（上次选了 3 次 Kling）"
  - "这个项目的视觉风格倾向暖色调（从用户修改的 prompt 中学到）"
  - "用户总是把 AI 建议的 duration 改长 1-2 秒（偏好更慢的节奏）"
  - "Shot 3 生成了 4 次才满意，最终成功的 prompt 有什么特点"
  - "这个用户的角色一致性容忍度低（拒绝过 3 次轻微变形的结果）"
```

**自愈机制**: 当用户 3 个项目都偏好 Kling 后，记忆应该从 "上次用了 Kling" 升级为 "用户偏好 Kling"。当用户突然改用 Vidu，记忆应该更新而非固守。

---

### 理念 3: "System prompt designed around cache boundary — 80% cache hit"

**Claude Code**:
- 577+ 行 system prompt，但结构才是关键
- 全局不变部分在 cache boundary 之前（跨用户共享）
- 动态部分在 cache boundary 之后（per session/per turn）
- 每个 Tool 基于**当前环境**动态生成自己的描述

**Mozoria 映射**: AI 导演的"大脑"不是一个简单的 prompt，而是**分层知识系统**：

```
Layer 1: 视觉叙事通识（永不变，全用户共享）
  - 镜头语言知识（close-up = 情感距离近，wide = 建立环境/孤立感）
  - 剪辑节奏理论（动作场景 2-4s，对话场景 4-7s，沉思场景 5-8s）
  - 叙事结构模板（起承转合、三幕剧、环形叙事）
  - 色彩心理学（暖色=亲密，冷色=疏离，高对比=冲突）
  - 转场逻辑（match cut, jump cut, dissolve 各自的叙事含义）

Layer 2: 平台适应知识（低频更新）
  - YouTube: 前 3 秒 hook 必须有视觉冲击或悬念
  - TikTok: 竖屏构图，更快节奏，前 1 秒决定生死
  - 不同平台的最优时长、比例、风格偏好

Layer 3: 模型特性知识（中频更新）
  - Vidu Q3: 擅长 anime style，motion 流畅但细节弱
  - Kling 3.0 Pro: cinematic 感强，角色一致性好但贵 3x
  - Kling O1 Ref: 多角色一致性最佳选择
  - 各模型的 prompt 偏好（Kling 响应更长的描述性 prompt，Vidu 对关键词更敏感）

Layer 4: 用户偏好（per user，从 Creative Memory 加载）
  - 风格偏好、节奏偏好、模型偏好、质量容忍度

Layer 5: 项目上下文（per project，per turn 动态注入）
  - 当前脚本内容、角色信息、已生成的 shots 状态
  - 当前这个 shot 在故事中的叙事位置和功能
```

**关键**: Layer 1-3 是知识，Layer 4 是学习，Layer 5 是上下文。当前 Mozoria 只有 Layer 5 的一小部分。

---

### 理念 4: "Never hand off understanding — synthesize before delegating"

**Claude Code Coordinator**:
> "Never write 'based on your findings' or 'based on the research.' These phrases delegate understanding. You never hand off understanding to another worker."

**Mozoria 映射**: AI 导演不能只是"调用 Gemini 拆镜头"（把理解委托给 Gemini）。它必须自己理解剧本，然后给出有理由的创意指令。

```
错误做法（委托理解）:
  "Gemini, 把这个剧本拆成几个镜头" → 直接用 Gemini 的结果

正确做法（理解后指导）:
  Step 1: AI 导演分析剧本 → 识别出 3 个场景、2 个情感高潮、4 个角色
  Step 2: 基于视觉叙事知识 → 决定用 7 个镜头，映射到叙事结构
  Step 3: 给出每个镜头的创意意图:
    "Shot 4 是第一个情感高潮——角色发现真相。
     用 close-up 捕捉角色的表情变化。
     Duration 6s 给观众时间消化这个转折。
     色调从暖色突变冷色，强化震撼感。"
  Step 4: 基于这个创意意图，再调用 prompt-building 生成具体 prompt
```

**本质区别**: 当前 Mozoria 是 "Script → Gemini → Shots"（单次 LLM 调用）。智能化后是 "Script → 理解 → 创意决策 → 执行"（多步推理链）。

---

### 理念 5: "Permission = policy engine, not toggle"

**Claude Code**: 7 层权限管道，glob pattern 规则，渐进式信任。

**Mozoria 映射**: "人类控制级别"不应该是简单的开/关，而是**渐进式信任策略**：

```
Level 1 — 新用户/新项目:
  AI 导演只做分析和建议，所有操作需要人类确认
  "我建议把 Shot 3 改成 close-up，因为..."  → 用户: ✅/❌

Level 2 — 建立信任后（AI 建议接受率 > 80%）:
  低风险操作自动执行（camera type、duration 调整）
  高风险操作仍需确认（视频生成 = 花积分）

Level 3 — 全信任（用户主动选择）:
  "Direct My Video" — 全流程自动，只在积分消耗前确认
  类似 Claude Code 的 "bypass permissions" 模式

Anti-pattern: 不管用户信任级别如何，花钱操作永远需要明确确认
```

---

### 理念 6: "Agent designed to be always-on — persistent intelligence, not sessions"

**Claude Code**: Memory 跨会话持久化，Agent 有 resume 能力，task state 持久存储。

**Mozoria 映射**: AI 导演不是每次打开项目都"重新认识你"。它应该：

```
跨会话持久:
  - 记住这个用户的创作风格偏好
  - 记住这个项目之前的创意决策和原因
  - 记住哪些 prompt 在这个用户的项目中效果好

跨项目学习:
  - 项目 A 中学到的 "这个用户偏好暖色调" → 项目 B 默认推荐暖色调
  - 项目 A 中 Kling O1 Ref 效果好 → 项目 B 多角色场景默认推荐 Kling O1 Ref

自动梦境（autoDream 启发）:
  - 后台定期分析用户的历史操作
  - 发现模式: "用户总是在 AI 建议后增加 1-2 秒 duration"
  - 更新偏好: 下次 AI 建议自动 +1.5s
```

---

### 理念 7: "Context compaction — cheapest strategy first, most expensive only when needed"

**Claude Code**: 4 层 context 压缩策略（micro-compact → snip → auto-compact → collapse），最便宜的先跑。

**Mozoria 映射**: AI 导演处理一个项目时，不需要每次都完整分析所有内容：

```
Layer 1 — Micro (每次交互):
  只看用户当前操作的 shot + 相邻 shots
  代价: 极低（几百 token）

Layer 2 — Snip (跨 shot 操作):
  加载 shot 摘要（每个 shot 一句话）+ 当前 shot 完整信息
  代价: 低（1-2K token）

Layer 3 — Full Context (全局决策):
  完整剧本 + 所有 shot + 角色信息 + 项目设定
  代价: 中（5-10K token）
  触发: 重新排序 shots、全局节奏优化、Generate All

Layer 4 — Deep Analysis (创作级):
  完整上下文 + 视觉叙事知识 + 平台适应策略 + 用户偏好
  代价: 高（15-30K token）
  触发: "Direct My Video"、质量问题排查、风格不一致修复
```

---

## 具体实现架构

### 新增文件结构

```
src/agent/
├── knowledge/                        # 📚 Layer 1-3: 知识系统
│   ├── visual-storytelling.ts        # 镜头语言、构图、色彩、转场知识
│   ├── narrative-structure.ts        # 叙事结构模板和分析方法
│   ├── platform-optimization.ts      # YouTube/TikTok 平台适应策略
│   └── model-characteristics.ts      # 各 AI 模型的特性、prompt 偏好、优劣势
│
├── memory/                           # 🧠 Layer 4: Creative Memory 系统
│   ├── creative-memory.ts            # 用户偏好学习 + 项目决策记忆
│   ├── prompt-journal.ts             # Prompt 成功/失败日志 + 模式提取
│   └── preference-learner.ts         # 从用户行为中提取偏好（acceptRate, style drift）
│
├── director/                         # 🎬 AI 导演核心
│   ├── director-brain.ts             # 导演的推理引擎（组装知识 + 上下文 → 创意决策）
│   ├── narrative-analyzer.ts         # 理解剧本的叙事结构、情感弧线、角色弧线
│   ├── shot-designer.ts              # 基于叙事意图设计每个 shot 的视觉策略
│   ├── prompt-composer.ts            # 基于视觉策略 + 模型特性生成最优 prompt
│   ├── quality-critic.ts             # 基于叙事意图评估生成质量（不只是技术质量）
│   └── pacing-orchestrator.ts        # 全局节奏编排（duration, 转场, 情感曲线）
│
├── core/                             # ⚙️ 基础设施（精简版，为智能层服务）
│   ├── types.ts                      # 类型定义
│   ├── task-manager.ts               # DB-backed 任务状态机
│   └── trust-engine.ts               # 渐进式信任策略引擎
│
src/app/api/agent/                    # API 层
├── direct/route.ts                   # POST: AI 导演全流程
├── suggest/route.ts                  # POST: 获取 AI 建议（不执行）
├── feedback/route.ts                 # POST: 用户反馈（接受/拒绝/修改 AI 建议）
├── tasks/[taskId]/route.ts           # GET/PATCH: 任务状态
└── tasks/[taskId]/stream/route.ts    # GET SSE: 实时进度
```

### 关键变化：从"做事"到"思考"

**当前 prompt-enhancer.ts（机械操作）:**
```
输入: shot description + style + camera type
操作: 字符串拼接（character tags + description + camera modifier + style modifier + quality booster）
输出: 一个拼接好的 prompt 字符串
```

**新的 prompt-composer.ts（创意推理）:**
```
输入: shot 在故事中的叙事功能 + 情感目标 + 角色状态 + 视觉策略
推理:
  1. 这个 shot 的叙事功能是"揭示真相" → 需要情感冲击力
  2. 角色此刻从困惑转为震惊 → 面部表情是关键
  3. 视觉策略: close-up, shallow depth of field, 光线从暗到亮
  4. 目标模型是 Kling 3.0 Pro → Kling 对长描述性 prompt 响应更好
  5. 用户偏好暖色调 → 但这个场景需要冷色调表达震惊，适当妥协
  6. 从 Prompt Journal 中: 类似场景下 "dramatic lighting change" 比 "shifting light" 效果好
输出: 一个有创意意图的、针对特定模型优化的、融合用户偏好的 prompt
```

### DB Schema 变化

```typescript
// 新增表: creative_memories — 持久化创意学习
export const creativeMemories = pgTable("creative_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),    // 'model_preference', 'style_tendency', 'pacing_pattern', 'prompt_success'
  key: text("key").notNull(),              // 具体维度: 'preferred_model', 'duration_bias', 'color_warmth'
  value: jsonb("value").notNull(),         // 学习到的值
  confidence: real("confidence").notNull().default(0.5),  // 置信度，随着更多数据增长
  evidence: jsonb("evidence").$type<{ action: string; timestamp: string }[]>(), // 支撑证据
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 新增表: prompt_journal — Prompt 成功/失败日志
export const promptJournal = pgTable("prompt_journal", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  projectId: uuid("project_id").references(() => projects.id),
  shotId: uuid("shot_id").references(() => shots.id),
  prompt: text("prompt").notNull(),
  model: text("model").notNull(),
  accepted: boolean("accepted"),            // 用户是否选择了这个版本
  narrativeIntent: text("narrative_intent"), // 这个 shot 的叙事意图
  tags: jsonb("tags").$type<string[]>(),    // 场景类型标签: 'emotional', 'action', 'establishing'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// agent_tasks 表同 v1（任务状态机基础设施）
```

---

## 实现 Phases（重新排序，按智能度递增）

### Phase 1: 视觉叙事知识注入（1 周）

**目标**: 让 AI 从"机械拆分脚本"变成"理解叙事结构后做创意决策"。

**做什么**:
1. 创建 `knowledge/visual-storytelling.ts` — 编码镜头语言知识
2. 创建 `knowledge/narrative-structure.ts` — 编码叙事分析方法
3. 创建 `director/narrative-analyzer.ts` — 用 Gemini + 知识库分析剧本
4. 创建 `director/shot-designer.ts` — 基于叙事分析设计 shot 视觉策略
5. 重构 `splitScript()` → 内部调用 narrative-analyzer + shot-designer
6. 每个 shot 的输出增加 `narrativeIntent`（叙事意图）和 `visualReason`（视觉理由）

**修改文件**:
- `src/lib/script-splitter.ts` — 重构为调用 narrative-analyzer + shot-designer
- `src/db/schema.ts` — shots 表增加 `narrativeIntent` 字段

**用户体验变化**:
```
之前: "Split to Shots" → 5-8 个没有解释的 shots
现在: "Split to Shots" → 每个 shot 附带:
  - 叙事意图: "这是情感高潮——角色发现真相"
  - 视觉理由: "用 close-up 因为需要捕捉角色的微表情变化"
  - camera/duration 不再是默认值，而是有理由的推荐
```

### Phase 2: 智能 Prompt 生成 + 模型适配（1 周）

**目标**: 从静态字符串拼接变成基于叙事意图 + 模型特性的智能 prompt。

**做什么**:
1. 创建 `knowledge/model-characteristics.ts` — 各模型的 prompt 偏好和特性
2. 创建 `director/prompt-composer.ts` — 智能 prompt 生成
3. 创建 `director/quality-critic.ts` — 基于叙事意图的质量评估（不只是技术评估）
4. `prompt-enhancer.ts` 保留为 fallback，新增 `composeDynamicPrompt()`

**修改文件**:
- `src/lib/prompt-enhancer.ts` — 新增 `composeDynamicPrompt()`
- `src/app/api/projects/[id]/shots/[shotId]/generate-video/route.ts` — 调用新的 prompt composer

**用户体验变化**:
```
之前: prompt = character tags + description + "wide establishing shot" + "anime style" + "high quality"
现在: prompt 基于:
  - 这个 shot 的叙事功能（建立孤独感 vs 情感爆发）
  - 目标模型的偏好（Kling 喜欢长描述 vs Vidu 喜欢关键词）
  - 场景类型的最佳实践（动作场景强调 motion 词，对话场景强调 expression 词）
```

### Phase 3: Creative Memory + 偏好学习（1 周）

**目标**: AI 导演跨会话记住用户偏好，越用越懂你。

**做什么**:
1. 创建 `memory/creative-memory.ts` — CRUD + 查询
2. 创建 `memory/preference-learner.ts` — 从用户行为中提取偏好
3. 创建 `memory/prompt-journal.ts` — 记录 prompt → 结果映射
4. 创建 API: `POST /api/agent/feedback` — 用户反馈入口
5. 在现有操作中植入学习钩子:
   - 用户修改 AI 建议的 camera type → 学习 camera 偏好
   - 用户修改 AI 建议的 duration → 学习节奏偏好
   - 用户选择某个版本 → 学习 prompt 成功模式
   - 用户选择某个模型 → 学习模型偏好

**修改文件**:
- `src/db/schema.ts` — 新增 `creative_memories` + `prompt_journal` 表
- `src/hooks/use-project.ts` — mutation onSuccess 中加入反馈钩子
- `src/components/storyboard/shot-detail-panel.tsx` — 选择版本/修改参数时触发学习

**用户体验变化**:
```
第 1 个项目: AI 推荐默认参数
第 2 个项目: "根据您之前的偏好，推荐使用 Kling 3.0 Pro（您上次 3/4 次选择了它）"
第 5 个项目: AI 的推荐已经非常接近用户的最终选择，修改率下降 50%+
```

### Phase 4: 导演流水线 + 信任引擎（1-2 周）

**目标**: 一键 "Direct My Video" 全自动流水线，渐进式信任。

**做什么**:
1. 创建 `director/director-brain.ts` — 编排完整的创作流水线
2. 创建 `core/trust-engine.ts` — 根据历史接受率决定自动化级别
3. 创建 `director/pacing-orchestrator.ts` — 全局节奏优化
4. 创建 API: `POST /api/agent/direct` — 触发全流程
5. 创建前端: Agent Panel + Progress + Proposal Dialog

**修改文件**:
- `src/components/storyboard/project-editor.tsx` — 集成 Agent Panel
- `src/db/schema.ts` — 新增 `agent_tasks` 表

**用户体验变化**:
```
新用户: "Direct My Video" → 分析 → [审批] → 拆分 → [审批] → 生成 → [审批]
老用户(信任度高): "Direct My Video" → 分析+拆分(自动) → [仅审批积分消耗] → 生成
```

### Phase 5: 平台适配 + Hook 优化（1 周）

**目标**: YouTube vs TikTok 的自动适配，前 3 秒 hook 优化。

**做什么**:
1. 创建 `knowledge/platform-optimization.ts` — 平台特性知识
2. 在 shot-designer 中加入平台感知逻辑
3. 首个 shot 自动优化为 hook（视觉冲击 + 悬念）
4. 比例、节奏、时长自动适配目标平台

---

## Verification Plan

### Phase 1 验证
1. 用同一个剧本，对比新旧 splitScript 的输出
2. 新输出每个 shot 应该有 `narrativeIntent` 和 `visualReason`
3. camera type 和 duration 应该有叙事理由，而非默认值
4. 对 3 种不同类型的剧本测试（动作/情感/悬疑），验证 AI 给出不同的视觉策略

### Phase 2 验证
1. 同一个 shot，用新旧 prompt 各生成一次，对比质量
2. 同一个 shot，分别用 Kling 和 Vidu 生成，验证 prompt 有模型适配差异
3. 动作场景 vs 对话场景的 prompt 应该有明显不同的侧重点

### Phase 3 验证
1. 第 1 次使用: AI 推荐应该是通用默认
2. 连续使用 5 次后: AI 推荐应该能反映用户修改模式
3. 检查 `creative_memories` 表: confidence 随着更多证据逐步增长
4. 检查 `prompt_journal`: 成功的 prompt 被记录并影响后续推荐

### Phase 4 验证
1. "Direct My Video" 全流程跑通
2. trust-engine 正确根据历史接受率调整自动化级别
3. 积分消耗前始终有确认步骤

---

## 关键区别：v1 vs v2

| 维度 | v1（自动化） | v2（智能化） |
|------|-------------|-------------|
| 核心理念 | 用 AI 填参数 | AI 理解叙事并做创意决策 |
| 知识来源 | 硬编码 → Gemini 调用 | 分层知识系统（通识+平台+模型+用户） |
| 记忆 | 无 | Creative Memory + Prompt Journal |
| 学习 | 无 | 从用户行为中持续学习偏好 |
| 输出 | 参数值 | 决策 + 理由（"为什么用 close-up"） |
| 信任 | 全部需确认 | 渐进式信任策略 |
| Prompt | 字符串拼接 | 基于叙事意图 + 模型特性的智能组合 |
| 人机关系 | 工具（执行命令） | 导演（提供创意建议） |
