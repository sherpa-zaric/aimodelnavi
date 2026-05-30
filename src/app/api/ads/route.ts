import { NextRequest, NextResponse } from "next/server";
import { query, initializeDatabase } from "@/lib/db";

let initialized = false;

export async function GET(request: NextRequest) {
  const position = request.nextUrl.searchParams.get("position");
  if (!position) {
    return NextResponse.json({ ads: [] });
  }

  try {
    if (!initialized) { await initializeDatabase(); initialized = true; }

    const { rows } = await query(
      `SELECT id, name, position, ad_code, width, height FROM ads
       WHERE position = $1 AND enabled = true
       ORDER BY created_at DESC`,
      [position]
    );

    return NextResponse.json({ ads: rows });
  } catch (err) {
    console.error("GET /api/ads error:", err);
    return NextResponse.json({ ads: [] });
  }
}
