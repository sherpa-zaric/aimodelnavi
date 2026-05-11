import { getModelBySlug } from '@/data/models';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

export function generateStaticParams() {
  // Slugs must match the model detail data
  const slugs = [
    "claude-mythos-preview", "gpt-5-2", "gemini-3-0-pro", "claude-opus-4-7",
    "deepseek-v3-2", "qwen3-6-27b", "gemma-4-31b", "gpt-5-1-codex-max", "grok-4-2-beta",
    "plamo-2-0", "namazu-deepseek-v3-1", "llama-3-namazu-405b",
    "llama-3-elyza-jp-8b", "elyza-thinking-1-0-qwen-32b", "youri-7b", "tsuzumi", "takane",
  ];
  return slugs.map((slug) => ({ slug }));
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getModelBySlug(slug);

  if (!model) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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