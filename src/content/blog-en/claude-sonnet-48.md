---
title: "Claude Sonnet 4.8: What Leaks Reveal About Anthropic's Next Major Model"
date: "2026-05-26"
tag: "Anthropic"
excerpt: "Based on leaked code and technical analysis, this article examines Claude Sonnet 4.8, Anthropic's upcoming mid-tier model. Predictions suggest it could achieve 82-84% on SWE-bench Verified—surpassing previous Opus versions—while maintaining the $3/$15 price point and adding major vision and coding improvements."
---

## The Mystery of the Version Number: Why Skip 4.7?

The Anthropic Sonnet series has progressed at a steady pace:

| Model | Release | API String |
|-------|---------|------------|
| Claude 3.5 Sonnet | June 2024 | claude-3-5-sonnet-20240620 |
| Claude 3.7 Sonnet | February 2025 | claude-3-7-sonnet-20250219 |
| Claude 4 Sonnet | May 2025 | claude-sonnet-4-0 |
| Claude Sonnet 4.5 | September 2025 | claude-sonnet-4-5 |
| Claude Sonnet 4.6 | February 2026 | claude-sonnet-4-6 |
| **Claude Sonnet 4.8** | **May 2026 (Expected)** | claude-sonnet-4-8 |

Skipping version 4.7 suggests this is **not a simple port from Opus 4.7**. It likely originates from a different development timeline and training run.

## Expected Specifications

Based on leaked information and extrapolating from Opus 4.7's improvements:

| Feature | Sonnet 4.6 (Current) | Sonnet 4.8 (Expected) |
|---------|----------------------|------------------------|
| SWE-bench Verified | 79.6% | **82-84%** |
| GPQA Diamond | 74.1% | **76-78%** |
| Image Resolution Limit | ~1.25MP | **3.75MP** (3x) |
| Context Window | 1M (beta) | 1M (possible GA) |
| Price (Input/Output) | $3/$15 | $3/$15 (likely unchanged) |
| Knowledge Cutoff | August 2025 | Late 2025 – Early 2026 |

### SWE-bench Verified: Basis for the 82-84% Estimate

Sonnet 4.6 scored 79.6% on SWE-bench Verified, nearly matching Opus 4.6 (80.8%). Opus 4.7 reached 87.6%, showing a ~7-point improvement over Opus 4.6.

If Sonnet 4.8 achieves a similar improvement margin (6-8 points) from Sonnet 4.6, **82-84%** becomes a reasonable estimate.

For context, the top SWE-bench Verified scores as of May 25, 2026:

| Rank | Model | Score |
|------|-------|-------|
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

Achieving 82-84% would place Sonnet 4.8 **ahead of Opus 4.5 and 4.6, and close to Opus 4.7**. This would deliver near-Opus level coding performance at the Sonnet price tier ($3/$15).

### Vision: 3.75MP Image Support

Opus 4.7 achieved "98.5% visual accuracy" and supports 3.75MP image resolution. Sonnet 4.8 is expected to bring this capability to the mid-tier price point.

Moving from Sonnet 4.6's ~1.25MP to 3.75MP—a **3x increase in resolution**—would significantly boost practicality for document analysis, UI mockup understanding, and chart interpretation.

### New "xhigh" Effort Level

The "xhigh" effort level (between "high" and "max") introduced with Opus 4.7 is also expected to be ported to Sonnet 4.8.

Current levels: low / medium / high / max

Adding **xhigh** allows for finer control over the cost-performance tradeoff.

### Tokenizer Update

Opus 4.7's new tokenizer generates between 1.0x to 1.35x more tokens depending on content type:

| Content Type | Token Increase Rate |
|--------------|---------------------|
| English Prose | ~1.0x (unchanged) |
| Code | ~1.1-1.2x |
| Structured Data (JSON, XML) | Up to 1.35x |

If Sonnet 4.8 adopts this tokenizer, **effective costs could rise by 10-35%**. Even if the API price remains $3/$15, the same content would be split into more tokens.

## Key Improvements Over Sonnet 4.6

### 1. Dramatically Enhanced Vision Capabilities

Expected visual abilities inherited from Opus 4.7:
- Image resolution: 1.25MP → 3.75MP
- Visual accuracy: 98.5% (measured on Opus 4.7)
- High-accuracy understanding of document screenshots, UI mockups, and charts

### 2. Improved Coding Performance

Opus 4.7's improvement track record:
- CursorBench: 58% → 70% (+12 points)
- 93-task coding benchmark: +13%
- Production task resolution: 3x increase

Sonnet 4.8 is expected to bring these gains to the $3/$15 price tier.

### 3. Shift in Prompt Interpretation

Opus 4.7 is described as interpreting prompts "more literally than 4.6." A similar behavioral shift is anticipated for Sonnet 4.8. While this means more precise instruction following, it may reduce flexibility for ambiguous prompts.

## Pricing: Stability in the Sonnet Tier

The Sonnet series has consistently maintained the $3/$15 pricing from 3.5 through 4.6:

| Model | Input/1M | Output/1M |
|-------|----------|------------|
| Claude 3.5 Sonnet | $3 | $15 |
| Claude 4 Sonnet | $3 | $15 |
| Claude Sonnet 4.5 | $3 | $15 |
| Claude Sonnet 4.6 | $3 | $15 |
| Claude Sonnet 4.8 (Expected) | $3 | $15 |

Meanwhile, the Opus tier saw a significant price cut with version 4.6 (from $15/$75 to $5/$25). If Sonnet 4.8 maintains $3/$15, it would be a model with **82-84% SWE-bench performance at 60% of Opus 4.7's price**.

## Related Leak Information

### KAIROS

Mentioned over 150 times in leaked Claude Code files, **KAIROS** appears to be a persistent daemon agent. Features include autonomous monitoring, memory consolidation ("autoDream"), preemptive actions, and push notifications.

### Mythos

Released April 7, 2026. Achieved 93.9% on SWE-bench Verified. Its use is limited to cybersecurity (Project Glasswing).

### numbat

Mentioned in leaked code but details are unknown for this unreleased model.

## Developer Expectations

Consolidating developer hopes for Sonnet 4.8:

1. **More reliable long-form output generation**
2. **Reduced over-engineering** (less addition of unnecessary complexity)
3. **Improved Time-to-First-Token (TTFT)**
4. **Better multi-file awareness in large codebases**
5. **Stable JSON/structured output and constrained decoding**

## Release Timeline

Predictions based on leaked information:

| Scenario | Timing | Probability |
|----------|--------|-------------|
| Best Case | Late April 2026 | Low |
| Most Likely | May 5-16, 2026 | Medium |
| Worst Case | Late May 2026 | Medium |

Given Opus 4.7 launched on April 16, Sonnet versions typically follow 3-4 weeks later. **Mid-May 2026** is the most probable release window.

## Competitive Landscape

Sonnet 4.8's positioning:

| Model | Input/1M | Output/1M | SWE-bench | Highlights |
|-------|----------|-----------|-----------|------------|
| Claude Sonnet 4.8 (Expected) | $3 | $15 | 82-84% | Vision 3.75MP, 1M context |
| Claude Sonnet 4.6 | $3 | $15 | 79.6% | Current workhorse |
| GPT-5.2 | $1.25 | $10.00 | 80.0% | OpenAI mainstay |
| DeepSeek V4 Pro (Max) | $1.74 | $3.48 | 80.6% | Most affordable frontier |
| Gemini 3.1 Pro | $2.50 | $15.00 | 80.6% | Google mainstay |
| MiniMax M2.5 | $0.15 | $1.15 | 80.2% | Coding-focused, cheapest |

If it hits 82-84%, Sonnet 4.8 would become **the strongest coding model in the Sonnet tier**. It would outperform Opus 4.5 (80.9%) and Opus 4.6 (80.8%) at a fraction of the cost.

## Conclusion

Claude Sonnet 4.8 has the potential to be Anthropic's most significant leap in the Sonnet line yet.

It promises to bring Opus 4.7's Vision capabilities, coding performance, and effort levels to the $3/$15 price bracket. Should it achieve 82-84% on SWE-bench Verified, it would deliver **Opus-level performance at Sonnet pricing**.

While these predictions are based on leaks, reviewing Anthropic's Sonnet series history suggests such an improvement is entirely plausible. We'll have to wait for the official announcement, but this is undoubtedly one of the most anticipated models for developers.