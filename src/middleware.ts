import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and login API without admin check
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname.startsWith("/en/admin/login") ||
    pathname.startsWith("/zh/admin/login") ||
    pathname.startsWith("/ko/admin/login")
  ) {
    return intlMiddleware(request);
  }

  // Check admin auth for /admin and /api/admin routes
  if (
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin") ||
    pathname.startsWith("/en/admin") || pathname.startsWith("/en/api/admin") ||
    pathname.startsWith("/zh/admin") || pathname.startsWith("/zh/api/admin") ||
    pathname.startsWith("/ko/admin") || pathname.startsWith("/ko/api/admin")
  ) {
    const session = request.cookies.get("admin_session")?.value;
    if (session !== process.env.ADMIN_PASSWORD) {
      if (pathname.includes("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(ja|en|ko)/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
