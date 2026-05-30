import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LangSwitcher from "@/components/LangSwitcher";
import AdSlot from "@/components/AdSlot";
import MobileAd from "@/components/MobileAd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: {
      default: isEn
        ? "AI Models Navi — AI Model Comparison, Pricing & Rankings"
        : "AI Models Navi — AIモデルの比較・料金・ランキング",
      template: isEn ? "%s — AI Models Navi" : "%s — AI Models Navi",
    },
    description: isEn
      ? "Compare AI model benchmarks, API pricing, and specifications."
      : "AIモデルのベンチマーク比較、API料金、モデル仕様を日本語で比較。",
    metadataBase: new URL("https://aimodelsnavi.com"),
    alternates: {
      canonical: `https://aimodelsnavi.com${locale === "ja" ? "" : `/${locale}`}`,
      languages: {
        ja: "https://aimodelsnavi.com",
        en: "https://aimodelsnavi.com/en",
        "x-default": "https://aimodelsnavi.com",
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <AdSlot position="header-banner" className="w-full flex justify-center py-2" />
      <div className="flex max-w-[1400px] mx-auto">
        <main className="flex-1 min-w-0">{children}</main>
        <AdSlot
          position="sidebar"
          className="hidden xl:block w-[160px] shrink-0 sticky top-24"
        />
      </div>
      <AdSlot position="footer-banner" className="w-full flex justify-center py-2" />
      <Footer />
      <MobileAd position="mobile-banner" />
      <LangSwitcher />
      <Analytics />
      <SpeedInsights />
    </NextIntlClientProvider>
    </html>
  );
}
