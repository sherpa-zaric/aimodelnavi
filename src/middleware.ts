import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and login API
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login"
  ) {
    return NextResponse.next();
  }

  // Check admin auth for all /admin and /api/admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const session = request.cookies.get("admin_session")?.value;
    if (session !== process.env.ADMIN_PASSWORD) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
