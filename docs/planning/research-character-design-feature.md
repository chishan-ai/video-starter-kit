# AI 角色设计功能调研与设计方案

> 调研日期: 2026-03-28
> 参考竞品: mkanime.ai
> 目标: 为 Mozoria 设计完整的角色设计功能模块

---

## 一、mkanime.ai 角色设计分析

### 它做了什么

从截图和官方指南来看，mkanime.ai 的角色设计流程:

1. **从剧本自动提取角色** — AI 读取剧本，识别关键角色
2. **生成 Character Description** — 每个角色的文字描述（外貌、穿着、性格）
3. **生成 Character Sheet** — 多角度/多姿势的角色设定图（正面、侧面、背面、3/4 视角）
4. **角色一致性锁定** — 同一角色在不同分镜中保持视觉一致
5. **角色可编辑** — 用户可以修改角色描述后重新生成

### 它的核心优势

- **全流程集成**: 剧本 → 角色 → 分镜 → 视频，角色贯穿始终
- **Character Sheet 质量高**: 生成的角色设定图包含多视角，类似专业动画前期设定
- **一致性好**: 角色在不同场景中面貌、服装保持一致

### Mozoria 目前缺什么

Mozoria 当前的角色管理只有：描述文本 + 参考图片上传 + AI 特征提取。
缺少: **角色设定图自动生成、穿着设计、配套产品设计**。

---

## 二、可用的 AI 角色设计 API

### 方案 A: Flux Kontext Pro/Max（推荐 — 穿着编辑）

| 项目 | 详情 |
|------|------|
| 提供商 | Black Forest Labs via fal.ai |
| 端点 | `fal-ai/flux-pro/kontext` / `fal-ai/flux-pro/kontext/max` |
| 价格 | $0.04/张 (Pro) / $0.08/张 (Max) |
| 核心能力 | 基于自然语言指令编辑图片 |

**适用场景**:
- "把角色的衣服换成红色晚礼服"
- "给角色加上一副墨镜和背包"
- "把角色放在一辆红色跑车旁边"
- 链式编辑：换衣服 → 换背景 → 加配饰，角色始终保持一致

**优点**: 已有 fal.ai 集成，零新基础设施成本。角色记忆功能强，多次编辑不丢脸。
**缺点**: 单张编辑，不能直接生成多视角 Character Sheet。

**参考**:
- [Flux Kontext 完整指南](https://apatero.com/blog/flux-kontext-complete-guide-instruction-based-editing-2025)
- [Flux Kontext 换装教程](https://fluxproweb.com/blog/detail/Unlock-Creative-Precision-with-Flux-Kontext-Max-The-Future-of-AI-Clothing-Changer-Tech-0b4a9916b76a/)

---

### 方案 B: Kling Image O1/O3（推荐 — IP 角色一致性）

| 项目 | 详情 |
|------|------|
| 提供商 | Kuaishou via fal.ai |
| 端点 | `fal-ai/kling-image/o1` |
| 价格 | $0.028/张 |
| 核心能力 | 多参考图一致性生成 |

**适用场景**:
- 上传 1-10 张参考图，生成同一角色在新场景/新姿势中的图片
- IP 角色设计：漫画面板、品牌周边、系列化视觉内容
- O3 版本可以"锁定"特定身份（面部、产品、服装），跨 seed 保持一致

**优点**: 专为 IP 角色一致性设计，价格便宜，已在 fal.ai 上可用。
**缺点**: 不是专门的 Character Sheet 生成器。

**参考**:
- [Kling O1 API 文档 (fal.ai)](https://fal.ai/models/fal-ai/kling-image/o1/api)
- [Kling 角色一致性指南](https://app.klingai.com/global/blog/ai-character-consistency-guide)

---

### 方案 C: GPT-Image-1 / GPT-4o 图片生成（强力 — Character Sheet）

| 项目 | 详情 |
|------|------|
| 提供商 | OpenAI |
| 端点 | OpenAI Images API (`gpt-image-1`, `gpt-image-1.5`) |
| 价格 | ~$0.02-0.19/张（按分辨率和质量） |
| 核心能力 | 从对话上下文生成图片，保持角色一致性 |

**适用场景**:
- 用自然语言描述角色，直接生成 Character Sheet（多角度设定图）
- 利用对话上下文保持角色外观一致
- 设计配套产品："设计一个与这个角色风格匹配的手提包"

**优点**: 理解力最强，可以通过对话迭代优化角色设计。文字渲染能力强（标注角色名称等）。
**缺点**: 价格较高，速度较慢，角色一致性依赖对话上下文而非显式锁定。

**参考**:
- [OpenAI 图片生成 API 文档](https://platform.openai.com/docs/guides/image-generation)
- [GPT-4o 图片生成介绍](https://openai.com/index/introducing-4o-image-generation/)

---

### 方案 D: Segmind Pixelflow Character Sheet Maker（专用 — 角色设定图）

| 项目 | 详情 |
|------|------|
| 提供商 | Segmind |
| 端点 | Pixelflow REST API |
| 价格 | 按 GPU 秒计费，有免费额度 |
| 核心能力 | 专门的 Character Sheet 生成工作流 |

**适用场景**:
- 上传单张角色图 → 自动生成多姿势 Character Sheet
- 生成 4 视角设定图（正面、右侧、背面、左侧）
- 2D 角色动画精灵表生成

**优点**: 专为 Character Sheet 设计，工作流成熟。支持 API 集成。
**缺点**: 额外的第三方依赖，非 fal.ai 生态。

**参考**:
- [Segmind Character Sheet Maker](https://www.segmind.com/pixelflows/ai-character-sheet-maker)
- [Segmind Character Sheet API](https://www.segmind.com/pixelflows/ai-character-sheet-maker/api)

---

### 方案 E: Scenario.com Turnaround Studio（游戏向 — 角色转面）

| 项目 | 详情 |
|------|------|
| 提供商 | Scenario |
| 端点 | Scenario API |
| 价格 | 订阅制 + API 计费 |
| 核心能力 | 专业角色转面设定图生成 |

**适用场景**:
- 生成前/右/后/左四视角角色转面图
- T-pose / A-pose 标准姿态
- ControlNet 姿态控制确保多角度一致
- 可训练自定义角色模型

**优点**: 最专业的角色转面工具，支持 ControlNet 精准控制。
**缺点**: 偏向游戏开发，订阅制定价较贵。

**参考**:
- [Scenario 角色转面教程](https://www.scenario.com/blog/generate-character-turnarounds-scenario)
- [Scenario Turnaround Studio](https://www.scenario.com/apps/turnaround-studio)

---

## 三、功能设计方案

基于 mkanime.ai 的参考和 API 调研，为 Mozoria 设计以下角色设计功能模块:

### 3.1 角色设计器（Character Designer）

#### 功能流程

```
用户输入角色描述
    ↓
AI 生成角色主图（正面全身）     ← GPT-Image-1 或 Flux
    ↓
自动生成 Character Sheet         ← Segmind API 或 GPT-Image-1
（多角度: 正面/侧面/背面/3-4视角）
    ↓
用户可编辑穿着/配饰              ← Flux Kontext
    ↓
锁定角色 → 用于分镜生成          ← Kling Image O1 参考图
```

#### 核心模块

**模块 1: 角色生成**
```typescript
interface CharacterDesignInput {
  name: string;              // 角色名称
  description: string;       // 角色描述
  style: 'anime' | '3d' | 'realistic';  // 风格
  gender: 'male' | 'female' | 'other';
  ageRange: string;          // "20-25岁"
  bodyType: string;          // 体型
}

interface CharacterDesignOutput {
  mainImage: string;         // 主图 URL（正面全身）
  characterSheet: string;    // Character Sheet URL（多角度）
  description: string;       // AI 生成的详细描述
  features: CharacterFeatures; // 提取的特征
}
```

**模块 2: 穿着设计器（Outfit Designer）**
```typescript
interface OutfitDesignInput {
  characterImage: string;    // 角色基础图
  outfitDescription: string; // 穿着描述
  occasion?: string;         // 场合（日常/正装/战斗等）
  colorScheme?: string;      // 配色方案
}

// 使用 Flux Kontext 实现
// 示例 prompt: "Change the character's outfit to a black leather jacket
//               with ripped jeans and combat boots"
```

**模块 3: 产品/配饰设计器（Props Designer）**
```typescript
interface PropsDesignInput {
  characterImage: string;    // 角色图
  propType: 'vehicle' | 'bag' | 'weapon' | 'accessory' | 'pet' | 'custom';
  propDescription: string;   // 产品描述
  matchStyle: boolean;       // 是否匹配角色风格
}

// 方案 1: Flux Kontext — 直接在角色图上添加产品
// prompt: "Add a sleek red sports car parked behind the character"

// 方案 2: GPT-Image-1 — 独立生成匹配风格的产品概念图
// prompt: "Design a luxury handbag that matches this anime character's
//          gothic lolita style, product concept art"

// 方案 3: Kling Image O1 — 用角色作为参考，生成角色与产品的合图
```

---

### 3.2 推荐技术方案

#### 最佳方案：组合式（Hybrid Approach）

| 功能 | 推荐 API | 理由 |
|------|----------|------|
| 角色主图生成 | **GPT-Image-1** | 理解力最强，可直接从文字描述生成高质量角色 |
| Character Sheet | **GPT-Image-1** 或 **Segmind** | GPT 可直接 prompt "character sheet, multiple views"；Segmind 更专业 |
| 穿着编辑 | **Flux Kontext Pro** (fal.ai) | 精准编辑衣服，保持角色一致 |
| 配饰/产品设计 | **Flux Kontext Pro** + **GPT-Image-1** | Kontext 做角色+产品合图，GPT 做独立产品概念 |
| 分镜角色一致性 | **Kling Image O1** (fal.ai) | 专为 IP 一致性设计，用角色设定图作参考 |

#### 实施优先级

```
Phase 1 (MVP):
  - 用 GPT-Image-1 生成角色主图 + Character Sheet
  - 用 Flux Kontext 实现穿着编辑
  - 预计 API 成本: ~$0.10-0.30/角色

Phase 2 (增强):
  - 加入 Kling Image O1 做分镜级角色一致性
  - 加入产品/配饰设计器
  - 预计 API 成本: +$0.03-0.08/次编辑

Phase 3 (高级):
  - Flux LoRA 训练 — 为高频角色训练专属模型
  - Scenario 级角色转面 — 更专业的多角度控制
  - 预计 API 成本: ~$2-5/角色 LoRA 训练
```

---

### 3.3 UI 设计参考

参考 mkanime.ai 的 UI，Mozoria 角色设计面板应包含：

```
┌─────────────────────────────────────────────────┐
│  角色设计器 - [角色名称]                          │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────────────────────────┐ │
│  │          │  │  Character Description        │ │
│  │  主图    │  │  一个 25 岁的年轻男性，穿着      │ │
│  │ (正面)   │  │  黑色皮夹克配破洞牛仔裤...       │ │
│  │          │  │  [编辑] [重新生成]              │ │
│  └──────────┘  └──────────────────────────────┘ │
│                                                  │
│  Character Sheet                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │正面 │ │右侧 │ │背面 │ │左侧 │              │
│  └─────┘ └─────┘ └─────┘ └─────┘              │
│  [重新生成 Sheet]                                │
│                                                  │
│  穿着设计                                        │
│  ┌─────────────────────────────────────┐        │
│  │ 描述穿着变化: [换成白色西装配领带]     │        │
│  │ [应用穿着变化]                       │        │
│  └─────────────────────────────────────┘        │
│                                                  │
│  配套产品                                        │
│  ┌─────┐ ┌─────┐ ┌─────┐                       │
│  │ 🚗  │ │ 👜 │ │ ⚔️  │   [+添加产品]          │
│  │汽车  │ │包  │ │武器 │                        │
│  └─────┘ └─────┘ └─────┘                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 四、API 能力对比矩阵

| 能力 | GPT-Image-1 | Flux Kontext | Kling O1/O3 | Segmind | Scenario |
|------|:-----------:|:------------:|:-----------:|:-------:|:--------:|
| 角色主图生成 | ★★★★★ | ★★★ | ★★★★ | ★★★ | ★★★★ |
| Character Sheet | ★★★★ | ★★ | ★★★ | ★★★★★ | ★★★★★ |
| 穿着编辑 | ★★★ | ★★★★★ | ★★★ | ★★ | ★★★ |
| 产品设计 | ★★★★ | ★★★★ | ★★★ | ★★ | ★★ |
| 角色一致性 | ★★★ | ★★★★ | ★★★★★ | ★★★ | ★★★★ |
| API 集成难度 | 低 | 低(已有fal) | 低(已有fal) | 中 | 中 |
| 成本/次 | $0.02-0.19 | $0.04-0.08 | $0.028 | ~$0.05 | 订阅制 |

---

## 五、哪些模型能接受角色设计的详细信息

持山特别关心的问题：**哪些模型可以接受穿着、配饰、产品等详细信息？**

### 能接受丰富角色描述的模型

| 模型 | 可接受信息类型 | 输入方式 |
|------|--------------|---------|
| **GPT-Image-1** | 极其详细的文字描述（穿着、材质、颜色、配饰、场景、表情、姿势） | 自然语言 prompt，可多轮对话迭代 |
| **Flux Kontext** | 编辑指令（换什么衣服、加什么配饰、改什么颜色） | 图片 + 文字编辑指令 |
| **Kling Image O1** | 参考图 + 文字描述（场景、姿势、服装变化） | 1-10 张参考图 + prompt |
| **Flux.2 Pro/Max** | 详细 prompt（角色外观、穿着、风格、构图） | 纯文字 prompt |
| **Segmind** | 输入图片 → 自动多姿势 | 图片输入 |
| **Scenario** | 训练数据 + prompt | 训练自定义模型 + prompt |

### 信息接受能力详细分析

**1. GPT-Image-1 — 最强文本理解**
```
可接受: "一个 25 岁的日本女性，穿着深蓝色和服，上面有金色樱花刺绣，
       腰间系着红色腰带，脚穿木屐，手持一把折扇，
       背景是一辆同色系的深蓝色复古跑车"
→ 可以一次性理解所有信息并生成
```

**2. Flux Kontext — 最强编辑控制**
```
Step 1: 有一张角色基础图
Step 2: "Change outfit to a navy blue kimono with golden sakura embroidery"
Step 3: "Add a red obi belt around the waist"
Step 4: "Place a matching dark blue vintage sports car behind the character"
→ 每步编辑保持角色一致性
```

**3. Kling Image O1 — 最强参考一致性**
```
输入: 3 张角色参考图（正面、侧面、全身）
Prompt: "Same character sitting in a luxury car interior,
        wearing sunglasses, holding a designer handbag"
→ 面部和体型完全一致，自然融入新场景
```

---

## 六、总结与建议

### 对 Mozoria 的核心建议

1. **Phase 1 用 GPT-Image-1 + Flux Kontext 组合**
   - GPT 负责"从无到有"生成角色 + Character Sheet
   - Flux Kontext 负责"基于现有角色"编辑穿着和配饰
   - 两者都有成熟的 API，集成成本低

2. **角色设计流程应该像 mkanime 一样集成到主流程中**
   - 剧本 → 自动提取角色 → 生成角色设定 → 分镜生成时自动引用
   - 这是 Mozoria 已有的 Gemini 角色提取能力可以直接衔接的

3. **产品/配饰设计是差异化卖点**
   - mkanime 没有明确的产品设计功能
   - Mozoria 可以做"角色 + 品牌产品"的一站式设计
   - 适合品牌内容创作者（给角色配上品牌汽车、包等）

### 预计 API 成本
- 生成一个完整角色（主图 + Sheet + 2 次穿着变化）: **~$0.30-0.50**
- 每次穿着/产品编辑: **~$0.04-0.08**
- 每次分镜角色一致性生成: **~$0.028**
