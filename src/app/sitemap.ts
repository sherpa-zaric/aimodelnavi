import { MetadataRoute } from "next";
import { modelDetails } from "@/data/models";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://aimodelsnavi.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/models`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/tools/cost-calculator`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/tools/model-compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/tools/token-counter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  // All model detail pages
  for (const model of modelDetails) {
    const date = model.releaseDate ? new Date(model.releaseDate) : null;
    entries.push({
      url: `${BASE_URL}/models/${model.slug}`,
      lastModified: date && !isNaN(date.getTime()) ? date : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
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
    });
  }

  return entries;
}
