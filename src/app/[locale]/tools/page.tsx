"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Calculator, FileText, ArrowLeft, ArrowLeftRight, Sparkles, LayoutGrid, BarChart3 } from "lucide-react";

const T = {
  ja: {
    back: "ホームに戻る", title: "AIモデル無料ツール", desc: "AIモデル選定をサポートする無料ツール集",
  },
  en: {
    back: "Back to Home", title: "Free AI Model Tools", desc: "Free tools to help you choose the right AI model and estimate costs",
  },
};

const tools = [
  {
    title: { ja: "Token Counter", en: "Token Counter" },
    desc: { ja: "テキストのトークン数を計算。プロンプトコストを事前に見積もり。", en: "Count tokens in your text. Estimate prompt costs before you run." },
    icon: FileText,
    href: "/tools/token-counter",
  },
  {
    title: { ja: "コスト計算機", en: "Cost Calculator" },
    desc: { ja: "API使用量から月額コストを自動計算。", en: "Calculate monthly API costs based on your usage." },
    icon: Calculator,
    href: "/tools/cost-calculator",
  },
  {
    title: { ja: "モデル比較", en: "Model Compare" },
    desc: { ja: "2つのモデルを並列比較。ベンチマーク・料金・性能を一目で確認。", en: "Compare two models side by side. Benchmarks, pricing, and performance." },
    icon: ArrowLeftRight,
    href: "/compare",
  },
  {
    title: { ja: "AIモデル推薦", en: "AI Model Recommender" },
    desc: { ja: "4つの質問に答えて、あなたに最適なAIモデルを見つけましょう。", en: "Answer 4 questions to find the perfect AI model for your needs." },
    icon: Sparkles,
    href: "/tools/model-recommender",
  },
  {
    title: { ja: "コンテキスト比較", en: "Context Visualizer" },
    desc: { ja: "各モデルのコンテキストサイズを視覚的に比較。", en: "Visually compare context window sizes across models." },
    icon: LayoutGrid,
    href: "/tools/context-visualizer",
  },
  {
    title: { ja: "使用パターン分析", en: "Usage Analyzer" },
    desc: { ja: "API使用ログを分析して、コスト最適化の提案を受けましょう。", en: "Analyze your API usage logs to get cost optimization recommendations." },
    icon: BarChart3,
    href: "/tools/usage-analyzer",
  },
];

export default function ToolsPage() {
  const params = useParams();
  const locale = (params.locale as string) === "en" ? "en" : "ja";
  const t = T[locale];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/${locale === "ja" ? "" : locale}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-500 mb-8">{t.desc}</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{tool.title[locale as keyof typeof tool.title]}</h3>
                    <p className="text-sm text-gray-500 mt-1">{tool.desc[locale as keyof typeof tool.desc]}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
