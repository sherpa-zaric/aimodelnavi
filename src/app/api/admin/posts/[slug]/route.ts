import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const REPO = "focusontec/aimodelnavi";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const filePath = `src/content/blog/${slug}.md`;

  // Check if file exists locally
  const localPath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(localPath)) {
    return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
  }

  // Get GitHub token from environment
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN が設定されていません" }, { status: 500 });
  }

  try {
    // Step 1: Get the file's SHA (required for GitHub API delete)
    const fileRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "AIModelsNavi-Admin",
        },
      }
    );

    if (!fileRes.ok) {
      const err = await fileRes.text();
      console.error("GitHub API error (get file):", err);
      if (fileRes.status === 404) {
        return NextResponse.json({ error: "記事が見つかりません（リモートで既に削除済み）" }, { status: 404 });
      }
      return NextResponse.json({ error: "GitHub API エラー" }, { status: 500 });
    }

    const fileData = await fileRes.json();
    const sha = fileData.sha;

    // Step 2: Delete the file via GitHub API
    const deleteRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${filePath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "AIModelsNavi-Admin",
        },
        body: JSON.stringify({
          message: `blog: delete article — ${slug}`,
          sha,
          committer: {
            name: "aimodelsnavi-bot",
            email: "bot@aimodelsnavi.com",
          },
        }),
      }
    );

    if (!deleteRes.ok) {
      const err = await deleteRes.text();
      console.error("GitHub API error (delete):", err);
      return NextResponse.json({ error: "ファイルの削除に失敗しました" }, { status: 500 });
    }

    // Step 3: Also delete associated images if they exist
    const imgDir = path.join(process.cwd(), "public/images/blog", slug);
    if (fs.existsSync(imgDir)) {
      // Delete local images (they'll be committed by the next pipeline run)
      fs.rmSync(imgDir, { recursive: true, force: true });
    }

    // Step 4: Delete local file
    fs.unlinkSync(localPath);

    return NextResponse.json({ deleted: true, slug });
  } catch (err) {
    console.error("DELETE /api/admin/posts/[slug] error:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
