import { NextResponse } from "next/server";
import jaManifest from "@/data/blog-manifest.json";
import enManifest from "@/data/blog-manifest-en.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "ja";
  const data = locale === "en" ? enManifest : jaManifest;
  return NextResponse.json(data);
}
