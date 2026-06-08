import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Calculator, Coins, Search, ArrowRight, TrendingUp, BookOpen, Wrench, ArrowLeftRight, FileText } from "lucide-react";
import blogManifest from "@/data/blog-manifest.json";
import blogManifestEn from "@/data/blog-manifest-en.json";

const T = {
  ja: {
    hero: "最適なAIモデルを、", heroBr: "", hero2: "最短で見つける",
    heroSub: "ベンチマーク比較、API料金、モデル仕様まで。OpenAI、Anthropic、Google、DeepSeekなど、主要AIモデルを日本語で徹底比較。",
    viewRankings: "ランキングを見る", comparePricing: "API料金を比較",
    modelsListed: "掲載モデル", pricingData: "API料金データ", dailyUpdate: "最新情報", dailyUpdateVal: "毎日更新",
    stepsTitle: "AIモデル選定の3ステップ", stepsSub: "ベンチマークから料金まで、意思決定に必要な情報を一元的に提供します",
    step1Title: "モデルを探す", step1Desc: "ベンチマークスコアでランキング。推論・プログラミング・数学などタスク別に最適なモデルを発見。",
    step2Title: "詳細を比較する", step2Desc: "パラメータ数、コンテキスト長、API料金など、気になるモデルの詳細情報を確認。",
    step3Title: "コストを試算する", step3Desc: "API料金と使用量を元に、月額コストを試算。予算に合ったモデル選定をサポート。",
    latestBlog: "最新ブログ", viewAll: "すべて見る",
    toolsTitle: "便利ツール", toolsSub: "AIモデルの選定とコスト計算をサポートするツール集",
    tool1Title: "Token Counter", tool1Desc: "テキストのトークン数を計算。プロンプトコストを事前に見積もり。",
    tool2Title: "コスト計算機", tool2Desc: "API使用量から月額コストを自動計算。予算に合ったモデルを選択。",
    tool3Title: "モデル比較", tool3Desc: "2つのモデルを並列比較。ベンチマーク・料金・性能を一目で確認。",
    tryNow: "使ってみる",
  },
  en: {
    hero: "Find the Best AI Model,", heroBr: "", hero2: "Fast",
    heroSub: "Benchmark comparisons, API pricing, and model specs. Compare OpenAI, Anthropic, Google, DeepSeek, and more.",
    viewRankings: "View Rankings", comparePricing: "Compare Pricing",
    modelsListed: "Models Listed", pricingData: "Pricing Entries", dailyUpdate: "Updated Daily", dailyUpdateVal: "Updated Daily",
    stepsTitle: "3 Steps to Choose the Right AI Model", stepsSub: "Everything you need for informed decisions — benchmarks, specs, and pricing in one place.",
    step1Title: "Find Models", step1Desc: "Browse rankings by benchmark scores. Discover the best models for reasoning, coding, math, and more.",
    step2Title: "Compare Details", step2Desc: "Check parameters, context windows, API pricing, and detailed specs side by side.",
    step3Title: "Calculate Costs", step3Desc: "Estimate monthly costs based on API pricing and your usage. Make budget-smart model choices.",
    latestBlog: "Latest Blog", viewAll: "View All",
    toolsTitle: "Developer Tools", toolsSub: "Tools to help you choose the right AI model and estimate costs",
    tool1Title: "Token Counter", tool1Desc: "Count tokens in your text. Estimate prompt costs before you run.",
    tool2Title: "Cost Calculator", tool2Desc: "Calculate monthly API costs based on your usage. Pick models that fit your budget.",
    tool3Title: "Model Compare", tool3Desc: "Compare two models side by side. Benchmarks, pricing, and performance at a glance.",
    tryNow: "Try Now",
  },
};

const PAGE_TITLES: Record<string, string> = {
  ja: "AI Models Navi — AIモデルの比較・料金・ランキング",
  en: "AI Models Navi — AI Model Comparison, Pricing & Rankings",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: { absolute: PAGE_TITLES[locale as keyof typeof PAGE_TITLES] || PAGE_TITLES.ja },
    description: t.heroSub,
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}`,
      languages: {
        ja: "https://aimodelsnavi.com",
        en: "https://aimodelsnavi.com/en",
        "x-default": "https://aimodelsnavi.com",
      },
    },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;

  const manifest = locale === "en" ? blogManifestEn : blogManifest;
  const sortedPosts = [...manifest].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">{t.hero}<br />{t.hero2}</h1>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl leading-relaxed">{t.heroSub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale === "ja" ? "" : locale + "/"}leaderboard`} className="inline-flex items-center gap-2 px-5 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
                {t.viewRankings}<ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={`/${locale === "ja" ? "" : locale + "/"}pricing`} className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20">
                {t.comparePricing}
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8">
              {[{ value: "200+", label: t.modelsListed }, { value: "160+", label: t.pricingData }, { value: t.dailyUpdateVal, label: t.dailyUpdate }].map((stat) => (
                <div key={stat.label} className="text-white"><div className="text-2xl lg:text-3xl font-bold">{stat.value}</div><div className="text-sm text-primary-200 mt-1">{stat.label}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center mb-12"><h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.stepsTitle}</h2><p className="mt-3 text-gray-500 max-w-xl mx-auto">{t.stepsSub}</p></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[{ step: "01", title: t.step1Title, desc: t.step1Desc, icon: Search }, { step: "02", title: t.step2Title, desc: t.step2Desc, icon: BarChart3 }, { step: "03", title: t.step3Title, desc: t.step3Desc, icon: Calculator }].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="relative p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-200 transition-colors">
                <div className="text-4xl font-bold text-primary-100">{s.step}</div>
                <div className="absolute top-6 right-6 p-2 bg-primary-50 rounded-lg"><Icon className="w-5 h-5 text-primary-600" /></div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">{s.title}</h3><p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.toolsTitle}</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">{t.toolsSub}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: t.tool1Title, desc: t.tool1Desc, icon: FileText, href: `/${locale === "ja" ? "" : locale + "/"}tools/token-counter` },
            { title: t.tool2Title, desc: t.tool2Desc, icon: Calculator, href: `/${locale === "ja" ? "" : locale + "/"}tools/cost-calculator` },
            { title: t.tool3Title, desc: t.tool3Desc, icon: ArrowLeftRight, href: `/${locale === "ja" ? "" : locale + "/"}compare` },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.title} href={tool.href} className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all">
                <div className="p-3 bg-primary-50 rounded-lg w-fit mb-4 group-hover:bg-primary-100 transition-colors">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{tool.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{tool.desc}</p>
                <span className="text-sm font-medium text-primary-600 flex items-center gap-1">
                  {t.tryNow} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {sortedPosts.length > 0 && (
        <section className="bg-gray-50 py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8"><h2 className="text-2xl font-bold text-gray-900">{t.latestBlog}</h2><Link href={`/${locale === "ja" ? "" : locale + "/"}blog`} className="text-sm font-medium text-primary-600 hover:text-primary-700">{t.viewAll} <ArrowRight className="w-4 h-4 inline" /></Link></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPosts.map((post: any) => (
                <Link key={post.slug} href={`/${locale === "ja" ? "" : locale + "/"}blog/${post.slug}`} className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">{post.tag}</span><span className="text-xs text-gray-400">{post.date}</span></div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">{locale === "en" ? (post.title_en || post.title) : post.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{locale === "en" ? (post.excerpt_en || post.excerpt || "") : (post.excerpt || "")}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
