import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aimodelsnavi.com"),
  // Google Search Console verification can be added via metadata.verification
  // verification: { google: process.env.GSC_VERIFICATION_CODE },
};

function OrganizationSchema() {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AI Models Navi",
    "url": "https://aimodelsnavi.com",
    "logo": "https://aimodelsnavi.com/opengraph-image",
    "description": "AIモデルの比較・料金・ランキングを日本語で提供するポータルサイト",
    "sameAs": [
      "https://github.com/focusontec/aimodelnavi",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "General Inquiry",
      "url": "https://aimodelsnavi.com/about",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-P9SZZKJ2T4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P9SZZKJ2T4');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <OrganizationSchema />
        {children}
      </body>
    </html>
  );
}
