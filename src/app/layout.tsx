import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  title: "AIモデルナビ — AIモデルの比較・料金・ランキング",
  description:
    "最新のAIモデル（LLM）のベンチマーク比較、API料金比較、モデル情報を日本語で提供。OpenAI、Anthropic、Google、DeepSeekなど主要モデルを網羅。",
  keywords: [
    "AIモデル",
    "LLM",
    "ベンチマーク",
    "API料金",
    "モデル比較",
    "日本語",
    "ChatGPT",
    "Claude",
    "Gemini",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
