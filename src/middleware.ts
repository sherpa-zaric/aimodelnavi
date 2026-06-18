import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin and API routes: handle auth, skip intl middleware
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") ||
      pathname.startsWith("/en/admin") || pathname.startsWith("/en/api/admin")) {

    // Allow login page and login API without auth check
    if (
      pathname === "/admin/login" ||
      pathname === "/api/admin/login" ||
      pathname.startsWith("/en/admin/login")
    ) {
      return NextResponse.next();
    }

    // Check admin auth — session cookie is a SHA256 hash set by login API
    const session = request.cookies.get("admin_session")?.value;
    if (!session || session.length !== 64) {
      if (pathname.includes("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // Public API routes: skip intl middleware
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // All other routes: run intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except static files and internal Next.js paths
    "/((?!_next|_vercel|.*\\.).*)",
  ],
};
