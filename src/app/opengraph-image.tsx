import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${SITE_NAME} · ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fontsDir = join(process.cwd(), "public/consiente/fuentes");
  const [bold, mono] = await Promise.all([
    readFile(join(fontsDir, "BricolageGrotesque-Bold.ttf")),
    readFile(join(fontsDir, "DM_Mono-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #F7F5EF 0%, #E5E0D5 45%, #0F2D3B 160%)",
          padding: 64,
          fontFamily: "Bricolage",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#31C6E6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              color: "#F7F5EF",
            }}
          >
            Q
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#0F2D3B",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: "#222220",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 22, color: "#6B7280", fontFamily: "DM Mono" }}>
            TEJIVA · asistente de QUINTIA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: bold, style: "normal", weight: 700 },
        { name: "DM Mono", data: mono, style: "normal", weight: 500 },
      ],
    },
  );
}
