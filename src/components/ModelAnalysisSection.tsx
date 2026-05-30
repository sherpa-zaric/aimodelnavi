"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, BarChart3, Users, Lightbulb, Newspaper, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface KeyMetric {
  label: string;
  value: string;
  context?: string;
}

interface CompetitorRow {
  name: string;
  arena?: string;
  swe?: string;
  gpqa?: string;
  price?: string;
}

interface Analysis {
  keyMetrics: KeyMetric[];
  pros: string[];
  cons: string[];
  competitorTable: CompetitorRow[];
  summary: string;
  performance: string;
  comparisons: string;
  community: string;
  useCaseDeep: string;
  latestNews: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

interface Props {
  analysis: Analysis;
  locale: string;
  modelNameToSlug?: Record<string, string>;
}

function Collapsible({ title, icon, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {icon} {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 py-4 analysis-content">{children}</div>}
    </div>
  );
}

export default function ModelAnalysisSection({ analysis, locale, modelNameToSlug }: Props) {
  const l = locale === "en" ? {
    title: "Deep Analysis",
    pros: "Strengths",
    cons: "Weaknesses",
    compare: "Competitor Comparison",
    summary: "Overview",
    performance: "Benchmarks & Performance",
    comparisons: "Detailed Comparison",
    community: "Community Feedback",
    useCases: "Use Cases",
    news: "Latest News",
    sources: "Sources",
    generated: "Analysis generated",
  } : {
    title: "深度分析",
    pros: "強み",
    cons: "弱み",
    compare: "競合比較",
    summary: "概要",
    performance: "ベンチマーク＆性能",
    comparisons: "詳細比較",
    community: "コミュニティ評価",
    useCases: "ユースケース",
    news: "最新ニュース",
    sources: "出典",
    generated: "分析生成日",
  };

  const hasMetrics = analysis.keyMetrics?.length > 0;
  const hasProsCons = analysis.pros?.length > 0 || analysis.cons?.length > 0;
  const hasCompetitors = analysis.competitorTable?.length > 0;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-5">{l.title}</h2>

      {/* Key Metrics */}
      {hasMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
          {analysis.keyMetrics.map((m, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{m.label}</p>
              <p className="text-lg font-bold text-gray-900">{m.value}</p>
              {m.context && <p className="text-xs text-gray-400 mt-0.5">{m.context}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Pros / Cons */}
      {hasProsCons && (
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {analysis.pros?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> {l.pros}
              </h3>
              <ul className="space-y-1">
                {analysis.pros.map((p, i) => (
                  <li key={i} className="text-sm text-emerald-700">・{p}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.cons?.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> {l.cons}
              </h3>
              <ul className="space-y-1">
                {analysis.cons.map((c, i) => (
                  <li key={i} className="text-sm text-amber-700">・{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Competitor Table */}
      {hasCompetitors && (
        <div className="mb-5 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{l.compare}</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-medium text-gray-600 border-b">Model</th>
                {analysis.competitorTable[0]?.arena && <th className="text-center px-3 py-2 font-medium text-gray-600 border-b">Arena</th>}
                {analysis.competitorTable[0]?.swe && <th className="text-center px-3 py-2 font-medium text-gray-600 border-b">SWE</th>}
                {analysis.competitorTable[0]?.gpqa && <th className="text-center px-3 py-2 font-medium text-gray-600 border-b">GPQA</th>}
                {analysis.competitorTable[0]?.price && <th className="text-center px-3 py-2 font-medium text-gray-600 border-b">Price</th>}
              </tr>
            </thead>
            <tbody>
              {analysis.competitorTable.map((row, i) => {
                const competitorSlug = modelNameToSlug?.[row.name];
                return (
                <tr key={i} className={i === 0 ? "bg-primary-50 font-medium" : ""}>
                  <td className="px-3 py-2 border-b border-gray-100">
                    {competitorSlug ? (
                      <Link href={`/${locale === "ja" ? "" : locale + "/"}models/${competitorSlug}`} className="text-primary-600 hover:text-primary-800 hover:underline">{row.name}</Link>
                    ) : row.name}
                  </td>
                  {row.arena && <td className="text-center px-3 py-2 border-b border-gray-100">{row.arena}</td>}
                  {row.swe && <td className="text-center px-3 py-2 border-b border-gray-100">{row.swe}</td>}
                  {row.gpqa && <td className="text-center px-3 py-2 border-b border-gray-100">{row.gpqa}</td>}
                  {row.price && <td className="text-center px-3 py-2 border-b border-gray-100">{row.price}</td>}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Collapsible detailed sections */}
      <div className="space-y-2">
        <Collapsible title={l.summary} icon={<BookOpen className="w-4 h-4" />}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.summary}</ReactMarkdown>
        </Collapsible>
        <Collapsible title={l.performance} icon={<BarChart3 className="w-4 h-4" />}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.performance}</ReactMarkdown>
        </Collapsible>
        <Collapsible title={l.comparisons} icon={<BarChart3 className="w-4 h-4" />}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.comparisons}</ReactMarkdown>
        </Collapsible>
        <Collapsible title={l.community} icon={<Users className="w-4 h-4" />}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.community}</ReactMarkdown>
        </Collapsible>
        <Collapsible title={l.useCases} icon={<Lightbulb className="w-4 h-4" />}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.useCaseDeep}</ReactMarkdown>
        </Collapsible>
        <Collapsible title={l.news} icon={<Newspaper className="w-4 h-4" />}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.latestNews}</ReactMarkdown>
        </Collapsible>
      </div>

      {/* Sources */}
      {analysis.sources?.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-1.5">{l.sources}</p>
          <ul className="space-y-0.5">
            {analysis.sources.map((s, i) => (
              <li key={i} className="text-xs text-gray-500">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 underline">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">{l.generated}: {analysis.generatedAt?.slice(0, 10)}</p>
    </div>
  );
}
