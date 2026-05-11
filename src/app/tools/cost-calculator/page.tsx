'use client';

import { useState } from 'react';
import { pricingData } from '@/data/pricing';

export default function CostCalculatorPage() {
  const [selectedModel, setSelectedModel] = useState('');
  const [inputTokens, setInputTokens] = useState(1000000);
  const [outputTokens, setOutputTokens] = useState(250000);
  const [requestsPerDay, setRequestsPerDay] = useState(100);

  const modelOptions = [...new Set(pricingData.map((p) => p.modelName))];

  const selectedPricing = pricingData.find(
    (p) => p.modelName === selectedModel && p.billingMode === 'standard'
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">APIコスト計算</h1>
      <p className="text-gray-500 mb-8">
        モデルと使用量を入力すると、月額のAPIコストを試算できます。
      </p>

      <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
        {/* Model select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            モデルを選択
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">モデルを選んでください</option>
            {modelOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Input tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            1リクエストあたりの入力トークン数
          </label>
          <input
            type="number"
            value={inputTokens}
            onChange={(e) => setInputTokens(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            {inputTokens >= 1000000
              ? `${(inputTokens / 1000000).toFixed(1)}M tokens`
              : inputTokens >= 1000
              ? `${(inputTokens / 1000).toFixed(0)}K tokens`
              : `${inputTokens} tokens`}
          </p>
        </div>

        {/* Output tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            1リクエストあたりの出力トークン数
          </label>
          <input
            type="number"
            value={outputTokens}
            onChange={(e) => setOutputTokens(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Requests per day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            1日あたりのリクエスト数
          </label>
          <input
            type="number"
            value={requestsPerDay}
            onChange={(e) => setRequestsPerDay(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results */}
      {selectedPricing && (
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <div className="p-5 bg-primary-50 rounded-xl">
            <p className="text-xs font-medium text-primary-600 mb-1">
              1リクエストあたり
            </p>
            <p className="text-2xl font-bold text-primary-700">
              ${perRequestCost.toFixed(4)}
            </p>
          </div>
          <div className="p-5 bg-accent-50 rounded-xl">
            <p className="text-xs font-medium text-accent-600 mb-1">
              1日あたり
            </p>
            <p className="text-2xl font-bold text-accent-700">
              ${dailyCost.toFixed(2)}
            </p>
          </div>
          <div className="p-5 bg-emerald-50 rounded-xl">
            <p className="text-xs font-medium text-emerald-600 mb-1">
              月額（30日）
            </p>
            <p className="text-2xl font-bold text-emerald-700">
              ${monthlyCost.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {selectedModel && !selectedPricing && (
        <div className="mt-8 p-4 bg-amber-50 text-amber-700 text-sm rounded-lg">
          このモデルの標準課金データが見つかりません。
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          ※ この計算は概算です。実際の料金は各プロバイダーの公式価格表に基づきます。
          バッチ処理やキャッシュを利用することで、実際のコストを大幅に削減できる場合があります。
        </p>
      </div>
    </div>
  );
}
