'use client';

import { useState } from 'react';
import { leaderboardData, ModelRanking } from '@/data/leaderboard';
import { Info } from 'lucide-react';

const benchmarks = [
  { key: 'hle' as const, label: 'HLE', desc: 'Human-Like Evaluation — 総合知能テスト' },
  { key: 'arcAgi2' as const, label: 'ARC-AGI-2', desc: '抽象的推論ベンチマーク' },
  { key: 'frontierMath' as const, label: 'FrontierMath', desc: '高度な数学問題' },
  { key: 'sweBenchVerified' as const, label: 'SWE-bench Verified', desc: '実践的ソフトウェア開発タスク' },
  { key: 'tauBench' as const, label: 'τ²-Bench', desc: '自律エージェントタスク' },
];

export default function LeaderboardPage() {
  const [sortKey, setSortKey] = useState<keyof ModelRanking>('hle');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  const sortedData = [...leaderboardData]
    .filter((m) => filterType === 'all' || m.type === filterType)
    .filter((m) => filterSource === 'all' || m.openSource === filterSource)
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return (bVal as number) - (aVal as number);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AIモデルランキング</h1>
        <p className="mt-2 text-gray-500">
          HLE、ARC-AGI-2、FrontierMath、SWE-bench Verified、τ²-Bench の統合ランキング。
          各ベンチマークの最高スコアを表示しています。
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {['all', 'reasoning', 'foundation', 'coder', 'chat'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterType === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'すべて' : t === 'reasoning' ? '推論' : t === 'foundation' ? '基盤' : t === 'coder' ? 'コーディング' : 'チャット'}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {[
            { value: 'all', label: 'すべて' },
            { value: 'open', label: 'オープンソース' },
            { value: 'closed', label: 'クローズド' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterSource(s.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterSource === s.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>モデル名</th>
              <th>開発元</th>
              {benchmarks.map((b) => (
                <th key={b.key}>
                  <button
                    onClick={() => setSortKey(b.key)}
                    className={`inline-flex items-center gap-1 hover:text-primary-600 transition-colors ${
                      sortKey === b.key ? 'text-primary-600' : ''
                    }`}
                  >
                    {b.label}
                    {sortKey === b.key && <span className="text-[10px]">▼</span>}
                  </button>
                </th>
              ))}
              <th>オープンソース</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((model) => (
              <tr key={model.name}>
                <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                  {model.rank}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {model.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {model.developer}
                </td>
                {benchmarks.map((b) => {
                  const val = model[b.key];
                  return (
                    <td key={b.key} className="px-4 py-3 text-sm">
                      {val !== null ? (
                        <span
                          className={`font-mono font-medium ${
                            (val as number) >= 50
                              ? 'text-emerald-600'
                              : (val as number) >= 30
                              ? 'text-amber-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {val.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-sm">
                  {model.openSource === 'open' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      オープン
                    </span>
                  ) : model.openSource === 'open-nc' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      非商用
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      クローズド
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Benchmark descriptions */}
      <div className="mt-10 p-6 bg-gray-50 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          ベンチマークについて
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {benchmarks.map((b) => (
            <div key={b.key}>
              <dt className="text-sm font-medium text-gray-900">{b.label}</dt>
              <dd className="text-xs text-gray-500 mt-0.5">{b.desc}</dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
