import { Trophy, Code, Calculator, Bot, Brain, Gauge, type LucideIcon } from "lucide-react";

export interface LeaderboardCategory {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  benchmarks: string[];
  icon: LucideIcon;
}

export const leaderboardCategories: Record<string, LeaderboardCategory> = {
  comprehensive: {
    slug: "comprehensive",
    title: "総合ランキング",
    titleEn: "Comprehensive Ranking",
    description: "HLE、ARC-AGI-2、FrontierMath、SWE-bench Verified、τ²-Bench の総合ランキング。",
    descriptionEn: "Overall AI model ranking across HLE, ARC-AGI-2, FrontierMath, SWE-bench Verified, and τ²-Bench.",
    benchmarks: ["hle", "arcAgi2", "frontierMath", "sweBenchVerified", "tauBench"],
    icon: Trophy,
  },
  code: {
    slug: "code",
    title: "コーディング能力ランキング",
    titleEn: "Coding Capability",
    description: "SWE-bench Verified、LiveCodeBench、SWE-bench Pro、Aider-Polyglot によるプログラミング能力評価。",
    descriptionEn: "Programming ability benchmarks: SWE-bench Verified, LiveCodeBench, SWE-bench Pro, Aider-Polyglot.",
    benchmarks: ["sweBenchVerified", "liveCodeBench", "sweBenchPro", "aiderPolyglot"],
    icon: Code,
  },
  math: {
    slug: "math",
    title: "数学能力ランキング",
    titleEn: "Math Capability",
    description: "AIME 2025/2026、FrontierMath、MATH-500、GSM8K による数学的推論能力評価。",
    descriptionEn: "Mathematical reasoning benchmarks: AIME 2025/2026, FrontierMath, MATH-500, GSM8K.",
    benchmarks: ["aime2025", "aime2026", "frontierMath", "math500", "gsm8k"],
    icon: Calculator,
  },
  agent: {
    slug: "agent",
    title: "AIエージェント能力ランキング",
    titleEn: "AI Agent Capability",
    description: "τ²-Bench、Terminal Bench Hard、Aider-Polyglot による自律エージェント能力評価。",
    descriptionEn: "Autonomous agent benchmarks: τ²-Bench, Terminal Bench Hard, Aider-Polyglot.",
    benchmarks: ["tauBench", "terminalBench", "aiderPolyglot"],
    icon: Bot,
  },
  reasoning: {
    slug: "reasoning",
    title: "推論能力ランキング",
    titleEn: "Reasoning Capability",
    description: "HLE、ARC-AGI-2、GPQA Diamond による推論・思考能力評価。",
    descriptionEn: "Reasoning and thinking benchmarks: HLE, ARC-AGI-2, GPQA Diamond.",
    benchmarks: ["hle", "arcAgi2", "gpqaDiamond"],
    icon: Brain,
  },
  general: {
    slug: "general",
    title: "汎用性能ランキング",
    titleEn: "General Performance",
    description: "MMLU-Pro、LMArena Elo による総合的な性能評価。",
    descriptionEn: "General AI performance: MMLU-Pro, LMArena Elo ratings.",
    benchmarks: ["mmluPro", "elo"],
    icon: Gauge,
  },
};

export const categoryOrder = ["comprehensive", "code", "math", "agent", "reasoning", "general"];

export function getCategoryBySlug(slug: string): LeaderboardCategory | undefined {
  return leaderboardCategories[slug];
}
