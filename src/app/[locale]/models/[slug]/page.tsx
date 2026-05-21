import { setRequestLocale } from 'next-intl/server';
import { getModelBySlug, modelDetails } from '@/data/models';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return modelDetails.flatMap((model) =>
    ["ja", "en", "ko"].map((locale) => ({ slug: model.slug, locale }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: "モデルが見つかりません" };

  const pricing = model.pricing
    ? ` 入力$${model.pricing.inputPer1M}/1M、出力$${model.pricing.outputPer1M}/1M。`
    : "";
  const description = `${model.descriptionJa.slice(0, 120)}${pricing} ${model.developer}の${model.type === "reasoning" ? "推論" : model.type === "coder" ? "コーディング" : "基盤"}モデル。`.slice(0, 160);

  return {
    title: `${model.name} (${model.developer})`,
    description,
    openGraph: {
      title: `${model.name} | AI Models Navi`,
      description: model.descriptionJa.slice(0, 200),
      type: "article",
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical: `https://aimodelsnavi.com/models/${model.slug}`,
    },
  };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const model = getModelBySlug(slug);

  if (!model) notFound();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://aimodelsnavi.com" },
      { "@type": "ListItem", position: 2, name: "モデル一覧", item: "https://aimodelsnavi.com/models" },
      { "@type": "ListItem", position: 3, name: model.name },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name,
    author: {
      "@type": "Organization",
      name: model.developer,
      ...(model.developerUrl ? { url: model.developerUrl } : {}),
    },
    description: model.descriptionJa,
    datePublished: model.releaseDate,
    license: model.license,
    applicationCategory: model.type === "coder" ? "DeveloperApplication" : "BusinessApplication",
    ...(model.pricing ? {
      offers: {
        "@type": "Offer",
        price: model.pricing.inputPer1M,
        priceCurrency: model.pricing.currency,
        description: `入力$${model.pricing.inputPer1M}/1Mトークン、出力$${model.pricing.outputPer1M}/1Mトークン`,
      },
    } : {}),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbLd, jsonLd]) }}
      />
      <Link
        href="/models"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        モデル一覧に戻る
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={model.developerUrl}
            target="_blank"
            className="text-sm text-gray-500 hover:text-primary-600"
          >
            {model.developer}
          </Link>
          {model.openSource === "open" ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              オープンソース
            </span>
          ) : model.openSource === "open-nc" ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              条件付オープン
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              プロプライエタリ
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {model.name}
        </h1>
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <p className="text-gray-700 leading-relaxed">{model.descriptionJa}</p>
      </div>

      {/* Specs grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "パラメータ", value: model.params },
          { label: "コンテキスト長", value: model.contextWindow },
          { label: "ライセンス", value: model.license },
          { label: "リリース日", value: model.releaseDate },
        ].map((spec) => (
          <div key={spec.label} className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{spec.label}</p>
            <p className="text-sm font-semibold text-gray-900">{spec.value}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      {model.pricing && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">API料金</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">入力料金（1Mトークンあたり）</p>
              <p className="text-2xl font-bold text-primary-700">
                {model.pricing.currency === "JPY" ? "¥" : "$"}
                {model.pricing.inputPer1M}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">出力料金（1Mトークンあたり）</p>
              <p className="text-2xl font-bold text-primary-700">
                {model.pricing.currency === "JPY" ? "¥" : "$"}
                {model.pricing.outputPer1M}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            課金モード：{model.pricing.billingMode}
          </p>
        </div>
      )}

      {!model.pricing && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">API料金</h2>
          <p className="text-sm text-gray-500">
            このモデルのAPI料金情報は現在未公開です。最新情報は各公式サイトでご確認ください。
          </p>
        </div>
      )}

      {/* Strengths / Weaknesses / Use Cases */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            強み
          </h3>
          <ul className="space-y-1.5">
            {model.strengths.map((s) => (
              <li key={s} className="text-sm text-emerald-700">・{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            弱み
          </h3>
          <ul className="space-y-1.5">
            {model.weaknesses.map((w) => (
              <li key={w} className="text-sm text-amber-700">・{w}</li>
            ))}
          </ul>
        </div>
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-primary-800 mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4" />
            活用場面
          </h3>
          <ul className="space-y-1.5">
            {model.useCases.map((u) => (
              <li key={u} className="text-sm text-primary-700">・{u}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Links */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">関連リンク</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(model.links).map(([type, url]) => {
            if (!url) return null;
            const labels: Record<string, string> = {
              official: "公式サイト",
              huggingface: "Hugging Face",
              paper: "論文",
              api: "API",
            };
            return (
              <a
                key={type}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors border border-gray-200"
              >
                {labels[type] || type}
                <ExternalLink className="w-3 h-3" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}