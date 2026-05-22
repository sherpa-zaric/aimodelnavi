"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const prefix = locale === "ja" ? "" : `/${locale}`;

  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("nav.leaderboard")}</h3>
            <ul className="space-y-2">
              <li><Link href={`${prefix}/leaderboard`} className="text-sm text-gray-600 hover:text-primary-600">{t("leaderboard.comprehensive")}</Link></li>
              <li><Link href={`${prefix}/leaderboard/reasoning`} className="text-sm text-gray-600 hover:text-primary-600">{t("leaderboard.reasoning")}</Link></li>
              <li><Link href={`${prefix}/leaderboard/code`} className="text-sm text-gray-600 hover:text-primary-600">{t("leaderboard.code")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("nav.pricing")}</h3>
            <ul className="space-y-2">
              <li><Link href={`${prefix}/pricing`} className="text-sm text-gray-600 hover:text-primary-600">{t("pricing.title")}</Link></li>
              <li><Link href={`${prefix}/tools/cost-calculator`} className="text-sm text-gray-600 hover:text-primary-600">{t("tools.costCalculator")}</Link></li>
              <li><Link href={`${prefix}/tools/token-counter`} className="text-sm text-gray-600 hover:text-primary-600">{t("tools.tokenCounter")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("nav.models")}</h3>
            <ul className="space-y-2">
              <li><Link href={`${prefix}/models`} className="text-sm text-gray-600 hover:text-primary-600">{t("models.title")}</Link></li>
              <li><Link href={`${prefix}/tools/model-compare`} className="text-sm text-gray-600 hover:text-primary-600">{t("tools.modelCompare")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("nav.info")}</h3>
            <ul className="space-y-2">
              <li><Link href={`${prefix}/blog`} className="text-sm text-gray-600 hover:text-primary-600">{t("nav.blog")}</Link></li>
              <li><Link href={`${prefix}/about`} className="text-sm text-gray-600 hover:text-primary-600">{t("footer.about")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">{t("site.description")}</p>
          <p className="text-xs text-gray-400 mt-1">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
