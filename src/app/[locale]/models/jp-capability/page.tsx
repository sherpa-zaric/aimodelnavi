import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { jpCapabilityData, type JpCapability } from "@/data/jp-capability";
import JpCapabilityBadge from "@/components/JpCapabilityBadge";

const T = {
  ja: {
    title: "日本語性能レーティング",
    desc: "AIモデルの日本語処理能力を比較。ネイティブJP対応から多言語対応まで、モデル別の日本語能力を確認できます。",
    models: "件のモデル",
    native: "ネイティブJP",
    high: "高品質日本語",
    moderate: "多言語対応",
    viewDetail: "詳細を見る",
    levelDesc: {
      native: "日本企業が開発したモデルまたは日本語に特化したモデル",
      high: "多言語対応モデルのうち、日本語処理に優れた性能を持つモデル",
      moderate: "一般的な多言語対応モデル",
    },
  },
  en: {
    title: "Japanese Language Performance Rating",
    desc: "Compare Japanese language processing capabilities of AI models. From native JP to multilingual support.",
    models: "models",
    native: "Native JP",
    high: "High-Quality JP",
    moderate: "Multilingual",
    viewDetail: "View Details",
    levelDesc: {
      native: "Model developed by a Japanese company or specialized for Japanese",
      high: "Multilingual model with strong Japanese processing",
      moderate: "General multilingual model",
    },
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = T[locale as keyof typeof T] || T.ja;
  return {
    title: t.title,
    description: t.desc,
    alternates: { canonical: "https://aimodelsnavi.com/models/jp-capability" },
  };
}

const levels = ["native", "high", "moderate"] as const;

export default async function JpCapabilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = T[locale as keyof typeof T] || T.ja;
  const prefix = locale === "ja" ? "" : `/${locale}`;

  const grouped = levels.map((level) => ({
    level,
    models: jpCapabilityData.filter((c) => c.jpLevel === level),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.title}
        </h1>
        <p className="mt-2 text-gray-500">{t.desc}</p>
      </div>

      {grouped.map(({ level, models }) => (
        <div key={level} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <JpCapabilityBadge level={level} badge={t.levelDesc[level]} />
            <span className="text-sm text-gray-500">
              {models.length} {t.models}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map((m) => (
              <Link
                key={m.slug}
                href={`${prefix}/models/${m.slug}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.developer}</p>
                </div>
                <span className="text-xs font-medium text-primary-600 shrink-0 ml-3">
                  {t.viewDetail}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
