'use client';

import { useState } from 'react';

export default function TokenCounterPage() {
  const [text, setText] = useState('');

  // Simple estimation: ~4 chars per token for English, ~1-2 for Japanese
  const estimateTokens = (t: string): number => {
    const japaneseChars = (t.match(/[　-〿぀-ゟ゠-ヿ＀-ﾟ一-龯㐀-䶿]/g) || []).length;
    const otherChars = t.length - japaneseChars;
    return Math.ceil(japaneseChars * 0.5 + otherChars / 4);
  };

  const tokenEstimate = estimateTokens(text);
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">トークンカウンター</h1>
      <p className="text-gray-500 mb-8">
        テキストのトークン数を推定します。日本語と英語の混在テキストに対応。
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ここにテキストを貼り付けてください..."
        rows={10}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
      />

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-5 bg-primary-50 rounded-xl text-center">
          <p className="text-xs font-medium text-primary-600 mb-1">推定トークン数</p>
          <p className="text-3xl font-bold text-primary-700">{tokenEstimate.toLocaleString()}</p>
        </div>
        <div className="p-5 bg-gray-50 rounded-xl text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">文字数</p>
          <p className="text-3xl font-bold text-gray-700">{charCount.toLocaleString()}</p>
        </div>
        <div className="p-5 bg-gray-50 rounded-xl text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">単語数</p>
          <p className="text-3xl font-bold text-gray-700">{wordCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          ※ トークン数の推定は簡易的な計算に基づきます。実際のトークン数はモデルやトークナイザーによって異なります。
          日本語文字は約0.5トークン/文字、英数字は約0.25トークン/文字として計算しています。
        </p>
      </div>
    </div>
  );
}
