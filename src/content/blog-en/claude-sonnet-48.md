---
title: "Leaked: Everything We Know About the Upcoming Claude Sonnet 4.8"
date: "2026-05-26"
tag: "Anthropic"
excerpt: "Leaked data from Claude Code suggests the upcoming Sonnet 4.8 will bridge the gap between mid-tier pricing and top-tier performance. Expected upgrades include 3.75MP vision resolution and a significant jump in SWE-bench coding scores to 82-84%."
---

On March 31, 2026, the string "sonnet-4-8" was discovered within the npm package for Claude Code (v2.1.88). While Anthropic has not officially announced the model, this leak provides a clear outline of what to expect from the next flagship iteration of the Sonnet series.

## The Versioning Mystery: Why 4.8 instead of 4.7?

Anthropic's Sonnet series has followed a consistent release cadence:

| Model | Release Date | API String |
| :--- | :--- | :--- |
| Claude 3.5 Sonnet | June 2024 | claude-3-5-sonnet-20240620 |
| Claude 3.7 Sonnet | February 2025 | claude-3-7-sonnet-20250219 |
| Claude 4 Sonnet | May 2025 | claude-sonnet-4-0 |
| Claude Sonnet 4.5 | September 2025 | claude-sonnet-4-5 |
| Claude Sonnet 4.6 | February 2026 | claude-sonnet-4-6 |
| **Claude Sonnet 4.8** | **May 2026 (Est.)** | **claude-sonnet-4-8** |

Skipping 4.7 suggests that this is not a simple port of Opus 4.7. It implies a different development timeline or a distinct training run tailored for the Sonnet line.

## Predicted Specifications

Based on leak data and the improvement rates seen in Opus 4.7, here is the projected spec sheet:

| Feature | Sonnet 4.6 (Current) | Sonnet 4.8 (Predicted) |
| :--- | :--- | :--- |
| SWE-bench Verified | 79.6% | **82-84%** |
| GPQA Diamond | 74.1% | **76-78%** |
| Max Image Resolution | ~1.25MP | **3.75MP** (3x increase) |
| Context Window | 1M (Beta) | 1M (Potential GA) |
| Pricing (Input/Output) | $3 / $15 | $3 / $15 (Likely unchanged) |
| Knowledge Cutoff | August 2025 | Late 2025 to Early 2026 |

### Analyzing the SWE-bench Forecast: 82-84%

Sonnet 4.6 currently sits at 79.6% on SWE-bench Verified, nearly matching Opus 4.6 (80.8%). However, Opus 4.7 reached 87.6%, a jump of roughly 7 percentage points over its predecessor. If Sonnet 4.8 sees a similar gain of 6-8 points, a score of **82-84%** is a reasonable estimate.

For context, here are the top SWE-bench Verified rankings as of May 25, 2026:

| Rank | Model | Score |
| :--- | :--- | :--- |
| 1 | Claude Mythos Preview | 93.9% |
| 2 | Claude Opus 4.7 | 87.6% |
| 3 | GPT-5.3 Codex | 85.0% |
| 4 | Claude Opus 4.5 | 80.9% |
| 5 | Claude Opus 4.6 | 80.8% |
| 5 | DeepSeek V4 Pro (Max) | 80.6% |
| 7 | Gemini 3.1 Pro | 80.6% |
| 8 | Kimi K2.6 | 80.2% |
| 8 | MiniMax M2.5 | 80.2% |
| 10 | Claude Sonnet 4.6 | 79.6% |

At 82-84%, Sonnet 4.8 would leapfrog Opus 4.5 and 4.6, bringing Opus-level coding capabilities to the more affordable Sonnet pricing tier.

### Vision: 3.75MP Resolution

Opus 4.7 achieved "98.5% visual accuracy" with a 3.75MP resolution limit. It is expected that Sonnet 4.8 will inherit this capability. Moving from 1.25MP to 3.75MP—a **threefold increase in resolution**—will significantly enhance the model's ability to analyze complex documents, UI mockups, and detailed charts.

### The New "xhigh" Effort Level

We expect the "xhigh" effort level (positioned between "high" and "max") introduced in Opus 4.7 to be ported to Sonnet 4.8. This provides developers with finer control over the trade-off between cost, latency, and reasoning depth.

### Tokenizer Updates

The new tokenizer used in Opus 4.7 generates 1.0 to 1.35 times more tokens depending on the content type:

| Content Type | Token Increase Rate |
| :--- | :--- |
| English Prose | ~1.0x (No change) |
| Code | ~1.1-1.2x |
| Structured Data (JSON, XML) | Up to 1.35x |

If Sonnet 4.8 adopts this tokenizer, **effective costs could rise by 10-35%**, even if the nominal API price remains $3/$15, simply because the same content will be split into more tokens.

## Key Improvements Over Sonnet 4.6

1. **Massive Vision Upgrade**: Transitioning to 3.75MP resolution for superior understanding of screenshots and charts.
2. **Coding Performance**: Leveraging the gains seen in Opus 4.7 (e.g., CursorBench jumping from 58% to 70%) to offer high-end autonomous coding at a mid-tier price.
3. **Prompt Interpretation**: Likely moving toward the "more literal" interpretation style of Opus 4.7, improving instruction following while potentially reducing flexibility with ambiguous prompts.

## Pricing Stability

The Sonnet line has remarkably maintained a consistent $3/$15 price point since version 3.5. If Sonnet 4.8 holds this price, it will offer roughly 82-84% SWE-bench performance at 60% of the cost of Opus 4.7.

## Other Related Leaks

*   **KAIROS**: Mentioned over 150 times in the Claude Code leaks. KAIROS appears to be a persistent daemon agent featuring autonomous monitoring, memory integration ("autoDream"), preemptive actions, and push notifications.
*   **Mythos**: Released April 7, 2026, scoring 93.9% on SWE-bench. Currently restricted to cybersecurity applications (Project Glasswing).
*   **numbat**: An unreleased model mentioned in the code with currently unknown details.

## Developer Expectations

Community anticipation for Sonnet 4.8 focuses on:
*   Reliable generation of longer outputs.
*   Reduction in "over-engineering" (avoiding unnecessary complexity in code).
*   Improved Time-to-First-Token (TTFT).
*   Better multi-file awareness across large codebases.
*   Stable JSON/structured output with constrained decoding.

## Release Timeline

Based on the patterns seen with Opus 4.7 (released April 16), Sonnet 4.8 typically follows 3-4 weeks later. The most likely release window is **mid-May 2026**.

## Competitive Landscape

| Model | Input/1M | Output/1M | SWE-bench | Key Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Sonnet 4.8 (Est.)** | **$3** | **$15** | **82-84%** | **3.75MP Vision, 1M Context** |
| Claude Sonnet 4.6 | $3 | $15 | 79.6% | Current flagship |
| GPT-5.2 | $1.25 | $10.00 | 80.0% | OpenAI Mainstream |
| DeepSeek V4 Pro (Max) | $1.74 | $3.48 | 80.6% | Low-cost frontier |
| Gemini 3.1 Pro | $2.50 | $15.00 | 80.6% | Google Mainstream |
| MiniMax M2.5 | $0.15 | $1.15 | 80.2% | Coding spec/Budget |

## Summary

Claude Sonnet 4.8 could represent the biggest leap in the Sonnet series to date. By bringing the vision capabilities and coding prowess of the Opus line to the $3/$15 price bracket, Anthropic is positioning it as the strongest coding model in its tier. While we await official confirmation, the leak suggests a model that delivers Opus-grade performance at a Sonnet price.