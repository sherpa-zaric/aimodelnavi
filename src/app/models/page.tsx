import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Model {
  name: string;
  developer: string;
  params: string;
  contextWindow: string;
  license: string;
  openSource: boolean;
  type: string;
  releaseDate: string;
  descriptionJa: string;
}

const models: Model[] = [
  {
    name: 'Claude Mythos Preview',
    developer: 'Anthropic',
    params: '非公開',
    contextWindow: '200K',
    license: 'プロプライエタリ',
    openSource: false,
    type: '推論',
    releaseDate: '2026-04-08',
    descriptionJa: 'Anthropicの最新推論特化モデル。HLEベンチマークで64.70を記録し、複雑な推論タスクでトップクラスの性能を発揮。',
  },
  {
    name: 'GPT-5.2',
    developer: 'OpenAI',
    params: '非公開',
    contextWindow: '256K',
    license: 'プロプライエタリ',
    openSource: false,
    type: '基盤',
    releaseDate: '2026-04-20',
    descriptionJa: 'OpenAIの最新主力モデル。高速な応答と高い推論能力を両立し、幅広いタスクで安定した性能を示す。',
  },
  {
    name: 'Gemini 3.0 Pro',
    developer: 'Google DeepMind',
    params: '非公開',
    contextWindow: '2M',
    license: 'プロプライエタリ',
    openSource: false,
    type: '基盤',
    releaseDate: '2026-03-15',
    descriptionJa: '200万トークンの超長コンテキストをサポート。マルチモーダル対応で、テキスト・画像・音声を統合処理。',
  },
  {
    name: 'Claude Opus 4.7',
    developer: 'Anthropic',
    params: '非公開',
    contextWindow: '200K',
    license: 'プロプライエタリ',
    openSource: false,
    type: 'チャット',
    releaseDate: '2026-04-16',
    descriptionJa: 'Anthropicの高性能チャットモデル。Managed Agents機能を搭載し、自律的なタスク実行が可能。',
  },
  {
    name: 'Qwen3.6-27B',
    developer: 'Alibaba',
    params: '27B',
    contextWindow: '128K',
    license: 'Apache 2.0',
    openSource: true,
    type: '基盤',
    releaseDate: '2026-04-22',
    descriptionJa: 'Alibabaのオープンソースモデル。27Bパラメータで効率的な性能を実現。商用利用可能。',
  },
  {
    name: 'DeepSeek V3.2',
    developer: 'DeepSeek-AI',
    params: '685B (MoE)',
    contextWindow: '128K',
    license: 'MIT',
    openSource: true,
    type: '基盤',
    releaseDate: '2026-03-28',
    descriptionJa: 'MoEアーキテクチャ採用の大規模オープンソースモデル。コストパフォーマンスに優れ、API料金も低価格。',
  },
  {
    name: 'GPT-5.2-Codex',
    developer: 'OpenAI',
    params: '非公開',
    contextWindow: '256K',
    license: 'プロプライエタリ',
    openSource: false,
    type: 'コーディング',
    releaseDate: '2026-04-30',
    descriptionJa: 'コーディング特化のGPT-5.2派生モデル。SWE-bench Verifiedでトップクラスのスコアを記録。',
  },
  {
    name: 'Gemma 4 31B',
    developer: 'Google DeepMind',
    params: '31B',
    contextWindow: '128K',
    license: 'Gemmaライセンス',
    openSource: true,
    type: '基盤',
    releaseDate: '2026-04-06',
    descriptionJa: 'Googleの軽量オープンモデル。31Bパラメータで効率的な性能を提供。商用利用可能。',
  },
];

export default function ModelsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">モデル一覧</h1>
        <p className="mt-2 text-gray-500">
          主要AIモデルの仕様・ライセンス・性能概要を一覧で比較できます。
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {models.map((model) => (
          <Link
            key={model.name}
            href={`/models/${model.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-')}`}
            className="group block p-6 rounded-xl border border-gray-100 bg-white hover:border-primary-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                {model.name}
              </h3>
              {model.openSource ? (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                  オープンソース
                </span>
              ) : (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                  プロプライエタリ
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              {model.descriptionJa}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">開発元</span>
                <p className="font-medium text-gray-700">{model.developer}</p>
              </div>
              <div>
                <span className="text-gray-400">パラメータ</span>
                <p className="font-medium text-gray-700">{model.params}</p>
              </div>
              <div>
                <span className="text-gray-400">コンテキスト長</span>
                <p className="font-medium text-gray-700">{model.contextWindow}</p>
              </div>
              <div>
                <span className="text-gray-400">タイプ</span>
                <p className="font-medium text-gray-700">{model.type}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-xs font-medium text-primary-600">
              詳細を見る
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
