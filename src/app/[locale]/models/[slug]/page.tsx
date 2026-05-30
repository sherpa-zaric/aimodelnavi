import { setRequestLocale } from "next-intl/server";
import { getModelBySlug, modelDetails, type ModelDetail } from "@/data/models";
import { getModelAnalysis } from "@/data/model-analyses";
import { getJpCapabilityBySlug } from "@/data/jp-capability";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle, Lightbulb, Languages } from "lucide-react";
import type { Metadata } from "next";
import ModelAnalysisSection from "@/components/ModelAnalysisSection";
import JpCapabilityBadge from "@/components/JpCapabilityBadge";
import AdSlot from "@/components/AdSlot";

function t(key: string, locale: string): string {
  const dict: Record<string, Record<string, string>> = {
    modelNotFound: { ja: "モデルが見つかりません", en: "Model not found" },
    backToModels: { ja: "モデル一覧に戻る", en: "Back to Models" },
    home: { ja: "ホーム", en: "Home" },
    modelList: { ja: "モデル一覧", en: "Models" },
    openSource: { ja: "オープンソース", en: "Open Source" },
    conditional: { ja: "条件付オープン", en: "Conditional Open" },
    proprietary: { ja: "プロプライエタリ", en: "Proprietary" },
    params: { ja: "パラメータ", en: "Parameters" },
    contextWindow: { ja: "コンテキスト長", en: "Context Window" },
    license: { ja: "ライセンス", en: "License" },
    releaseDate: { ja: "リリース日", en: "Release Date" },
    apiPricing: { ja: "API料金", en: "API Pricing" },
    inputPrice: { ja: "入力料金（1Mトークンあたり）", en: "Input Price (per 1M tokens)" },
    outputPrice: { ja: "出力料金（1Mトークンあたり）", en: "Output Price (per 1M tokens)" },
    billingMode: { ja: "課金モード", en: "Billing Mode" },
    pricingUnavailable: { ja: "このモデルのAPI料金情報は現在未公開です", en: "API pricing for this model is not yet available" },
    strengths: { ja: "強み", en: "Strengths" },
    weaknesses: { ja: "弱み", en: "Weaknesses" },
    useCases: { ja: "活用例", en: "Use Cases" },
    type_reasoning: { ja: "推論", en: "reasoning" },
    type_coder: { ja: "コーディング", en: "coding" },
    type_foundation: { ja: "基盤", en: "foundation" },
    input: { ja: "入力", en: "Input" },
    output: { ja: "出力", en: "Output" },
  };
  return dict[key]?.[locale] || dict[key]?.ja || key;
}

// Translate Japanese data values to English for EN locale
function tv(value: string, locale: string): string {
  if (locale !== "en") return value;
  const map: Record<string, string> = {
    "プロプライエタリ": "Proprietary",
    "オープンソース": "Open Source",
    "条件付オープン": "Conditional Open",
    "非公開": "Undisclosed",
    "個人": "Individual",
    "標準": "Standard",
    "バッチ": "Batch",
    "キャッシュ": "Cache",
    "長文": "Long Context",
  };
  return map[value] || value;
}


// ── JSON-LD Structured Data ──

function buildSoftwareApplicationLd(model: any, locale: string, devName: string): any {
  const ld: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": model.name,
    "description": (locale === "en" ? (model.descriptionEn || model.descriptionJa) : model.descriptionJa).slice(0, 300),
    "applicationCategory": "AIApplication",
    "operatingSystem": "Any",
    "softwareVersion": model.releaseDate || "latest",
    "author": {
      "@type": "Organization",
      "name": devName,
    },
    "offers": model.pricing ? {
      "@type": "Offer",
      "price": String(model.pricing.inputPer1M),
      "priceCurrency": model.pricing.currency === "JPY" ? "JPY" : "USD",
      "description": `API pricing: ${model.pricing.currency === "JPY" ? "¥" : "$"}${model.pricing.inputPer1M} input / ${model.pricing.currency === "JPY" ? "¥" : "$"}${model.pricing.outputPer1M} output per 1M tokens`,
    } : undefined,
  };
  if (model.releaseDate) {
    ld.datePublished = model.releaseDate;
  }
  return ld;
}

function buildBreadcrumbLd(slug: string, modelName: string, locale: string): any {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === "en" ? "Home" : "ホーム",
        "item": "https://aimodelsnavi.com",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": locale === "en" ? "Models" : "モデル一覧",
        "item": `https://aimodelsnavi.com${locale === "ja" ? "" : "/en"}/models`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": modelName,
        "item": `https://aimodelsnavi.com${locale === "ja" ? "" : "/en"}/models/${slug}`,
      },
    ],
  };
}

function buildFaqLd(strengths: string[], weaknesses: string[], useCases: string[], locale: string): any {
  const qas = [];
  if (strengths.length > 0) {
    qas.push({
      "@type": "Question",
      "name": locale === "en" ? `What are the strengths of this model?` : `このモデルの強みは何ですか？`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": strengths.join(" "),
      },
    });
  }
  if (weaknesses.length > 0) {
    qas.push({
      "@type": "Question",
      "name": locale === "en" ? `What are the weaknesses of this model?` : `このモデルの弱みは何ですか？`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": weaknesses.join(" "),
      },
    });
  }
  if (useCases.length > 0) {
    qas.push({
      "@type": "Question",
      "name": locale === "en" ? `What are the best use cases?` : `どんな用途に最適ですか？`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": useCases.join(" "),
      },
    });
  }
  if (qas.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": qas,
  };
}

export function generateStaticParams() {
  return modelDetails.flatMap((model) =>
    ["ja", "en"].map((locale) => ({ slug: model.slug, locale }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: t("modelNotFound", locale) };

  const desc = locale === "en" ? (model.descriptionEn || model.descriptionJa).slice(0, 160) : model.descriptionJa.slice(0, 160);
  const typeLabel = t(`type_${model.type}`, locale);
  const devName = locale === "en" ? (model.developerEn || model.developer) : model.developer;

  return {
    title: `${model.name} (${devName})`,
    description: `${desc} ${devName} ${typeLabel} ${locale === "en" ? "model" : "モデル"}.`.slice(0, 160),
    keywords: [model.name, devName, typeLabel, "AI model", "benchmark", "API pricing", "LLM", locale === "ja" ? "大規模言語モデル" : "large language model"],
    openGraph: {
      title: `${model.name} | AI Models Navi`,
      description: desc.slice(0, 200),
      type: "article",
      images: ["/opengraph-image"],
      url: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/models/${model.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${model.name} | AI Models Navi`,
      description: desc.slice(0, 200),
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}/models/${model.slug}`,
      languages: {
        ja: `https://aimodelsnavi.com/models/${model.slug}`,
        en: `https://aimodelsnavi.com/en/models/${model.slug}`,
        "x-default": `https://aimodelsnavi.com/models/${model.slug}`,
      },
    },
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const desc = locale === "en" ? (model.descriptionEn || model.descriptionJa) : model.descriptionJa;
  const devName = locale === "en" ? (model.developerEn || model.developer) : model.developer;
  const strengths = locale === "en" && model.strengthsEn?.length ? model.strengthsEn : model.strengths;
  const weaknesses = locale === "en" && model.weaknessesEn?.length ? model.weaknessesEn : model.weaknesses;
  const useCases = locale === "en" && model.useCasesEn?.length ? model.useCasesEn : model.useCases;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href={`/${locale === "ja" ? "" : locale + "/"}models`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ArrowLeft className="w-3 h-3" />{t("backToModels", locale)}
      </Link>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-gray-500">{devName}</span>
          {model.openSource === "open" ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">{t("openSource", locale)}</span>
          ) : model.openSource === "open-nc" ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{t("conditional", locale)}</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{t("proprietary", locale)}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">{model.name}</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <p className="text-gray-700 leading-relaxed">{desc}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("params", locale), value: tv(model.params, locale) },
          { label: t("contextWindow", locale), value: model.contextWindow },
          { label: t("license", locale), value: tv(model.license, locale) },
          { label: t("releaseDate", locale), value: model.releaseDate },
        ].map((spec) => (
          <div key={spec.label} className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{spec.label}</p>
            <p className="text-sm font-semibold text-gray-900">{spec.value}</p>
          </div>
        ))}
      </div>

      {/* Japanese Language Capability */}
      {(() => {
        const jpCap = getJpCapabilityBySlug(slug);
        if (!jpCap) return null;
        return (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-600" />
              {locale === "en" ? "Japanese Language Capability" : "日本語性能"}
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <JpCapabilityBadge level={jpCap.jpLevel} badge={locale === "en" ? jpCap.badgeEn : jpCap.badgeJa} />
            </div>
            <p className="text-sm text-gray-700">
              {locale === "en" ? jpCap.descriptionEn : jpCap.descriptionJa}
            </p>
            {(jpCap.japaneseMtBench || jpCap.jglue || jpCap.jmmlu) && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {jpCap.japaneseMtBench && (
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Japanese MT-Bench</p>
                    <p className="text-lg font-bold text-blue-700">{jpCap.japaneseMtBench}</p>
                  </div>
                )}
                {jpCap.jglue && (
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">JGLUE</p>
                    <p className="text-lg font-bold text-blue-700">{jpCap.jglue}</p>
                  </div>
                )}
                {jpCap.jmmlu && (
                  <div className="text-center p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">JMMLU</p>
                    <p className="text-lg font-bold text-blue-700">{jpCap.jmmlu}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {model.pricing ? (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t("apiPricing", locale)}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">{t("inputPrice", locale)}</p>
              <p className="text-2xl font-bold text-primary-700">{model.pricing.currency === "JPY" ? "¥" : "$"}{model.pricing.inputPer1M}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("outputPrice", locale)}</p>
              <p className="text-2xl font-bold text-primary-700">{model.pricing.currency === "JPY" ? "¥" : "$"}{model.pricing.outputPer1M}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("billingMode", locale)}: {tv(model.pricing.billingMode, locale)}</p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t("apiPricing", locale)}</h2>
          <p className="text-sm text-gray-500">{t("pricingUnavailable", locale)}</p>
        </div>
      )}

      <AdSlot position="model-inline" className="my-6 flex justify-center" />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />{t("strengths", locale)}</h3>
          <ul className="space-y-1.5">{strengths.map((s: string) => (<li key={s} className="text-sm text-emerald-700">・{s}</li>))}</ul>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{t("weaknesses", locale)}</h3>
          <ul className="space-y-1.5">{weaknesses.map((w: string) => (<li key={w} className="text-sm text-amber-700">・{w}</li>))}</ul>
        </div>
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-sky-800 mb-3 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" />{t("useCases", locale)}</h3>
          <ul className="space-y-1.5">{useCases.map((u: string) => (<li key={u} className="text-sm text-sky-700">・{u}</li>))}</ul>
        </div>
      </div>

      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildBreadcrumbLd(slug, model.name, locale)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildSoftwareApplicationLd(model, locale, devName)),
        }}
      />
      {(() => {
        const faqLd = buildFaqLd(strengths, weaknesses, useCases, locale);
        if (!faqLd) return null;
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
          />
        );
      })()}

      {/* Deep Analysis Section */}
      {(() => {
        const analysis = getModelAnalysis(slug, locale);
        if (!analysis) return null;
        const modelNameToSlug = Object.fromEntries(
          modelDetails.map((m: ModelDetail) => [m.name, m.slug])
        );
        return <ModelAnalysisSection analysis={analysis} locale={locale} modelNameToSlug={modelNameToSlug} />;
      })()}
    </div>
  );
}
