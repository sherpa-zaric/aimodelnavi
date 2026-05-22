import { MetadataRoute } from "next";
import { modelDetails } from "@/data/models";
import { getAllPosts } from "@/lib/blog";
import { categoryOrder } from "@/lib/leaderboard-categories";

const BASE_URL = "https://aimodelsnavi.com";

function langs(jaPath: string, enPath: string) {
  return { languages: { ja: `${BASE_URL}${jaPath}`, en: `${BASE_URL}${enPath}`, "x-default": `${BASE_URL}${jaPath}` } };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0, alternates: langs("", "/en") },
    { url: `${BASE_URL}/models`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9, alternates: langs("/models", "/en/models") },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8, alternates: langs("/leaderboard", "/en/leaderboard") },
    { url: `${BASE_URL}/benchmarks`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8, alternates: langs("/benchmarks", "/en/benchmarks") },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8, alternates: langs("/pricing", "/en/pricing") },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7, alternates: langs("/blog", "/en/blog") },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5, alternates: langs("/about", "/en/about") },
    { url: `${BASE_URL}/tools/cost-calculator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6, alternates: langs("/tools/cost-calculator", "/en/tools/cost-calculator") },
    { url: `${BASE_URL}/tools/model-compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6, alternates: langs("/tools/model-compare", "/en/tools/model-compare") },
    { url: `${BASE_URL}/tools/token-counter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6, alternates: langs("/tools/token-counter", "/en/tools/token-counter") },
  ];

  // Leaderboard category pages
  for (const slug of categoryOrder) {
    entries.push({
      url: `${BASE_URL}/leaderboard/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
      alternates: langs(`/leaderboard/${slug}`, `/en/leaderboard/${slug}`),
    });
  }

  // All model detail pages
  for (const model of modelDetails) {
    const date = model.releaseDate ? new Date(model.releaseDate) : null;
    entries.push({
      url: `${BASE_URL}/models/${model.slug}`,
      lastModified: date && !isNaN(date.getTime()) ? date : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: langs(`/models/${model.slug}`, `/en/models/${model.slug}`),
    });
  }

  // All blog posts
  const posts = getAllPosts();
  for (const post of posts) {
    const date = new Date(post.date);
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: isNaN(date.getTime()) ? new Date() : date,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: langs(`/blog/${post.slug}`, `/en/blog/${post.slug}`),
    });
  }

  return entries;
}
