/** Configuración pública del sitio (dominio, SEO). */

export const SITE_NAME = "Quintia";
export const SITE_TAGLINE = "Cinco fuerzas. Infinitas posibilidades.";
export const SITE_DESCRIPTION =
  "Quintia es una marca para las posibilidades de la vida: cinco fuerzas (Explorar, Sentir, Moverse, Conectar, Acompañar) en un ecosistema de ciencia, tecnología, experiencias y acompañamiento. TEJIVA acompaña en la plataforma. Entorno de pruebas — acceso restringido.";

/** URL de pruebas (no publicar en abierto hasta diseño industrial). */
export const DEFAULT_SITE_URL = "http://localhost:3004";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return DEFAULT_SITE_URL;
}

/** Rutas públicas indexables (el resto de la app es privada). */
export const PUBLIC_PATHS = [
  "/",
  "/landing",
  "/landing/privacidad",
  "/landing/tratamiento-de-datos",
  "/ingreso",
] as const;

/** Prefijos que no deben indexarse ni listarse en el sitemap. */
export const PRIVATE_PATH_PREFIXES = [
  "/api",
  "/admin",
  "/clinico",
  "/experto",
  "/paciente",
  "/observador",
  "/inicio",
  "/personas",
  "/territorios",
  "/equipos",
  "/usuarios",
  "/rutas",
] as const;
