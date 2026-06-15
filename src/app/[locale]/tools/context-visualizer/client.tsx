"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Code, MessageSquare, FileText, Info, ChevronDown, ChevronUp } from "lucide-react";

const T = {
  ja: {
    back: "ツール一覧に戻る", title: "コンテキストウィンドウ可視化",
    subtitle: "AIモデルの「記憶容量」を視覚的に理解する",
    whatIs: "コンテキストウィンドウとは？",
    whatIsDesc: "AIモデルが一度に処理できるテキストの最大量です。越大きなコンテキストほど、長いドキュメントや大規模なコードベースを一度に分析できます。",
    selectModel: "モデルを選択", modelCompare: "モデル比較",
    whatFits: "このコンテキストに何が入る？",
    reference: "参考：よくあるテキスト量",
    chat100: "チャット100往復", chat100desc: "約5万トークン",
    novel: "小説1冊", novelDesc: "約8-10万トークン",
    docs: "技術ドキュメント", docsDesc: "約10-15万トークン",
    code50k: "コードベース（5万行）", code50kdesc: "約15-20万トークン",
    code100k: "コードベース（10万行）", code100kdesc: "約30-40万トークン",
    book: "本1冊（200ページ）", bookDesc: "約50万トークン",
    dailyReport: "日報1年分", dailyReportDesc: "約60万トークン",
    annualReport: "年次報告書5冊", annualReportDesc: "約100万トークン",
    tokenUnit: "トークン", fits: "回分入ります",
    selectPrompt: "モデルを選択して、何が入るか見てみましょう",
    whyMatters: "なぜコンテキストウィンドウが重要なのか",
    whyMattersDesc1: "コンテキストウィンドウが大きいと、一度に多くの情報を処理できます。例えば、 Entireなコードベースを一度に読み込んでバグを探すことが可能です。",
    whyMattersDesc2: "ただし、越大きい越好きいわけではありません。モデルがコンテキストを「正しく理解できるか」も重要です。",
    tip: "プロ tip：長文処理が必要な場合は、コンテキストウィンドウが大きいモデルを選びましょう。短いタスクなら、小さめのモデルで十分です。",
  },
  en: {
    back: "Back to Tools", title: "Context Window Visualizer",
    subtitle: "Visually understand the 'memory capacity' of AI models",
    whatIs: "What is a Context Window?",
    whatIsDesc: "The maximum amount of text an AI model can process at once. Larger context windows allow analyzing longer documents or massive codebases in a single pass.",
    selectModel: "Select a Model", modelCompare: "Model Comparison",
    whatFits: "What fits in this context?",
    reference: "Reference: Common Text Sizes",
    chat100: "100 Chat Exchanges", chat100desc: "≈50K tokens",
    novel: "1 Novel", novelDesc: "≈80-100K tokens",
    docs: "Technical Documentation", docsDesc: "≈100-150K tokens",
    code50k: "Codebase (50K lines)", code50kdesc: "≈150-200K tokens",
    code100k: "Codebase (100K lines)", code100kdesc: "≈300-400K tokens",
    book: "1 Book (200 pages)", bookDesc: "≈500K tokens",
    dailyReport: "1 Year of Daily Reports", dailyReportDesc: "≈600K tokens",
    annualReport: "5 Annual Reports", annualReportDesc: "≈1M tokens",
    tokenUnit: "tokens", fits: "fit",
    selectPrompt: "Select a model to see what fits",
    whyMatters: "Why Context Window Matters",
    whyMattersDesc1: "A larger context window lets you process more information at once. For example, you can read an entire codebase and find bugs in one pass.",
    whyMattersDesc2: "Bigger isn't always better though. How well the model 'understands' the context also matters.",
    tip: "Pro tip: For long-context tasks, choose models with large windows. For short tasks, smaller models are often sufficient and cheaper.",
  },
};

const models = [
  { name: "Gemini 3.0 Pro", tokens: 2000000, color: "bg-blue-500", tier: "Premium" },
  { name: "Claude Opus 4.8", tokens: 1000000, color: "bg-purple-600", tier: "Premium" },
  { name: "Gemini 3.5 Flash", tokens: 1000000, color: "bg-blue-400", tier: "Standard" },
  { name: "Grok 4.3", tokens: 1000000, color: "bg-teal-500", tier: "Standard" },
  { name: "MiniMax M3", tokens: 1000000, color: "bg-orange-500", tier: "Standard" },
  { name: "Claude Opus 4.7", tokens: 1000000, color: "bg-purple-500", tier: "Standard" },
  { name: "GPT-5.2", tokens: 400000, color: "bg-green-500", tier: "Standard" },
  { name: "Claude Sonnet 4.6", tokens: 200000, color: "bg-purple-400", tier: "Standard" },
  { name: "GPT-5.5", tokens: 256000, color: "bg-green-400", tier: "Standard" },
  { name: "GPT-4.1", tokens: 128000, color: "bg-green-300", tier: "Budget" },
  { name: "DeepSeek V3.2", tokens: 128000, color: "bg-red-500", tier: "Budget" },
  { name: "Gemma 4 31B", tokens: 128000, color: "bg-yellow-500", tier: "Budget" },
  { name: "Qwen3.6-27B", tokens: 128000, color: "bg-yellow-400", tier: "Budget" },
];

const references = [
  { icon: MessageSquare, nameKey: "chat100", descKey: "chat100desc", tokens: 50000 },
  { icon: BookOpen, nameKey: "novel", descKey: "novelDesc", tokens: 90000 },
  { icon: FileText, nameKey: "docs", descKey: "docsDesc", tokens: 125000 },
  { icon: Code, nameKey: "code50k", descKey: "code50kdesc", tokens: 175000 },
  { icon: Code, nameKey: "code100k", descKey: "code100kdesc", tokens: 350000 },
  { icon: BookOpen, nameKey: "book", descKey: "bookDesc", tokens: 500000 },
  { icon: FileText, nameKey: "dailyReport", descKey: "dailyReportDesc", tokens: 600000 },
  { icon: FileText, nameKey: "annualReport", descKey: "annualReportDesc", tokens: 1000000 },
];

function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

export default function ContextVisualizerPage() {
  const params = useParams();
  const locale = (params.locale as string) === "en" ? "en" : "ja";
  const t = T[locale];
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/${locale === "ja" ? "" : locale + "/"}tools`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-500 mb-6">{t.subtitle}</p>

        {/* What is Context Window? */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <button onClick={() => setShowInfo(!showInfo)} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-gray-900">{t.whatIs}</h2>
            </div>
            {showInfo ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {showInfo && (
            <div className="mt-4 text-sm text-gray-600 space-y-2">
              <p>{t.whatIsDesc}</p>
              <p>{t.whyMattersDesc1}</p>
              <p>{t.whyMattersDesc2}</p>
              <p className="text-primary-600 font-medium">{t.tip}</p>
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-4">{t.selectModel}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {models.map((m) => (
              <button
                key={m.name}
                onClick={() => setSelectedModel(m)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedModel.name === m.name
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-100 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${m.color}`} />
                  <span className="text-sm font-medium text-gray-900">{m.name}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{formatTokens(m.tokens)} {t.tokenUnit}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-2">{t.modelCompare}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {locale === "ja" ? "各モデルのコンテキストウィンドウを視覚的に比較" : "Visual comparison of context windows across models"}
          </p>
          <div className="space-y-3">
            {models.map((m) => {
              const pct = Math.min((m.tokens / 2000000) * 100, 100);
              const isSelected = selectedModel.name === m.name;
              return (
                <button
                  key={m.name}
                  onClick={() => setSelectedModel(m)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{m.name}</span>
                    <span className="text-sm font-bold text-primary-600">{formatTokens(m.tokens)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`${m.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* What Fits */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-2">{t.whatFits}: {selectedModel.name}</h2>
          <p className="text-sm text-gray-500 mb-6">{formatTokens(selectedModel.tokens)} {t.tokenUnit}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {references.map((ref) => {
              const Icon = ref.icon;
              const fits = Math.floor(selectedModel.tokens / ref.tokens);
              const barPct = Math.min((ref.tokens / selectedModel.tokens) * 100, 100);
              return (
                <div key={ref.nameKey} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg"><Icon className="w-5 h-5 text-gray-600" /></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{t[ref.nameKey as keyof typeof t]}</div>
                      <div className="text-xs text-gray-500 mb-2">{t[ref.descKey as keyof typeof t]}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${barPct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-primary-600 whitespace-nowrap">
                          ×{fits} {t.fits}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">{locale === "ja" ? "クイック比較" : "Quick Comparison"}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500">{locale === "ja" ? "テキスト" : "Text"}</th>
                  <th className="text-right py-2 text-gray-500">{locale === "ja" ? "トークン" : "Tokens"}</th>
                  <th className="text-right py-2 text-gray-500">{locale === "ja" ? "128K" : "128K"}</th>
                  <th className="text-right py-2 text-gray-500">{locale === "ja" ? "256K" : "256K"}</th>
                  <th className="text-right py-2 text-gray-500">{locale === "ja" ? "1M" : "1M"}</th>
                </tr>
              </thead>
              <tbody>
                {references.map((ref) => (
                  <tr key={ref.nameKey} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{t[ref.nameKey as keyof typeof t]}</td>
                    <td className="py-2 text-right text-gray-600">{formatTokens(ref.tokens)}</td>
                    <td className="py-2 text-right">{Math.floor(128000 / ref.tokens) > 0 ? `×${Math.floor(128000 / ref.tokens)}` : "—"}</td>
                    <td className="py-2 text-right">{Math.floor(256000 / ref.tokens) > 0 ? `×${Math.floor(256000 / ref.tokens)}` : "—"}</td>
                    <td className="py-2 text-right">{Math.floor(1000000 / ref.tokens) > 0 ? `×${Math.floor(1000000 / ref.tokens)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
