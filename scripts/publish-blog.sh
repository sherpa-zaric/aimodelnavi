#!/bin/bash
#
# publish-blog.sh — 一键发布中文博客到 AI Models Navi
#
# 用法：
#   ./scripts/publish-blog.sh <中文markdown文件>           # 远程模式（GitHub Actions）
#   ./scripts/publish-blog.sh <中文markdown文件> --local   # 本地模式（直接翻译+提交）
#   ./scripts/publish-blog.sh <中文markdown文件> --yes     # 跳过确认
#
# 远程模式（默认）：
#   读取中文 Markdown → 调用 GitHub Actions → 自动翻译成日文 → 发布到网站
#   适用于：文章中有 http 图片 URL，或无图片
#
# 本地模式（--local）：
#   读取中文 Markdown → 本地翻译 → 处理本地图片 → 直接 commit + push
#   适用于：fetch-article.ts 已下载图片到本地的情况
#
# 前置条件：
#   远程模式：gh CLI 已登录
#   本地模式：LLM_API_KEY 环境变量已设置

set -euo pipefail

REPO="focusontec/aimodelnavi"
WORKFLOW="publish-blog.yml"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── 参数解析 ──

FILE=""
AUTO_YES=false
LOCAL_MODE=false

for arg in "$@"; do
  if [ "$arg" = "--yes" ] || [ "$arg" = "-y" ]; then
    AUTO_YES=true
  elif [ "$arg" = "--local" ]; then
    LOCAL_MODE=true
  elif [ -z "$FILE" ] && [[ "$arg" != --* ]]; then
    FILE="$arg"
  fi
done

if [ -z "$FILE" ]; then
  echo "用法: $0 <中文markdown文件> [--local] [--yes]"
  echo ""
  echo "  --local  本地翻译+提交（图片已在本地）"
  echo "  --yes    跳过确认提示"
  echo ""
  echo "Markdown 文件格式："
  echo "  ---"
  echo "  title: \"文章标题\""
  echo "  tag: \"Anthropic\"        # 可选，默认 解説"
  echo "  excerpt: \"摘要\"         # 可选，不填则 LLM 生成"
  echo "  ---"
  echo "  正文内容..."
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "错误：文件不存在 — $FILE"
  exit 1
fi

# ── 解析 frontmatter ──

TITLE=""
TAG="解説"
EXCERPT=""
BODY=""

IN_FRONTMATTER=false
FRONTMATTER_DONE=false
LINE_NUM=0

while IFS= read -r line || [ -n "$line" ]; do
  LINE_NUM=$((LINE_NUM + 1))

  if [ "$LINE_NUM" -eq 1 ] && [[ "$line" == "---" ]]; then
    IN_FRONTMATTER=true
    continue
  fi

  if [ "$IN_FRONTMATTER" = true ] && [[ "$line" == "---" ]]; then
    IN_FRONTMATTER=false
    FRONTMATTER_DONE=true
    continue
  fi

  if [ "$IN_FRONTMATTER" = true ]; then
    if [[ "$line" =~ ^title:\ *\"(.+)\" ]]; then
      TITLE="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^title:\ *(.+) ]]; then
      TITLE="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^tag:\ *\"(.+)\" ]]; then
      TAG="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^tag:\ *(.+) ]]; then
      TAG="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^excerpt:\ *\"(.+)\" ]]; then
      EXCERPT="${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^excerpt:\ *(.+) ]]; then
      EXCERPT="${BASH_REMATCH[1]}"
    fi
  else
    if [ -n "$BODY" ]; then
      BODY="${BODY}"$'\n'"${line}"
    else
      BODY="$line"
    fi
  fi
done < "$FILE"

BODY=$(echo "$BODY" | sed '/./,$!d')

# ── 验证 ──

if [ -z "$TITLE" ]; then
  echo "错误：Markdown 文件缺少 title 字段"
  exit 1
fi

if [ -z "$BODY" ]; then
  echo "错误：文件正文为空"
  exit 1
fi

BODY_LEN=${#BODY}

# ── 检测图片 ──

# 远程图片 URL（http/https）
REMOTE_IMAGE_URLS=$(echo "$BODY" | grep -oP '!\[[^\]]*\]\(https?://[^)]+\)' | grep -oP 'https?://[^)]+' || true)
REMOTE_COUNT=0
if [ -n "$REMOTE_IMAGE_URLS" ]; then
  # 只保留真正的图片 URL
  FILTERED_URLS=""
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    if echo "$url" | grep -qiE '\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)|images\.unsplash\.com|pbs\.twimg\.com|imgur\.com|cloudinary\.com|cdn\.openai\.com|storage\.googleapis\.com|mmbiz\.qpic\.cn'; then
      if [ -n "$FILTERED_URLS" ]; then
        FILTERED_URLS="${FILTERED_URLS}"$'\n'"${url}"
      else
        FILTERED_URLS="$url"
      fi
    fi
  done <<< "$REMOTE_IMAGE_URLS"
  REMOTE_IMAGE_URLS="$FILTERED_URLS"
  REMOTE_COUNT=$(echo "$REMOTE_IMAGE_URLS" | grep -c '.' || echo 0)
fi

# 本地图片路径（/images/blog/...）
LOCAL_IMAGE_PATHS=$(echo "$BODY" | grep -oP '/images/blog/[^)]+' || true)
LOCAL_COUNT=0
if [ -n "$LOCAL_IMAGE_PATHS" ]; then
  LOCAL_COUNT=$(echo "$LOCAL_IMAGE_PATHS" | grep -c '.' || echo 0)
fi

TOTAL_IMAGES=$((REMOTE_COUNT + LOCAL_COUNT))

echo "═══════════════════════════════════════"
echo "  発行: AI Models Navi"
echo "═══════════════════════════════════════"
echo ""
echo "  タイトル: $TITLE"
echo "  タグ: $TAG"
echo "  要約: ${EXCERPT:-(自動生成)}"
echo "  本文: $BODY_LEN 文字"
echo "  画像: $TOTAL_IMAGES 枚 (リモート: $REMOTE_COUNT, ローカル: $LOCAL_COUNT)"
if [ "$LOCAL_MODE" = true ]; then
  echo "  モード: ローカル翻訳"
else
  echo "  モード: GitHub Actions"
fi
echo ""

# ── 确认 ──

if [ "$AUTO_YES" = false ]; then
  read -p "発行しますか？(y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "キャンセルしました"
    exit 0
  fi
fi

# ════════════════════════════════════════
#  本地模式：翻译 + 图片 + 提交
# ════════════════════════════════════════

if [ "$LOCAL_MODE" = true ]; then
  echo ""
  echo "  ローカル翻訳モード..."

  # 检查 LLM_API_KEY
  if [ -z "${LLM_API_KEY:-}" ]; then
    echo "エラー: LLM_API_KEY 環境変数が設定されていません"
    echo "export LLM_API_KEY=your-key を実行してください"
    exit 1
  fi

  # Step 1: 翻译
  echo "  1. 中国語→日本語翻訳..."
  cd "$PROJECT_DIR"

  # 构造翻译输入（带 frontmatter）
  TRANSLATE_INPUT=$(mktemp)
  cat > "$TRANSLATE_INPUT" << TMPEOF
---
title: "$TITLE"
tag: "$TAG"
${EXCERPT:+excerpt: "$EXCERPT"}
---

$BODY
TMPEOF

  npx tsx scripts/translate-blog.ts "$TRANSLATE_INPUT"
  rm -f "$TRANSLATE_INPUT"

  # 找到翻译后的文件
  TRANSLATED_FILE=$(ls -t src/content/blog/*.md 2>/dev/null | head -1)
  if [ -z "$TRANSLATED_FILE" ]; then
    echo "エラー: 翻訳ファイルが見つかりません"
    exit 1
  fi

  SLUG=$(basename "$TRANSLATED_FILE" .md)
  echo "  ✓ 翻訳完了: $SLUG"

  # Step 2: 处理本地图片
  if [ "$LOCAL_COUNT" -gt 0 ]; then
    echo "  2. ローカル画像をコミット..."

    # 检查图片是否已在 public/ 目录
    IMG_DIR="public/images/blog/$SLUG"
    if [ -d "$IMG_DIR" ]; then
      IMG_FILES=$(ls "$IMG_DIR" 2>/dev/null | wc -l | tr -d ' ')
      echo "     $IMG_FILES 枚の画像を検出"
    else
      # 尝试从 fetch-article.ts 的默认位置复制
      FETCH_IMG_DIR="public/images/blog/$(echo "$SLUG" | sed 's/^blog-//')"
      if [ -d "$FETCH_IMG_DIR" ]; then
        mv "$FETCH_IMG_DIR" "$IMG_DIR"
        echo "     画像を移動: $IMG_DIR"
      fi
    fi
  fi

  # Step 3: 提交
  echo "  3. コミット..."
  cd "$PROJECT_DIR"

  FILES_TO_ADD="src/content/blog/$SLUG.md"
  if [ -d "public/images/blog/$SLUG" ]; then
    FILES_TO_ADD="$FILES_TO_ADD public/images/blog/$SLUG"
  fi

  git add $FILES_TO_ADD
  git commit -m "blog: publish translated post — $TITLE"
  git pull -X ours origin main || true
  git push

  echo ""
  echo "  ✓ 発行完了！"
  echo "  URL: /blog/$SLUG"
  echo ""

  # 清理草稿
  DRAFT_FILE="_drafts/$(basename "$FILE")"
  if [ -f "$DRAFT_FILE" ]; then
    echo "  下書きを削除: $DRAFT_FILE"
    rm -f "$DRAFT_FILE"
  fi

  exit 0
fi

# ════════════════════════════════════════
#  远程模式：GitHub Actions
# ════════════════════════════════════════

if ! gh auth status &>/dev/null; then
  echo "错误：gh CLI 未登录，请先运行 gh auth login"
  exit 1
fi

echo ""
echo "  GitHub Actions をトリガー中..."

# 构造图片 URL JSON
if [ "$REMOTE_COUNT" -gt 0 ]; then
  IMAGE_URLS_JSON=$(echo "$REMOTE_IMAGE_URLS" | jq -R -s 'split("\n") | map(select(length > 0))')
else
  IMAGE_URLS_JSON="[]"
fi

# JSON payload
PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg tag "$TAG" \
  --arg excerpt "$EXCERPT" \
  --arg content "$BODY" \
  --argjson images "$IMAGE_URLS_JSON" \
  '{
    ref: "main",
    inputs: {
      title: $title,
      tag: $tag,
      excerpt: $excerpt,
      content: $content,
      images: ($images | join(","))
    }
  }')

RESPONSE=$(gh api \
  --method POST \
  -H "Accept: application/vnd.github.v3+json" \
  "/repos/$REPO/actions/workflows/$WORKFLOW/dispatches" \
  --input - <<< "$PAYLOAD" \
  2>&1) && HTTP_CODE=204 || HTTP_CODE=$?

if [ "$HTTP_CODE" = "204" ] || [[ "$RESPONSE" == *"204"* ]]; then
  echo "  ✓ トリガー完了！"
  echo ""
  echo "  GitHub Actions 処理中："
  echo "  1. LLM翻訳（中国語→日本語）"
  if [ "$REMOTE_COUNT" -gt 0 ]; then
    echo "  2. $REMOTE_COUNT 枚の画像をダウンロード"
    echo "  3. src/content/blog/ に保存"
  else
    echo "  2. src/content/blog/ に保存"
  fi
  echo "  auto commit + push → Vercel 自動デプロイ"
  echo ""
  echo "  進捗確認："
  echo "  https://github.com/$REPO/actions/workflows/$WORKFLOW"
else
  echo "  ✗ トリガー失敗"
  echo "  $RESPONSE"
  exit 1
fi
