'use client';

import { useState } from 'react';
import { benchmarksData, Benchmark } from '@/data/benchmarks';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const categories = [
  { key: 'all', label: 'すべて' },
  { key: 'math', label: '数学' },
  { key: 'coding', label: 'プログラミング' },
  { key: 'reasoning', label: '推論' },
  { key: 'comprehensive', label: '総合' },
  { key: 'agent', label: 'エージェント' },
];

export default function BenchmarksPage() {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedBenchmark, setExpandedBenchmark] = useState<string | null>(null);

  const filteredBenchmarks = benchmarksData.filter(
    (b) => filterCategory === 'all' || b.category === filterCategory
  );

  const toggleBenchmark = (key: string) => {
    setExpandedBenchmark(expandedBenchmark === key ? null : key);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI モデル評価基准</h1>
        <p className="mt-2 text-gray-500">
          业界主流の AI モデル評価基准一覧。各基准の説明と、モデルのランキングを確認できます。
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterCategory === cat.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Benchmarks list */}
      <div className="space-y-4">
        {filteredBenchmarks.map((benchmark) => (
          <div
            key={benchmark.key}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Benchmark header */}
            <button
              onClick={() => toggleBenchmark(benchmark.key)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{benchmark.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{benchmark.nameJa}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {benchmark.category === 'math' ? '数学' :
                   benchmark.category === 'coding' ? 'プログラミング' :
                   benchmark.category === 'reasoning' ? '推論' :
                   benchmark.category === 'comprehensive' ? '総合' :
                   benchmark.category === 'agent' ? 'エージェント' : benchmark.category}
                </span>
                <span className="text-sm text-gray-400">
                  {benchmark.totalModels} モデル
                </span>
              </div>
              {expandedBenchmark === benchmark.key ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Benchmark details (expanded) */}
            {expandedBenchmark === benchmark.key && (
              <div className="px-6 pb-6">
                {/* Description */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{benchmark.description}</p>
                </div>

                {/* Rankings table */}
                {benchmark.rankings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">#</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">モデル</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">開発元</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">スコア</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">モード</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmark.rankings.slice(0, 20).map((ranking, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-sm text-gray-500">{idx + 1}</td>
                            <td className="py-2 px-3 text-sm font-medium text-gray-900">{ranking.name}</td>
                            <td className="py-2 px-3 text-sm text-gray-600">{ranking.developer}</td>
                            <td className="py-2 px-3 text-sm text-right font-mono font-medium text-emerald-600">
                              {ranking.score.toFixed(1)}
                            </td>
                            <td className="py-2 px-3 text-xs text-gray-500">{ranking.mode || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {benchmark.rankings.length > 20 && (
                      <p className="mt-3 text-sm text-gray-500 text-center">
                        ... 他 {benchmark.rankings.length - 20} モデル
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    ランキングデータがありません
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info section */}
      <div className="mt-10 p-6 bg-gray-50 rounded-xl">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          評価基准について
        </h2>
        <p className="text-sm text-gray-600">
          各評価基准は、AI モデルの特定の能力を測定するために設計されています。
          数学推論、コーディング、総合的な理解力など、多様な角度からモデルの性能を評価できます。
          データは定期的に更新され、最新のモデルのスコアが反映されます。
        </p>
      </div>
    </div>
  );
}
