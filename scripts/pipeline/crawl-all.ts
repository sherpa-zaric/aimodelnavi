/**
 * Crawl orchestrator - runs all crawler sources.
 */

import { crawlDataLearner } from "../sources/datalearner";
import { crawlHuggingFace } from "../sources/huggingface";
import { crawlDataLearnerBlog } from "../sources/datalearner-blog";

export interface PipelineCrawlResult {
  datalearner: Awaited<ReturnType<typeof crawlDataLearner>>;
  huggingface: Awaited<ReturnType<typeof crawlHuggingFace>>;
  datalearnerBlog: Awaited<ReturnType<typeof crawlDataLearnerBlog>>;
}

export async function crawlAll(mode: "full" | "incremental"): Promise<PipelineCrawlResult> {
  console.log("\n═══ Stage 1: Crawl ═══");

  const datalearner = await crawlDataLearner(mode);
  const huggingface = await crawlHuggingFace(mode);
  const datalearnerBlog = await crawlDataLearnerBlog(mode);

  return { datalearner, huggingface, datalearnerBlog };
}