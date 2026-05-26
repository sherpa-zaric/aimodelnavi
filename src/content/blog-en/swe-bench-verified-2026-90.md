---
title: "SWE-bench Verified 2026 Rankings: Comparing Coding Performance Across 90 AI Models"
date: "2026-05-26"
tag: "Benchmark"
excerpt: "The May 2026 SWE-bench Verified rankings reveal Anthropic's dominance with its Mythos model and the rapid ascent of Chinese models like DeepSeek and MiniMax. The data shows a significant shift toward open-source parity and a dramatic increase in cost-performance efficiency."
---

SWE-bench Verified has emerged as one of the most trusted benchmarks for measuring the real-world coding capabilities of AI. Unlike synthetic tests, this benchmark consists of a subset of 500 actual GitHub issues verified by human annotators, drawn from prominent open-source projects like Django, Flask, and scikit-learn.

As of May 2026, **90 models** have been evaluated. Here is a comprehensive breakdown of the latest results.

## Top 10 Leaderboard: May 2026

| Rank | Model | Developer | Score | Pricing (In/Out per 1M) | License |
|------|--------|-----------|-------|--------------------------|---------|
| 1 | Claude Mythos Preview | Anthropic | **93.9%** | Undisclosed | Closed |
| 2 | Claude Opus 4.7 (Adaptive) | Anthropic | **87.6%** | $5.00 / $25.00 | Closed |
| 3 | GPT-5.3 Codex | OpenAI | **85.0%** | Undisclosed | Closed |
| 4 | Claude Opus 4.5 | Anthropic | **80.9%** | Undisclosed | Closed |
| 5 | Claude Opus 4.6 | Anthropic | **80.8%** | $5.00 / $25.00 | Closed |
| 5 | DeepSeek V4 Pro (Max) | DeepSeek | **80.6%** | $1.74 / $3.48 | Open |
| 5 | Gemini 3.1 Pro | Google DeepMind | **80.6%** | $2.50 / $15.00 | Closed |
| 8 | Kimi K2.6 | Moonshot AI | **80.2%** | $0.95 / $4.00 | Open |
| 8 | MiniMax M2.5 | MiniMax | **80.2%** | $0.30 / $1.20 | Open |
| 10 | GPT-5.2 | OpenAI | **80.0%** | $1.25 / $10.00 | Closed |

## Key Analysis: Market Shifts

### 1. Anthropic's Dominance
Anthropic currently commands the leaderboard, holding four of the top five spots. Specifically, the Mythos Preview's score of 93.9% creates a massive **6.3 percentage point gap** over the second-place Opus 4.7 (87.6%).

This isn't just a fluke of one benchmark. Anthropic has maintained top-tier performance across SWE-bench, GPQA Diamond, and HLE, signaling a fundamentally robust general architecture.

### 2. The Rise of Chinese Models
In 2025, Chinese models were virtually absent from the top 10. By May 2026, the landscape has shifted dramatically.

| Model | Developer | Score | Rank |
|--------|-----------|-------|------|
| DeepSeek V4 Pro (Max) | DeepSeek | 80.6% | 5th |
| Kimi K2.6 | Moonshot AI | 80.2% | 8th |
| MiniMax M2.5 | MiniMax | 80.2% | 8th |
| Qwen3.6 Plus | Alibaba | 78.8% | 12th |
| MiMo-V2-Pro | Xiaomi | 78.0% | 13th |
| GLM-5 | Zhipu AI | 77.8% | 15th |

With three Chinese models in the top 10, DeepSeek V4 Pro is now performing on par with Gemini 3.1 Pro and Claude Opus 4.6. Notably, MiniMax M2.5 has become the **most cost-effective model in the top 10**, achieving 80.2% with an aggressive pricing strategy.

### 3. OpenAI's Current Struggle
 sorprendingly, GPT-5.2 lingers at 10th place with 80.0%. While GPT-5.3 Codex ranks 3rd (85%), it is important to note that this is a specialized coding model. As a general-purpose model, GPT-5.2 is currently being outperformed by DeepSeek V4 Pro and Kimi K2.6.

### 4. Google's Positioning
Gemini 3.1 Pro remains competitive at 80.6% (tied for 5th). While Google continues to deliver frontier-class performance, they lack a standout leader in this specific category. All eyes are on the upcoming Gemini 3.5 Pro release to see if it can reclaim the top spots.

## Price-to-Performance Analysis

When analyzing the relationship between the SWE-bench score and API costs, the value proposition becomes clear.

| Model | Score | In/1M | Out/1M | Score per Dollar (Output) |
|--------|-------|--------|---------|--------------------------|
| MiniMax M2.5 | 80.2% | $0.30 | $1.20 | **66.8** |
| DeepSeek V4 Pro (Max) | 80.6% | $1.74 | $3.48 | **23.2** |
| Kimi K2.6 | 80.2% | $0.95 | $4.00 | **20.1** |
| GPT-5.2 | 80.0% | $1.25 | $10.00 | **8.0** |
| Gemini 3.1 Pro | 80.6% | $2.50 | $15.00 | **5.4** |
| Claude Sonnet 4.6 | 79.6% | $3.00 | $15.00 | **5.3** |
| Claude Opus 4.6 | 80.8% | $5.00 | $25.00 | **3.2** |
| Claude Opus 4.7 | 87.6% | $5.00 | $25.00 | **3.5** |

MiniMax M2.5's efficiency is staggering. It achieves a score nearly identical to Claude Opus 4.6 (80.2% vs 80.8%) while being **over 20 times cheaper** in terms of output cost.

## Open Source vs. Closed

Looking at the distribution across 90 models, the gap between open and closed models is narrowing.

| License | Top 10 | Top 20 | Top 50 | Total (90) |
|---------|---------|---------|--------|------------|
| Closed | 7 | 12 | 25 | ~50 |
| Open | 3 | 8 | 25 | ~40 |

Having three open-source models (DeepSeek, Kimi, and MiniMax) in the top 10 represents a dramatic shift from 2025, when open-source models were almost non-existent at the highest tier.

## Understanding Benchmark Limitations

While SWE-bench Verified is a gold standard, it primarily evaluates Python open-source projects. High scores do not necessarily guarantee:
- **Domain-specific performance**: Results may vary on proprietary or niche codebases.
- **Multi-language proficiency**: Performance in JavaScript, TypeScript, Go, or Rust may differ.
- **Long-term project management**: The test measures the ability to solve a single issue, not the capacity to manage a project over weeks.
- **Creative architecture**: Bug fixing is a different skill set than designing new features from scratch.

## Outlook for Late 2026

We are rapidly approaching a ceiling on SWE-bench Verified. A score of 93.9% means the model correctly solved over 469 out of 500 issues. The remaining 31 are problems that humans deemed "solvable" but which currently baffle AI.

Future benchmarks will likely shift toward:
- **SWE-bench Pro**: Higher difficulty subsets.
- **Terminal-Bench 2.1**: Complex, terminal-based agentic tasks.
- **Multi-file/Multi-step execution**: Long-term project autonomy.

## Conclusion

The 2026 SWE-bench Verified results highlight three structural changes in AI coding:

1. **Anthropic's Supremacy**: With the Mythos model, Anthropic has established itself as the current king of coding.
2. **The Frontier Parity of Chinese Models**: Players like DeepSeek, Kimi, and MiniMax have reached parity with the best of US-based frontier models.
3. **The Democratization of Performance**: Extreme cost-efficiencies, exemplified by MiniMax M2.5, are making frontier-level coding assistance accessible to everyone.