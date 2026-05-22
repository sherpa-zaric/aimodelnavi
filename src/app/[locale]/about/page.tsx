import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const T = {
  ja: {
    title: "当サイトについて",
    description: "AI Models Naviは、最新のAIモデル（LLM）のベンチマーク比較、API料金比較、モデル仕様情報を日本語で提供するプラットフォームです。データ収集方針とお問い合わせ情報。",
    ogTitle: "当サイトについて | AI Models Navi",
    ogDesc: "AI Models Naviのデータ収集方針、提供する情報、お問い合わせ先。",
    whatTitle: "AI Models Naviとは",
    whatDesc: "AI Models Naviは、最新のAIモデル（大規模言語モデル）に関する情報を日本語で提供するプラットフォームです。ベンチマーク比較、API料金比較、モデル仕様情報を一元化し、開発者や企業が最適なAIモデルを選定するための意思決定をサポートします。",
    infoTitle: "提供する情報",
    info1: "AIモデルランキング",
    info1desc: "HLE、ARC-AGI-2、SWE-bench Verifiedなど主要ベンチマークに基づくモデルランキング",
    info2: "API料金比較",
    info2desc: "OpenAI、Anthropic、Google、DeepSeekなど主要プロバイダーのAPI料金を1Mトークンあたりで比較",
    info3: "モデル一覧",
    info3desc: "各モデルのパラメータ数、コンテキスト長、ライセンス、性能概要",
    info4: "コスト計算ツール",
    info4desc: "使用量に基づく月額APIコストの試算",
    info5: "ブログ",
    info5desc: "AIモデルの最新ニュース、ベンチマーク分析、技術解説",
    dataTitle: "データについて",
    dataDesc: "当サイトのデータは、以下の優先順位で収集しています：",
    data1: "各モデルの公式GitHubリポジトリ、Hugging Faceモデルカード、製品ページ、学術論文",
    data2: "標準ベンチマーク（MMLU、GSM8K、HumanEval）およびコミュニティリーダーボード（LMSYS Chatbot Arena、Open LLM Leaderboard）",
    data3: "独立した第三者評価機関（Artificial Analysis等）のデータ",
    dataNote: "データは定期的に更新していますが、最新の正確な情報は各公式サイトでご確認ください。",
    contactTitle: "お問い合わせ",
    contactDesc: "当サイトに関するご意見・ご要望がございましたら、以下のメールアドレスまでお気軽にお寄せください。",
  },
  en: {
    title: "About",
    description: "AI Models Navi is a platform providing AI model benchmark comparisons, API pricing, and model specifications in English. Data collection policy and contact information.",
    ogTitle: "About | AI Models Navi",
    ogDesc: "AI Models Navi data collection policy, information provided, and contact details.",
    whatTitle: "What is AI Models Navi",
    whatDesc: "AI Models Navi is a platform providing information about the latest AI models (large language models). It consolidates benchmark comparisons, API pricing, and model specifications to help developers and businesses make informed decisions when selecting AI models.",
    infoTitle: "Information Provided",
    info1: "AI Model Rankings",
    info1desc: "Model rankings based on major benchmarks such as HLE, ARC-AGI-2, SWE-bench Verified",
    info2: "API Pricing Comparison",
    info2desc: "Compare API pricing per 1M tokens from major providers including OpenAI, Anthropic, Google, DeepSeek",
    info3: "Model List",
    info3desc: "Parameter counts, context windows, licenses, and performance summaries for each model",
    info4: "Cost Calculator",
    info4desc: "Estimate monthly API costs based on usage",
    info5: "Blog",
    info5desc: "Latest AI model news, benchmark analysis, and technical commentary",
    dataTitle: "About the Data",
    dataDesc: "Our data is collected in the following priority order:",
    data1: "Official GitHub repositories, Hugging Face model cards, product pages, and academic papers for each model",
    data2: "Standard benchmarks (MMLU, GSM8K, HumanEval) and community leaderboards (LMSYS Chatbot Arena, Open LLM Leaderboard)",
    data3: "Data from independent third-party evaluation organizations (e.g., Artificial Analysis)",
    dataNote: "Data is updated regularly, but please check official sources for the most accurate and up-to-date information.",
    contactTitle: "Contact",
    contactDesc: "If you have any feedback or requests, please feel free to reach out to us at the following email address.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: t.title,
    description: t.description,
    openGraph: { title: t.ogTitle, description: t.ogDesc },
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/about`,
      languages: {
        ja: "https://aimodelsnavi.com/about",
        en: "https://aimodelsnavi.com/en/about",
        "x-default": "https://aimodelsnavi.com/about",
      },
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-bold text-gray-900">{t.whatTitle}</h2>
          <p className="text-gray-600 leading-relaxed">{t.whatDesc}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">{t.infoTitle}</h2>
          <ul className="text-gray-600 leading-relaxed space-y-2">
            <li><strong>{t.info1}</strong>{locale === "en" ? ": " : "：" }{t.info1desc}</li>
            <li><strong>{t.info2}</strong>{locale === "en" ? ": " : "：" }{t.info2desc}</li>
            <li><strong>{t.info3}</strong>{locale === "en" ? ": " : "：" }{t.info3desc}</li>
            <li><strong>{t.info4}</strong>{locale === "en" ? ": " : "：" }{t.info4desc}</li>
            <li><strong>{t.info5}</strong>{locale === "en" ? ": " : "：" }{t.info5desc}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">{t.dataTitle}</h2>
          <p className="text-gray-600 leading-relaxed">{t.dataDesc}</p>
          <ol className="text-gray-600 leading-relaxed space-y-1 list-decimal pl-5">
            <li>{t.data1}</li>
            <li>{t.data2}</li>
            <li>{t.data3}</li>
          </ol>
          <p className="text-gray-600 leading-relaxed mt-3">{t.dataNote}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">{t.contactTitle}</h2>
          <p className="text-gray-600 leading-relaxed">{t.contactDesc}</p>
          <p className="text-primary-600 font-medium">contact@aimodelsnavi.com</p>
        </section>
      </div>
    </div>
  );
}
