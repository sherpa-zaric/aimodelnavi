# AI Models Navi 爬虫管道 - 项目状态与需求文档

> 生成时间: 2026-05-12 | 供模型切换后恢复上下文使用

---

## 一、项目概述

**项目名称**: AI Models Navi (aimodelsnavi.com)
**项目目标**: 日语AI模型对比网站，仿照 DataLearnerAI (datalearner.com)
**技术栈**: Next.js 16.2.6 + App Router + TypeScript + Tailwind CSS v4
**部署**: Vercel (通过 GitHub: focusontec/aimodelnavi, private)  
**本地路径**: `/Users/zhaozhenchao/codes/datalearner/web`

---

## 二、当前网站状态

### 已完成的页面
- 首页 `/` - 硬编码的统计数据与链接
- 模型列表 `/models` - 展示17个手动策划的模型
- 模型详情 `/models/[slug]` - 17个模型的完整详情页
- 定价对比 `/pricing` - API定价表格
- 排行榜 `/leaderboard` - 基准评测排行
- 博客列表 `/blog` + 详情 `/blog/[slug]` - 3篇日语博客
- 工具: 成本计算器、模型对比、分词计数器

### 已有的数据文件
| 文件 | 内容 | 状态 |
|------|------|------|
| `src/data/models.ts` | 17个手动策划模型(9全球+8日本国产) | ✅ 网站正在使用 |
| `src/data/leaderboard.ts` | 16个模型基准分数 | ✅ 网站正在使用 |
| `src/data/pricing.ts` | 4条DeepSeek定价数据 | ✅ 网站正在使用 |
| `src/data/model-list.ts` | 60个从DataLearnerAI同步的模型 | ❌ 未被任何页面使用 |
| `src/data/model-slugs.ts` | 240个模型slug列表 | ❌ 未被任何页面使用 |

### 已有的同步脚本
| 脚本 | 功能 | 状态 |
|------|------|------|
| `scripts/sync-datalearner.ts` | 从DataLearnerAI爬取模型(新版用JSON-LD) | ✅ 已测试，60个模型 |
| `scripts/sync-leaderboard.ts` | LMSYS+HuggingFace排行榜 | ✅ 工作中 |
| `scripts/sync-pricing.ts` | 5家定价页面爬取 | ⚠️ 只有DeepSeek成功 |
| `scripts/generate-blog.ts` | HackerNews+Reddit→日语博客 | ✅ 工作中 |

### GitHub Actions 工作流
- `.github/workflows/daily-update.yml` - 每日07:00 UTC运行排行榜+博客
- `.github/workflows/weekly-pricing.yml` - 每周一08:00 UTC运行定价同步
- sync-datalearner.ts **未加入**任何工作流

---

## 三、核心需求：爬虫管道

### 3.1 用户原始需求

> 我希望你能形成一个完善的爬虫程序：
> 1. 爬取内容（首次先批量爬取，后面稳定更新后每日爬取更新的内容）→ 原始内容存入数据库 类似scrapy爬虫
> 2. 爬取的内容经过AI改写 → 翻译日文 → 形成网站展示内容，后续我们可能要增加其他的语种
> 3. 日本的一些模型你也可以采取相同的策略，完善我们的内容框架

### 3.2 架构设计

```
DataLearnerAI  ──┐                    ┌──→ src/data/models.ts
HuggingFace API ──┤── Crawl ──→ SQLite ─┤──→ src/data/leaderboard.ts
手动策划 ──────────┘    ↓    ↓  ↓      └──→ src/data/pricing.ts
                   Process Translate
                   (AI改写  (ja/en/ko)
                    +丰富)
```

**5阶段管道**:
1. **Crawl** - 从数据源抓取，存入SQLite原始数据
2. **Store** - 按内容hash去重，追踪变化
3. **Process** - AI改写/丰富原始数据为结构化模型记录
4. **Translate** - 生成日语(及未来其他语言)内容
5. **Generate** - 输出与现有页面兼容的TypeScript文件

### 3.3 SQLite 数据库 Schema

数据库文件: `data/crawler.db` (提交到Git)

核心表:
- `data_sources` - 爬取源注册表 (datalearner, huggingface, manual等)
- `raw_crawl_log` - 每次HTTP请求的审计日志
- `raw_models` - 原始JSON数据 (按source_id+external_id去重)
- `models` - 统一模型注册表 (单一事实来源，含is_core/is_japanese标记)
- `model_translations` - 多语言翻译 (language='ja'/'en'/'ko'等)
- `leaderboard_scores` - 基准评测数据
- `pricing_entries` - API定价数据
- `model_source_map` - 模型与数据源的关联

### 3.4 数据源

**DataLearnerAI (datalearner.com)**:
- 列表页: JSON-LD `ItemList` 含模型slug
- 详情页: `SoftwareApplication` JSON-LD 含name, developer, description(中文), releaseDate, license, offers, sameAs
- 5页共240+个slug，已验证可抓取60个详情页
- 增量: 仅抓第1页 → 与数据库比对 → 只抓新模型

**HuggingFace API** (Phase 2):
- REST API: `GET https://huggingface.co/api/models?author={org}`
- 日本组织: pfnet, sakana-ai, elyza, rinna, llm-jp, cyberagent, stabilityai, stockmark
- 不需要爬取，有完整JSON API
- 增量: 检查lastModified字段

**公司官网** (Phase 2):
- preferred.jp, sakana.ai, elyza.ai, rinna.co.jp 等
- 无结构化数据API，需爬取HTML

### 3.5 脚本目录结构

```
scripts/
  lib/
    anthropic.ts          # 已有 - LLM API封装(Ollama/Anthropic/OpenAI)
    storage.ts            # 已有 - 文件I/O
    db.ts                 # 新建 - SQLite连接、schema迁移、CRUD
    http.ts               # 新建 - 限速fetch、重试、缓存
  sources/
    datalearner.ts        # 新建 - DataLearnerAI JSON-LD爬虫
    huggingface.ts        # Phase 2 - HuggingFace API爬虫
  pipeline/
    crawl-all.ts          # 新建 - 爬虫编排
    process-models.ts     # 新建 - AI改写/丰富
    translate-models.ts   # 新建 - 多语言翻译
    generate-data-files.ts # 新建 - 生成TypeScript
  migrate-seed.ts         # 新建 - 导入现有17个模型到SQLite
  sync-all.ts             # 新建 - 统一入口(CI用)
```

### 3.6 LLM配置

```bash
LLM_PROVIDER=ollama
LLM_API_KEY=<用户提供>
LLM_MODEL=gemma4:31b
# Ollama Cloud Base URL: https://ollama.com/v1/chat/completions
```

`scripts/lib/anthropic.ts` 已支持多provider，无需修改。

### 3.7 增量更新逻辑

- `sync-all.ts --full` 或数据库为空 → 全量爬取(5页列表+所有详情页)
- 默认(数据库有数据) → 增量爬取(第1页+新slug+变化的HF模型)
- 只处理新增/变化的模型
- 只在数据变化时重新生成TypeScript文件

### 3.8 生成阶段关键要求

`generate-data-files.ts` 生成的 `src/data/models.ts` 必须**完全兼容**现有 `ModelDetail` 接口:

```typescript
export interface ModelDetail {
  slug: string;
  name: string;
  developer: string;
  developerUrl: string;
  params: string;
  contextWindow: string;
  license: string;
  openSource: "open" | "closed" | "open-nc";
  type: "reasoning" | "foundation" | "chat" | "coder";
  releaseDate: string;
  pricing: {
    inputPer1M: number | null;
    outputPer1M: number | null;
    currency: "USD" | "JPY";
    billingMode: string;
    url: string | null;
  } | null;
  descriptionJa: string;
  strengths: string[];
  weaknesses: string[];
  useCases: string[];
  links: {
    official?: string;
    huggingface?: string;
    paper?: string;
    api?: string;
  };
}
```

---

## 四、分阶段实施计划

### Phase 1: DataLearnerAI + SQLite + AI处理 ✅ 已完成

| 步骤 | 任务 | 状态 |
|------|------|------|
| 1 | 安装 better-sqlite3 + @types/better-sqlite3 | ✅ 已完成 |
| 2 | 创建 data/, scripts/sources/, scripts/pipeline/ 目录 | ✅ 已完成 |
| 3 | 创建 scripts/lib/db.ts (SQLite连接、迁移、CRUD) | ✅ 已完成 |
| 4 | 创建 scripts/lib/http.ts (限速fetch、重试) | ✅ 已完成 |
| 5 | 创建 scripts/sources/datalearner.ts | ✅ 已完成 |
| 6 | 创建 scripts/pipeline/crawl-all.ts | ✅ 已完成 |
| 7 | 创建 scripts/pipeline/process-models.ts | ✅ 已完成 |
| 8 | 创建 scripts/pipeline/translate-models.ts | ✅ 已完成 |
| 9 | 创建 scripts/pipeline/generate-data-files.ts | ✅ 已完成 |
| 10 | 创建 scripts/migrate-seed.ts | ✅ 已完成 |
| 11 | 创建 scripts/sync-all.ts | ✅ 已完成 |
| 12 | 更新 src/app/models/[slug]/page.tsx 动态slug | ✅ 已完成 |
| 13 | 测试: npx tsx scripts/sync-all.ts --full | ✅ 已完成(229模型) |

### Phase 2: HuggingFace日本国产模型 ✅ 已完成

| 步骤 | 任务 | 状态 |
|------|------|------|
| 14 | 创建 scripts/sources/huggingface.ts | ✅ 已完成 |
| 15 | 更新 crawl-all.ts 加入HuggingFace | ✅ 已完成 |
| 16 | 添加日本开发者映射 | ✅ 已完成 |
| 17 | 更新 process-models.ts 合并HF+DL数据 | ✅ 已完成 |

### Phase 3: 排行榜+定价+GitHub Actions (进行中)

| 步骤 | 任务 | 状态 |
|------|------|------|
| 18 | 改造 sync-leaderboard.ts 使用SQLite | 🔄 进行中 |
| 19 | 改造 sync-pricing.ts 使用SQLite | 🔄 进行中 |
| 20 | 创建 daily-pipeline.yml 工作流 | ✅ 已完成 |

---

## 五、关键代码参考

### 5.1 DataLearnerAI JSON-LD 提取 (已验证可行)

```typescript
// 从列表页提取模型slug
const links = html.match(/href="\/ai-models\/pretrained-models\/([^"]+)"/g) || [];
const slugs = [...new Set(links.map(l => l.replace('href="/ai-models/pretrained-models/', '').replace('"', '')))];

// 从详情页提取SoftwareApplication JSON-LD
const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
const app = blocks.map(b => {
  const json = b.replace(/<script.*?>/, '').replace(/<\/script>/, '');
  try { return JSON.parse(json); } catch { return null; }
}).find(d => d?.["@type"] === "SoftwareApplication");

// app包含: name, author.name, description(中文), datePublished, offers.price, license, sameAs
```

### 5.2 类别推断逻辑

```typescript
function inferCategory(name: string, description: string): string {
  const lower = (name + " " + description).toLowerCase();
  if (lower.match(/codex|coder|code/i)) return "coder";
  if (lower.match(/reasoning|think|deep.?think|o[0-9]|mythos/i)) return "reasoning";
  if (lower.match(/embed|embed$/i)) return "embedding";
  if (lower.match(/image|vision|multimodal|vl-|ocr/i)) return "multimodal";
  if (lower.match(/voice|tts|asr|speech|audio/i)) return "voice";
  return "foundation";
}
```

### 5.3 许可证推断

```typescript
function inferLicenseStatus(license?: string): "open" | "closed" | "open-nc" {
  if (!license) return "closed";
  const lower = license.toLowerCase();
  if (lower.includes("不开源") || lower.includes("proprietary")) return "closed";
  if (lower.includes("mit") || lower.includes("apache")) return "open";
  if (lower.includes("llama") || lower.includes("gemma")) return "open-nc";
  return "closed";
}
```

### 5.4 限速请求

```typescript
// 800ms间隔，3次重试，指数退避
async function rateLimitedFetch(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "AIModelsNavi/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
// 每次请求后 await sleep(800)
```

---

## 六、用户偏好记录

- **数据库存储**: Git提交SQLite文件 (不需要外部服务)
- **实施策略**: 分步实现 (先DataLearnerAI，后HuggingFace，最后排行榜定价)
- **语言优先级**: 日语优先，未来支持英语/韩语等
- **内容质量**: 日语内容需要地道自然，面向日本开发者
- **手动策划内容**: 17个核心模型的精心编写内容必须保留(is_core=1)

---

## 七、已验证的关键发现

1. DataLearnerAI是Next.js SSR应用，HTML中包含完整的JSON-LD结构化数据
2. 列表页有51个唯一slug(第1页)，5页共240个slug
3. 详情页JSON-LD包含: name, developer, description(中文), releaseDate, license, offers(price/currency), sameAs(链接)
4. HuggingFace有REST API，不需要爬取HTML
5. Ollama Cloud API已连通: `https://ollama.com/v1/chat/completions` + gemma4:31b
6. 现有网站页面只使用models.ts(17个模型)，model-list.ts完全未使用

---

## 八、恢复工作指引

更换模型后，按以下步骤恢复:

1. 读取本文档了解上下文
2. 读取计划文件: `/Users/zhaozhenchao/.claude/plans/noble-questing-crane.md`
3. 从Phase 1步骤3开始: 创建 `scripts/lib/db.ts`
4. 按顺序完成Phase 1的所有步骤
5. 测试: `LLM_API_KEY=xxx npx tsx scripts/sync-all.ts --full`
6. 验证: `npm run build` 和 `npm run dev`