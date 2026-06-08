"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, Code, FileText, Brain, DollarSign, Zap, Globe } from "lucide-react";

interface Answers { useCase: string; budget: string; priority: string; context: string; }
interface Recommendation { model: string; reason: string; score: number; pricing: string; bestFor: string; link: string; }

const T = {
  ja: {
    back: "ツール一覧に戻る", title: "AIモデル推薦", subtitle: "4つの質問に答えて、あなたに最適なAIモデルを見つけましょう",
    questionOf: "質問", of: "/", resultTitle: "おすすめのAIモデル", restart: "もう一度診断する",
    viewDetails: "詳細を見る", matchScore: "適合度",
    recs: {
      opus: { reason: "最高品質のコーディングと分析能力", bestFor: "高品質コード生成" },
      m3: { reason: "コスパ最強。100万トークン対応", bestFor: "コスト効率" },
      gpt: { reason: "バランスの取れた高性能モデル", bestFor: "汎用タスク" },
    },
  },
  en: {
    back: "Back to Tools", title: "AI Model Recommender", subtitle: "Answer 4 questions to find the perfect AI model for your needs",
    questionOf: "Question", of: "of", resultTitle: "Recommended AI Models", restart: "Start Over",
    viewDetails: "View Details", matchScore: "Match Score",
    recs: {
      opus: { reason: "Top-tier coding and analysis quality", bestFor: "High-quality code" },
      m3: { reason: "Best cost efficiency. 1M token support", bestFor: "Cost efficiency" },
      gpt: { reason: "Well-balanced high-performance model", bestFor: "General tasks" },
    },
  },
};

const questions = [
  { id: "useCase", question: { ja: "主な用途は何ですか？", en: "What's your primary use case?" }, options: [
    { value: "coding", label: { ja: "コーディング", en: "Coding" }, icon: Code },
    { value: "writing", label: { ja: "文章作成", en: "Writing" }, icon: FileText },
    { value: "analysis", label: { ja: "データ分析", en: "Analysis" }, icon: Brain },
    { value: "chatbot", label: { ja: "チャットボット", en: "Chatbot" }, icon: Globe },
  ]},
  { id: "budget", question: { ja: "月間のAPI予算は？", en: "Monthly API budget?" }, options: [
    { value: "low", label: { ja: "~$50", en: "~$50" }, icon: DollarSign },
    { value: "medium", label: { ja: "$50-$200", en: "$50-$200" }, icon: DollarSign },
    { value: "high", label: { ja: "$200+", en: "$200+" }, icon: DollarSign },
  ]},
  { id: "priority", question: { ja: "最も重視するポイントは？", en: "What matters most?" }, options: [
    { value: "quality", label: { ja: "品質", en: "Quality" }, icon: Sparkles },
    { value: "speed", label: { ja: "速度", en: "Speed" }, icon: Zap },
    { value: "cost", label: { ja: "コスパ", en: "Cost" }, icon: DollarSign },
  ]},
  { id: "context", question: { ja: "扱うデータ量は？", en: "Data volume?" }, options: [
    { value: "small", label: { ja: "少量", en: "Small" }, icon: FileText },
    { value: "medium", label: { ja: "中程度", en: "Medium" }, icon: FileText },
    { value: "large", label: { ja: "大量(100万トークン)", en: "Large (1M tokens)" }, icon: FileText },
  ]},
];

function getRecommendations(answers: Answers, t: typeof T.ja): Recommendation[] {
  const models: Recommendation[] = [];
  let opusScore = 0;
  if (answers.useCase === "coding") opusScore += 30;
  if (answers.useCase === "analysis") opusScore += 25;
  if (answers.priority === "quality") opusScore += 30;
  if (answers.budget === "high") opusScore += 20;
  if (answers.context === "large") opusScore += 15;
  models.push({ model: "Claude Opus 4.8", reason: t.recs.opus.reason, score: Math.min(opusScore, 100), pricing: "$5/$25 per 1M", bestFor: t.recs.opus.bestFor, link: "/models/claude-opus-4-8" });

  let m3Score = 0;
  if (answers.useCase === "coding") m3Score += 25;
  if (answers.priority === "cost") m3Score += 35;
  if (answers.budget === "low") m3Score += 30;
  if (answers.context === "large") m3Score += 20;
  models.push({ model: "MiniMax M3", reason: t.recs.m3.reason, score: Math.min(m3Score, 100), pricing: "$0.30/$1.20 per 1M", bestFor: t.recs.m3.bestFor, link: "/models/minimax-m3" });

  let gptScore = 0;
  if (answers.useCase === "writing") gptScore += 25;
  if (answers.useCase === "chatbot") gptScore += 25;
  if (answers.priority === "quality") gptScore += 20;
  if (answers.priority === "speed") gptScore += 15;
  if (answers.budget === "medium") gptScore += 15;
  models.push({ model: "GPT-5.5", reason: t.recs.gpt.reason, score: Math.min(gptScore, 100), pricing: "$2.50/$10 per 1M", bestFor: t.recs.gpt.bestFor, link: "/models/gpt-5-5" });

  return models.sort((a, b) => b.score - a.score).slice(0, 3);
}

export default function ModelRecommenderPage() {
  const params = useParams();
  const locale = (params.locale as string) === "en" ? "en" : "ja";
  const t = T[locale];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ useCase: "", budget: "", priority: "", context: "" });
  const [recs, setRecs] = useState<Recommendation[] | null>(null);

  const handleAnswer = (id: string, value: string) => {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);
    if (step < questions.length - 1) setStep(step + 1);
    else setRecs(getRecommendations(newAnswers, t));
  };

  const reset = () => { setStep(0); setAnswers({ useCase: "", budget: "", priority: "", context: "" }); setRecs(null); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/${locale === "ja" ? "" : locale + "/"}tools`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" />{t.back}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-500 mb-8">{t.subtitle}</p>

        {!recs && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{t.questionOf} {step + 1} {t.of} {questions.length}</span>
              <span>{Math.round((step / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${(step / questions.length) * 100}%` }} />
            </div>
          </div>
        )}

        {!recs && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{questions[step].question[locale]}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {questions[step].options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} onClick={() => handleAnswer(questions[step].id, opt.value)}
                    className="p-5 rounded-xl border-2 border-gray-200 text-left transition-all hover:border-primary-300 hover:bg-primary-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg"><Icon className="w-5 h-5 text-gray-600" /></div>
                      <span className="font-medium text-gray-900">{opt.label[locale]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {recs && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-50 rounded-lg"><Sparkles className="w-6 h-6 text-primary-600" /></div>
                <h2 className="text-xl font-bold text-gray-900">{t.resultTitle}</h2>
              </div>
              <div className="space-y-4">
                {recs.map((rec, i) => (
                  <div key={rec.model} className={`p-5 rounded-xl border-2 ${i === 0 ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {i === 0 && <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">#1</span>}
                          <h3 className="text-lg font-bold text-gray-900">{rec.model}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{rec.reason}</p>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{rec.pricing}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{rec.bestFor}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">{rec.score}%</div>
                        <div className="text-xs text-gray-500">{t.matchScore}</div>
                      </div>
                    </div>
                    <Link href={`/${locale === "ja" ? "" : locale + "/"}${rec.link}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 mt-3">
                      {t.viewDetails} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <button onClick={reset} className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" />{t.restart}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
