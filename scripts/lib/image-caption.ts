import fs from "fs";
import path from "path";

/**
 * image-caption.ts — Analyze blog images with vision model and generate captions
 * for images containing Chinese text. Used before translation so JP/EN captions
 * are generated automatically by the translation step.
 */

const VISION_MODEL = process.env.VISION_MODEL || "mimo-v2.5";
const VISION_API_KEY = process.env.VISION_API_KEY || process.env.LLM_API_KEY || "";
const VISION_BASE_URL =
  process.env.VISION_BASE_URL ||
  process.env.LLM_BASE_URL ||
  "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions";

function loadImageBase64(imagePath: string): { b64: string; mimeType: string } | null {
  const filePath = path.join(process.cwd(), "public", imagePath);
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return { b64: buf.toString("base64"), mimeType };
}

async function captionSingleImage(
  imagePath: string,
  articleTitle: string
): Promise<string | null> {
  const loaded = loadImageBase64(imagePath);
  if (!loaded) return null;

  const prompt = `This image is from a Chinese AI article titled "${articleTitle}".
Look at this image carefully. Does it contain any Chinese text (labels, UI elements, buttons, menu items, watermarks, annotations)?

If YES: Describe the image in 1-2 sentences in Chinese, focusing on what the Chinese text says and what the image shows. Be specific about the Chinese content.

If NO (purely English, numbers, or visual content with no Chinese): respond with exactly "NO_CHINESE".

Respond in Chinese only. Keep it under 50 characters.`;

  try {
    const res = await fetch(VISION_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VISION_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 128,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${loaded.mimeType};base64,${loaded.b64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const answer = data.choices[0]?.message?.content?.trim() || "";
    if (!answer || answer.includes("NO_CHINESE")) return null;
    return answer;
  } catch {
    return null;
  }
}

export async function captionImages(
  markdown: string,
  articleTitle: string
): Promise<Map<string, string>> {
  const captionMap = new Map<string, string>();
  const imgRegex = /!\[([^\]]*)\]\(\/images\/blog\/[^)]+\)/g;
  const matches = [...markdown.matchAll(imgRegex)];
  if (matches.length === 0) return captionMap;

  console.log(`  画像キャプション生成 (${matches.length}枚)...`);

  const BATCH_SIZE = 5;
  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const batch = matches.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (match) => {
        const pathMatch = match[0].match(/\(\/images\/blog\/[^)]+\)/);
        if (!pathMatch) return { path: "", caption: null as string | null };
        const imgPath = pathMatch[0].slice(1, -1);
        const caption = await captionSingleImage(imgPath, articleTitle);
        return { path: imgPath, caption };
      })
    );
    for (const r of results) {
      if (r.caption) {
        captionMap.set(r.path, r.caption);
        console.log(`    ✓ ${r.path.split("/").pop()}: ${r.caption.slice(0, 40)}...`);
      }
    }
  }

  console.log(`    ${captionMap.size}/${matches.length}枚にキャプション追加`);
  return captionMap;
}

export function injectCaptions(
  markdown: string,
  captionMap: Map<string, string>
): string {
  if (captionMap.size === 0) return markdown;

  const lines = markdown.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    result.push(line);
    if (line.match(/!\[([^\]]*)\]\(\/images\/blog\/[^)]+\)/)) {
      const imgPathMatch = line.match(/\(\/images\/blog\/[^)]+\)/);
      if (imgPathMatch) {
        const imgPath = imgPathMatch[0].slice(1, -1);
        const caption = captionMap.get(imgPath);
        if (caption) {
          result.push(`*画像説明: ${caption}*`);
          result.push("");
        }
      }
    }
  }

  return result.join("\n");
}

/**
 * Detect which images contain Chinese text. Returns a Set of image paths
 * (e.g., "/images/blog/slug/img-1.png") that have Chinese text overlays.
 */
export async function detectChineseImages(
  markdown: string,
  articleTitle: string
): Promise<Set<string>> {
  const chineseImages = new Set<string>();
  const imgRegex = /!\[([^\]]*)\]\(\/images\/blog\/[^)]+\)/g;
  const matches = [...markdown.matchAll(imgRegex)];
  if (matches.length === 0) return chineseImages;

  console.log(`  中国語テキスト画像検出 (${matches.length}枚)...`);

  const BATCH_SIZE = 5;
  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const batch = matches.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (match) => {
        const pathMatch = match[0].match(/\(\/images\/blog\/[^)]+\)/);
        if (!pathMatch) return { path: "", hasChinese: false };
        const imgPath = pathMatch[0].slice(1, -1);
        const caption = await captionSingleImage(imgPath, articleTitle);
        return { path: imgPath, hasChinese: caption !== null };
      })
    );
    for (const r of results) {
      if (r.hasChinese) {
        chineseImages.add(r.path);
        console.log(`    🔴 ${r.path.split("/").pop()}: 中国語テキスト検出`);
      } else {
        console.log(`    ✓ ${r.path.split("/").pop()}: 問題なし`);
      }
    }
  }

  console.log(`    ${chineseImages.size}/${matches.length}枚に中国語テキスト`);
  return chineseImages;
}

/**
 * Replace images containing Chinese text with Japanese text descriptions.
 * Generates Japanese descriptions via LLM, replaces image references in markdown,
 * and deletes the image files from public/.
 *
 * Call this AFTER Japanese translation, BEFORE English translation.
 */
export async function replaceChineseImages(
  markdown: string,
  chineseImages: Set<string>,
  articleTitle: string
): Promise<string> {
  if (chineseImages.size === 0) return markdown;

  console.log(`  中国語画像を日本語テキストに置換 (${chineseImages.size}枚)...`);

  // Generate Japanese descriptions for each Chinese image
  const descriptionMap = new Map<string, string>();

  const BATCH_SIZE = 5;
  const imagePaths = [...chineseImages];
  for (let i = 0; i < imagePaths.length; i += BATCH_SIZE) {
    const batch = imagePaths.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (imgPath) => {
        const loaded = loadImageBase64(imgPath);
        if (!loaded) return { path: imgPath, description: null as string | null };

        const prompt = `この画像は「${articleTitle}」という日本語のAI記事に含まれています。
画像を注意深く見てください。画像に含まれる中国語のテキスト（ラベル、UI要素、ボタン、メニュー項目、注釈など）の内容を、日本語で簡潔に説明してください。

画像が何を示しているのかも含めて、1〜3文の日本語で記述してください。
日本語のみで回答してください。`;

        try {
          const res = await fetch(VISION_BASE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${VISION_API_KEY}`,
            },
            body: JSON.stringify({
              model: VISION_MODEL,
              max_tokens: 256,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    {
                      type: "image_url",
                      image_url: { url: `data:${loaded.mimeType};base64,${loaded.b64}` },
                    },
                  ],
                },
              ],
            }),
          });

          if (!res.ok) return { path: imgPath, description: null };
          const data = (await res.json()) as {
            choices: { message: { content: string } }[];
          };
          const description = data.choices[0]?.message?.content?.trim() || null;
          return { path: imgPath, description };
        } catch {
          return { path: imgPath, description: null };
        }
      })
    );

    for (const r of results) {
      if (r.description) {
        descriptionMap.set(r.path, r.description);
        console.log(`    ✓ ${r.path.split("/").pop()}: ${r.description.slice(0, 50)}...`);
      } else {
        console.log(`    ⚠ ${r.path.split("/").pop()}: 説明生成失敗`);
      }
    }
  }

  // Replace image references with Japanese text descriptions in markdown
  let result = markdown;
  for (const [imgPath, description] of descriptionMap) {
    const escapedPath = imgPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const imgLineRegex = new RegExp(`!?\\[[^\\]]*\\]\\(${escapedPath}\\)`, "g");
    result = result.replace(imgLineRegex, `> ${description}`);
  }

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  // Delete the image files
  for (const imgPath of chineseImages) {
    const filePath = path.join(process.cwd(), "public", imgPath);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`    🗑 削除: ${imgPath}`);
      }
    } catch (err) {
      console.log(`    ⚠ 削除失敗: ${imgPath}`);
    }
  }

  console.log(`    ${descriptionMap.size}枚をテキストに置換`);
  return result;
}
