"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { BarChart3, BookOpen, Calculator, GitCompare, ChevronDown, Menu, X, Zap, Target, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const blogTags = [
  "OpenAI", "AIエージェント", "Google", "解説", "Anthropic",
  "オープンソース", "ベンチマーク", "DeepSeek", "xAI", "Alibaba", "料金比較",
];

const toolLinks = [
  { slug: "cost-calculator", labelJa: "APIコスト計算", labelEn: "API Cost Calculator", icon: Calculator },
  { slug: "token-counter", labelJa: "トークンカウンター＆コスト計算機", labelEn: "Token Counter & Cost Calculator", icon: BarChart3 },
];

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [blogDropdownOpen, setBlogDropdownOpen] = useState(false);
  const [blogTagsExpanded, setBlogTagsExpanded] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  const prefix = locale === "ja" ? "" : `/${locale}`;

  const navItems = [
    { href: `${prefix}/leaderboard`, label: t("leaderboard"), icon: BarChart3 },
    { href: `${prefix}/compare`, label: t("compare"), icon: GitCompare },
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

              if (item.label === t("tools")) {
                const toolsHref = `${prefix}/tools/cost-calculator`;
                const isToolsActive = pathname.startsWith(`${prefix}/tools`);
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setToolsDropdownOpen(true)}
                    onMouseLeave={() => setToolsDropdownOpen(false)}
                  >
                    <Link
                      href={toolsHref}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isToolsActive
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <ChevronDown className="w-3 h-3" />
                    </Link>
                    {toolsDropdownOpen && (
                      <div className="absolute left-0 top-full w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        {toolLinks.map((tool) => (
                          <Link
                            key={tool.slug}
                            href={`${prefix}/tools/${tool.slug}`}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                          >
                            <tool.icon className="w-4 h-4 text-gray-400" />
                            {locale === "ja" ? tool.labelJa : tool.labelEn}
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
        <div ref={mobileMenuRef} className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 max-h-[70vh] overflow-y-auto">
          {navItems.map((item) => {
            if (item.label === t("blog")) {
              return (
                <div key={item.href}>
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                    <button
                      onClick={() => setBlogTagsExpanded(!blogTagsExpanded)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${blogTagsExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  {blogTagsExpanded && (
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
                  )}
                </div>
              );
            }
            if (item.label === t("tools")) {
              const toolsHref = `${prefix}/tools/cost-calculator`;
              return (
                <div key={item.href}>
                  <div className="flex items-center justify-between">
                    <Link
                      href={toolsHref}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                    <button
                      onClick={() => setToolsExpanded(!toolsExpanded)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${toolsExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  {toolsExpanded && (
                    <div className="pl-8 pb-1">
                      {toolLinks.map((tool) => (
                        <Link
                          key={tool.slug}
                          href={`${prefix}/tools/${tool.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-primary-600"
                        >
                          <tool.icon className="w-3.5 h-3.5" />
                          {locale === "ja" ? tool.labelJa : tool.labelEn}
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
