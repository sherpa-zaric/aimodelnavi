import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import AnalysisTabs from "@/components/AnalysisTabs";

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

export default function ModelAnalysisSection({ analysis, locale, modelNameToSlug }: Props) {
  const l = locale === "en" ? {
    title: "Deep Analysis",
    pros: "Strengths",
    cons: "Weaknesses",
    compare: "Competitor Comparison",
    sources: "Sources",
    generated: "Analysis generated",
    summary: "Overview",
    performance: "Benchmarks & Performance",
    comparisons: "Detailed Comparison",
    community: "Community Feedback",
    useCases: "Use Cases",
    news: "Latest News",
  } : {
    title: "深度分析",
    pros: "強み",
    cons: "弱み",
    compare: "競合比較",
    sources: "出典",
    generated: "分析生成日",
    summary: "概要",
    performance: "ベンチマーク＆性能",
    comparisons: "詳細比較",
    community: "コミュニティ評価",
    useCases: "ユースケース",
    news: "最新ニュース",
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

      {/* Noscript fallback: render all sections as plain text for non-JS crawlers */}
      <noscript>
        <div className="space-y-6 mt-4">
          {[
            { title: l.summary, content: analysis.summary },
            { title: l.performance, content: analysis.performance },
            { title: l.comparisons, content: analysis.comparisons },
            { title: l.community, content: analysis.community },
            { title: l.useCases, content: analysis.useCaseDeep },
            { title: l.news, content: analysis.latestNews },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      </noscript>

      {/* Interactive tab-based analysis sections */}
      <AnalysisTabs
        summary={analysis.summary}
        performance={analysis.performance}
        comparisons={analysis.comparisons}
        community={analysis.community}
        useCaseDeep={analysis.useCaseDeep}
        latestNews={analysis.latestNews}
        locale={locale}
      />

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
