import { NextRequest, NextResponse } from "next/server";
import { query, initializeDatabase } from "@/lib/db";

let initialized = false;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of ["name", "position", "ad_code", "width", "height", "enabled"]) {
    if (body[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(body[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "更新するフィールドがありません" }, { status: 400 });
  }

  fields.push(`updated_at = NOW()`);
  values.push(parseInt(id));

  try {
    if (!initialized) { await initializeDatabase(); initialized = true; }

    const { rows } = await query(
      `UPDATE ads SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "広告が見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ ad: rows[0] });
  } catch (err) {
    console.error("PATCH /api/admin/ads/[id] error:", err);
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

    const { rows } = await query(
      `DELETE FROM ads WHERE id = $1 RETURNING id`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "広告が見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/admin/ads/[id] error:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
