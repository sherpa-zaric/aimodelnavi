"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, MessageCircle, Megaphone, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  function logout() {
    document.cookie = "admin_session=; path=/; max-age=0";
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/admin" className="text-sm font-bold text-gray-900">
          Admin Panel
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
              pathname.startsWith("/admin/blog")
                ? "bg-primary-50 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            Blog
          </Link>
          <Link
            href="/admin/comments"
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
              pathname.startsWith("/admin/comments")
                ? "bg-primary-50 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Comments
          </Link>
          <Link
            href="/admin/ads"
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
              pathname.startsWith("/admin/ads")
                ? "bg-primary-50 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Ads
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
