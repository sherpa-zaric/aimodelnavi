"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
];

export default function LangSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchTo(targetLocale: string) {
    // Strip current locale prefix and add new one
    const parts = pathname.split("/").filter(Boolean);
    if (["ja", "en", "zh", "ko"].includes(parts[0])) parts.shift();
    const newPath = targetLocale === "ja" ? `/${parts.join("/")}` : `/${targetLocale}/${parts.join("/")}`;
    router.push(newPath || "/");
    setOpen(false);
  }

  const currentLang = LANGUAGES.find((l) => l.code === locale);

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow text-sm text-gray-700"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLang?.label || locale}</span>
      </button>
      {open && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchTo(lang.code)}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                lang.code === locale ? "font-semibold text-primary-600" : "text-gray-700"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
