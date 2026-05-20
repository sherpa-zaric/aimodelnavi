/**
 * image-filter.ts — Image filtering for blog articles
 *
 * Two-layer filtering:
 * 1. Heuristic: keyword/URL pattern matching (fast, no API)
 * 2. AI Vision: classify images using LLM vision model (accurate)
 *
 * Used by: fetch-article.ts, sync-blog.ts
 */

// ── Heuristic filter ──

const PROMO_KEYWORDS = [
  "微信", "公众号", "扫码", "关注", "二维码", "读者群",
  "wechat", "QR", "qrcode", "订阅", "加群", "客服",
  "点赞", "在看", "转发", "分享", "推广", "广告",
  "长按", "识别", "海报", "福利", "领取", "限时",
];

const PROMO_URL_PATTERNS = [
  "wechat", "qrcode", "qr-code", "promotion", "banner", "ad-",
  "mpmenu", "reward", "like-author",
];

export function isPromoByHeuristic(alt: string, src: string): boolean {
  const lowerAlt = alt.toLowerCase();
  const lowerSrc = src.toLowerCase();

  for (const kw of PROMO_KEYWORDS) {
    if (lowerAlt.includes(kw)) return true;
  }

  for (const pat of PROMO_URL_PATTERNS) {
    if (lowerSrc.includes(pat)) return true;
  }

  return false;
}

// ── AI Vision filter ──

export type ImageClassification = "promo" | "chinese_text" | "content";

export async function classifyImageWithVision(
  imageUrl: string,
  imageAlt: string,
  articleTitle: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<ImageClassification> {
  try {
    let b64: string;
    let mimeType: string;

    if (imageUrl.startsWith("/")) {
      // Local file
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "public", imageUrl);
      if (!fs.existsSync(filePath)) return "content";
      const buf = fs.readFileSync(filePath);
      b64 = buf.toString("base64");
      mimeType = filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")
        ? "image/jpeg"
        : filePath.endsWith(".webp")
        ? "image/webp"
        : "image/png";
    } else {
      // Remote URL
      const res = await fetch(imageUrl, {
        headers: { "User-Agent": "AIModelsNavi/1.0" },
      });
      if (!res.ok) return "content";
      const buf = Buffer.from(await res.arrayBuffer());
      b64 = buf.toString("base64");
      mimeType = res.headers.get("content-type") || "image/webp";
    }

    const prompt = `Analyze this image from a Chinese AI blog article titled "${articleTitle}" (alt text: "${imageAlt}").

Classify as one of:
- "promo": WeChat/微信公众号 QR code, subscription banner, "scan to follow", reader group invite, advertisement, or promotional content
- "chinese_text": contains Chinese text but appears to be a content image (infographic, diagram, chart, screenshot with Chinese labels)
- "content": purely technical content (chart, diagram, architecture, benchmark results, photo) — no Chinese text at all

Respond with EXACTLY one word: promo, chinese_text, or content.`;

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 32,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${b64}` } },
          ],
        }],
      }),
    });

    if (!res.ok) return "content";
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const answer = data.choices[0].message.content.toLowerCase().trim();

    if (answer.includes("promo")) return "promo";
    if (answer.includes("chinese")) return "chinese_text";
    return "content";
  } catch {
    return "content"; // on error, keep the image
  }
}

// ── Combined filter ──

export interface ImageToFilter {
  url: string;
  alt: string;
}

export async function filterImages(
  images: ImageToFilter[],
  articleTitle: string,
  options: { useVision?: boolean; apiKey?: string; baseUrl?: string; model?: string } = {}
): Promise<{ kept: ImageToFilter[]; rejected: { image: ImageToFilter; reason: string }[] }> {
  const kept: ImageToFilter[] = [];
  const rejected: { image: ImageToFilter; reason: string }[] = [];

  // Layer 1: Heuristic filter
  const heuristicKeep: ImageToFilter[] = [];
  for (const img of images) {
    if (isPromoByHeuristic(img.alt, img.url)) {
      rejected.push({ image: img, reason: "promo (keyword)" });
    } else {
      heuristicKeep.push(img);
    }
  }

  if (rejected.length > 0) {
    console.log(`  Heuristic: rejected ${rejected.length} promo images`);
  }

  if (heuristicKeep.length === 0) return { kept, rejected };

  // Layer 2: AI Vision filter (if enabled and API available)
  if (options.useVision && options.apiKey && options.baseUrl && options.model) {
    console.log(`  Vision AI: analyzing ${heuristicKeep.length} images...`);
    for (const img of heuristicKeep) {
      const classification = await classifyImageWithVision(
        img.url, img.alt, articleTitle,
        options.apiKey, options.baseUrl, options.model
      );
      if (classification === "promo" || classification === "chinese_text") {
        const reason = classification === "promo" ? "promo (AI)" : "chinese text (AI)";
        console.log(`    ✗ ${reason}: ${img.alt || img.url.split("/").pop()}`);
        rejected.push({ image: img, reason });
      } else {
        console.log(`    ✓ content: ${img.alt || img.url.split("/").pop()}`);
        kept.push(img);
      }
    }
  } else {
    kept.push(...heuristicKeep);
  }

  return { kept, rejected };
}
