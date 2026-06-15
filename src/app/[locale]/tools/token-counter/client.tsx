'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { modelDetails, type ModelDetail } from '@/data/models';
import { promptTemplates, type PromptTemplate } from './templates';
import {
  Calculator, Zap, DollarSign, BarChart3, ChevronDown,
  Copy, Check, Sparkles, ArrowRight, Shield, Code, X, Search,
} from 'lucide-react';
import Link from 'next/link';

const T = {
  ja: {
    title: "トークンカウンター＆プロンプトコスト計算機",
    subtitle: "プロンプトを貼り付けるだけで、トークン数・APIコスト・モデル比較を瞬時に確認。100%ブラウザ内で処理され、プロンプトは外部送信されません。",
    placeholder: "プロンプトテキストをここに貼り付けてください...",
    selectModel: "モデルを選択",
    outputRatio: "出力倍率",
    requestsDay: "1日あたりリクエスト数",
    inputTokens: "入力トークン",
    outputTokens: "出力トークン",
    totalTokens: "合計トークン",
    costPerRequest: "1リクエストあたり",
    dailyCost: "1日あたり",
    monthlyCost: "月額（30日）",
    contextUsage: "コンテキスト使用率",
    noPricing: "価格データなし",
    compareTitle: "モデル比較",
    compareSub: "同じプロンプトで全モデルのコストを比較",
    model: "モデル",
    provider: "プロバイダー",
    inputPrice: "入力価格",
    outputPrice: "出力価格",
    estCost: "推定コスト",
    contextUse: "コンテキスト",
    viewDetail: "詳細",
    bestCheapest: "最安",
    bestBalanced: "バランス型",
    bestContext: "最大コンテキスト",
    bestPremium: "プレミアム",
    privacy: "プライバシー: プロンプトはブラウザ内で処理され、サーバーに送信されません。",
    builderTitle: "プロンプトビルダー",
    builderSub: "項目を入力すると構造化プロンプトを自動生成",
    role: "役割",
    task: "タスク",
    context: "コンテキスト",
    requirements: "要件",
    outputFormat: "出力形式",
    examples: "例",
    generate: "プロンプトを生成",
    templates: "テンプレート",
    variables: "変数",
    exportCode: "コードをエクスポート",
    copy: "コピー",
    copied: "コピー済み",
    noData: "—",
    searchPlaceholder: "モデル名で検索...",
    howTokensWork: "AIトークンの仕組み",
    howCostCalc: "プロンプトコストの計算方法",
    whyDiffer: "モデルごとにトークン数が異なる理由",
    howToReduce: "プロンプトコストを削減する方法",
    howToChoose: "最適なモデルの選び方",
    faq: "よくある質問",
    privacyBadge: "100%プライベート",
  },
  en: {
    title: "AI Token Counter & Prompt Cost Calculator",
    subtitle: "Paste your prompt to instantly see token count, API cost, and model comparison. 100% browser-based — your prompt never leaves your device.",
    placeholder: "Paste your prompt text here...",
    selectModel: "Select Model",
    outputRatio: "Output Ratio",
    requestsDay: "Requests per Day",
    inputTokens: "Input Tokens",
    outputTokens: "Output Tokens",
    totalTokens: "Total Tokens",
    costPerRequest: "Cost per Request",
    dailyCost: "Daily Cost",
    monthlyCost: "Monthly (30 days)",
    contextUsage: "Context Window Usage",
    noPricing: "No pricing data",
    compareTitle: "Model Comparison",
    compareSub: "Compare costs across all models with the same prompt",
    model: "Model",
    provider: "Provider",
    inputPrice: "Input Price",
    outputPrice: "Output Price",
    estCost: "Est. Cost",
    contextUse: "Context",
    viewDetail: "View",
    bestCheapest: "Cheapest",
    bestBalanced: "Best Value",
    bestContext: "Largest Context",
    bestPremium: "Premium",
    privacy: "Privacy: Your prompt is processed locally in your browser and is not sent to our servers.",
    builderTitle: "Prompt Builder",
    builderSub: "Fill in the fields to auto-generate a structured prompt",
    role: "Role",
    task: "Task",
    context: "Context",
    requirements: "Requirements",
    outputFormat: "Output Format",
    examples: "Examples",
    generate: "Generate Prompt",
    templates: "Templates",
    variables: "Variables",
    exportCode: "Export Code",
    copy: "Copy",
    copied: "Copied",
    noData: "—",
    searchPlaceholder: "Search model name...",
    howTokensWork: "How AI Token Counting Works",
    howCostCalc: "How Prompt Cost is Calculated",
    whyDiffer: "Why Token Counts Differ Between Models",
    howToReduce: "How to Reduce Prompt Cost",
    howToChoose: "How to Choose the Best Model for Your Prompt",
    faq: "Frequently Asked Questions",
    privacyBadge: "100% Private",
  },
};

function estimateTokens(str: string): number {
  const japaneseChars = (str.match(/[　-〿぀-ゟ゠-ヿ＀-ﾟ一-龯㐀-䶿]/g) || []).length;
  const otherChars = str.length - japaneseChars;
  return Math.ceil(japaneseChars * 0.5 + otherChars / 4);
}

function parseContextWindow(s: string): number {
  const m = s.match(/([\d.]+)\s*([KkMm])/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  if (u === 'K') return n * 1000;
  if (u === 'M') return n * 1_000_000;
  return n;
}

function getModelsForComparison(): ModelDetail[] {
  return modelDetails.filter(
    (m) => m.pricing?.inputPer1M != null && m.pricing?.outputPer1M != null && m.pricing.billingMode === 'standard'
  );
}

export default function TokenCounterPage() {
  const locale = useLocale();
  const t = T[locale as keyof typeof T] || T.ja;
  const isEn = locale === 'en';

  // Core state
  const [text, setText] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('');
  const [outputRatio, setOutputRatio] = useState(3);
  const [requestsPerDay, setRequestsPerDay] = useState(100);

  // Builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderRole, setBuilderRole] = useState('');
  const [builderTask, setBuilderTask] = useState('');
  const [builderContext, setBuilderContext] = useState('');
  const [builderRequirements, setBuilderRequirements] = useState('');
  const [builderOutputFormat, setBuilderOutputFormat] = useState('');
  const [builderExamples, setBuilderExamples] = useState('');

  // Variables state
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  // Export tab
  const [exportTab, setExportTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  // Model search
  const [modelSearch, setModelSearch] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allModels = useMemo(() => getModelsForComparison(), []);

  const selectedModel = useMemo(() => {
    return modelDetails.find(m => m.slug === selectedSlug);
  }, [selectedSlug]);

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return allModels.slice(0, 30);
    const q = modelSearch.toLowerCase();
    return allModels.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.developer.toLowerCase().includes(q) ||
      m.developerEn.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [modelSearch, allModels]);

  // Token calculation
  const inputTokens = useMemo(() => estimateTokens(text), [text]);
  const outputTokens = Math.ceil(inputTokens * outputRatio);
  const totalTokens = inputTokens + outputTokens;

  // Cost calculation for selected model
  const selectedCost = useMemo(() => {
    if (!selectedModel?.pricing) return null;
    const input = (inputTokens / 1_000_000) * selectedModel.pricing.inputPer1M!;
    const output = (outputTokens / 1_000_000) * selectedModel.pricing.outputPer1M!;
    return { input, output, perRequest: input + output, daily: (input + output) * requestsPerDay, monthly: (input + output) * requestsPerDay * 30 };
  }, [selectedModel, inputTokens, outputTokens, requestsPerDay]);

  // Context usage
  const contextWindowNum = useMemo(() => {
    if (!selectedModel) return 0;
    return parseContextWindow(selectedModel.contextWindow);
  }, [selectedModel]);

  const contextPercent = contextWindowNum > 0 ? (totalTokens / contextWindowNum) * 100 : 0;

  // All models comparison
  const comparisonRows = useMemo(() => {
    if (inputTokens === 0) return [];
    return allModels.map(m => {
      const input = (inputTokens / 1_000_000) * m.pricing!.inputPer1M!;
      const output = (outputTokens / 1_000_000) * m.pricing!.outputPer1M!;
      const total = input + output;
      const ctx = parseContextWindow(m.contextWindow);
      const ctxPct = ctx > 0 ? (totalTokens / ctx) * 100 : 0;
      return { model: m, inputCost: input, outputCost: output, totalCost: total, contextPct: ctxPct };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [inputTokens, outputTokens, totalTokens, allModels]);

  const bestCost = comparisonRows.length > 0 ? comparisonRows[0].totalCost : 0;

  // Best value recommendations
  const recommendations = useMemo(() => {
    if (comparisonRows.length === 0) return null;
    const cheapest = comparisonRows[0];
    const sorted = [...comparisonRows].sort((a, b) => {
      const scoreA = a.totalCost * (1 + Math.max(0, a.contextPct - 80) * 0.1);
      const scoreB = b.totalCost * (1 + Math.max(0, b.contextPct - 80) * 0.1);
      return scoreA - scoreB;
    });
    const balanced = sorted[0];
    const largestCtx = [...comparisonRows].sort((a, b) => {
      if (a.contextPct === 0 && b.contextPct === 0) return 0;
      if (a.contextPct === 0) return 1;
      if (b.contextPct === 0) return -1;
      return a.contextPct - b.contextPct;
    })[0];
    const premium = [...comparisonRows].sort((a, b) => b.totalCost - a.totalCost)[0];
    return { cheapest, balanced, largestCtx, premium };
  }, [comparisonRows]);

  // Variable detection
  const detectedVars = useMemo(() => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  }, [text]);

  // Processed text with variables replaced
  const processedText = useMemo(() => {
    let result = text;
    for (const [key, val] of Object.entries(varValues)) {
      result = result.replaceAll(`{{${key}}}`, val || `{{${key}}}`);
    }
    return result;
  }, [text, varValues]);

  const processedInputTokens = useMemo(() => estimateTokens(processedText), [processedText]);

  // Build prompt from builder
  function buildPrompt(): string {
    const parts: string[] = [];
    if (builderRole) parts.push(builderRole);
    if (builderTask) parts.push(`Task:\n${builderTask}`);
    if (builderContext) parts.push(`Context:\n${builderContext}`);
    if (builderRequirements) parts.push(`Requirements:\n${builderRequirements}`);
    if (builderOutputFormat) parts.push(`Output format:\n${builderOutputFormat}`);
    if (builderExamples) parts.push(`Examples:\n${builderExamples}`);
    return parts.join('\n\n');
  }

  function applyTemplate(tmpl: PromptTemplate) {
    setBuilderRole(tmpl.role);
    setBuilderTask(tmpl.task);
    setBuilderContext(tmpl.context);
    setBuilderRequirements(tmpl.requirements);
    setBuilderOutputFormat(tmpl.outputFormat);
    setBuilderExamples(tmpl.examples);
    setBuilderOpen(true);
  }

  function generateToTextarea() {
    const prompt = buildPrompt();
    if (prompt) setText(prompt);
  }

  // Export code
  function getExportCode(): string {
    const modelId = selectedModel ? selectedModel.name.toLowerCase().replace(/\s+/g, '-') : 'gpt-4';
    const escaped = processedText.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const pyEscaped = processedText.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

    if (exportTab === 'curl') {
      return `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
    "model": "${modelId}",
    "messages": [{"role": "user", "content": "${escaped}"}],
    "max_tokens": ${outputTokens}
  }'`;
    }
    if (exportTab === 'python') {
      return `import openai

client = openai.OpenAI()
response = client.chat.completions.create(
    model="${modelId}",
    messages=[{"role": "user", "content": "${pyEscaped}"}],
    max_tokens=${outputTokens},
)
print(response.choices[0].message.content)`;
    }
    return `import OpenAI from "openai";

const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: "${modelId}",
  messages: [{ role: "user", content: "${escaped}" }],
  max_tokens: ${outputTokens},
});
console.log(response.choices[0].message.content);`;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const localePrefix = isEn ? '/en' : '';

  // JSON-LD
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Token Counter & Prompt Cost Calculator",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: isEn
      ? "Count AI prompt tokens, estimate API costs, and compare pricing across GPT, Claude, Gemini, DeepSeek, Qwen."
      : "AIプロンプトのトークン数をカウントし、APIコストを推定、GPT・Claude・Gemini・DeepSeek・Qwenの料金を比較。",
  };

  const faqItems = isEn ? [
    { q: "What is an AI token?", a: "An AI token is a unit of text that language models process. In English, one token is roughly 4 characters or 0.75 words. In Japanese, one character is approximately 0.5-1 tokens depending on the tokenizer." },
    { q: "How accurate is this token counter?", a: "Our token counter uses a heuristic estimation. For OpenAI models, actual counts may vary slightly. We recommend using this tool for planning and cost estimation rather than exact billing predictions." },
    { q: "Does my prompt leave my browser?", a: "No. All token counting and cost calculation happens entirely in your browser. Your prompt text is never sent to our servers or any third party." },
    { q: "Why do token counts differ between models?", a: "Different AI providers use different tokenization algorithms. GPT uses tiktoken, Claude uses its own tokenizer, and Gemini uses SentencePiece. The same text can produce different token counts across these systems." },
    { q: "How do I estimate output token cost?", a: "Output tokens are typically 3-5x more expensive than input tokens. Use the output ratio slider to adjust the expected output length. For chat applications, a 3x multiplier is a reasonable starting point." },
  ] : [
    { q: "AIトークンとは何ですか？", a: "AIトークンは、言語モデルが処理するテキストの単位です。英語では約4文字または0.75語が1トークンに相当します。日本語ではトークナイザーによりますが、1文字が約0.5〜1トークンです。" },
    { q: "このトークンカウンターの精度は？", a: "ヒューリスティックな推定を使用しています。OpenAIモデルの場合、実際のカウントと多少の差異がある場合があります。正確な請求予測ではなく、計画やコスト見積もりにご活用ください。" },
    { q: "プロンプトはブラウザ外に送信されますか？", a: "いいえ。トークンカウントとコスト計算はすべてブラウザ内で完結します。プロンプトテキストが当社サーバーやサードパーティに送信されることはありません。" },
    { q: "モデルごとにトークン数が異なるのはなぜ？", a: "各AIプロバイダーが異なるトークナイゼーションアルゴリズムを使用しているためです。GPTはtiktoken、Claudeは独自トークナイザー、GeminiはSentencePieceを使用しており、同じテキストでもトークン数が異なります。" },
    { q: "出力トークンのコストはどう推定しますか？", a: "出力トークンは入力トークンより3〜5倍高価です。出力倍率スライダーで出力長を調整してください。チャットアプリでは3倍が妥当な目安です。" },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(item => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <Shield className="w-3 h-3" /> {t.privacyBadge}
          </span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-600 max-w-2xl">{t.subtitle}</p>
      </div>

      {/* Main input area */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Left: textarea + builder */}
        <div className="lg:col-span-2 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
            rows={10}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y font-mono"
          />

          {/* Variables */}
          {detectedVars.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-800 mb-2">{t.variables} ({detectedVars.length})</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {detectedVars.map(v => (
                  <div key={v} className="flex items-center gap-2">
                    <label className="text-xs text-amber-700 font-mono w-24 shrink-0">{`{{${v}}}`}</label>
                    <input
                      type="text"
                      value={varValues[v] || ''}
                      onChange={(e) => setVarValues({ ...varValues, [v]: e.target.value })}
                      className="flex-1 rounded border border-amber-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder={v}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Builder toggle */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setBuilderOpen(!builderOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">{t.builderTitle}</span>
                <span className="text-xs text-gray-500">{t.builderSub}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${builderOpen ? 'rotate-180' : ''}`} />
            </button>

            {builderOpen && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {/* Templates */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">{t.templates}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {promptTemplates.map(tmpl => (
                      <button
                        key={tmpl.id}
                        onClick={() => applyTemplate(tmpl)}
                        className="shrink-0 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                      >
                        <span className="text-base">{tmpl.icon}</span>
                        <span className="text-xs font-medium text-gray-800 ml-1.5">{isEn ? tmpl.nameEn : tmpl.nameJa}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Builder fields */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.role}</label>
                    <textarea value={builderRole} onChange={e => setBuilderRole(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.task}</label>
                    <textarea value={builderTask} onChange={e => setBuilderTask(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.context}</label>
                    <textarea value={builderContext} onChange={e => setBuilderContext(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.requirements}</label>
                    <textarea value={builderRequirements} onChange={e => setBuilderRequirements(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.outputFormat}</label>
                    <textarea value={builderOutputFormat} onChange={e => setBuilderOutputFormat(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.examples}</label>
                    <textarea value={builderExamples} onChange={e => setBuilderExamples(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                </div>

                <button
                  onClick={generateToTextarea}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> {t.generate}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: controls + results */}
        <div className="space-y-4">
          {/* Model selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.selectModel}</label>
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => { setModelDropdownOpen(!modelDropdownOpen); setModelSearch(''); }}
                className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white hover:border-gray-300 transition-colors"
              >
                <span className={selectedModel ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedModel ? `${selectedModel.name} (${selectedModel.developer})` : t.selectModel}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {modelDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded">
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={e => setModelSearch(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="flex-1 text-sm bg-transparent focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredModels.map(m => (
                      <button
                        key={m.slug}
                        onClick={() => { setSelectedSlug(m.slug); setModelDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 last:border-0 hover:bg-primary-50 ${m.slug === selectedSlug ? 'bg-primary-50' : ''}`}
                      >
                        <span className="font-medium text-gray-900">{m.name}</span>
                        <span className="text-gray-500 ml-1.5 text-xs">{isEn ? m.developerEn : m.developer}</span>
                        {m.pricing && (
                          <span className="text-gray-400 ml-1.5 text-xs">${m.pricing.inputPer1M}/1M</span>
                        )}
                      </button>
                    ))}
                    {filteredModels.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">{t.noData}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Output ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t.outputRatio}: <span className="text-primary-600 font-bold">{outputRatio}x</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={outputRatio}
              onChange={e => setOutputRatio(parseFloat(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1x</span><span>5x</span><span>10x</span>
            </div>
          </div>

          {/* Requests per day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.requestsDay}</label>
            <input
              type="number"
              min={1}
              value={requestsPerDay}
              onChange={e => setRequestsPerDay(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Result cards */}
      {text.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-primary-50 rounded-xl text-center">
            <p className="text-xs font-medium text-primary-600 mb-1">{t.inputTokens}</p>
            <p className="text-2xl font-bold text-primary-700">{inputTokens.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-xs font-medium text-blue-600 mb-1">{t.outputTokens}</p>
            <p className="text-2xl font-bold text-blue-700">{outputTokens.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">{t.totalTokens}</p>
            <p className="text-2xl font-bold text-gray-700">{totalTokens.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-xs font-medium text-green-600 mb-1">{t.costPerRequest}</p>
            <p className="text-2xl font-bold text-green-700">
              {selectedCost ? `$${selectedCost.perRequest.toFixed(6)}` : t.noData}
            </p>
          </div>
        </div>
      )}

      {/* Cost breakdown + context */}
      {selectedCost && text.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">{selectedModel!.name}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t.inputTokens}</span><span className="font-medium">${selectedCost.input.toFixed(6)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t.outputTokens}</span><span className="font-medium">${selectedCost.output.toFixed(6)}</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between"><span className="text-gray-500">{t.dailyCost}</span><span className="font-medium">${selectedCost.daily.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-700 font-medium">{t.monthlyCost}</span><span className="font-bold text-green-700">${selectedCost.monthly.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{t.contextUsage}</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{totalTokens.toLocaleString()} / {contextWindowNum.toLocaleString()}</span>
                <span className={`font-bold ${contextPercent > 80 ? 'text-red-600' : contextPercent > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {contextPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${contextPercent > 80 ? 'bg-red-500' : contextPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, contextPercent)}%` }}
                />
              </div>
            </div>
            {contextPercent > 80 && (
              <p className="text-xs text-red-600 mt-2">⚠️ {isEn ? 'Prompt is close to context limit. Large outputs may exceed the window.' : 'プロンプトがコンテキスト上限に近づいています。大きな出力はウィンドウを超える可能性があります。'}</p>
            )}
          </div>
        </div>
      )}

      {/* Best Value recommendations */}
      {recommendations && text.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            {isEn ? 'Best Models for This Prompt' : 'このプロンプトに最適なモデル'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { rec: recommendations.cheapest, label: t.bestCheapest, color: 'green', icon: '💰' },
              { rec: recommendations.balanced, label: t.bestBalanced, color: 'blue', icon: '⚖️' },
              { rec: recommendations.largestCtx, label: t.bestContext, color: 'purple', icon: '📐' },
              { rec: recommendations.premium, label: t.bestPremium, color: 'amber', icon: '👑' },
            ].map(({ rec, label, color, icon }) => (
              <Link
                key={label}
                href={`${localePrefix}/models/${rec.model.slug}`}
                className={`block p-4 bg-${color}-50 border border-${color}-200 rounded-xl hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span>{icon}</span>
                  <span className={`text-xs font-bold text-${color}-700`}>{label}</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{rec.model.name}</p>
                <p className="text-xs text-gray-500">{isEn ? rec.model.developerEn : rec.model.developer}</p>
                <p className={`text-sm font-bold text-${color}-700 mt-1`}>${rec.totalCost.toFixed(6)}/{isEn ? 'req' : 'リクエスト'}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Model comparison table */}
      {comparisonRows.length > 0 && text.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{t.compareTitle}</h2>
          <p className="text-sm text-gray-500 mb-4">{t.compareSub}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">{t.model}</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">{t.provider}</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">{t.inputPrice}</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">{t.outputPrice}</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">{t.estCost}</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">{t.contextUse}</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">{t.viewDetail}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.slice(0, 30).map((row) => {
                  const isBest = row.totalCost === bestCost;
                  return (
                    <tr key={row.model.slug} className={`border-b border-gray-100 ${isBest ? 'bg-green-50' : ''}`}>
                      <td className="py-2 px-3">
                        <span className={`font-medium ${isBest ? 'text-green-700' : 'text-gray-900'}`}>{row.model.name}</span>
                        {isBest && <span className="ml-1.5 text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-bold">{t.bestCheapest}</span>}
                      </td>
                      <td className="py-2 px-3 text-gray-500">{isEn ? row.model.developerEn : row.model.developer}</td>
                      <td className="py-2 px-3 text-right text-gray-600">${row.model.pricing!.inputPer1M}/1M</td>
                      <td className="py-2 px-3 text-right text-gray-600">${row.model.pricing!.outputPer1M}/1M</td>
                      <td className={`py-2 px-3 text-right font-medium ${isBest ? 'text-green-700 font-bold' : 'text-gray-900'}`}>${row.totalCost.toFixed(6)}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.contextPct > 80 ? 'text-red-600 font-medium' : row.contextPct > 50 ? 'text-yellow-600' : 'text-gray-600'}>
                          {row.contextPct > 0 ? `${row.contextPct.toFixed(1)}%` : t.noData}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Link href={`${localePrefix}/models/${row.model.slug}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                          {t.viewDetail} →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Code export */}
      {text.length > 0 && selectedModel && (
        <div className="mb-8 p-5 bg-gray-900 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">{t.exportCode}</span>
            </div>
            <div className="flex gap-1">
              {(['curl', 'python', 'node'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setExportTab(tab)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${exportTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <pre className="text-sm text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap break-all">
            {getExportCode()}
          </pre>
          <button
            onClick={() => copyToClipboard(getExportCode())}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-200 text-xs rounded-lg hover:bg-gray-600 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? t.copied : t.copy}
          </button>
        </div>
      )}

      {/* Privacy note */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-10">
        <Shield className="w-4 h-4 text-green-600 shrink-0" />
        <p className="text-xs text-green-700">{t.privacy}</p>
      </div>

      {/* Internal links */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link href={`${localePrefix}/tools/cost-calculator`} className="text-sm text-primary-600 hover:underline">
          → {isEn ? 'API Cost Calculator' : 'APIコスト計算'}
        </Link>
        <Link href={`${localePrefix}/pricing`} className="text-sm text-primary-600 hover:underline">
          → {isEn ? 'Pricing Comparison' : '料金比較'}
        </Link>
        <Link href={`${localePrefix}/compare`} className="text-sm text-primary-600 hover:underline">
          → {isEn ? 'Model Comparison' : 'モデル比較'}
        </Link>
        <Link href={`${localePrefix}/models`} className="text-sm text-primary-600 hover:underline">
          → {isEn ? 'All Models' : '全モデル'}
        </Link>
      </div>

      {/* SEO Content */}
      <div className="prose prose-sm max-w-none">
        <h2>{t.howTokensWork}</h2>
        <p>
          {isEn
            ? "AI tokens are the fundamental units that language models use to process text. When you send a prompt to an AI model like GPT, Claude, or Gemini, the text is first broken down into tokens — which can be words, parts of words, or individual characters. For example, the word 'tokenization' might be split into 'token' and 'ization'. In Japanese, each character (kanji, hiragana, katakana) typically consumes 0.5 to 1.5 tokens depending on the model's tokenizer."
            : "AIトークンは、言語モデルがテキストを処理するための基本単位です。GPT、Claude、GeminiなどのAIモデルにプロンプトを送信すると、テキストはまずトークンに分割されます。トークンは単語、単語の一部、または個々の文字になる可能性があります。日本語では、各文字（漢字、ひらがな、カタカナ）はトークナイザーによって0.5〜1.5トークンを消費します。"}
        </p>

        <h2>{t.howCostCalc}</h2>
        <p>
          {isEn
            ? "AI API pricing is typically measured per million tokens (per 1M tokens). The cost formula is straightforward: Input Cost = (input tokens / 1,000,000) × input price per 1M tokens, and similarly for output. Most providers charge more for output tokens than input tokens — typically 3 to 5 times more. This is because generating new text requires more computational resources than processing existing text."
            : "AI APIの料金は通常、100万トークンあたり（per 1M tokens）で測定されます。コスト計算式はシンプルです：入力コスト =（入力トークン数 / 1,000,000）× 100万トークンあたりの入力価格。出力も同様です。ほとんどのプロバイダーは入力トークンより出力トークンの方が高額で、通常3〜5倍です。これは新しいテキストの生成が既存テキストの処理よりも多くの計算リソースを必要とするためです。"}
        </p>

        <h2>{t.whyDiffer}</h2>
        <p>
          {isEn
            ? "The same text can produce different token counts across AI models because each provider uses a different tokenization algorithm. OpenAI uses tiktoken (based on BPE), Claude uses a proprietary tokenizer, and Gemini uses SentencePiece. For instance, the word 'hello' is 1 token in GPT but might be tokenized differently in other models. CJK characters (Chinese, Japanese, Korean) are particularly variable — some tokenizers treat each character as a single token, while others combine common character pairs."
            : "同じテキストでもAIモデルによってトークン数が異なる場合があります。各プロバイダーが異なるトークナイゼーションアルゴリズムを使用しているためです。OpenAIはtiktoken（BPEベース）、Claudeは独自トークナイザー、GeminiはSentencePieceを使用しています。CJK文字（中国語、日本語、韓国語）は特に変動が大きく、トークナイザーによって1文字を1トークンとして扱うものもあれば、よく使われる文字ペアを結合するものもあります。"}
        </p>

        <h2>{t.howToReduce}</h2>
        <p>
          {isEn
            ? "To reduce prompt costs, consider these strategies: remove redundant instructions, use concise language, abbreviate repeated context, leverage system prompts efficiently, and choose the right model for your task. For repetitive tasks, use few-shot examples instead of long descriptions. If your prompt includes large context, consider whether a model with a smaller context window (and lower price) would suffice. Always compare costs across models — sometimes a slightly more expensive model with better capabilities can complete the task in fewer tokens."
            : "プロンプトコストを削減するには、以下の戦略を検討してください：冗長な指示を削除し、簡潔な表現を使い、繰り返しのコンテキストを省略し、システムプロンプトを効率的に活用し、タスクに最適なモデルを選択します。反復タスクには長い説明の代わりにfew-shot例を使用してください。大きなコンテキストを含むプロンプトの場合、より小さなコンテキストウィンドウ（より低価格）のモデルで十分かどうかを検討してください。常にモデル間でコストを比較しましょう。"}
        </p>

        <h2>{t.howToChoose}</h2>
        <p>
          {isEn
            ? "Choosing the best AI model depends on your specific needs. For cost-sensitive applications with simple tasks, models like DeepSeek or Qwen offer excellent value. For complex reasoning and coding, Claude and GPT models typically perform best. Consider not just the per-token cost, but also the model's accuracy for your task — a cheaper model that requires multiple retries may end up costing more. Use the comparison table above to find the sweet spot between cost and capability for your use case."
            : "最適なAIモデルの選択は、具体的なニーズによって異なります。シンプルなタスクでコストが重要な場合は、DeepSeekやQwenなどのモデルが優れたコストパフォーマンスを提供します。複雑な推論やコーディングには、ClaudeやGPTモデルが最適です。トークン単価だけでなく、タスクに対するモデルの精度も考慮してください。安価でもリトライが必要なモデルは、結果的にコストが高くなる可能性があります。上の比較表をご利用ください。"}
        </p>

        <h2>{t.faq}</h2>
        {faqItems.map((item, i) => (
          <div key={i} className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">{item.q}</h3>
            <p className="text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
