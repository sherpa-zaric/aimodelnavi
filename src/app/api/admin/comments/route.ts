import { NextRequest, NextResponse } from "next/server";
import { query, initializeDatabase } from "@/lib/db";

let initialized = false;

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "all";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    if (!initialized) { await initializeDatabase(); initialized = true; }

    const statusClause = status === "all" ? "" : `AND c.status = $3`;
    const params = status === "all"
      ? [limit, offset]
      : [limit, offset, status];

    const countParams = status === "all" ? [] : [status];
    const countClause = status === "all" ? "" : `WHERE status = $1`;

    const { rows: comments } = await query(
      `SELECT c.id, c.slug, c.name, c.content, c.parent_id, c.status, c.created_at, c.ip_hash,
              p.name AS parent_name, p.content AS parent_content
       FROM comments c
       LEFT JOIN comments p ON c.parent_id = p.id
       ${status === "all" ? "" : `WHERE c.status = $3`}
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total FROM comments ${countClause}`,
      countParams
    );
    const total = (countRows[0] as { total: number }).total;

    // Get status counts
    const { rows: statusCounts } = await query(
      `SELECT status, COUNT(*)::int AS cnt FROM comments GROUP BY status`
    );
    const counts: Record<string, number> = { all: 0, pending: 0, approved: 0, rejected: 0 };
    for (const row of statusCounts as { status: string; cnt: number }[]) {
      counts[row.status] = row.cnt;
      counts.all += row.cnt;
    }

    return NextResponse.json({
      comments: comments.map((c: Record<string, unknown>) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        content: c.content,
        parent_id: c.parent_id,
        status: c.status,
        created_at: c.created_at,
        ip_hash: c.ip_hash,
        parent_name: c.parent_name,
        parent_content: c.parent_content,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      counts,
    });
  } catch (err) {
    console.error("GET /api/admin/comments error:", err);
    return NextResponse.json({ error: "コメントの取得に失敗しました" }, { status: 500 });
  }
}
