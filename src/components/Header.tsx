"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { BarChart3, BookOpen, Calculator, ChevronDown, Menu, X, Zap, Target, Sparkles } from "lucide-react";
import { useState } from "react";

const blogTags = [
  "OpenAI", "AIエージェント", "Google", "解説", "Anthropic",
  "オープンソース", "ベンチマーク", "DeepSeek", "xAI", "Alibaba", "料金比較",
];

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [blogDropdownOpen, setBlogDropdownOpen] = useState(false);

  const prefix = locale === "ja" ? "" : `/${locale}`;

  const navItems = [
    { href: `${prefix}/leaderboard`, label: t("leaderboard"), icon: BarChart3 },
    { href: `${prefix}/recommend`, label: t("recommend"), icon: Sparkles },
    { href: `${prefix}/benchmarks`, label: t("benchmarks"), icon: Target },
    { href: `${prefix}/pricing`, label: t("pricing"), icon: Zap },
    { href: `${prefix}/models`, label: t("models"), icon: BookOpen },
    { href: `${prefix}/blog`, label: t("blog"), icon: BookOpen },
    { href: `${prefix}/tools/cost-calculator`, label: t("tools"), icon: Calculator },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={prefix || "/"} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">AI Models Navi</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              if (item.label === t("blog")) {
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setBlogDropdownOpen(true)}
                    onMouseLeave={() => setBlogDropdownOpen(false)}
                  >
                    <Link
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <ChevronDown className="w-3 h-3" />
                    </Link>
                    {blogDropdownOpen && (
                      <div className="absolute left-0 top-full w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        {blogTags.map((tag) => (
                          <Link
                            key={tag}
                            href={`${item.href}?tag=${encodeURIComponent(tag)}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
          {navItems.map((item) => {
            if (item.label === t("blog")) {
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                  <div className="pl-8 pb-1">
                    {blogTags.map((tag) => (
                      <Link
                        key={tag}
                        href={`${item.href}?tag=${encodeURIComponent(tag)}`}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-1.5 text-xs text-gray-500 hover:text-primary-600"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
