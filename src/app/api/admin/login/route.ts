import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = body.password;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
