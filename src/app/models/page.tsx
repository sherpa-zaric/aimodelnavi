'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { modelDetails, ModelDetail } from '@/data/models';

const typeLabels: Record<string, string> = {
  reasoning: '推論',
  foundation: '基盤',
  chat: 'チャット',
  coder: 'コーディング',
};

const sourceLabels: Record<string, string> = {
  open: 'オープンソース',
  'open-nc': '条件付オープン',
  closed: 'プロプライエタリ',
};

export default function ModelsPage() {
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  const filtered = modelDetails.filter((m) => {
    if (filterSource !== 'all' && m.openSource !== filterSource) return false;
    if (filterRegion === 'jp') {
      const jpDevelopers = ['Preferred Networks', 'Sakana AI', 'ELYZA', 'rinna', 'NTT', '富士通'];
      if (!jpDevelopers.includes(m.developer)) return false;
    }
    if (filterRegion === 'global') {
      const jpDevelopers = ['Preferred Networks', 'Sakana AI', 'ELYZA', 'rinna', 'NTT', '富士通'];
      if (jpDevelopers.includes(m.developer)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">モデル一覧</h1>
        <p className="mt-2 text-gray-500">
          主要AIモデルの仕様・ライセンス・性能概要を一覧で比較できます。国産モデルも網羅。
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {['all', 'open', 'open-nc', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSource(s)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterSource === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'すべて' : sourceLabels[s]}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {['all', 'global', 'jp'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRegion(r)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterRegion === r
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 'all' ? '全地域' : r === 'jp' ? '🇯🇵 国産' : '🌍 グローバル'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((model) => (
          <Link
            key={model.slug}
            href={`/models/${model.slug}`}
            className="group block p-6 rounded-xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                {model.name}
              </h3>
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  model.openSource === 'open'
                    ? 'bg-emerald-50 text-emerald-700'
                    : model.openSource === 'open-nc'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {sourceLabels[model.openSource]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-3">
              {model.descriptionJa}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">開発元</span>
                <p className="font-medium text-gray-700">{model.developer}</p>
              </div>
              <div>
                <span className="text-gray-400">パラメータ</span>
                <p className="font-medium text-gray-700">{model.params}</p>
              </div>
              <div>
                <span className="text-gray-400">コンテキスト長</span>
                <p className="font-medium text-gray-700">{model.contextWindow}</p>
              </div>
              <div>
                <span className="text-gray-400">タイプ</span>
                <p className="font-medium text-gray-700">{typeLabels[model.type]}</p>
              </div>
            </div>
            {model.pricing && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs">
                <span className="text-gray-400">
                  入力{' '}
                  <span className="font-medium text-gray-700">
                    {model.pricing.currency === 'JPY' ? '¥' : '$'}
                    {model.pricing.inputPer1M}
                  </span>
                </span>
                <span className="text-gray-400">
                  出力{' '}
                  <span className="font-medium text-gray-700">
                    {model.pricing.currency === 'JPY' ? '¥' : '$'}
                    {model.pricing.outputPer1M}
                  </span>
                </span>
                <span className="text-xs text-gray-300">/1M tokens</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center text-xs font-medium text-primary-600">
              詳細を見る
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}