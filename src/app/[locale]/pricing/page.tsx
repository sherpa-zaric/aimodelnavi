'use client';

import { useState } from 'react';
import { pricingData, BillingMode } from '@/data/pricing';
import { Info, ArrowUpDown } from 'lucide-react';

const billingLabels: Record<BillingMode, { label: string; desc: string }> = {
  standard: { label: '標準', desc: '通常のトークン単位課金' },
  batch: { label: 'バッチ', desc: '非同期バルク処理（最大50%割引）' },
  cache: { label: 'キャッシュ', desc: '反復コンテキストの割引料金' },
  'long-context': { label: '長文', desc: '長い入力超過時の段階料金' },
};

const providers = [...new Set(pricingData.map((p) => p.provider))];

export default function PricingPage() {
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(
    new Set(providers)
  );
  const [selectedBilling, setSelectedBilling] = useState<Set<BillingMode>>(
    new Set<BillingMode>(['standard'])
  );
  const [sortField, setSortField] = useState<'inputPrice' | 'outputPrice' | 'modelName'>('inputPrice');

  const toggleProvider = (p: string) => {
    const next = new Set(selectedProviders);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setSelectedProviders(next);
  };

  const toggleBilling = (b: BillingMode) => {
    const next = new Set(selectedBilling);
    if (next.has(b)) next.delete(b);
    else next.add(b);
    setSelectedBilling(next);
  };

  const filtered = pricingData
    .filter((p) => selectedProviders.has(p.provider))
    .filter((p) => selectedBilling.has(p.billingMode))
    .sort((a, b) => {
      if (sortField === 'modelName') return a.modelName.localeCompare(b.modelName);
      return a[sortField] - b[sortField];
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API料金比較</h1>
        <p className="mt-2 text-gray-500">
          主要AIモデルのAPI料金を1Mトークンあたりの価格で比較。データは各社公式サイトに基づきます。
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <span className="text-xs font-medium text-gray-500 mb-2 block">プロバイダー</span>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  selectedProviders.has(p)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 mb-2 block">課金モード</span>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(billingLabels) as [BillingMode, { label: string; desc: string }][]).map(
              ([mode, { label }]) => (
                <button
                  key={mode}
                  onClick={() => toggleBilling(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    selectedBilling.has(mode)
                      ? 'bg-accent-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>
                <button
                  onClick={() => setSortField('modelName')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  モデル名
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th>プロバイダー</th>
              <th>課金モード</th>
              <th>
                <button
                  onClick={() => setSortField('inputPrice')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  入力料金
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th>
                <button
                  onClick={() => setSortField('outputPrice')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  出力料金
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th>入力形式</th>
              <th>出力形式</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={`${p.modelName}-${p.provider}-${p.billingMode}`}>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {p.modelName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.provider}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`price-tag ${
                      p.billingMode === 'standard'
                        ? 'bg-primary-50 text-primary-700'
                        : p.billingMode === 'batch'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.billingMode === 'cache'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {billingLabels[p.billingMode].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                  ${p.inputPrice.toFixed(p.inputPrice < 1 ? 3 : 2)}
                </td>
                <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                  ${p.outputPrice.toFixed(p.outputPrice < 1 ? 3 : 2)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {p.inputModality === 'multimodal' ? '画像+テキスト' : 'テキスト'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {p.outputModality === 'multimodal' ? '画像+テキスト' : 'テキスト'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Billing mode explanation */}
      <div className="mt-10 p-6 bg-gray-50 rounded-xl">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          課金モードについて
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(Object.entries(billingLabels) as [BillingMode, { label: string; desc: string }][]).map(
            ([mode, { label, desc }]) => (
              <div key={mode}>
                <dt className="text-sm font-medium text-gray-900">{label}</dt>
                <dd className="text-xs text-gray-500 mt-0.5">{desc}</dd>
              </div>
            )
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        ※ 価格は各社公式サイトの情報に基づきます。最新の正確な料金は各公式サイトでご確認ください。
        価格はUSD（米ドル）表示です。
      </p>
    </div>
  );
}
