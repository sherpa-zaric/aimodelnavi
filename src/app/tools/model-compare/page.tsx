'use client';

import { useState } from 'react';
import { leaderboardData } from '@/data/leaderboard';
import { pricingData } from '@/data/pricing';

export default function ModelComparePage() {
  const [modelA, setModelA] = useState('');
  const [modelB, setModelB] = useState('');

  const modelNames = [...new Set(leaderboardData.map((m) => m.name))];

  const getModel = (name: string) => leaderboardData.find((m) => m.name === name);
  const getPricing = (name: string) =>
    pricingData.find((p) => p.modelName === name && p.billingMode === 'standard');

  const a = getModel(modelA);
  const b = getModel(modelB);
  const pa = getPricing(modelA);
  const pb = getPricing(modelB);

  const compareBenchmarks = [
    { key: 'hle' as const, label: 'HLE' },
    { key: 'arcAgi2' as const, label: 'ARC-AGI-2' },
    { key: 'frontierMath' as const, label: 'FrontierMath' },
    { key: 'sweBenchVerified' as const, label: 'SWE-bench Verified' },
    { key: 'tauBench' as const, label: 'τ²-Bench' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">モデル比較</h1>
      <p className="text-gray-500 mb-8">
        2つのAIモデルをベンチマークと料金で直接比較します。
      </p>

      {/* Model selectors */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            モデル A
          </label>
          <select
            value={modelA}
            onChange={(e) => setModelA(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">選択してください</option>
            {modelNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            モデル B
          </label>
          <select
            value={modelB}
            onChange={(e) => setModelB(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">選択してください</option>
            {modelNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {a && b && (
        <div className="space-y-6">
          {/* Benchmark comparison */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">ベンチマーク比較</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">指標</th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-primary-600">{a.name}</th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-accent-600">{b.name}</th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-400">勝者</th>
                </tr>
              </thead>
              <tbody>
                {compareBenchmarks.map(({ key, label }) => {
                  const av = a[key];
                  const bv = b[key];
                  const winner =
                    av === null ? 'b' : bv === null ? 'a' : av > bv ? 'a' : bv > av ? 'b' : 'draw';
                  return (
                    <tr key={key} className="border-b border-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-700">{label}</td>
                      <td className="px-6 py-3 text-sm text-center font-mono">
                        {av !== null ? (
                          <span className={winner === 'a' ? 'font-bold text-primary-600' : 'text-gray-600'}>
                            {av.toFixed(1)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-center font-mono">
                        {bv !== null ? (
                          <span className={winner === 'b' ? 'font-bold text-accent-600' : 'text-gray-600'}>
                            {bv.toFixed(1)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {winner === 'a' ? (
                          <span className="text-xs font-medium text-primary-600">{a.name}</span>
                        ) : winner === 'b' ? (
                          <span className="text-xs font-medium text-accent-600">{b.name}</span>
                        ) : (
                          <span className="text-xs text-gray-400">引分</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing comparison */}
          {pa && pb && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">API料金比較（標準モード）</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">項目</th>
                    <th className="px-6 py-2 text-center text-xs font-medium text-primary-600">{a.name}</th>
                    <th className="px-6 py-2 text-center text-xs font-medium text-accent-600">{b.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-700">入力 ($/1M tokens)</td>
                    <td className="px-6 py-3 text-sm text-center font-mono">${pa.inputPrice.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-center font-mono">${pb.inputPrice.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 text-sm font-medium text-gray-700">出力 ($/1M tokens)</td>
                    <td className="px-6 py-3 text-sm text-center font-mono">${pa.outputPrice.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-center font-mono">${pb.outputPrice.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
