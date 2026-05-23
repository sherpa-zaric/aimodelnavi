---
title: "Google's Gemini 3.1 Pro Achieves 77.1% on ARC-AGI-2, Doubling Previous Reasoning Capabilities"
date: "2026-05-23"
tag: "Google"
excerpt: "Google's Gemini 3.1 Pro sets a new benchmark with a 77.1% score on ARC-AGI-2, doubling the reasoning performance of its predecessor. The model excels in agent tasks and multimodal benchmarks, solidifying its position as a top contender in the AI industry."
---

## What is Gemini 3.1 Pro?

On February 19, 2026, Google unveiled Gemini 3.1 Pro, the latest addition to its Gemini 3 series. As the successor to Gemini 3 Pro, it brings substantial enhancements to reasoning performance, multimodal support, and agent functionalities.

**Key Specifications**

| Item | Details |
|---|---|
| Context Window | 1M tokens |
| Max Output | 64K tokens |
| Supported Inputs | Text, Code, Images, Audio, Video, PDF |
| Knowledge Cutoff | January 2025 |
| Availability | API (Preview), Gemini App, NotebookLM |

---

## Main Benchmark Results

### Reasoning

| Benchmark | Gemini 3.1 Pro | Gemini 3 Pro | Claude Opus 4.6 | GPT-5.2 |
|---|---|---|---|---|
| ARC-AGI-2 | **77.1%** | 31.1% | 68.8% | 52.9% |
| GPQA Diamond | **94.3%** | 91.9% | 91.3% | 92.4% |
| HLE (Academic Reasoning) | **44.4%** | 37.5% | 40.0% | 34.5% |

On ARC-AGI-2, it surged from 31.1% to 77.1%, marking a **2.5x improvement** in the ability to solve entirely novel logical patterns.

### Coding and Agents

| Benchmark | Gemini 3.1 Pro | Claude Opus 4.6 | GPT-5.3-Codex |
|---|---|---|---|
| SWE-Bench Verified | 80.6% | 80.8% | — |
| SWE-Bench Pro | 54.2% | — | 56.8% |
| Terminal-Bench 2.0 | 68.5% | 65.4% | 64.7% |
| SciCode | **59%** | 52% | — |
| LiveCodeBench Pro | **2887 Elo** | — | — |

It nearly matches Claude Opus 4.6 (80.8%) on SWE-Bench Verified and outperforms it on Terminal-Bench 2.0 with 68.5% versus 65.4%.

### Multimodal and Multilingual

| Benchmark | Gemini 3.1 Pro | Gemini 3 Pro |
|---|---|---|
| MMMU-Pro | 80.5% | 81.0% |
| MMMLU | 92.6% | 91.8% |
| MRCR v2 (128K) | 84.9% | 77.0% |

### Agent and Tool Usage

| Benchmark | Gemini 3.1 Pro | Claude Opus 4.6 | GPT-5.2 |
|---|---|---|---|
| MCP Atlas | **69.2%** | 59.5% | 60.6% |
| BrowseComp | **85.9%** | 84.0% | 65.8% |
| τ2-bench (Retail) | 90.8% | 91.9% | 82.0% |

It significantly outperforms Claude Opus 4.6 (59.5%) on MCP Atlas with a 69.2% score.

---

## Strengths of Gemini 3.1 Pro

### 1. Dramatic Improvement in Abstract Reasoning

The 77.1% on ARC-AGI-2 is a leap from the previous generation's 31.1%. This benchmark evaluates the ability to tackle "completely new logical patterns," serving as a key indicator of a model's generalization capability.

### 2. Enhanced Agent Workflows

Scores like MCP Atlas at 69.2% and BrowseComp at 85.9% highlight superiority in multi-step tool usage tasks. Google emphasizes improvements in agent capabilities for domains such as "finance and spreadsheet applications."

### 3. Expanded Thinking Levels

A new `MEDIUM` thinking level has been introduced, allowing for finer adjustments in the trade-off between cost, performance, and speed. Combined with the existing `HIGH`, it simplifies optimization for various use cases.

### 4. Custom Tool Endpoints

A dedicated endpoint, `gemini-3.1-pro-preview-customtools`, is now available, optimized for agent workflows that prioritize custom tools like `view_file` or `search_code`.

---

## Pricing and Availability

Gemini 3.1 Pro is accessible on the following platforms:

- **For Developers**: Gemini API (Google AI Studio), Gemini CLI, Google Antigravity, Android Studio
- **For Enterprises**: Vertex AI, Gemini Enterprise
- **For Consumers**: Gemini App, NotebookLM (Pro/Ultra plans)

Subscribers to Google AI Pro ($20/month) and Ultra ($100/month) plans can access Gemini 3.1 Pro in the Gemini app with enhanced usage limits.

---

## Positioning Compared to Other Models

In the early 2026 AI model landscape, Gemini 3.1 Pro stands out as follows:

| Model | Strengths | GPQA Diamond | SWE-Bench Verified |
|---|---|---|---|
| Gemini 3.1 Pro | Abstract Reasoning, Multimodal | **94.3%** | 80.6% |
| Claude Opus 4.6 | Coding, Long-context Processing | 91.3% | 80.8% |
| Qwen3.7-Max | Agent, Long-term Autonomy | 92.4% | 80.4% |
| GPT-5.2 | Balanced | 92.4% | 80.0% |

Its GPQA Diamond score of 94.3% is the highest among published results.

---

## Summary

Gemini 3.1 Pro represents a major upgrade in reasoning capabilities from Gemini 3 Pro. The standout 77.1% on ARC-AGI-2 demonstrates exceptional generalization for abstract logical problems, surpassing other models significantly.

Key highlights:

1. **ARC-AGI-2**: 77.1% (2.5x improvement over the previous generation)
2. **GPQA Diamond**: 94.3% (highest recorded score)
3. **SWE-Bench Verified**: 80.6% (on par with Claude Opus 4.6)
4. **MCP Atlas**: 69.2% (leads in agent capabilities)
5. **1M tokens** context window
6. Addition of **MEDIUM thinking level** for streamlined cost optimization