import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Models Navi — AIモデルの比較・料金・ランキング";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)",
          fontFamily: "sans-serif",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            ⚡
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "white", letterSpacing: -1 }}>
            AI Models Navi
          </div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: "#e0f2fe", textAlign: "center", maxWidth: 900 }}>
          AIモデルの比較・料金・ランキングを日本語で
        </div>
        <div style={{ fontSize: 22, color: "#bae6fd", marginTop: 24, textAlign: "center" }}>
          最新のAIモデル情報をわかりやすく • ベンチマーク • API料金比較
        </div>
      </div>
    ),
    { ...size }
  );
}
