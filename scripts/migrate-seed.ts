#!/usr/bin/env tsx

/**
 * migrate-seed.ts
 *
 * One-time migration: imports the 17 hand-curated models from src/data/models.ts
 * into the SQLite database with is_core=1 and priority=10.
 *
 * Usage: npx tsx scripts/migrate-seed.ts
 */

import { migrate, getSourceId, upsertModel, getModelCount } from "./lib/db";

// The 17 hand-curated models from the existing src/data/models.ts
// We import the actual data by re-exporting from the TypeScript file
// Since we can't import TS data files directly from scripts (they're excluded from tsconfig),
// we hard-code the seed data here.

const SEED_MODELS = [
  { slug: "claude-mythos-preview", name: "Claude Mythos Preview", developer: "Anthropic", developer_url: "https://www.anthropic.com", params: "非公開", context_window: "200K", license: "プロプライエタリ", license_status: "closed", category: "reasoning", release_date: "2026-04-08", description_ja: "Anthropicの最新推論特化モデル。Mythosアーキテクチャを採用し、HLEベンチマークで64.70を記録するなど、複雑な推論タスクにおいて現在最高水準の性能を発揮する。Managed Agents機能により、自律的なツール利用やマルチステップのタスク実行が可能。安全性と性能の両立を重視した設計が特徴。", strengths: '["推論能力が業界最高水準","Managed Agentsによる自律タスク実行","200Kトークンの長文コンテキスト対応","安全性への配慮"]', weaknesses: '["API料金が高額","オープンソースではない","推論速度がやや遅い"]', use_cases: '["複雑な推論タスク","自律エージェント","長文の分析・要約","高度なプログラミング支援"]', links_json: '{"official":"https://www.anthropic.com","api":"https://console.anthropic.com"}', pricing_json: '{"inputPer1M":15,"outputPer1M":75,"currency":"USD","billingMode":"標準","url":"https://www.anthropic.com/pricing"}', is_japanese: 0 },
  { slug: "gpt-5-2", name: "GPT-5.2", developer: "OpenAI", developer_url: "https://openai.com", params: "非公開", context_window: "256K", license: "プロプライエタリ", license_status: "closed", category: "foundation", release_date: "2026-04-20", description_ja: "OpenAIの主力汎用モデル。前世代GPT-5.1から推論・コーディング性能を大幅に向上させた。256Kトークンのコンテキストウィンドウをサポートし、幅広いタスクで安定した高性能を発揮する。", strengths: '["汎用性が高い","256Kの長文コンテキスト","Instant版で高速・低コスト","エコシステムが充実"]', weaknesses: '["Pro版は高額","オープンソースではない","日本語処理は専用モデルに劣る場合がある"]', use_cases: '["汎用的なテキスト生成","コーディング支援","長文の要約・分析","チャットボット"]', links_json: '{"official":"https://openai.com","api":"https://platform.openai.com"}', pricing_json: '{"inputPer1M":1.25,"outputPer1M":10,"currency":"USD","billingMode":"標準","url":"https://openai.com/api/pricing/"}', is_japanese: 0 },
  { slug: "gemini-3-0-pro", name: "Gemini 3.0 Pro", developer: "Google DeepMind", developer_url: "https://deepmind.google", params: "非公開", context_window: "2M", license: "プロプライエタリ", license_status: "closed", category: "foundation", release_date: "2026-03-15", description_ja: "Google DeepMindの最新フラッグシップモデル。200万トークンの超長コンテキストをサポートし、テキスト・画像・音声を統合的に処理できるマルチモーダル対応が特徴。", strengths: '["200万トークンの超長コンテキスト","マルチモーダル対応","Flash版が低コスト・高速","Google Cloudとの連携"]', weaknesses: '["長文コンテキスト使用時は料金が倍増","オープンソースではない","APIレスポンスがやや不安定な場合がある"]', use_cases: '["長文書の分析・要約","画像を含むマルチモーダルタスク","Google Cloud環境でのAI活用","大量データのバッチ処理"]', links_json: '{"official":"https://deepmind.google","api":"https://ai.google.dev"}', pricing_json: '{"inputPer1M":1.25,"outputPer1M":5,"currency":"USD","billingMode":"標準","url":"https://ai.google.dev/pricing"}', is_japanese: 0 },
  { slug: "claude-opus-4-7", name: "Claude Opus 4.7", developer: "Anthropic", developer_url: "https://www.anthropic.com", params: "非公開", context_window: "200K", license: "プロプライエタリ", license_status: "closed", category: "chat", release_date: "2026-04-16", description_ja: "Anthropicの高性能チャットモデル。Mythosアーキテクチャをベースに、対話形式のタスクに最適化されている。Managed Agents機能を搭載し、複雑な業務フローの自動化に対応。", strengths: '["Managed Agentsによる業務自動化","キャッシュでコスト削減可能","対話品質が高い","バッチAPIで50%割引"]', weaknesses: '["標準料金は最高水準","オープンソースではない","推論モデルに比べ推論性能は低い"]', use_cases: '["業務プロセスの自動化","チャットボット・対話システム","顧客サポートAI","長期的な対話コンテキストを要するタスク"]', links_json: '{"official":"https://www.anthropic.com","api":"https://console.anthropic.com"}', pricing_json: '{"inputPer1M":15,"outputPer1M":75,"currency":"USD","billingMode":"標準","url":"https://www.anthropic.com/pricing"}', is_japanese: 0 },
  { slug: "deepseek-v3-2", name: "DeepSeek V3.2", developer: "DeepSeek-AI", developer_url: "https://deepseek.com", params: "685B (MoE)", context_window: "128K", license: "MIT", license_status: "open", category: "foundation", release_date: "2026-03-28", description_ja: "中国のDeepSeek-AIが開発したオープンソース大規模モデル。Mixture-of-Experts（MoE）アーキテクチャを採用し、685Bパラメータのうち推論時に活性化されるのは一部のみという効率的な設計。MITライセンスで商用利用が可能でありながら、API料金も極めて低価格。", strengths: '["MITライセンスで商用利用可能","API料金が極めて低額","MoEアーキテクチャで効率的","128Kコンテキスト対応"]', weaknesses: '["日本語処理能力は日本語特化モデルに劣る","サーバーが中国国内にある場合あり","推論速度がやや遅い"]', use_cases: '["コスト重視の大規模処理","オンプレミスでのモデル運用","MoEアーキテクチャの研究","商用サービスへの組み込み"]', links_json: '{"official":"https://deepseek.com","huggingface":"https://huggingface.co/deepseek-ai","api":"https://platform.deepseek.com"}', pricing_json: '{"inputPer1M":0.27,"outputPer1M":1.1,"currency":"USD","billingMode":"標準","url":"https://api-docs.deepseek.com/quick_start/pricing"}', is_japanese: 0 },
  { slug: "qwen3-6-27b", name: "Qwen3.6-27B", developer: "Alibaba", developer_url: "https://tongyi.aliyun.com", params: "27B", context_window: "128K", license: "Apache 2.0", license_status: "open", category: "foundation", release_date: "2026-04-22", description_ja: "Alibabaが開発したオープンソースモデルの最新版。27Bパラメータで軽量ながら高性能を実現しており、Apache 2.0ライセンスで商用利用が可能。多言語対応が強化されており、日本語処理能力も前世代から大幅に向上。", strengths: '["Apache 2.0で商用利用可能","軽量で高速","多言語対応（日本語含む）","コミュニティが活発"]', weaknesses: '["フロンティアモデルには性能で劣る","日本語処理は特化モデルに及ばない","Alibaba Cloud以外のAPI選択肢が限定的"]', use_cases: '["オープンソースでの開発・研究","軽量モデルが必要なエッジデプロイ","多言語対応アプリ","コスト重視の商用サービス"]', links_json: '{"official":"https://tongyi.aliyun.com","huggingface":"https://huggingface.co/Qwen"}', pricing_json: '{"inputPer1M":0.35,"outputPer1M":1.4,"currency":"USD","billingMode":"標準","url":"https://help.aliyun.com/document_detail/2712572.html"}', is_japanese: 0 },
  { slug: "gemma-4-31b", name: "Gemma 4 31B", developer: "Google DeepMind", developer_url: "https://deepmind.google", params: "31B", context_window: "128K", license: "Gemma License", license_status: "open-nc", category: "foundation", release_date: "2026-04-06", description_ja: "Google DeepMindの軽量オープンモデルの最新版。31Bパラメータで効率的な性能を提供し、Gemmaライセンスのもと商用利用も可能（条件あり）。ローカル環境での動作も現実的であり、プライバシー要件の厳しい環境での利用に適する。", strengths: '["軽量でローカル動作が可能","Gemmaライセンスで商用利用可能（条件付）","Googleの技術ベース","コミュニティが活発"]', weaknesses: '["非商用制限あり（Gemma License）","日本語能力は限定的","フロンティアモデルとの性能差が大きい","API提供がない（セルフホストのみ）"]', use_cases: '["ローカル環境でのAI活用","プライバシー重視のアプリ","モデルのファインチューニング","研究・実験用途"]', links_json: '{"official":"https://ai.google.dev/gemma","huggingface":"https://huggingface.co/google/gemma-4-31b"}', is_japanese: 0 },
  { slug: "gpt-5-1-codex-max", name: "GPT-5.1 Codex Max", developer: "OpenAI", developer_url: "https://openai.com", params: "非公開", context_window: "256K", license: "プロプライエタリ", license_status: "closed", category: "coder", release_date: "2026-02-10", description_ja: "OpenAIのコーディング特化モデルの最上位版。SWE-bench Verifiedで68.2を記録し、実践的なソフトウェア開発タスクにおいてトップクラスの性能を発揮する。", strengths: '["コーディング性能が最高水準","SWE-bench Verifiedトップクラス","256Kコンテキストで大規模コードベース対応","バッチAPIで50%割引"]', weaknesses: '["汎用テキスト生成ではGPT-5.2に劣る","コーディング以外の用途には不向き","料金がやや高額"]', use_cases: '["大規模コード生成","リファクタリング支援","マルチファイルのデバッグ","CI/CDパイプラインへの組み込み"]', links_json: '{"official":"https://openai.com","api":"https://platform.openai.com"}', pricing_json: '{"inputPer1M":2.5,"outputPer1M":15,"currency":"USD","billingMode":"標準","url":"https://openai.com/api/pricing/"}', is_japanese: 0 },
  { slug: "grok-4-2-beta", name: "Grok 4.2 Beta", developer: "xAI", developer_url: "https://x.ai", params: "非公開", context_window: "128K", license: "プロプライエタリ", license_status: "closed", category: "chat", release_date: "2026-04-08", description_ja: "xAIが開発する対話特化型モデル。X（旧Twitter）のリアルタイムデータと連携できる点が最大の特徴で、最新の話題やトレンドに基づいた回答が可能。", strengths: '["Xのリアルタイムデータと連携","最新情報に基づく回答","対話品質が高い","API提供あり"]', weaknesses: '["Beta版で安定性に課題","他モデルに比べベンチマーク性能が低い","オープンソースではない","利用可能リージョンが限定的"]', use_cases: '["リアルタイム情報の取得・分析","SNS連携AIアシスタント","トレンド分析","Xプラットフォーム上のAI機能"]', links_json: '{"official":"https://x.ai","api":"https://x.ai/api"}', pricing_json: '{"inputPer1M":5,"outputPer1M":15,"currency":"USD","billingMode":"標準","url":"https://x.ai/api-pricing"}', is_japanese: 0 },
  // Japanese domestic models
  { slug: "plamo-2-0", name: "PLaMo 2.0", developer: "Preferred Networks", developer_url: "https://www.preferred.jp", params: "31B", context_window: "32K", license: "PLaMo License", license_status: "open-nc", category: "foundation", release_date: "2026-03-01", description_ja: "Preferred Networks（PFN）が開発した国産大規模言語モデルの最新版。310億パラメータで、日本語タスクにおいてGPT-4 miniやClaude 2.5に匹敵する性能を実現。さくらインターネット・NICTとの共同プロジェクトにより、NICTが蓄積した700億ページ超の日本語Webデータを学習に活用。", strengths: '["日本語処理能力が極めて高い","国産モデルで日本の文脈に最適化","700億ページ超の日本語データで学習","さくらインターネット経由でAPI利用可能"]', weaknesses: '["グローバルベンチマークではフロンティアモデルに劣る","コンテキスト長が32Kと短め","非商用ライセンス（商用は要相談）","推論速度がやや遅い"]', use_cases: '["日本語ドキュメントの生成・要約","カスタマーサポート（日本語）","日本の法規制に対応したAIシステム","国内クラウドでのAI運用"]', links_json: '{"official":"https://www.preferred.jp","huggingface":"https://huggingface.co/pfnet/plamo-2.0"}', pricing_json: '{"inputPer1M":50,"outputPer1M":200,"currency":"JPY","billingMode":"従量課金","url":"https://plamo.preferred.ai"}', is_japanese: 1 },
  { slug: "namazu-deepseek-v3-1", name: "Namazu-DeepSeek-V3.1-Terminus", developer: "Sakana AI", developer_url: "https://sakana.ai", params: "685B (MoE)", context_window: "128K", license: "Apache 2.0", license_status: "open", category: "foundation", release_date: "2026-03-15", description_ja: "Sakana AIが開発した日本特化型オープンLLM。DeepSeek-V3.1-Terminusをベースに、日本の文化的・社会的文脈に合うよう事後学習でバイアスを是正したモデル。政治・歴史・外交テーマにおける中立性と正確性の大幅改善が特徴。", strengths: '["日本の文化的文脈に最適化","回答拒否率を72%からほぼ0%に改善","オープンソース（Apache 2.0）","ベースモデルと同等の推論性能を維持"]', weaknesses: '["ベースモデルに依存（独自学習は事後学習のみ）","API提供が限定的","グローバルベンチマークでの評価が少ない","まだアルファ版"]', use_cases: '["日本語チャットボット","政治・歴史テーマの質問応答","日本の文化・社会に関するコンテンツ生成","教育・研究用途"]', links_json: '{"official":"https://sakana.ai","huggingface":"https://huggingface.co/sakanaai"}', is_japanese: 1 },
  { slug: "llama-3-namazu-405b", name: "Llama-3-Namazu-405B", developer: "Sakana AI", developer_url: "https://sakana.ai", params: "405B", context_window: "128K", license: "Llama 3 License", license_status: "open-nc", category: "foundation", release_date: "2026-03-15", description_ja: "Sakana AIが開発した大規模パラメータ版のNamazuモデル。Llama-3-405Bをベースに、日本の文化的・社会的文脈に最適化した事後学習を施している。", strengths: '["405Bパラメータで高性能","日本の文化的文脈に最適化","Llama 3の強力なベースモデル","長文生成品質が高い"]', weaknesses: '["動作に高スペックなGPUが必要","非商用ライセンス（Llama 3 License）","推論コストが高い","API提供がない"]', use_cases: '["高品質な日本語コンテンツ生成","複雑な日本語推論タスク","研究・開発用途","大規模データの日本語処理"]', links_json: '{"official":"https://sakana.ai","huggingface":"https://huggingface.co/sakanaai"}', is_japanese: 1 },
  { slug: "llama-3-elyza-jp-8b", name: "Llama-3-ELYZA-JP-8B", developer: "ELYZA", developer_url: "https://www.elyza.ai", params: "8B", context_window: "8K", license: "Llama 3 License", license_status: "open-nc", category: "foundation", release_date: "2025-07-01", description_ja: "ELYZAが開発した日本語特化型オープンモデル。MetaのLlama 3をベースに、大量の日本語データでファインチューニングしており、8Bパラメータながら日本語生成の品質は非常に高い。", strengths: '["日本語品質が極めて高い","軽量で高速","企業導入実績100社超","デジタル庁ガバメントAI採用"]', weaknesses: '["コンテキスト長が8Kと短い","非商用ライセンス","グローバルベンチマークでは上位モデルに劣る","単独では複雑な推論に不向き"]', use_cases: '["日本語チャットボット","テキスト要約・校正","カスタマーサポート","日本語コンテンツ生成"]', links_json: '{"official":"https://www.elyza.ai","huggingface":"https://huggingface.co/elyza/Llama-3-ELYZA-JP-8B","api":"https://elyza.ai/api"}', pricing_json: '{"inputPer1M":30,"outputPer1M":120,"currency":"JPY","billingMode":"従量課金","url":"https://elyza.ai/api"}', is_japanese: 1 },
  { slug: "elyza-thinking-1-0-qwen-32b", name: "ELYZA-Thinking-1.0-Qwen-32B", developer: "ELYZA", developer_url: "https://www.elyza.ai", params: "32B", context_window: "32K", license: "ELYZA License", license_status: "open-nc", category: "reasoning", release_date: "2026-01-15", description_ja: "ELYZAが開発した日本初の推論特化型モデル。OpenAIのo1/o3シリーズと同様の「思考の連鎖（Chain-of-Thought）」アプローチを採用し、複雑な推論タスクに特化している。", strengths: '["国産初の推論特化モデル","数学・論理推論に強い","日本語での思考プロセス可視化","Qwen-32Bベースで安定した性能"]', weaknesses: '["推論に時間がかかる","コンテキスト長が32K","通常のテキスト生成には不向き","商用利用は要ライセンス確認"]', use_cases: '["数学的推論タスク","論理的思考を要する問題解決","日本語での複雑な分析","教育分野での活用"]', links_json: '{"official":"https://www.elyza.ai","huggingface":"https://huggingface.co/elyza"}', pricing_json: '{"inputPer1M":80,"outputPer1M":320,"currency":"JPY","billingMode":"従量課金","url":"https://elyza.ai/api"}', is_japanese: 1 },
  { slug: "youri-7b", name: "Youri-7B", developer: "rinna", developer_url: "https://rinna.co.jp", params: "7B", context_window: "8K", license: "Apache 2.0", license_status: "open", category: "foundation", release_date: "2025-06-01", description_ja: "rinnaが開発した日本語特化型オープンソースモデル。70億パラメータで軽量ながら、日本語処理に最適化された学習が施されている。Apache 2.0ライセンスで商用利用が可能。", strengths: '["Apache 2.0で商用利用可能","学術的評価が最も高い国産モデル","軽量で高速","研究コミュニティが活発"]', weaknesses: '["コンテキスト長が8K","商用展開が遅れている","性能面でELYZAに及ばない部分がある","API提供がない"]', use_cases: '["日本語NLP研究","軽量モデルでのプロトタイピング","商用利用を想定したファインチューニング","教育・学術用途"]', links_json: '{"official":"https://rinna.co.jp","huggingface":"https://huggingface.co/rinna/youri-7b"}', is_japanese: 1 },
  { slug: "tsuzumi", name: "つづみ (tsuzumi)", developer: "NTT", developer_url: "https://www.ntt.co.jp", params: "7B〜13B", context_window: "8K", license: "NTT License", license_status: "closed", category: "foundation", release_date: "2025-09-01", description_ja: "NTTグループが開発した国産大規模言語モデル。日本語に特化しつつ、NTTグループの通信インフラと深く統合したAIソリューションを提供する構想。", strengths: '["NTTグループの通信インフラと連携","エッジコンピューティング対応の可能性","日本語処理に最適化","大企業の資金力による継続開発"]', weaknesses: '["NTTグループ内での利用に限定","外部提供が未定","ベンチマーク情報が限定的","オープンソースではない"]', use_cases: '["NTTグループ内のAIソリューション","通信サービスとの連携AI","エッジデバイスでの日本語処理","企業内チャットボット"]', links_json: '{"official":"https://www.ntt.co.jp"}', is_japanese: 1 },
  { slug: "takane", name: "たかね (Takane)", developer: "富士通", developer_url: "https://www.fujitsu.com", params: "13B", context_window: "8K", license: "プロプライエタリ", license_status: "closed", category: "foundation", release_date: "2025-11-01", description_ja: "富士通が開発した企業向け国産大規模言語モデル。13Bパラメータで、金融・医療・法務などの特定ドメインに特化したカスタマイズを提供する戦略を採る。", strengths: '["ドメイン特化型カスタマイズが可能","金融・医療・法務に対応","富士通のSI事業と連携","セキュリティ基準が高い"]', weaknesses: '["外部提供が限定的","オープンソースではない","汎用ベンチマークでの評価が少ない","大企業向けで中小企業には敷居が高い"]', use_cases: '["金融ドメインのAIソリューション","医療・法務の専門的処理","大企業の社内AI","規制業界向けの安全なAI活用"]', links_json: '{"official":"https://www.fujitsu.com"}', is_japanese: 1 },
];

async function main() {
  console.log("=== Migrate Seed Models ===\n");

  migrate();

  const beforeCount = getModelCount();
  console.log(`  Models in DB before migration: ${beforeCount}`);

  if (beforeCount > 0) {
    console.log("  Database already has models. Checking for missing seed models...");
  }

  let imported = 0;
  let skipped = 0;

  for (const model of SEED_MODELS) {
    const id = upsertModel({
      slug: model.slug,
      name: model.name,
      developer: model.developer,
      developer_url: model.developer_url,
      params: model.params,
      context_window: model.context_window,
      license: model.license,
      license_status: model.license_status,
      category: model.category,
      release_date: model.release_date,
      description_ja: model.description_ja,
      strengths: model.strengths,
      weaknesses: model.weaknesses,
      use_cases: model.use_cases,
      links_json: model.links_json,
      pricing_json: model.pricing_json,
      is_core: 1,
      is_japanese: model.is_japanese,
      priority: 10,
    });

    if (id) {
      imported++;
      console.log(`  ✓ ${model.name} (${model.developer})`);
    } else {
      skipped++;
    }
  }

  const afterCount = getModelCount();
  console.log(`\n  Models in DB after migration: ${afterCount}`);
  console.log(`  Imported: ${imported}, Skipped: ${skipped}`);
  console.log("\n=== Migration Complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});