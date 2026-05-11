/**
 * File-based storage for structured data.
 * All data lives in src/data/ as TypeScript files that the Next.js app imports directly.
 * Blog posts live in src/content/blog/ as Markdown files.
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/data");
const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export function saveDataFile(filename: string, content: string): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, content, "utf-8");
  console.log(`  → Saved ${filename}`);
}

export function readDataFile(filename: string): string | null {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath, "utf-8");
}

export function saveBlogPost(slug: string, frontmatter: Record<string, string>, content: string): void {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value.includes('"')) {
      lines.push(`${key}: '${value}'`);
    } else {
      lines.push(`${key}: "${value}"`);
    }
  }
  lines.push("---");
  lines.push("");
  lines.push(content);

  const filepath = path.join(BLOG_DIR, `${slug}.md`);
  fs.writeFileSync(filepath, lines.join("\n"), "utf-8");
  console.log(`  → Saved blog: ${slug}.md`);
}

/**
 * Compare two data snapshots and return a summary of changes.
 */
export function diffSnapshots(
  oldData: Record<string, unknown>[],
  newData: Record<string, unknown>[],
  keyField: string
): { added: number; removed: number; changed: string[] } {
  const oldMap = new Map(oldData.map((d) => [d[keyField], d]));
  const newMap = new Map(newData.map((d) => [d[keyField], d]));

  const added = newData.filter((d) => !oldMap.has(d[keyField] as string)).length;
  const removed = oldData.filter((d) => !newMap.has(d[keyField] as string)).length;

  const changed: string[] = [];
  for (const [key, newEntry] of newMap) {
    const oldEntry = oldMap.get(key);
    if (oldEntry && JSON.stringify(oldEntry) !== JSON.stringify(newEntry)) {
      changed.push(key as string);
    }
  }

  return { added, removed, changed };
}
