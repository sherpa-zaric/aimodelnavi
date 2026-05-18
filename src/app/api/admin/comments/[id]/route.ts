import { NextRequest, NextResponse } from "next/server";
import { query, initializeDatabase } from "@/lib/db";

let initialized = false;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
  }

  try {
    if (!initialized) { await initializeDatabase(); initialized = true; }

    const { rows } = await query(
      `UPDATE comments SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, parseInt(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "コメントが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ id: rows[0].id, status: rows[0].status });
  } catch (err) {
    console.error("PATCH /api/admin/comments/[id] error:", err);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (!initialized) { await initializeDatabase(); initialized = true; }

    // Delete replies first
    await query(`DELETE FROM comments WHERE parent_id = $1`, [parseInt(id)]);
    // Delete the comment
    const { rows } = await query(
      `DELETE FROM comments WHERE id = $1 RETURNING id`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "コメントが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/admin/comments/[id] error:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
