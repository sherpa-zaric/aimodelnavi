import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = body.password;

  if (!password || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  const inputHash = hashPassword(password);
  const storedHash = hashPassword(process.env.ADMIN_PASSWORD);

  const inputBuf = Buffer.from(inputHash, "hex");
  const storedBuf = Buffer.from(storedHash, "hex");
  if (inputBuf.length !== storedBuf.length || !timingSafeEqual(inputBuf, storedBuf)) {
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", inputHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
