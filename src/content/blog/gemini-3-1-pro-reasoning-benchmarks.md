---
title: Gemini 3.1 Proの詳細解説：ARC-AGI-2で77.1%を記録し推論能力が前世代の2倍に
date: '2026-05-23'
tag: Google
excerpt: >-
  Googleの最新推論モデルGemini 3.1 ProがARC-AGI-2で77.1%、GPQA Diamondで94.3%を記録。SWE-Bench
  Verifiedでは80.6%を達成し、Claude Opus 4.6やGPT-5.3-Codexに匹敵する性能を実現した。
---

## Gemini 3.1 Proとは

2026年2月19日、GoogleはGemini 3シリーズの最新モデル「Gemini 3.1 Pro」を発表した。Gemini 3 Proの後継として、推論能力、マルチモーダル対応、エージェント機能を大幅に強化している。

**主な仕様**

| 項目 | 詳細 |
|---|---|
| コンテキストウィンドウ | 1Mトークン |
| 最大出力 | 64Kトークン |
| 対応入力 | テキスト、コード、画像、音声、動画、PDF |
| 知識カットオフ | 2025年1月 |
| 提供形態 | API（プレビュー）、Geminiアプリ、NotebookLM |

---

## 主要ベンチマーク結果

### 推論能力

| ベンチマーク | Gemini 3.1 Pro | Gemini 3 Pro | Claude Opus 4.6 | GPT-5.2 |
|---|---|---|---|---|
| ARC-AGI-2 | **77.1%** | 31.1% | 68.8% | 52.9% |
| GPQA Diamond | **94.3%** | 91.9% | 91.3% | 92.4% |
| HLE（学術推論） | **44.4%** | 37.5% | 40.0% | 34.5% |

ARC-AGI-2では前世代の31.1%から77.1%へと**2.5倍の向上**を達成。完全に新しい論理パターンを解く能力が大幅に改善された。

### コーディング・エージェント

| ベンチマーク | Gemini 3.1 Pro | Claude Opus 4.6 | GPT-5.3-Codex |
|---|---|---|---|
| SWE-Bench Verified | 80.6% | 80.8% | — |
| SWE-Bench Pro | 54.2% | — | 56.8% |
| Terminal-Bench 2.0 | 68.5% | 65.4% | 64.7% |
| SciCode | **59%** | 52% | — |
| LiveCodeBench Pro | **2887 Elo** | — | — |

SWE-Bench VerifiedではClaude Opus 4.6（80.8%）とほぼ同スコア。Terminal-Bench 2.0では65.4%のOpus 4.6を上回る68.5%を記録した。

### マルチモーダル・マルチリンガル

| ベンチマーク | Gemini 3.1 Pro | Gemini 3 Pro |
|---|---|---|
| MMMU-Pro | 80.5% | 81.0% |
| MMMLU | 92.6% | 91.8% |
| MRCR v2（128K） | 84.9% | 77.0% |

### エージェント・ツール利用

| ベンチマーク | Gemini 3.1 Pro | Claude Opus 4.6 | GPT-5.2 |
|---|---|---|---|
| MCP Atlas | **69.2%** | 59.5% | 60.6% |
| BrowseComp | **85.9%** | 84.0% | 65.8% |
| τ2-bench（Retail） | 90.8% | 91.9% | 82.0% |

MCP Atlasでは69.2%を記録し、Claude Opus 4.6（59.5%）を大きく上回った。

---

## Gemini 3.1 Proの強み

### 1. 抽象推理の飛躍的向上

ARC-AGI-2の77.1%は、前世代の31.1%から大きく改善されたスコアだ。このベンチマークは「完全に新しい論理パターン」を解く能力を測定しており、モデルの汎化能力の指標となる。

### 2. エージェントワークフローの強化

MCP Atlas 69.2%、BrowseComp 85.9%といったスコアは、マルチステップのツール利用タスクでの優位性を示している。Googleは「finance and spreadsheet applications」などのドメインでのエージェント能力改善を強調している。

### 3. 思考レベルの拡張

新しく`MEDIUM`思考レベルが追加され、コスト・性能・速度のトレードオフをより細かく調整可能になった。従来の`HIGH`に加え、用途に応じた最適化がしやすくなった。

### 4. カスタムツールエンドポイント

`gemini-3.1-pro-preview-customtools`というエンドポイントが新設され、`view_file`や`search_code`のようなカスタムツールを優先的に使用するエージェントワークフローに最適化されている。

---

## 料金と利用方法

Gemini 3.1 Proは以下のプラットフォームで利用可能だ。

- **開発者向け**: Gemini API（Google AI Studio）、Gemini CLI、Google Antigravity、Android Studio
- **企業向け**: Vertex AI、Gemini Enterprise
- **消費者向け**: Geminiアプリ、NotebookLM（Pro/Ultraプラン）

Google AI Proプラン（月額$20）およびUltraプラン（月額$100）のユーザーは、Geminiアプリ内で3.1 Proにアクセスし、より高い利用制限を利用できる。

---

## 他のモデルとの位置づけ

2026年前半のAIモデル市場において、Gemini 3.1 Proは以下のように位置づけられる。

| モデル | 強み | GPQA Diamond | SWE-Bench Verified |
|---|---|---|---|
| Gemini 3.1 Pro | 抽象推理、マルチモーダル | **94.3%** | 80.6% |
| Claude Opus 4.6 | コーディング、長文処理 | 91.3% | 80.8% |
| Qwen3.7-Max | エージェント、長時間自律 | 92.4% | 80.4% |
| GPT-5.2 | バランス型 | 92.4% | 80.0% |

GPQA Diamond 94.3%は、公開されているスコアの中で最高値だ。

---

## まとめ

Gemini 3.1 Proは、Gemini 3 Proから推論能力を大幅に引き上げたモデルだ。特にARC-AGI-2の77.1%は際立ったスコアで、抽象的な論理問題への汎化能力が他モデルを大きく上回っている。

ポイントを整理すると：

1. **ARC-AGI-2**: 77.1%（前世代の2.5倍）
2. **GPQA Diamond**: 94.3%（最高スコア）
3. **SWE-Bench Verified**: 80.6%（Claude Opus 4.6と同レベル）
4. **MCP Atlas**: 69.2%（エージェント能力で他モデルを凌駕）
5. **1Mトークン**のコンテキストウィンドウ
6. **MEDIUM思考レベル**の追加でコスト最適化が容易に

---

## 関連記事

- [ARC-AGI-3登場：AIの「真の推論能力」を測る初のインタラクティブ・ベンチマークとは](/blog/arc-agi-3-benchmark-launch-2026)
- [Google I/O 2026詳解：Gemini 3.5 Flashと「Agentic Gemini era」がもたらすAIエージェントへの転換点](/blog/google-io-2026gemini-35-flashagentic-gemini-eraai)
- [OpenAIが「GPT-5.5（コードネーム：Spud）」をリリース：エージェント能力が大幅向上、API提供は安全審査のため順次開始へ](/blog/openai-gpt-5-5-spud-release)
