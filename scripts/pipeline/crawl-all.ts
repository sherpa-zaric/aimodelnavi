/**
 * Crawl orchestrator - runs all crawler sources.
 */

import { crawlDataLearner } from "../sources/datalearner";
import { crawlHuggingFace } from "../sources/huggingface";

export interface PipelineCrawlResult {
  datalearner: Awaited<ReturnType<typeof crawlDataLearner>>;
  huggingface: Awaited<ReturnType<typeof crawlHuggingFace>>;
}

export async function crawlAll(mode: "full" | "incremental"): Promise<PipelineCrawlResult> {
  console.log("\n═══ Stage 1: Crawl ═══");

  const datalearner = await crawlDataLearner(mode);
  const huggingface = await crawlHuggingFace(mode);

  return { datalearner, huggingface };
}