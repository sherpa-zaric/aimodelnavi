import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDir = path.join(process.cwd(), 'src/content/blog');
const blogEnDir = path.join(process.cwd(), 'src/content/blog-en');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tag: string;
  excerpt: string;
  content: string;
}

function loadPostFromFile(filepath: string, slug: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(filepath, 'utf-8');
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title,
      date: data.date,
      tag: data.tag,
      excerpt: data.excerpt,
      content,
    };
  } catch {
    return null;
  }
}

export function getAllPosts(locale: string = 'ja'): BlogPost[] {
  if (locale === 'en') {
    // EN listing: return all JA posts (listing page uses manifest for EN titles)
    // Detail page will use getPostBySlug which tries EN first, falls back to JA
    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
    return files
      .map((file) => {
        const slug = file.replace(/\.md$/, '');
        return loadPostFromFile(path.join(blogDir, file), slug);
      })
      .filter((p): p is BlogPost => p !== null)
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }

  // JA: read from blog/
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      return loadPostFromFile(path.join(blogDir, file), slug);
    })
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string, locale: string = 'ja'): BlogPost | null {
  if (locale === 'en') {
    // EN: try EN version first, fall back to JA
    const enPath = path.join(blogEnDir, `${slug}.md`);
    const enPost = loadPostFromFile(enPath, slug);
    if (enPost) return enPost;
  }
  return loadPostFromFile(path.join(blogDir, `${slug}.md`), slug);
}
