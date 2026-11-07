/**
 * Resuelve assets de marca QUINTIA / TEJIVA.
 * Acepta rutas legadas (nara-*, plateado/*, consiente/*, teo-*, aurelia-*) y las mapea.
 */

/** Emociones legacy TEO → estados TEJIVA (misma tabla que brand.TEO_TO_TEJIVA). */
const LEGACY_TEO_MOOD: Record<string, string> = {
  calma: "base",
  curiosidad: "escucha",
  duda: "piensa",
  energia: "celebra",
};

const LOGO_MAP: Record<string, string> = {
  "nara-isotipo.svg": "/quintia/logo/quintia-fuerzas.svg",
  "nara-logo.svg": "/quintia/logo/quintia-horizontal-oscuro.svg",
  "nara-logo-negativo.svg": "/quintia/logo/quintia-horizontal-claro.svg",
  "plateado-isotipo.svg": "/quintia/logo/quintia-fuerzas.svg",
  "plateado-logo.svg": "/quintia/logo/quintia-horizontal-oscuro.svg",
  "plateado-logo-claro.svg": "/quintia/logo/quintia-horizontal-claro.svg",
  "consiente-simbolo-verde.svg": "/quintia/logo/quintia-fuerzas.svg",
  "consiente-simbolo-naranja.svg": "/quintia/logo/quintia-fuerzas.svg",
  "consiente-simbolo-lima.svg": "/quintia/logo/quintia-fuerzas.svg",
  "consiente-simbolo-hueso.svg": "/quintia/logo/quintia-fuerzas.svg",
  "consiente-horizontal-principal.svg": "/quintia/logo/quintia-horizontal-oscuro.svg",
  "consiente-horizontal-una-tinta-hueso.svg": "/quintia/logo/quintia-horizontal-claro.svg",
  "consiente-horizontal-una-tinta-verde.svg": "/quintia/logo/quintia-horizontal-oscuro.svg",
  "consiente-horizontal-sobre-crema.svg": "/quintia/logo/quintia-horizontal-oscuro.svg",
  "consiente-horizontal-sobre-verde.svg": "/quintia/logo/quintia-horizontal-claro.svg",
  "consiente-horizontal-sobre-naranja.svg": "/quintia/logo/quintia-horizontal-oscuro.svg",
  "quintia-fuerzas.svg": "/quintia/logo/quintia-fuerzas.svg",
  "quintia-horizontal-oscuro.svg": "/quintia/logo/quintia-horizontal-oscuro.svg",
  "quintia-horizontal-claro.svg": "/quintia/logo/quintia-horizontal-claro.svg",
};

function tejivaMood(file: string): string | null {
  const m =
    file.match(/^(?:aurelia|tejiva|teo|nara)-(base|escucha|piensa|responde|celebra|calma|curiosidad|duda|energia)\.svg$/) ||
    file.match(/^(calma|curiosidad|duda|energia)\.svg$/);
  if (!m) return null;
  const raw = m[1]!;
  const mood = LEGACY_TEO_MOOD[raw] || raw;
  return `/quintia/tejiva/tejiva-${mood}.svg`;
}

function rewritePath(path: string): string {
  let p = path.replace(/^\/+/, "");

  // Absolute-ish already under quintia
  if (p.startsWith("quintia/")) return `/${p}`;

  // Strip legacy prefixes
  if (p.startsWith("nara/")) p = p.slice("nara/".length);
  if (p.startsWith("plateado/marca/")) p = p.slice("plateado/marca/".length);
  if (p.startsWith("plateado/") && !p.startsWith("plateado/herramientas/") && !p.startsWith("plateado/recursos/")) {
    p = p.slice("plateado/".length);
  }
  if (p.startsWith("marca/")) p = p.slice("marca/".length);
  if (p.startsWith("consiente/")) p = p.slice("consiente/".length);

  const file = p.split("/").pop() || p;

  // Logos
  if (LOGO_MAP[file]) return LOGO_MAP[file]!;
  if (p.includes("logo/") && LOGO_MAP[file]) return LOGO_MAP[file]!;

  // TEJIVA moods
  const mood = tejivaMood(file);
  if (mood) return mood;
  if (/tejiva|aurelia|teo|personajes/.test(p)) {
    const m2 = tejivaMood(file.replace(/^teo-/, "teo-").replace(/^nara-/, "nara-"));
    if (m2) return m2;
    return "/quintia/tejiva/tejiva-base.svg";
  }

  // Herramientas canónicas en public/quintia/herramientas (SVG marca Quintia)
  if (p.startsWith("quintia/herramientas/") || p.startsWith("herramientas/")) {
    const file = (p.split("/").pop() || "").replace(/\.png$/i, ".svg");
    return `/quintia/herramientas/${file}`;
  }
  if (p.startsWith("recursos/")) {
    return `/consiente/${p}`;
  }
  if (p.startsWith("plateado/herramientas/") || p.startsWith("plateado/recursos/")) {
    return `/${p.replace(/^plateado\//, "consiente/")}`;
  }

  // Default: try quintia logo mark
  if (file.endsWith(".svg") && /logo|simbolo|isotipo|wordmark/.test(p)) {
    return "/quintia/logo/quintia-fuerzas.svg";
  }

  return `/consiente/${p}`;
}

export function naraAsset(path: string): string {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/quintia/")) return path;
  if (path.startsWith("/")) {
    if (
      path.startsWith("/nara/") ||
      path.startsWith("/plateado/") ||
      path.startsWith("/consiente/") ||
      path.startsWith("/marca/") ||
      path.includes("nara-") ||
      path.includes("plateado-") ||
      path.includes("consiente-") ||
      path.includes("/personajes/") ||
      path.includes("/teo/") ||
      path.includes("/aurelia")
    ) {
      return rewritePath(path);
    }
    return path;
  }
  return rewritePath(path);
}
