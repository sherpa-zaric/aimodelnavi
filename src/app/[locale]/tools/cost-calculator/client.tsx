'use client';

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calculator, ArrowLeft, Sparkles, TrendingDown, ArrowRight, Lightbulb, DollarSign } from "lucide-react";
import { pricingData } from "@/data/pricing";

const T = {
  ja: {
    back: "ツール一覧に戻る", title: "AIコスト最適化ツール", subtitle: "モデルと使用量を入力すると、月額コストを試算し、最適なモデルを推薦します",
    selectModel: "モデルを選択", placeholder: "モデルを選んでください",
    inputTokens: "1リクエストあたりの入力トークン数", outputTokens: "1リクエストあたりの出力トークン数",
    requestsDay: "1日あたりのリクエスト数", perRequest: "1リクエストあたり", perDay: "1日あたり", perMonth: "月額（30日）",
    noData: "このモデルの標準課金データが見つかりません。",
    note: "※ この計算は概算です。実際の料金は各プロバイダーの公式価格表に基づきます。",
    savingsTitle: "💰 節約可能なモデル", savingsDesc: "同等の品質で大幅に節約できるモデルがあります",
    saveUpTo: "最大節約額", switchTo: "切り替え先", qualityNote: "品質レベル", perMonthLabel: "/月",
    proBadge: "Pro", comingSoon: "近日公開", proDesc: "高度な最適化分析と使用パターン追跡",
    tipsTitle: "💡 コスト最適化のヒント", tip1: "バッチ処理を使用すると、APIコストを最大50%削減できます", tip2: "プロンプトキャッシュを活用すると、繰り返しリクエストのコストを削減できます", tip3: "タスクに最適なモデルを選択することで、品質を保ちながらコストを削減できます",
    viewAllModels: "すべてのモデルを見る", tryRecommender: "AIモデル推薦を試す",
  },
  en: {
    back: "Back to Tools", title: "AI Cost Optimizer", subtitle: "Enter a model and usage to estimate costs and get optimization recommendations",
    selectModel: "Select Model", placeholder: "Choose a model",
    inputTokens: "Input tokens per request", outputTokens: "Output tokens per request",
    requestsDay: "Requests per day", perRequest: "Per request", perDay: "Per day", perMonth: "Monthly (30 days)",
    noData: "Standard pricing data not found for this model.",
    note: "※ This calculation is an estimate. Actual pricing is based on each provider's official price list.",
    savingsTitle: "💰 Potential Savings", savingsDesc: "These models offer similar quality at lower cost",
    saveUpTo: "Save up to", switchTo: "Switch to", qualityNote: "Quality level", perMonthLabel: "/mo",
    proBadge: "Pro", comingSoon: "Coming Soon", proDesc: "Advanced optimization analytics and usage pattern tracking",
    tipsTitle: "💡 Cost Optimization Tips", tip1: "Using batch processing can reduce API costs by up to 50%", tip2: "Leveraging prompt caching can reduce costs for repeated requests", tip3: "Choosing the right model for each task maintains quality while reducing costs",
    viewAllModels: "View All Models", tryRecommender: "Try Model Recommender",
  },
};

// Model quality tiers for comparison
const modelTiers: Record<string, { tier: number; category: string }> = {
  "Claude Opus 4.8": { tier: 1, category: "Premium" },
  "Claude Opus 4.7": { tier: 1, category: "Premium" },
  "GPT-5.5": { tier: 1, category: "Premium" },
  "GPT-5.2": { tier: 1, category: "Premium" },
  "Gemini 3.0 Pro": { tier: 2, category: "Standard" },
  "Gemini 3.1 Pro": { tier: 2, category: "Standard" },
  "Claude Sonnet 4.6": { tier: 2, category: "Standard" },
  "Grok 4": { tier: 2, category: "Standard" },
  "MiniMax M3": { tier: 2, category: "Standard" },
  "DeepSeek V3.2": { tier: 3, category: "Budget" },
  "GPT-4.1": { tier: 3, category: "Budget" },
  "Gemma 4": { tier: 3, category: "Budget" },
};

function getCheaperAlternatives(currentModel: string, monthlyCost: number) {
  const currentTier = modelTiers[currentModel]?.tier || 2;
  const alternatives: { model: string; savings: number; quality: string }[] = [];

  for (const [model, info] of Object.entries(modelTiers)) {
    if (model === currentModel) continue;
    if (info.tier > currentTier) continue; // Only suggest same or better tier

    const pricing = pricingData.find(
      (p) => p.modelName === model && p.billingMode === "standard"
    );
    if (!pricing) continue;

    // Estimate cost with same usage (simplified)
    const altCost = monthlyCost * (pricing.inputPrice / (pricingData.find(
      (p) => p.modelName === currentModel && p.billingMode === "standard"
    )?.inputPrice || 1));

    if (altCost < monthlyCost * 0.8) { // At least 20% savings
      alternatives.push({
        model,
        savings: monthlyCost - altCost,
        quality: info.category,
      });
    }
  }

  return alternatives.sort((a, b) => b.savings - a.savings).slice(0, 3);
}

export default function CostCalculatorPage() {
  const params = useParams();
  const locale = (params.locale as string) === "en" ? "en" : "ja";
  const t = T[locale];

  const [selectedModel, setSelectedModel] = useState("");
  const [inputTokens, setInputTokens] = useState(1000000);
  const [outputTokens, setOutputTokens] = useState(250000);
  const [requestsPerDay, setRequestsPerDay] = useState(100);

  const modelOptions = [...new Set(pricingData.map((p) => p.modelName))];

  const selectedPricing = pricingData.find(
    (p) => p.modelName === selectedModel && p.billingMode === "standard"
  );

  const inputCost = selectedPricing
    ? (inputTokens / 1_000_000) * selectedPricing.inputPrice
    : 0;
  const outputCost = selectedPricing
    ? (outputTokens / 1_000_000) * selectedPricing.outputPrice
    : 0;
  const perRequestCost = inputCost + outputCost;
  const dailyCost = perRequestCost * requestsPerDay;
  const monthlyCost = dailyCost * 30;

  const cheaperAlternatives = useMemo(
    () => (selectedModel && monthlyCost > 0 ? getCheaperAlternatives(selectedModel, monthlyCost) : []),
    [selectedModel, monthlyCost]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/${locale === "ja" ? "" : locale + "/"}tools`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-500 mb-8">{t.subtitle}</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.selectModel}</label>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">{t.placeholder}</option>
                {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.inputTokens}</label>
              <input type="number" value={inputTokens} onChange={(e) => setInputTokens(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <p className="text-xs text-gray-400 mt-1">
                {inputTokens >= 1000000 ? `${(inputTokens / 1000000).toFixed(1)}M tokens` : inputTokens >= 1000 ? `${(inputTokens / 1000).toFixed(0)}K tokens` : `${inputTokens} tokens`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.outputTokens}</label>
              <input type="number" value={outputTokens} onChange={(e) => setOutputTokens(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.requestsDay}</label>
              <input type="number" value={requestsPerDay} onChange={(e) => setRequestsPerDay(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {selectedPricing ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-primary-50 rounded-xl">
                    <p className="text-xs font-medium text-primary-600 mb-1">{t.perRequest}</p>
                    <p className="text-xl font-bold text-primary-700">${perRequestCost.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-accent-50 rounded-xl">
                    <p className="text-xs font-medium text-accent-600 mb-1">{t.perDay}</p>
                    <p className="text-xl font-bold text-accent-700">${dailyCost.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <p className="text-xs font-medium text-emerald-600 mb-1">{t.perMonth}</p>
                    <p className="text-xl font-bold text-emerald-700">${monthlyCost.toFixed(2)}</p>
                  </div>
                </div>

                {/* Cheaper Alternatives */}
                {cheaperAlternatives.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-gray-900">{t.savingsTitle}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{t.savingsDesc}</p>
                    <div className="space-y-3">
                      {cheaperAlternatives.map((alt) => (
                        <div key={alt.model} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{alt.model}</div>
                            <div className="text-xs text-gray-500">{t.qualityNote}: {alt.quality}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-600 font-bold text-sm">
                              {t.saveUpTo} ${alt.savings.toFixed(2)}{t.perMonthLabel}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : selectedModel ? (
              <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-lg">{t.noData}</div>
            ) : null}

            {/* Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900">{t.tipsTitle}</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{t.tip1}</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{t.tip2}</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{t.tip3}</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link href={`/${locale === "ja" ? "" : locale + "/"}pricing`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {t.viewAllModels} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={`/${locale === "ja" ? "" : locale + "/"}tools/model-recommender`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 rounded-xl text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                <Sparkles className="w-4 h-4" />{t.tryRecommender}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">{t.note}</p>
        </div>
      </div>
    </div>
  );
}
