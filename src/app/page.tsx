import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Calculator,
  Coins,
  Search,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Models Navi — AIモデルの比較・料金・ランキング",
  description:
    "最新のAIモデル（LLM）のスペック、ベンチマーク性能、API料金を日本語で比較。OpenAI、Anthropic、Google、DeepSeek、アリババなど250以上のモデルを網羅。",
  alternates: {
    canonical: "https://aimodelsnavi.com",
  },
};

function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Models Navi",
    url: "https://aimodelsnavi.com",
    description: "最新のAIモデルのベンチマーク比較、API料金比較、モデル情報を日本語で提供。",
    inLanguage: "ja",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://aimodelsnavi.com/models?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function Home() {
  return (
    <div>
      <JsonLd />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              最適なAIモデルを、
              <br />
              最短で見つける
            </h1>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl leading-relaxed">
              ベンチマーク比較、API料金、モデル仕様まで。
              <br className="hidden sm:block" />
              OpenAI、Anthropic、Google、DeepSeekなど、主要AIモデルを日本語で徹底比較。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg shadow-primary-900/20"
              >
                ランキングを見る
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
              >
                API料金を比較
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              {[
                { value: "200+", label: "掲載モデル" },
                { value: "160+", label: "API料金データ" },
                { value: "毎日更新", label: "最新情報" },
              ].map((stat) => (
                <div key={stat.label} className="text-white">
                  <div className="text-2xl lg:text-3xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-sm text-primary-200 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Decision Pathway — 3 steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            AIモデル選定の3ステップ
          </h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            ベンチマークから料金まで、意思決定に必要な情報を一元的に提供します
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "モデルを探す",
              desc: "ベンチマークスコアでランキング。推論・プログラミング・数学などタスク別に最適なモデルを発見。",
              icon: Search,
              href: "/leaderboard",
              color: "bg-primary-50 text-primary-600",
            },
            {
              step: "02",
              title: "詳細を比較する",
              desc: "コンテキスト長、ライセンス、オープンソースか否かなど、多次元でモデルを比較検討。",
              icon: TrendingUp,
              href: "/tools/model-compare",
              color: "bg-accent-50 text-accent-600",
            },
            {
              step: "03",
              title: "コストを試算する",
              desc: "API料金比較とコスト計算ツールで、予算に合ったモデル選びをサポート。",
              icon: Calculator,
              href: "/tools/cost-calculator",
              color: "bg-emerald-50 text-emerald-600",
            },
          ].map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="group block p-6 rounded-2xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-gray-400">
                  STEP {item.step}
                </span>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Content entry points */}
      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
              使いたい機能から探す
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "AIモデルランキング",
                desc: "HLE、ARC-AGI-2、SWE-benchなど主要ベンチマークの統合ランキング",
                icon: BarChart3,
                href: "/leaderboard",
              },
              {
                title: "API料金比較",
                desc: "165件以上のAPI料金を入力/出力トークン単価で一覧比較",
                icon: Coins,
                href: "/pricing",
              },
              {
                title: "モデル一覧",
                desc: "200以上のモデルをパラメータ数・コンテキスト長・ライセンスで検索",
                icon: BookOpen,
                href: "/models",
              },
              {
                title: "コスト計算ツール",
                desc: "使用量から月額APIコストを試算、複数モデルの費用比較が可能",
                icon: Calculator,
                href: "/tools/cost-calculator",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group block p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <item.icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest blog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">最新ブログ</h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            すべて見る
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title:
                "GPT-5.2のベンチマーク総まとめ：コーディング・推論性能を徹底検証",
              date: "2026-05-07",
              tag: "OpenAI",
            },
            {
              title:
                "Claude Opus 4.7 発表：MythosアーキテクチャとManaged Agentsの全貌",
              date: "2026-04-16",
              tag: "Anthropic",
            },
            {
              title:
                "【2026年5月版】主要AIモデルAPI料金の完全比較一覧",
              date: "2026-05-01",
              tag: "料金比較",
            },
          ].map((post) => (
            <Link
              key={post.title}
              href="/blog"
              className="blog-card group block p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mb-3">
                {post.tag}
              </span>
              <h2 className="font-bold text-gray-900 leading-snug transition-colors">
                {post.title}
              </h2>
              <time className="block mt-3 text-xs text-gray-400">
                {post.date}
              </time>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-white">
            どのAIモデルを使うべきか、迷っていませんか？
          </h2>
          <p className="mt-2 text-primary-100 text-sm">
            まずはランキングから、あなたのタスクに最適なモデルを探してみましょう
          </p>
          <Link
            href="/leaderboard"
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
          >
            ランキングを今すぐ見る
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
