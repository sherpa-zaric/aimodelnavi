import { NextRequest, NextResponse } from "next/server";
import { query, initializeDatabase } from "@/lib/db";

let initialized = false;

export async function GET(request: NextRequest) {
  try {
    if (!initialized) { await initializeDatabase(); initialized = true; }

    const position = request.nextUrl.searchParams.get("position");
    const sql = position
      ? `SELECT * FROM ads WHERE position = $1 ORDER BY created_at DESC`
      : `SELECT * FROM ads ORDER BY created_at DESC`;
    const params = position ? [position] : [];

    const { rows } = await query(sql, params);
    return NextResponse.json({ ads: rows });
  } catch (err) {
    console.error("GET /api/admin/ads error:", err);
    return NextResponse.json({ error: "広告の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, position, ad_code, width, height, enabled } = body;

  if (!name || !position || !ad_code) {
    return NextResponse.json({ error: "name, position, ad_code は必須です" }, { status: 400 });
  }

  const validPositions = ["sidebar", "header-banner", "blog-inline", "blog-bottom", "model-inline", "footer-banner", "mobile-banner"];
  if (!validPositions.includes(position)) {
    return NextResponse.json({ error: "無効なポジションです" }, { status: 400 });
  }

  try {
    if (!initialized) { await initializeDatabase(); initialized = true; }

    const { rows } = await query(
      `INSERT INTO ads (name, position, ad_code, width, height, enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, position, ad_code, width || null, height || null, enabled !== false]
    );

    return NextResponse.json({ ad: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/ads error:", err);
    return NextResponse.json({ error: "広告の作成に失敗しました" }, { status: 500 });
  }
}
