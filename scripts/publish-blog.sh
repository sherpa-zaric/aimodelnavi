#!/bin/bash
#
# publish-blog.sh — 一键发布中文博客到 AI Models Navi
#
# 用法：
#   ./scripts/publish-blog.sh <中文markdown文件>
#
# 前置条件：
#   - gh CLI 已登录（gh auth login）
#   - GitHub 仓库已配置 LLM_API_KEY secret
#
# 工作流程：
#   读取中文 Markdown → 调用 GitHub Actions → 自动翻译成日文 → 发布到网站

set -euo pipefail

REPO="focusontec/aimodelnavi"
WORKFLOW="publish-blog.yml"

# ── 参数检查 ──

if [ $# -lt 1 ]; then
  echo "用法: $0 <中文markdown文件>"
  echo ""
  echo "示例: $0 ~/articles/my-post.md"
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

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "错误：文件不存在 — $FILE"
  exit 1
fi

# ── 检查 gh 登录状态 ──

if ! gh auth status &>/dev/null; then
  echo "错误：gh CLI 未登录，请先运行 gh auth login"
  exit 1
fi

# ── 解析 frontmatter ──

TITLE=""
TAG="解説"
EXCERPT=""
BODY=""

# 提取 frontmatter 和正文
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
    # 解析 YAML frontmatter
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
    # 正文部分
    if [ -n "$BODY" ]; then
      BODY="${BODY}"$'\n'"${line}"
    else
      BODY="$line"
    fi
  fi
done < "$FILE"

# 去掉正文开头的空行
BODY=$(echo "$BODY" | sed '/./,$!d')

# ── 验证 ──

if [ -z "$TITLE" ]; then
  echo "错误：Markdown 文件缺少 title 字段"
  echo "请在 frontmatter 中添加: title: \"文章标题\""
  exit 1
fi

if [ -z "$BODY" ]; then
  echo "错误：文件正文为空"
  exit 1
fi

BODY_LEN=${#BODY}

echo "═══════════════════════════════════════"
echo "  发布博客到 AI Models Navi"
echo "═══════════════════════════════════════"
echo ""
echo "  标题: $TITLE"
echo "  标签: $TAG"
echo "  摘要: ${EXCERPT:-(自动生成)}"
echo "  正文: $BODY_LEN 字符"
echo ""

# ── 确认发布 ──

read -p "确认发布？(y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "已取消"
  exit 0
fi

# ── 触发 GitHub Actions ──

echo ""
echo "  正在触发 GitHub Actions..."

# 构造 JSON payload（jq 处理转义，避免 shell 特殊字符问题）
PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg tag "$TAG" \
  --arg excerpt "$EXCERPT" \
  --arg content "$BODY" \
  '{
    ref: "main",
    inputs: {
      title: $title,
      tag: $tag,
      excerpt: $excerpt,
      content: $content
    }
  }')

# 使用 gh api 发送请求（gh 自带认证，无需额外 token）
RESPONSE=$(gh api \
  --method POST \
  -H "Accept: application/vnd.github.v3+json" \
  "/repos/$REPO/actions/workflows/$WORKFLOW/dispatches" \
  --input - <<< "$PAYLOAD" \
  2>&1) && HTTP_CODE=204 || HTTP_CODE=$?

if [ "$HTTP_CODE" = "204" ] || [[ "$RESPONSE" == *"204"* ]]; then
  echo "  ✓ 已触发！"
  echo ""
  echo "  GitHub Actions 正在处理："
  echo "  1. 调用 LLM 将中文翻译成日文"
  echo "  2. 保存到 src/content/blog/"
  echo "  3. 自动 commit + push"
  echo "  4. Vercel 自动部署"
  echo ""
  echo "  查看进度："
  echo "  https://github.com/$REPO/actions/workflows/$WORKFLOW"
  echo ""
  echo "  通常 1-3 分钟完成部署。"
else
  echo "  ✗ 触发失败"
  echo "  $RESPONSE"
  echo "  请检查 gh auth status 和仓库权限"
  exit 1
fi
