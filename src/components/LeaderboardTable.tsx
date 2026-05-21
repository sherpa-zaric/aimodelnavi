"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";
import { leaderboardData, type ModelRanking } from "@/data/leaderboard";
import type { Benchmark } from "@/data/benchmarks";

interface LeaderboardTableProps {
  benchmarks: string[];
  benchmarkDefs: (Benchmark | undefined)[];
}

const LABELS: Record<string, Record<string, string>> = {
  ja: {
    all: "すべて", reasoning: "推論", foundation: "基盤", coder: "コーディング", chat: "チャット",
    openSource: "オープンソース", closed: "クローズド", search: "モデル名・開発元で検索",
    models: "件のモデル", noResults: "該当するモデルが見つかりません", loadMore: "さらに読み込む",
    modelName: "モデル名", developer: "開発元", openSourceCol: "オープンソース",
    open: "オープン", nc: "非商用",
  },
  en: {
    all: "All", reasoning: "Reasoning", foundation: "Base", coder: "Coding", chat: "Chat",
    openSource: "Open Source", closed: "Closed", search: "Search models...",
    models: "models", noResults: "No models found", loadMore: "Load more",
    modelName: "Model", developer: "Developer", openSourceCol: "Open Source",
    open: "Open", nc: "Non-commercial",
  },
  ko: {
    all: "전체", reasoning: "추론", foundation: "기반", coder: "코딩", chat: "채팅",
    openSource: "오픈소스", closed: "비공개", search: "모델명 또는 개발사로 검색",
    models: "개 모델", noResults: "결과 없음", loadMore: "더 보기",
    modelName: "모델명", developer: "개발사", openSourceCol: "오픈소스",
    open: "오픈", nc: "비상업용",
  },
};

const PAGE_SIZE = 30;

export default function LeaderboardTable({ benchmarks, benchmarkDefs }: LeaderboardTableProps) {
  const locale = useLocale();
  const l = LABELS[locale] || LABELS.ja;
  const [sortKey, setSortKey] = useState<string>(benchmarks[0] || "hle");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredAndSorted = useMemo(() => {
    return [...leaderboardData]
      .filter((m) => filterType === "all" || m.type === filterType)
      .filter((m) => filterSource === "all" || m.openSource === filterSource)
      .filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.developer.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const aVal = a[sortKey as keyof ModelRanking];
        const bVal = b[sortKey as keyof ModelRanking];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        return (bVal as number) - (aVal as number);
      });
  }, [filterType, filterSource, searchQuery, sortKey]);

  const displayData = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;
  const TYPE_KEYS = ["all", "reasoning", "foundation", "coder", "chat"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder={l.search}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {TYPE_KEYS.map((t) => (
            <button key={t} onClick={() => { setFilterType(t); setVisibleCount(PAGE_SIZE); }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterType === t ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {l[t] || t}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {[{ value: "all", label: l.all }, { value: "open", label: l.openSource }, { value: "closed", label: l.closed }].map((s) => (
            <button key={s.value} onClick={() => { setFilterSource(s.value); setVisibleCount(PAGE_SIZE); }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterSource === s.value ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filteredAndSorted.length} {l.models}{searchQuery && ` (${l.search} "${searchQuery}")`}</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>{l.modelName}</th>
              <th>{l.developer}</th>
              {benchmarks.map((key) => {
                const def = benchmarkDefs.find((b) => b?.key === key);
                return (
                  <th key={key}>
                    <button onClick={() => setSortKey(key)}
                      className={`inline-flex items-center gap-1 hover:text-primary-600 transition-colors ${sortKey === key ? "text-primary-600" : ""}`}>
                      {def?.name || key}{sortKey === key && <span className="text-[10px]">▼</span>}
                    </button>
                  </th>
                );
              })}
              <th>{l.openSourceCol}</th>
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr><td colSpan={3 + benchmarks.length + 1} className="px-4 py-10 text-center text-sm text-gray-400">{l.noResults}</td></tr>
            ) : (
              displayData.map((model, idx) => (
                <tr key={model.name}>
                  <td className="px-4 py-3 text-sm text-gray-500 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{model.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{model.developer}</td>
                  {benchmarks.map((key) => {
                    const val = model[key as keyof ModelRanking];
                    return (
                      <td key={key} className="px-4 py-3 text-sm">
                        {val !== null && val !== undefined ? (
                          <span className={`font-mono font-medium ${(val as number) >= 50 ? "text-emerald-600" : (val as number) >= 30 ? "text-amber-600" : "text-gray-600"}`}>{(val as number).toFixed(1)}</span>
                        ) : (<span className="text-gray-300">—</span>)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-sm">
                    {model.openSource === "open" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">{l.open}</span>
                    ) : model.openSource === "open-nc" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{l.nc}</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{locale === "en" ? "Closed" : locale === "ko" ? "비공개" : "クローズド"}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="px-6 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
            {l.loadMore}（{visibleCount} / {filteredAndSorted.length}）
          </button>
        </div>
      )}
    </div>
  );
}
