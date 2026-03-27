# AI 动画 SaaS — 开源工具深度分析报告

**调研日期**: 2026-03-26

---

## 总览：MVP 技术选型推荐（最终版）

| 环节 | 推荐工具 | 理由 |
|------|---------|------|
| **SaaS 基座** | fal-ai video-starter-kit | ⭐ 完整 Next.js + Remotion + AI 视频骨架，MIT，节省 4-6 周 |
| **分镜自动化** | video-shot-agent | 生产级 LangGraph 管线，pip install 即用，输出兼容 Kling/Vidu |
| **前端编辑器** | Remotion（基座）→ Twick SDK（后期） | MVP 用基座时间线，Growth 引入 Twick 模块化定制 |
| **后端视频合成** | Editly | 流式处理低内存（~50MB），JSON 声明式 API，MIT 协议 |
| **视频生成 API（动漫）** | Vidu API | 动漫最优，成本低（$0.0375/秒），支持 7 张参考图 |
| **视频生成 API（通用）** | Kling via PiAPI | 20+ 并发，按需付费，~$0.90/10秒（基座已内置 Kling 1.5） |
| **设计参考** | OpenStoryline Style Skills | 动漫风格预设 + 自然语言导演交互模式 |
| **架构参考** | MoneyPrinterAICreate | LLM 分镜 + 视频组装的完整管线参考 |

---

## 1. MoneyPrinterAICreate — 架构参考

**项目**: https://github.com/q1uki/MoneyPrinterAICreate (272 stars)
**代码量**: ~5,850 行 Python

### 架构

```
FastAPI + Uvicorn
├── services/llm.py (549行) — 多 LLM 适配，脚本+分镜生成
├── services/wan21.py (89行) — Wan2.1 API 集成
├── services/video.py (413行) — MoviePy 视频合成
├── services/task.py (337行) — 异步任务管理
├── services/voice.py (1356行) — TTS + 字幕
└── controllers/ — REST API 端点
```

### 核心流程

```
generate_script() → generate_outline() → Wan2.1 t2v/i2v → MoviePy combine → 最终视频
```

### LLM 分镜设计（核心可复用）

分镜输出 JSON 格式：
```json
{
  "0": {
    "prompt": "主体描述 + 修饰词 + 环境描写 + 镜头要求",
    "method": "t2v 或 i2v",
    "img": "图片内容描述"
  }
}
```

关键约束：
- 每段 5 秒，包含 prompt + method + img
- 禁止生成文字/数字（AI 视频模型限制）
- 提示词必须纯描述性

### 可复用评估

| 模块 | 可复用性 | 说明 |
|------|---------|------|
| LLM 提示词框架 | ⭐⭐⭐⭐⭐ | 支持 10+ LLM 提供商，提示词结构化良好 |
| 任务管理 | ⭐⭐⭐⭐ | 内存/Redis 双模式，进度追踪 |
| 视频合成 | ⭐⭐⭐⭐ | MoviePy 集成完整，字幕+音频混音 |
| Wan2.1 集成 | ⭐⭐ | 试用 API 太慢（10-20分钟/5秒），需替换 |
| 前端 | ⭐⭐ | Streamlit 不适合生产 |

### 结论

**用途：架构参考和提示词学习**。不直接使用，但其 LLM 分镜提示词框架和视频合成逻辑值得借鉴。

---

## 2. video-shot-agent — 分镜自动化引擎

**项目**: https://github.com/neopen/video-shot-agent (37 stars)
**安装**: `pip install neoshot`

### 架构：5 智能体 LangGraph 管线

```
剧本解析(ScriptParserAgent)
  ↓ ParsedScript（角色、场景、元素）
镜头分割(ShotSegmenterAgent)
  ↓ ShotSequence（镜头类型、时长、情绪）
视频片段(VideoSplitterAgent)
  ↓ FragmentSequence（1-10秒片段）
提示词转换(PromptConverterAgent)
  ↓ AIVideoInstructions（Kling/Vidu 兼容提示词）
质量审计(QualityAuditorAgent)
  ↓ 通过/修复循环
```

### 输出格式（直接兼容目标 API）

```python
AIVideoPrompt:
  fragment_id: "frag_001"
  prompt: "英文视频描述..."
  negative_prompt: "不要的元素..."
  duration: 4.2
  model: "runway_gen2"  # 可切换
  style: "cinematic 35mm film..."
  audio_prompt: { ... }
```

| 目标 API | 兼容性 |
|---------|--------|
| Kling API | ✅ 高 |
| Wan API | ✅ 高 |
| Vidu API | ✅ 高 |
| Runway Gen2 | ✅ 最佳 |

### 角色一致性管理

内置 `ContinuityGuardian` 状态快照系统：
- 角色外观追踪（服装、发型、持有物品）
- 情绪/动作状态记录
- 跨片段连贯性参数传递
- 质量审计自动检测不一致

局限：依赖 LLM 理解，非强制性保证

### 集成方式（4 种）

| 方式 | 推荐度 | 说明 |
|------|--------|------|
| Python 库 | ⭐⭐⭐⭐⭐ | `from penshot.api import PenshotFunction` |
| REST API | ⭐⭐⭐⭐ | FastAPI 服务，Docker 部署 |
| LangGraph 节点 | ⭐⭐⭐⭐ | 嵌入自定义工作流 |
| A2A | ⭐⭐⭐ | Agent-to-Agent（计划中） |

### 成本估算

~$2.75/100分钟剧本（GPT-4o），DeepSeek 备用可更低

### 定制能力

- 提示词模板：YAML 格式，支持覆盖
- LLM 选择：GPT-4o / Claude / DeepSeek / Qwen / Ollama
- 时长参数：可配置片段时长范围
- 质量阈值：置信度分数可调

### 结论

**强烈推荐直接集成**。生产级质量，pip install 即用，输出直接兼容 Kling/Vidu API。是 MVP 分镜环节的首选方案。

---

## 3. 前端编辑器对比：DesignCombo vs Twick

### 推荐：Twick SDK

| 维度 | DesignCombo | Twick | 胜者 |
|------|-----------|-------|------|
| Stars | 1,516 | 416 | DesignCombo |
| 版本成熟度 | 0.1.0（极早期） | 0.15.0（较成熟） | **Twick** |
| 许可证 | 专有 © 2025 | SUL v1.0（允许商业 SaaS） | **Twick** |
| 架构 | 单体应用，强耦合 | Monorepo 14 独立包 | **Twick** |
| Timeline | Canvas-based（私有包，黑盒） | DOM-based（完全可编程） | **Twick** |
| Canvas | DOM/HTML + Remotion | Fabric.js（轻量 2D） | **Twick** |
| AI 集成 | 仅 Gemini 导入 | 内置字幕/转录/媒体生成 | **Twick** |
| 导出 | 依赖外部 API（combo.sh） | 客户端 WebCodecs + 服务端 FFmpeg | **Twick** |
| 文档 | 仅 1 个 README | 9+ 详细文档 | **Twick** |
| 社区 | 零活动 | Discord + 贡献指南 | **Twick** |
| 定制性 | 不可拆分 | 可选择任意子包 | **Twick** |

### Twick 核心优势

**模块化架构（14 个独立包）：**
```
@twick/timeline     — 时间线数据模型 + 操作
@twick/canvas       — Fabric.js 画布包装
@twick/live-player  — 同步播放器
@twick/studio       — 完整编辑器 UI
@twick/browser-render — WebCodecs 客户端渲染
@twick/render-server  — Node + FFmpeg 服务端渲染
@twick/effects      — GL 着色器效果
@twick/ai-models    — AI 集成
@twick/cloud-functions — AWS Lambda（字幕、导出、转录）
```

**分镜工作流适配：**
```tsx
const editor = useTimelineEditor();

// 为每个分镜创建轨道
for (const scene of storyboard) {
  const track = editor.addTrack({ type: "element" });
  editor.addElementToTrack(track.id, {
    type: "video", s: 0, e: 5,
    props: { url: scene.videoUrl }
  });
}
```

**导出方案：**
- 原型阶段：客户端 WebCodecs（零服务器成本）
- 生产阶段：服务端 Puppeteer + FFmpeg

**许可证确认：**
- SUL v1.0 允许：商业应用（用户是最终用户）、自托管、销售包含 Twick 的产品
- SUL v1.0 禁止：转售 Twick 本身给其他开发者

### DesignCombo 不推荐原因

- 0.1.0 太早期，代码库可能快速变化
- 许可证不明确（专有 © 2025，商业风险）
- 强耦合 @designcombo 私有包，无法拆分定制
- 社区零活动，无支持渠道
- 导出依赖外部 combo.sh API

### 结论

**Twick 是明确的首选**。模块化、AI 原生、许可清晰、文档完善。MVP 用 Level 1（完整 Studio），后期用 Level 2（组件化定制）。

---

## 4. 后端视频合成对比：Editly vs MoviePy

### 推荐：Editly

| 维度 | Editly | MoviePy | 胜者 |
|------|--------|---------|------|
| 处理模式 | 流式（streaming） | 内存逐帧（numpy） | **Editly** |
| 内存占用（8×5秒 1080p） | ~50MB | ~2-3GB | **Editly** |
| API 风格 | JSON5 声明式 | Python OOP | **Editly** |
| 多音轨 | 原生支持 + 音量控制 | 需手工 CompositeAudioClip | **Editly** |
| 字幕 | 4 种内置层（title/subtitle/title-bg/news-title） | 基础 TextClip + 实验性 SRT | **Editly** |
| 转场效果 | 43+ gl-transitions（GPU 加速） | 无内置转场 | **Editly** |
| 渲染速度 | 快（FFmpeg 流式） | 慢（Python 逐帧） | **Editly** |
| 许可证 | MIT | MIT | 平 |
| 语言 | TypeScript/Node.js | Python | 看技术栈 |
| 生态成熟度 | 5.3k stars | 14.5k stars | MoviePy |

### Editly 核心优势

**JSON 声明式 API（天然适合 SaaS）：**
```javascript
await editly({
  outPath: "output.mp4",
  width: 1920, height: 1080, fps: 30,
  clips: [
    { duration: 5, layers: [{ type: "video", path: "clip1.mp4" }] },
    { duration: 4, layers: [{ type: "video", path: "clip2.mp4" }] }
  ],
  audioTracks: [
    { path: "tts_voice.mp3", start: 0, mixVolume: 1 },
    { path: "background.mp3", start: 0, mixVolume: 0.3 }
  ],
  defaults: { transition: { name: "fade", duration: 0.5 } }
});
```

**微服务集成：**
```javascript
// Express/Fastify 端点
app.post('/render', async (req, res) => {
  const spec = req.body;  // 前端直接发 JSON 配置
  await editly(spec);
  res.download('output.mp4');
});
```

### MoviePy 何时选择

- 后端坚持 Python 且并发量小（<10）
- 需要极高编程灵活性的复杂视频处理
- 与 Python AI 模型在同一进程中运行

### 结论

**Editly 完胜我们的场景**。5-8 个短视频片段拼接 + TTS 音频 + 字幕叠加，JSON API 天然适合 SaaS 微服务。配合 Node.js 后端和 Twick 前端，技术栈统一。

---

## 5. 视频生成 API：Kling vs Vidu

### 核心对比

| 维度 | Kling | Vidu |
|------|-------|------|
| **动漫优化** | 基础 | ⭐⭐⭐⭐⭐（专属 anime style 参数） |
| **角色一致性** | 支持 7 张参考图 | 支持 7 张参考图 |
| **成本** | $1/10秒（官方） | $0.0375/秒（便宜 55%） |
| **最大时长** | 10 秒 | 16 秒 |
| **并发** | 5（官方）/ 20+（PiAPI） | 待确认 |
| **动作控制** | Motion Brush（v1.0） | Motion intensity 参数 |
| **生成速度** | 标准 | 最快 10 秒 |
| **API 成熟度** | 高 | 中高（2025.2 推出） |

### Kling API 接入方案

**官方 API：**
- 门槛高：起价 $4,200（30,000 单位，90 天有效）
- 仅 5 并发
- 功能最全（Motion Brush、摄像机控制、物理模拟）

**推荐方案 — PiAPI（第三方）：**
- 按需付费，~$0.90/10秒
- 20+ 并发
- 支持所有 Kling 功能

**SDK 选择：**

| SDK | 推荐度 | 说明 |
|-----|--------|------|
| TechWithTy/kling | ⭐⭐⭐⭐⭐ | 类型安全、异步、Pydantic v2、生产级 |
| klingCreator | ⭐⭐ | 逆向工程，仅原型用 |
| PiAPI REST | ⭐⭐⭐⭐ | 简洁 REST，适合直接调用 |

### Vidu API

**动漫杀手级特性：**
- `--style anime` 参数：高质量 2D 动画
- 精确提取参考图特征（发色、发型、眼睛、服装）
- Reference-to-Video 2.0：多实体一致性
- 生成速度：最快仅 10 秒

**定价：**
- Pro（影院质量）：60秒 ~$2.03
- Pro（标准质量）：60秒 ~$0.90
- 平台：https://platform.vidu.com/

### 推荐策略

```
动漫内容 → Vidu API（成本低、动漫最优）
通用内容 → PiAPI Kling（功能全、高并发）
SDK → TechWithTy/kling（生产级代码质量）
```

### 异步处理架构

两者都是异步生成模式：
1. 提交任务 → 获得 task_id
2. Webhook 回调 或 轮询获取结果
3. 推荐 Webhook（延迟更低、成本更优）

---

## 6. 技术栈决策总结

### 推荐架构

```
┌────────────────────────────────────────────────────┐
│              前端 (React + Twick SDK)                │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────┐│
│  │ 剧本输入面板  │  │ 分镜预览/编辑  │  │ 导出面板 ││
│  │              │  │ (@twick/studio)│  │          ││
│  └──────┬───────┘  └───────┬───────┘  └────┬─────┘│
└─────────┼──────────────────┼───────────────┼──────┘
          │                  │               │
          v                  v               v
┌────────────────────────────────────────────────────┐
│             后端 API (Node.js / FastAPI)             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────┐│
│  │ video-shot-  │  │ 视频生成调度   │  │ Editly   ││
│  │ agent        │  │ (Vidu + Kling)│  │ 视频合成  ││
│  │ (pip/微服务) │  │               │  │          ││
│  └──────────────┘  └───────────────┘  └──────────┘│
└────────────────────────────────────────────────────┘
          │                  │
          v                  v
┌──────────────┐    ┌───────────────┐
│ LLM API      │    │ 视频生成 API   │
│ (GPT-4o/     │    │ Vidu (动漫)   │
│  DeepSeek)   │    │ Kling via     │
│              │    │ PiAPI (通用)  │
└──────────────┘    └───────────────┘
```

### 技术栈统一性

| 层 | 技术 | 语言 |
|----|------|------|
| 前端 | React + Twick SDK | TypeScript |
| 前端编辑器 | @twick/studio + @twick/timeline | TypeScript |
| 后端 API | Express/Fastify 或 Next.js API Routes | TypeScript |
| 视频合成 | Editly | TypeScript (Node.js) |
| 分镜引擎 | video-shot-agent（微服务） | Python |
| 视频生成 | Vidu API + Kling PiAPI | REST API |

全栈 TypeScript + Python 微服务（仅分镜引擎），技术栈简洁统一。

### MVP 开发顺序

**Week 1-2：核心管线验证**
- 接入 video-shot-agent，验证分镜输出质量
- 接入 Vidu API，验证动漫视频生成效果
- 测试角色一致性（参考图注入）

**Week 3-4：前端编辑器**
- 集成 Twick Studio（Level 1）
- 构建剧本输入面板
- 分镜预览展示

**Week 5-6：后端合成 + 编辑**
- Editly 视频拼接管线
- 分镜编辑（重新生成、排序、增删）
- TTS 音频集成

**Week 7-8：产品化**
- Auth + Credits 计费
- Landing Page
- Beta 测试

---

## 附录：成本估算（每个用户视频）

假设：5-8 个分镜，每个 5 秒，总时长 25-40 秒

| 环节 | 成本 |
|------|------|
| LLM 分镜（GPT-4o） | ~$0.05 |
| Vidu 视频生成（动漫） | ~$0.94-1.50（25-40秒 × $0.0375/秒） |
| Kling 视频生成（通用） | ~$2.50-4.00（5-8个 × $0.50-0.90） |
| TTS 音频 | ~$0.01-0.05 |
| **总成本/视频** | **~$1-5.50**（取决于 API 选择） |

定价 $49-129/月（含 10-30 个视频），毛利可观。

---

## 7. X/Twitter 扩展调研 — 新发现的工具（Grok 搜索，523 来源）

通过 Grok Agent 在 X 上搜索最近 3 个月开发者分享的 GitHub 项目，发现以下**之前调研未覆盖**的工具：

### 高优先级新发现

| 工具 | Stars | 类别 | 说明 | X 分享者 |
|------|-------|------|------|---------|
| **fal-ai video-starter-kit** | 2.3k | SaaS 启动模板 | 完整的浏览器 AI 视频生产 SaaS（Next.js + Remotion + fal.ai + IndexedDB），无需服务端数据库 | @tom_doerr (Jan 2026) |
| **FireRed-OpenStoryline** | 1.3k | 分镜→视频 | AI 视频编辑 Agent，自然语言导演，脚本风格迁移，可复用 Style Skills | @RepoGems (Mar 2026) |
| **Helios** | 1.5k | 视频生成 | 实时长视频生成（分钟级，19.5 FPS on H100，6GB VRAM），支持 T2V/I2V/V2V | @jiqizhixin (Mar 2026) |
| **bilibili/index-anisora** | 新发布 | 动漫生成 | B 站开源的动漫视频生成模型，一键生成动漫风格视频（漫剧/PV/MAD） | 动漫开发社区 (Mar 2026) |

### 中优先级新发现

| 工具 | Stars | 类别 | 说明 | X 分享者 |
|------|-------|------|------|---------|
| **clip-js** | 707 | Web 编辑器 | 浏览器视频编辑器（Next.js + Remotion + FFmpeg WASM），CapCut 风格 | @MustafyOf (Mar 2026) |
| **DirectorsConsole** | 262 | 分镜工具 | Web 分镜画布 + 110 个影视/动画预设 + 多 ComfyUI 节点并行渲染 | @wildmindai (Feb 2026) |
| **OpenRoom** (MiniMax) | 739 | 角色一致性 | 浏览器 AI Agent 环境，持久角色行为框架 | @SkylerMiao7 (Mar 2026) |
| **InSpatio-World** | 581 | 视频生成 | 可控摄像机运动视频管线（Florence-2 + Wan2.1） | @tom_doerr (Mar 2026) |
| **nugget-app** | 540 | 视频组装 | Electron 编辑器，AI 字幕（Whisper），关键帧动画，8K | @tom_doerr (Mar 2026) |
| **trycua/launchpad** | 442 | SaaS 模板 | AI 产品视频 Monorepo（Remotion + Next.js + Claude Code） | @NaitiveAi (Feb 2026) |
| **izwi** | 239 | TTS 引擎 | 设备端 TTS + 长音频项目 Studio（语音克隆、精准对齐） | @IzwiAI (Mar 2026) |

### 低优先级/参考

| 工具 | Stars | 类别 | 说明 |
|------|-------|------|------|
| **openvideo** | 170 | Web 编辑器 | React + WebCodecs + PixiJS，GLSL 效果/转场 |
| **chatman-media/timeline-studio** | 149 | Web 编辑器 | AI 视频编辑 UI（React 19/Next.js 15 + Tauri/Rust + FFmpeg） |
| **ComfyUI-Kie-API** | 23 | Kling 集成 | Kling 2.x/3.0 的 ComfyUI 自定义节点 |
| **NemoVideo Skills** | 17 | AI Agent | AI 视频编辑 Agent 技能库（自动字幕、BGM、转场） |
| **Pixazo-ai-studio** | <10 | SaaS 模板 | Next.js text→image→music→video 全管线 SaaS 启动器 |

### 关键洞察

1. **fal-ai video-starter-kit（2.3k stars）是最大发现**：完整的浏览器 AI 视频生产 SaaS 模板，技术栈（Next.js + Remotion + AI API）和我们的方向高度一致。需要深入研究其架构和代码。

2. **FireRed-OpenStoryline（1.3k stars）可能是最直接的产品参考**：AI 视频编辑 Agent + 自然语言导演 + Style Skills 复用，和我们的"分镜编辑器"方向高度重合。

3. **bilibili/index-anisora 是动漫方向的重要新选项**：如果我们定位动漫优先，这可能是比 Vidu 更好的自托管选择（但需要 GPU）。

4. **React/Next.js 视频编辑器赛道正在快速升温**：clip-js、openvideo、timeline-studio 都是最近 3 个月出现的，说明市场需求确实存在。

5. **开发者技术栈共识**：Next.js + Remotion/WebCodecs + AI API（fal.ai/Kling/Minimax）+ IndexedDB/Vercel 是当前最流行的组合。

### 技术选型影响（已完成深入分析，见第 8-10 节）

基于扩展调研 + 深度分析后的最终结论：

| 原选型 | 新发现的替代 | 深度分析结论 |
|--------|------------|-------------|
| 从零搭建 SaaS | fal-ai video-starter-kit（2.3k stars） | ✅ **采纳为 SaaS 基座**，节省 60% 基础搭建工作 |
| Twick SDK | clip-js（707 stars） | ✅ **维持 Twick 推荐**，clip-js 单体架构不适合深度定制 |
| video-shot-agent | FireRed-OpenStoryline（1.3k stars） | ✅ **两者互补非替代**，OpenStoryline 是编辑器，agent 是生成器 |
| Vidu API（动漫） | bilibili/index-anisora | ⚠️ 后期考虑（需 GPU 自托管，MVP 用 API 更轻量） |
| Editly | 无更好替代 | ✅ 维持推荐 |

---

## 8. fal-ai video-starter-kit — SaaS 基座深度分析

**项目**: https://github.com/fal-ai/video-starter-kit (2.3k stars)
**许可**: MIT
**评分**: 8/10（作为 SaaS 起点）

### 架构概览

```
Next.js 15 + App Router
├── fal.ai SDK — AI 模型调用（Kling 1.5, Minimax, LTX, Mochi, Hunyuan 等）
├── Remotion — 浏览器端视频渲染 + 时间线编辑
├── IndexedDB (Dexie.js) — 浏览器本地存储（零服务端数据库）
├── Vercel AI SDK — 流式 AI 交互
└── Tailwind + shadcn/ui — 现代 UI
```

### 已内置功能（开箱即用）

| 功能 | 状态 | 说明 |
|------|------|------|
| AI 视频生成 | ✅ | 集成 Kling 1.5 + 多模型切换 |
| AI 音乐生成 | ✅ | MMAudio 集成 |
| TTS 语音 | ✅ | F5-TTS 集成 |
| AI 图片生成 | ✅ | Flux 系列集成 |
| 图生视频 (I2V) | ✅ | Kling + Minimax |
| 时间线编辑 | ✅ | Remotion 基础时间线 |
| 浏览器渲染 | ✅ | Remotion + WebCodecs |
| 本地存储 | ✅ | IndexedDB，零服务端成本 |
| 部署 | ✅ | Vercel 一键部署 |

### 需要我们自建的部分（约 40% 工作量）

| 功能 | 优先级 | 复杂度 | 说明 |
|------|--------|--------|------|
| **分镜网格视图** | 🔴 高 | 中 | 当前只有单轨时间线，需改造为分镜面板模式 |
| **剧本→分镜自动拆分** | 🔴 高 | 中 | 接入 video-shot-agent，实现脚本自动分镜 |
| **全局角色锁定** | 🔴 高 | 高 | 参考图注入 + 跨分镜角色一致性机制 |
| **云端存储** | 🟡 中 | 低 | IndexedDB → S3/R2（用户资源持久化） |
| **计费系统** | 🟡 中 | 中 | Credits 计费 + Stripe 集成 |
| **用户认证** | 🟡 中 | 低 | NextAuth / Clerk |
| **Vidu API 集成** | 🟡 中 | 低 | 动漫优先 API，补充 Kling |
| **导出优化** | 🟢 低 | 中 | 服务端 FFmpeg 渲染（高负载场景） |

### 已知限制

- **30 秒硬编码时长上限**：代码中 `MAX_DURATION = 30`，修改为配置项即可解决
- **仅浏览器端渲染**：Remotion 浏览器渲染性能有限，高并发需加服务端渲染
- **fal.ai 绑定**：AI 模型调用通过 fal.ai proxy，需要评估是否可直连 Vidu/Kling API
- **无用户系统**：纯工具型，无认证/计费/多用户

### 结论

**强烈推荐作为 SaaS 基座**。核心价值是：已经搭好了 Next.js + Remotion + AI 视频生成的完整骨架，MIT 许可无限制。我们只需在此基础上加入分镜编辑器、角色一致性、计费系统。比从零开始至少节省 4-6 周。

---

## 9. FireRed-OpenStoryline — AI 视频编辑 Agent 分析

**项目**: https://github.com/FireRedTeam/OpenStoryline (1.3k stars)
**许可**: Apache 2.0
**定位**: AI 视频**编辑**Agent（非生成器）
**生产就绪度**: 6/10

### 核心定位澄清

> **关键认知：OpenStoryline 是视频编辑器，不是视频生成器。**
> 它处理的是**已有媒体素材**（通过 Pexels 搜索或用户上传），而非 AI 生成新视频。
> 和 video-shot-agent 是**互补关系**，不是替代关系。

### 架构：19 节点 LangChain + MCP 管线

```
用户输入（自然语言导演指令）
  ↓
ScriptWriter → 剧本生成
  ↓
StoryboardDesigner → 分镜设计（场景描述、镜头规划）
  ↓
MediaSearcher → Pexels API 搜索匹配素材
  ↓
VideoAssembler → FFmpeg 拼接 + 字幕 + BGM
  ↓
QualityChecker → 质量审查 + 迭代优化
```

### 与 video-shot-agent 对比

| 维度 | video-shot-agent | OpenStoryline |
|------|-----------------|---------------|
| **输入** | 剧本文本 | 自然语言导演指令 |
| **输出** | AI 视频生成提示词（Kling/Vidu 兼容） | 完成的视频文件（已有素材拼接） |
| **媒体来源** | 无（输出给 AI 生成 API） | Pexels 搜索 + 用户上传 |
| **核心价值** | 分镜→提示词转换 | 素材搜索→视频组装 |
| **角色一致性** | ContinuityGuardian 状态追踪 | 无（依赖搜索素材匹配） |
| **适用场景** | AI 动画生成管线 | 混剪/Vlog/素材视频 |
| **我们的用途** | ✅ 核心分镜引擎 | ⚠️ 参考其 Style Skills 设计 |

### 可借鉴的设计

1. **Style Skills 系统**：预定义的导演风格模板（韩剧、科幻、纪录片等），可复用到我们的动漫风格预设
2. **自然语言导演界面**：用户用自然语言描述想要的效果，Agent 自动执行
3. **MCP 工具架构**：19 个 MCP 节点的拆分方式，可参考其工具编排模式

### 结论

**不直接使用，作为设计参考**。OpenStoryline 处理的是已有素材拼接，和我们 AI 生成新视频的方向不同。但其 Style Skills 设计和自然语言导演界面的交互模式值得借鉴。

---

## 10. clip-js vs Twick SDK — 前端编辑器最终对比

**结论：维持 Twick SDK 推荐**

### 详细对比

| 维度 | clip-js (707 stars) | Twick SDK (416 stars) | 胜者 |
|------|--------------------|-----------------------|------|
| **架构** | 单体应用（Next.js 全包） | Monorepo 14 独立包 | **Twick** |
| **渲染引擎** | Remotion + FFmpeg WASM | Remotion + WebCodecs + 服务端 FFmpeg | **Twick** |
| **可拆分性** | 低（组件紧耦合） | 高（任意子包独立使用） | **Twick** |
| **AI 集成** | 无内置 | 内置字幕/转录/AI 媒体生成 | **Twick** |
| **分镜定制** | 需大量改造 | 可用 @twick/timeline 灵活构建 | **Twick** |
| **服务端渲染** | 仅浏览器 FFmpeg WASM | 浏览器 + Node FFmpeg + AWS Lambda | **Twick** |
| **上手难度** | ⭐ 更简单 | ⭐⭐ 稍复杂 | clip-js |
| **许可** | MIT | SUL v1.0（允许商业 SaaS） | 平 |
| **社区** | 基础 | Discord + 文档完善 | **Twick** |

### clip-js 适合的场景

- 需要快速原型验证的场景
- 简单的视频剪辑工具（类 CapCut 网页版）
- 不需要深度定制编辑器 UI 的场景

### Twick 适合我们的原因

1. **分镜面板定制**：可用 @twick/timeline 和 @twick/canvas 单独构建分镜网格视图，不被完整编辑器 UI 束缚
2. **渲染灵活性**：MVP 用浏览器渲染，规模化后切服务端，无需迁移代码
3. **AI 原生**：@twick/ai-models 包直接支持字幕、转录等 AI 功能
4. **与 video-starter-kit 兼容**：两者都基于 React + Remotion，集成无冲突

### 集成策略

```
MVP 阶段：fal-ai video-starter-kit 内置的 Remotion 时间线（够用）
Growth 阶段：引入 @twick/timeline + @twick/canvas 实现高级分镜编辑
Scale 阶段：完整 Twick Studio 替换自建编辑器
```

### 结论

**Twick 在各关键维度胜出**。clip-js 更简单但过于单体化，不适合需要深度定制分镜编辑体验的 SaaS。实际 MVP 阶段可以先用 video-starter-kit 自带的基础时间线，后期再引入 Twick 进阶。

---

## 11. 最终技术选型总结（更新版）

### 核心架构变更

基于全部深度分析，架构从"从零搭建"调整为**"基座 + 定制"模式**：

```
┌─────────────────────────────────────────────────────┐
│   fal-ai video-starter-kit（SaaS 基座，MIT）          │
│   Next.js 15 + Remotion + AI SDK + IndexedDB         │
│                                                       │
│   ┌───────────────── 我们定制 ──────────────────┐    │
│   │                                               │    │
│   │  ✦ 分镜网格视图（替换单轨时间线）              │    │
│   │  ✦ video-shot-agent 集成（剧本→分镜→提示词）  │    │
│   │  ✦ Vidu API 集成（动漫优先）                   │    │
│   │  ✦ 角色一致性引擎（参考图注入）               │    │
│   │  ✦ Credits 计费 + Auth                         │    │
│   │  ✦ 云端存储（S3/R2）                           │    │
│   │                                               │    │
│   └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          v             v             v
  ┌──────────────┐ ┌──────────┐ ┌──────────────┐
  │ video-shot-  │ │ Vidu API │ │ Kling via    │
  │ agent        │ │ (动漫)   │ │ PiAPI (通用) │
  │ (Python 微服务)│ │          │ │              │
  └──────────────┘ └──────────┘ └──────────────┘
```

### 技术栈全景

| 层 | 技术 | 来源 | 许可 |
|----|------|------|------|
| SaaS 基座 | fal-ai video-starter-kit | 开源 | MIT |
| 前端框架 | Next.js 15 + React | 基座内置 | MIT |
| 视频时间线 | Remotion（基座）→ Twick（后期） | 基座/引入 | MIT/SUL |
| AI 视频生成 | Kling 1.5（基座）+ Vidu API（新增） | API | 按量付费 |
| 分镜引擎 | video-shot-agent | 集成 | MIT |
| 后端合成 | Editly（高负载导出） | 引入 | MIT |
| 设计参考 | OpenStoryline Style Skills | 借鉴 | Apache 2.0 |

### 开发路线（修订版）

**Phase 1（Week 1-2）：基座启动 + 核心验证**
- Fork video-starter-kit，本地运行
- 接入 Vidu API（动漫生成）
- 验证 video-shot-agent 分镜输出质量
- 测试参考图角色一致性

**Phase 2（Week 3-4）：分镜编辑器**
- 改造时间线为分镜网格视图
- 剧本输入 → 自动分镜 → 预览
- 单个分镜重新生成/编辑

**Phase 3（Week 5-6）：产品化**
- Auth（NextAuth/Clerk）+ Credits 计费
- 云端存储（S3/R2 替换 IndexedDB）
- Landing Page + Stripe 支付

**Phase 4（Week 7-8）：Beta + 增长**
- Beta 内测（X/Twitter 社区招募）
- 用户反馈迭代
- 后期引入 Twick SDK 提升编辑体验
