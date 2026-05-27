---
title: "SWE-bench Verified 2026 Leaderboard: Analyzing the Coding Prowess of 90 AI Models"
date: "2026-05-26"
tag: "Benchmark"
excerpt: "The May 2026 SWE-bench Verified leaderboard shows Anthropic dominating the top tier with the Mythos model, while Chinese LLMs make a massive leap into the top 10. The data reveals a significant shift toward high-performance, low-cost open-source coding models."
---

SWE-bench Verified remains the gold standard for measuring the practical coding capabilities of AI. Unlike synthetic benchmarks, it utilizes a human-verified subset of 500 real-world GitHub issues extracted from major open-source projects like Django, Flask, and scikit-learn, simulating actual software engineering tasks.

As of May 2026, **90 models** have been evaluated. Here is the comprehensive breakdown of the latest results.

## Top 10 Leaderboard (May 2026)

| Rank | Model | Developer | Score | Price (Input/Output per 1M) | License |
|------|--------|--------|--------|------------------------|-----------|
| 1 | Claude Mythos Preview | Anthropic | **93.9%** | Private | Closed |
| 2 | Claude Opus 4.7 (Adaptive) | Anthropic | **87.6%** | $5.00 / $25.00 | Closed |
| 3 | GPT-5.3 Codex | OpenAI | **85.0%** | Private | Closed |
| 4 | Claude Opus 4.5 | Anthropic | **80.9%** | Private | Closed |
| 5 | Claude Opus 4.6 | Anthropic | **80.8%** | $5.00 / $25.00 | Closed |
| 5 | DeepSeek V4 Pro (Max) | DeepSeek | **80.6%** | $1.74 / $3.48 | Open |
| 5 | Gemini 3.1 Pro | Google DeepMind | **80.6%** | $2.50 / $15.00 | Closed |
| 8 | Kimi K2.6 | Moonshot AI | **80.2%** | $0.95 / $4.00 | Open |
| 8 | MiniMax M2.5 | MiniMax | **80.2%** | $0.30 / $1.20 | Open |
| 10 | GPT-5.2 | OpenAI | **80.0%** | $1.25 / $10.00 | Closed |

## Key Analysis: The State of AI Coding

### 1. Anthropic's Dominance
Anthropic currently holds an overwhelming lead, occupying four of the top five slots. The Claude Mythos Preview, scoring 93.9%, leads the second-place Opus 4.7 by a significant **6.3 percentage points**. 

Crucially, Anthropic's strength isn't limited to a single benchmark. By maintaining top-tier performance across SWE-bench, GPQA Diamond, and HLE, the company has demonstrated a superior general-purpose architecture for complex reasoning.

### 2. The Rise of Chinese LLMs
In 2025, Chinese models were largely absent from the top 10 of SWE-bench. By May 2026, the landscape has shifted dramatically:

| Model | Developer | Score | Rank |
|--------|--------|--------|------|
| DeepSeek V4 Pro (Max) | DeepSeek | 80.6% | 5th |
| Kimi K2.6 | Moonshot AI | 80.2% | 8th |
| MiniMax M2.5 | MiniMax | 80.2% | 8th |
| Qwen3.6 Plus | Alibaba | 78.8% | 12th |
| MiMo-V2-Pro | Xiaomi | 78.0% | 13th |
| GLM-5 | Zhipu AI | 77.8% | 15th |

With three Chinese models in the top 10, DeepSeek V4 Pro is now performing on par with Gemini 3.1 Pro and Opus 4.6. Particular mention must go to MiniMax M2.5, which achieved an 80.2% score at a price point of $0.30/$1.20, making it the most affordable model in the top 10.

### 3. OpenAI's Struggle for Generalization
GPT-5.2 sits at 10th place with 80.0%. While the specialized GPT-5.3 Codex ranks 3rd (85%), it is a coding-specific model. In terms of general-purpose LLMs, OpenAI is being overtaken by the likes of DeepSeek V4 Pro and Kimi K2.6.

### 4. Google's Positioning
Gemini 3.1 Pro remains competitive at 80.6% (tied for 5th). While Google stays in the frontier class, they lack a standout lead. Industry eyes are now on the upcoming Gemini 3.5 Pro to see if Google can reclaim the top spot.

## Price-to-Performance Analysis

When analyzing the correlation between SWE-bench scores and cost, the value proposition becomes clear:

| Model | Score | Input/1M | Output/1M | Score per Dollar (Output) |
|--------|--------|---------|---------|-------------------|
| MiniMax M2.5 | 80.2% | $0.30 | $1.20 | **66.8** |
| DeepSeek V4 Pro (Max) | 80.6% | $1.74 | $3.48 | **23.2** |
| Kimi K2.6 | 80.2% | $0.95 | $4.00 | **20.1** |
| GPT-5.2 | 80.0% | $1.25 | $10.00 | **8.0** |
| Gemini 3.1 Pro | 80.6% | $2.50 | $15.00 | **5.4** |
| Claude Sonnet 4.6 | 79.6% | $3.00 | $15.00 | **5.3** |
| Claude Opus 4.6 | 80.8% | $5.00 | $25.00 | **3.2** |
| Claude Opus 4.7 | 87.6% | $5.00 | $25.00 | **3.5** |

MiniMax M2.5 is an extreme outlier in cost-efficiency. It achieves nearly the same performance as Opus 4.6 (80.2% vs 80.8%) while costing **less than 1/20th** in terms of output pricing.

## Open Source vs. Closed Source

Distribution of the 90 evaluated models by license:

| License | Top 10 | Top 20 | Top 50 | Total 90 |
|-----------|---------|---------|---------|------|
| Closed | 7 | 12 | 25 | ~50 |
| Open | 3 | 8 | 25 | ~40 |

Three open-source models (DeepSeek, Kimi, and MiniMax) have breached the top 10. Considering that open-source models were virtually absent from the top tier in 2025, this represents a seismic shift in the ecosystem.

## Understanding the Benchmark's Limits

While SWE-bench Verified is high-signal, it primarily targets Python open-source projects. A high score does not automatically guarantee:

- **Project-specific performance**: Results may vary across proprietary codebases.
- **Cross-language proficiency**: Performance in JavaScript, TypeScript, Go, or Rust may differ.
- **Long-term project management**: The benchmark evaluates single-issue resolution, not the ability to manage a project over weeks.
- **Creative Architecture**: Designing new features requires different cognitive abilities than bug fixing.

## Outlook for Late 2026

We are rapidly approaching a ceiling for SWE-bench Verified. Mythos' 93.9% means it correctly solved over 469 out of 500 issues. The remaining 31 issues are problems humans can solve, but current AI cannot.

The next frontiers will be:
- **SWE-bench Pro**: A more challenging subset of tasks.
- **Terminal-Bench 2.1**: Terminal-based agentic tasks.
- **Multi-file, multi-step pipelines**: Evaluation of long-term project execution.

## Final Thoughts

The 2026 SWE-bench Verified results reveal three structural shifts in AI coding:

1. **Anthropic has established itself as the coding king**, with the Mythos model providing a massive lead.
2. **Chinese models have reached the frontier**, with DeepSeek, Kimi, and MiniMax now competing directly with GPT and Gemini.
3. **The democratization of high-end coding AI** is happening via a dramatic improvement in price-to-performance, led by models like MiniMax M2.5.

Though it is just one benchmark, SWE-bench Verified remains the most reliable indicator of how AI is evolving to solve real-world software engineering problems.