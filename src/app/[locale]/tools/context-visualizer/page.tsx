"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Code, MessageSquare, FileText } from "lucide-react";

const T = {
  ja: { back: "ツール一覧に戻る", title: "コンテキストウィンドウ比較", subtitle: "各モデルのコンテキストサイズを視覚的に比較", modelCompare: "モデル比較", whatFits: "何が入る？", tokens: "トークン",
    items: [
      { name: "チャット100往復", tokens: 50000 },
      { name: "小説1冊", tokens: 80000 },
      { name: "技術ドキュメント", tokens: 120000 },
      { name: "コードベース(5万行)", tokens: 150000 },
    ],
  },
  en: { back: "Back to Tools", title: "Context Window Visualizer", subtitle: "Visually compare context window sizes across models", modelCompare: "Model Comparison", whatFits: "What Fits?", tokens: "tokens",
    items: [
      { name: "100 Chat Exchanges", tokens: 50000 },
      { name: "1 Novel", tokens: 80000 },
      { name: "Technical Docs", tokens: 120000 },
      { name: "Codebase (50K lines)", tokens: 150000 },
    ],
  },
};

const models = [
  { name: "DeepSeek V3.2", tokens: 128000, color: "bg-red-500" },
  { name: "GPT-5.5", tokens: 256000, color: "bg-green-500" },
  { name: "Claude Opus 4.8", tokens: 1000000, color: "bg-purple-500" },
  { name: "Gemini 3.0 Pro", tokens: 1000000, color: "bg-blue-500" },
  { name: "MiniMax M3", tokens: 1000000, color: "bg-orange-500" },
];

const icons = [MessageSquare, BookOpen, FileText, Code];

function fmt(n: number) { return n >= 1000000 ? `${(n / 1000000).toFixed(0)}M` : `${(n / 1000).toFixed(0)}K`; }

export default function ContextVisualizerPage() {
  const params = useParams();
  const locale = (params.locale as string) === "en" ? "en" : "ja";
  const t = T[locale];
  const [selected, setSelected] = useState(models[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/${locale === "ja" ? "" : locale + "/"}tools`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-500 mb-8">{t.subtitle}</p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t.modelCompare}</h2>
          <div className="space-y-3">
            {models.map((m) => {
              const pct = (m.tokens / 1000000) * 100;
              return (
                <button key={m.name} onClick={() => setSelected(m)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selected.name === m.name ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:border-gray-300"}`}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{m.name}</span>
                    <span className="text-sm font-bold text-primary-600">{fmt(m.tokens)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`${m.color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{t.whatFits} {selected.name}</h2>
          <p className="text-sm text-gray-500 mb-6">{fmt(selected.tokens)} {t.tokens}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.items.map((item, idx) => {
              const Icon = icons[idx];
              const fits = Math.floor(selected.tokens / item.tokens);
              const pct = (item.tokens / selected.tokens) * 100;
              return (
                <div key={item.name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg"><Icon className="w-5 h-5 text-gray-600" /></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-sm font-bold text-primary-600">{fits > 0 ? `×${fits}` : "< 1"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
