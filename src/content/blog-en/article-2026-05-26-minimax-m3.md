---
title: "MiniMax M3: The 1-Trillion-Parameter Model Betting Everything on Office AI"
date: "2026-05-26"
tag: "Open Source"
excerpt: "MiniMax's upcoming M3 model targets the office productivity market with ~1 trillion parameters, 1M context windows, and multimodal vision — a strategic pivot away from coding. Building on M2.5's cost leadership ($0.15/M tokens, 1/100th of Claude Opus pricing), M3 aims to challenge GPT and Claude where Chinese models have been virtually absent: Word, Excel, and PowerPoint workflows."
---

In April, a single tweet sent ripples through the AI industry.

MiniMax engineer Skyler Miao confirmed on X that the company's next flagship model, **M3**, will feature multimodal vision capabilities — marking an official declaration that the Chinese AI lab is ready to challenge Claude and GPT on their own turf.

Coming right on the heels of M2.7's text-only performance rivaling Claude Opus in coding benchmarks, the news electrified the developer community.

---

## The Path M2.5 Blazed Open

Before diving into M3, you need to understand the foundation it's built on — M2.5 and M2.7.

**M2.5**, released in February 2026, was the model that changed MiniMax's trajectory. According to OpenRouter data, it consumed **3.07 trillion tokens** within just one week of launch, topping global API call volumes and pushing MiniMax's annual recurring revenue (ARR) to $150 million.

![](/images/blog/article-2026-05-26-minimax-m3/img-2-benchmark.jpg)

The defining trait of M2.5 in a single sentence: **frontier-tier coding capability with just 10B effective parameters.**

On SWE-Bench Verified, it scored 80.2%. In the Droid harness, it hit 79.7%, edging past Opus 4.6's 78.9%. On Multi-SWE-Bench for multilingual coding, it set an industry-leading 51.3%.

But the real shock was the cost. Running continuously for one hour at 100 TPS costs roughly **one dollar**. At 50 TPS, it's 30 cents. MiniMax called it "the first frontier model where users never have to think about cost."

## M2.7: The Birth of Self-Evolution

Released in March 2026, **M2.7** pushed the envelope further.

Its most significant innovation was a mechanism MiniMax calls **self-evolution**. Internally, M2.7 built its own reinforcement learning (RL) experiment harnesses, fed experiment results back into its own learning process, and iterated in a closed loop. Human researchers set the direction; the model executed, analyzed, and improved. M2.7 ended up autonomously handling 30–50% of the RL team's workflow.

![](/images/blog/article-2026-05-26-minimax-m3/img-4-mle-bench.png)

Benchmark results tell the story:

| Benchmark | M2.7 Score | What It Measures |
|-------------|-----------|------|
| SWE-Pro | 56.22% | Real-world software engineering |
| TerminalBench 2 | 57.0% | Terminal-based agent tasks |
| VIBE-Pro | 55.6% | End-to-end project delivery |
| GDPval-AA | ELO 1495 | Office document creation (open-source leading score) |

Office capabilities also saw major upgrades. M2.7 handles complex editing in Word, Excel, and PowerPoint; multi-round revisions; and high-fidelity edits — all while maintaining a **97% skill compliance rate** across 40+ complex skills (each exceeding 2,000 tokens).

## What to Expect from M3

Multiple sources confirm M3 is slated for release **sometime in May 2026**. MiniMax founder "adao" reportedly told internal groups that "M3 is not far off" and "it's just the beginning," while engineer Skyler Miao officially confirmed multimodal vision capabilities.

Expected specifications:

| Dimension | Projected Spec |
|------|------------|
| Parameters | ~1 trillion (1T) |
| Context Window | 1 million tokens |
| Multimodal | Text + Vision (document and spreadsheet screenshot analysis) |
| Target Scenario | Office (document comprehension, spreadsheets, presentation generation) |
| Pricing Strategy | Continuing M2.5's cost-competitive approach |

A Morgan Stanley research note predicts M3 will "resolve knowledge capacity issues through additional pre-training and architectural innovations, support robust multimodal understanding, and deliver overall performance that squarely challenges the world's top flagship models."

## Why Office? Why Now?

M3's strategic bet is unmistakable — **prioritize office scenarios over coding.**

Three market shifts in 2026 explain why this makes sense.

**First**, Microsoft Agent 365 reached general availability, causing enterprise demand for office AI to explode.

**Second**, Claude Code's success proved the value of "agent execution." Models that actually *do* the work rather than merely advising in chat deliver ten times the value.

**Third**, Chinese models are virtually absent from the office scenario. GPT and Claude dominate general conversation; M2.5 and GLM-5 compete in coding — but the vast, untouched third territory is office productivity.

![](/images/blog/article-2026-05-26-minimax-m3/img-5-coding-bench.png)

MiniMax has also open-sourced its Office Skills engine under the MIT license. Supporting Word, Excel, PowerPoint, and PDF, it bypasses legacy libraries to generate output that directly conforms to Office standards. M3 is expected to integrate deeply with this engine.

## The May Model War

M3's release window coincides with one of the most intense launch periods in AI history.

| Model | Company | Why It Matters |
|--------|------|-------------|
| GPT-5.6 | OpenAI | Parameter retuning, Terminal-Bench refresh |
| Sonnet 4.8 | Anthropic | Enhanced coding capability |
| Gemini 3.5 | Google | Pre-Google I/O warmup, multimodal upgrades |
| MiniMax M3 | MiniMax | Chinese flagship, agent-native, cost-efficient |

This marks the first time a Chinese model is competing head-to-head with all three US flagships in the same release window.

## The Divergence of Chinese Models

M3's arrival symbolizes a broader structural shift across the Chinese model ecosystem.

| Model | Primary Focus | Current Status |
|--------|---------|-----------|
| Qwen 3.6 | Coding + Agents | 1M context, Fireworks integration |
| Kimi K2.6 | Coding + Vision | SWE-bench leader, Swarm preview |
| DeepSeek V4 | Reasoning + Cost Efficiency | 1T MoE, cache price cuts |
| GLM-5 | Long-horizon Agents | Autonomous engineering capabilities |
| **MiniMax M3** | **Office Scenarios** | **Releasing soon** |

Chinese models once fought a war of attrition in the same lane. But by May 2026, each company is carving out a distinctly differentiated position. M3 chose "office" — arguably the largest unoccupied territory of all.

![](/images/blog/article-2026-05-26-minimax-m3/img-6-office-bench.png)

## What This Means for the Broader Market

M3's arrival is too significant to ignore, especially for enterprise buyers.

**Cost competitiveness is staggering.** M2.5's input pricing is $0.15 per million tokens. Compared to Claude Opus 4.7's $15, that's **1/100th the price**. If M3 maintains this price point while pushing office-scenario quality to frontier levels, enterprise AI adoption costs drop dramatically.

**Office compatibility opens integration pathways.** MiniMax has open-sourced its Office Skills engine under MIT, meaning integration with WPS and other business systems is technically feasible. However, enterprise compliance requirements — data security, audit logging — could remain adoption barriers.

**Multimodal vision reshapes knowledge work.** Parsing spreadsheets from document screenshots and auto-generating presentations is the kind of capability that can fundamentally transform how office workers operate.

## Challenges and Risks

Caveats apply.

**Release delays are real.** Chinese models have a pattern of slipping past announced timelines. M3 missing the May window remains entirely possible.

**Office scenarios are deceptively hard.** Raw model capability isn't enough — deep integration with the Office/WPS ecosystem is essential. Microsoft Agent 365 is already in GA with an overwhelming ecosystem advantage.

**Knowledge capacity tradeoffs persist.** M2.5's 10B effective parameter design came with reported knowledge limitations. Scaling to 1 trillion parameters should resolve this, but balancing knowledge density against inference cost becomes the new challenge.

## The Bottom Line

MiniMax M3 marks a turning point: Chinese models are graduating from competing on cost alone to differentiating by scenario.

![](/images/blog/article-2026-05-26-minimax-m3/img-1-hero.png)

One trillion parameters, one million tokens, multimodal vision — on paper, the specs stand shoulder-to-shoulder with GPT-5.5 and Claude Opus 4.7. But M3's real winning formula isn't the specs. **It's how fast and how cheaply MiniMax can fill the vast, unoccupied territory of office productivity.**

Just as Huawei built a "spare tire" in 2019 when chips were cut off, MiniMax is building another lane. After coding, the next frontier is office. And MiniMax is betting the farm on it.