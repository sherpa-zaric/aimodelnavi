import Link from "next/link";
import { BarChart3, Coins, Search } from "lucide-react";

interface HeroProps {
  locale: string;
  t: {
    hero: string;
    hero2: string;
    heroSub: string;
    viewRankings: string;
    comparePricing: string;
    modelsListed: string;
    pricingData: string;
    dailyUpdate: string;
    dailyUpdateVal: string;
    searchPlaceholder: string;
  };
}

export function Hero({ locale, t }: HeroProps) {
  const prefix = locale === "ja" ? "" : `/${locale}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
        <div className="max-w-3xl">
          <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            {t.hero}<br />{t.hero2}
          </h1>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl leading-relaxed">
            {t.heroSub}
          </p>

          {/* Search Box */}
          <div className="mt-8 relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              readOnly
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${prefix}/leaderboard`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
            >
              <BarChart3 className="w-4 h-4" />
              {t.viewRankings}
            </Link>
            <Link
              href={`${prefix}/pricing`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
              <Coins className="w-4 h-4" />
              {t.comparePricing}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { value: "289", label: t.modelsListed },
              { value: "1750+", label: t.pricingData },
              { value: t.dailyUpdateVal, label: t.dailyUpdate },
            ].map((stat) => (
              <div key={stat.label} className="text-white">
                <div className="text-2xl lg:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-primary-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
