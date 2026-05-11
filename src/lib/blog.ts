import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDir = path.join(process.cwd(), 'src/content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tag: string;
  excerpt: string;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, '');

    return {
      slug,
      title: data.title,
      date: data.date,
      tag: data.tag,
      excerpt: data.excerpt,
      content,
    };
  });

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(path.join(blogDir, `${slug}.md`), 'utf-8');
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
