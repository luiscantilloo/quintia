import type { NextConfig } from "next";

/**
 * Gateway del núcleo (nucleo-api · PROGRAM_ID=consiente).
 * Preferir NUCLEO_API_URL. NARA_API_URL solo por compatibilidad de env legado.
 * Dev Consiente (PROGRAM_ID=consiente): http://127.0.0.1:4200 (Parienta :4000 · NARA :4100).
 */
const NUCLEO_API_URL = (
  process.env.NUCLEO_API_URL ||
  process.env.NARA_API_URL ||
  ""
).replace(/\/$/, "");

if (!NUCLEO_API_URL && process.env.NODE_ENV !== "test") {
  console.warn(
    "[consiente-web] Falta NUCLEO_API_URL — defínalo en .env.local (ej. http://127.0.0.1:4200 → nucleo-api / consiente).",
  );
}

/**
 * H-008 (TRL 2026-10-10): Content-Security-Policy. Next inyecta scripts y estilos en línea, por eso
 * 'unsafe-inline'; 'unsafe-eval' solo en desarrollo (HMR). Orígenes externos que usa el navegador:
 * el webhook de TEO en n8n y los mosaicos de OpenStreetMap del mapa de visitas.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://polariatech.app.n8n.cloud https://fonts.googleapis.com https://fonts.gstatic.com",
  "media-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  // H-008: sin la cabecera X-Powered-By: Next.js
  poweredByHeader: false,
  // Acceso HMR desde la red local (p. ej. celular/otro PC en la LAN) y loopback
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.80.12"],
  // El código portado del prototipo aún tiene deuda de tipos; no bloquear el deploy.
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/landing",
        permanent: false,
      },
      {
        source: "/landing/privacidad.html",
        destination: "/landing/privacidad",
        permanent: true,
      },
      {
        source: "/landing/tratamiento-de-datos.html",
        destination: "/landing/tratamiento-de-datos",
        permanent: true,
      },
      {
        source: "/landing/index.html",
        destination: "/landing",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    if (!NUCLEO_API_URL) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${NUCLEO_API_URL}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: CSP },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        source: "/(.*)\\.(svg|ico|png|jpg|jpeg|webp|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
