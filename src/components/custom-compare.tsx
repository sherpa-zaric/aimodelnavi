"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, Search } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ModelDetail } from "@/data/models";
import type { ModelRanking } from "@/data/leaderboard";

interface Props {
  models: ModelDetail[];
  rankings: ModelRanking[];
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    addModel: string;
    noResults: string;
    inputPrice: string;
    outputPrice: string;
    context: string;
    noData: string;
    model: string;
  };
}

const BENCHMARK_KEYS: { key: keyof ModelRanking; label: string }[] = [
  { key: "hle", label: "HLE" },
  { key: "arcAgi2", label: "ARC-AGI-2" },
  { key: "frontierMath", label: "FrontierMath" },
  { key: "sweBenchVerified", label: "SWE-bench Verified" },
  { key: "sweBenchPro", label: "SWE-bench Pro" },
  { key: "gpqaDiamond", label: "GPQA Diamond" },
  { key: "mmluPro", label: "MMLU-Pro" },
  { key: "aime2025", label: "AIME 2025" },
  { key: "math500", label: "MATH-500" },
  { key: "liveCodeBench", label: "LiveCodeBench" },
  { key: "gsm8k", label: "GSM8K" },
];

function findRanking(rankings: ModelRanking[], name: string): ModelRanking | undefined {
  const lower = name.toLowerCase();
  return rankings.find((r) => r.name.toLowerCase() === lower);
}

export default function CustomCompare({ models, rankings, locale, labels }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selected, setSelected] = useState<ModelDetail[]>(() => {
    const slugs = searchParams.get("models");
    if (!slugs) return [];
    return slugs.split(",").filter(Boolean).map((s) => models.find((m) => m.slug === s)).filter(Boolean) as ModelDetail[];
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEn = locale === "en";

  const updateUrl = useCallback((slugs: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slugs.length > 0) {
      params.set("models", slugs.join(","));
    } else {
      params.delete("models");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return models.filter((m) => !selected.some((s) => s.slug === m.slug)).slice(0, 20);
    const q = search.toLowerCase();
    return models
      .filter(
        (m) =>
          !selected.some((s) => s.slug === m.slug) &&
          (m.name.toLowerCase().includes(q) ||
            m.developer.toLowerCase().includes(q) ||
            m.developerEn.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [search, models, selected]);

  function addModel(m: ModelDetail) {
    if (selected.length < 4) {
      const next = [...selected, m];
      setSelected(next);
      updateUrl(next.map((x) => x.slug));
      setSearch("");
      setOpen(false);
    }
  }

  function removeModel(slug: string) {
    const next = selected.filter((m) => m.slug !== slug);
    setSelected(next);
    updateUrl(next.map((x) => x.slug));
  }

  const bestValues = useMemo(() => {
    const best: Record<string, number> = {};
    for (const bm of BENCHMARK_KEYS) {
      let max = -1;
      for (const m of selected) {
        const r = findRanking(rankings, m.name);
        const val = r ? (r[bm.key] as number | null) : null;
        if (val !== null && val > max) max = val;
      }
      if (max >= 0) best[bm.key as string] = max;
    }
    return best;
  }, [selected, rankings]);

  return (
    <div className="mb-12 p-6 bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{labels.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{labels.subtitle}</p>
        </div>
        {selected.length < 4 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setOpen(!open);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
            >
              + {labels.addModel}
            </button>

            {open && (
              <div className="absolute right-0 z-10 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={labels.searchPlaceholder}
                      className="flex-1 text-sm bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filtered.map((m) => (
                    <button
                      key={m.slug}
                      onClick={() => addModel(m)}
                      className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium text-gray-900">{m.name}</span>
                      <span className="text-gray-500 ml-1.5 text-xs">{isEn ? m.developerEn : m.developer}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">{labels.noResults}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {selected.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{labels.searchPlaceholder}</p>
        </div>
      )}

      {/* Selected model chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((m) => (
            <span
              key={m.slug}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
            >
              <span className="font-medium text-gray-800">{m.name}</span>
              <button onClick={() => removeModel(m.slug)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {selected.length >= 1 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium w-40">{labels.model}</th>
                {selected.map((m) => (
                  <th key={m.slug} className="text-center py-2 px-3">
                    <a
                      href={`/${locale === "ja" ? "" : locale + "/"}models/${m.slug}`}
                      className="font-bold text-primary-700 hover:underline"
                    >
                      {m.name}
                    </a>
                    <div className="text-xs text-gray-500 font-normal">{isEn ? m.developerEn : m.developer}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-600">{labels.context}</td>
                {selected.map((m) => (
                  <td key={m.slug} className="text-center py-2 px-3 font-semibold text-gray-900">
                    {m.contextWindow}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-600">{labels.inputPrice}</td>
                {selected.map((m) => (
                  <td key={m.slug} className="text-center py-2 px-3 text-gray-900">
                    {m.pricing?.inputPer1M != null ? `$${m.pricing.inputPer1M}` : labels.noData}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-600">{labels.outputPrice}</td>
                {selected.map((m) => (
                  <td key={m.slug} className="text-center py-2 px-3 text-gray-900">
                    {m.pricing?.outputPer1M != null ? `$${m.pricing.outputPer1M}` : labels.noData}
                  </td>
                ))}
              </tr>

              {BENCHMARK_KEYS.map((bm) => {
                const hasAny = selected.some((m) => {
                  const r = findRanking(rankings, m.name);
                  return r && r[bm.key] != null;
                });
                if (!hasAny) return null;

                const values = selected.map((m) => {
                  const r = findRanking(rankings, m.name);
                  return r ? (r[bm.key] as number | null) : null;
                });
                const nonNull = values.filter((v) => v != null) as number[];
                const maxVal = nonNull.length > 0 ? Math.max(...nonNull) : null;
                const winnerIdx = nonNull.length >= 2 ? values.findIndex((v) => v === maxVal) : -1;

                return (
                  <tr key={bm.key as string} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-600">{bm.label}</td>
                    {selected.map((m, i) => {
                      const val = values[i];
                      const isBest = val != null && val === bestValues[bm.key as string] && selected.length > 1;
                      const isWinner = i === winnerIdx && selected.length > 1;
                      return (
                        <td
                          key={m.slug}
                          className={`text-center py-2 px-3 ${
                            isBest
                              ? "font-bold text-primary-700 bg-primary-50 rounded"
                              : val != null
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {val != null ? val : labels.noData}
                          {isWinner && (
                            <span className="ml-1 text-[10px] font-bold text-primary-600">★</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
