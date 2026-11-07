/**
 * Marca QUINTIA — rutas y copy de producto.
 * Id técnico del programa: `quintia` (API y UI).
 */
import { SITE_NAME, SITE_TAGLINE, getSiteUrl } from "@/lib/site";

export const BRAND = {
  name: SITE_NAME,
  tagline: SITE_TAGLINE,
  org: "Núcleo Care",
  programLabel: "Quintia",
  agentName: "TEJIVA",
  agentRole: "asistente de Quintia",
  techLabel: "",
  emailPlaceholder: "correo@quintia.com",
  siteHost: () => {
    try {
      return new URL(getSiteUrl()).host;
    } catch {
      return "localhost:3004";
    }
  },
} as const;

const Q = "/quintia";

export type TejivaMood = "base" | "escucha" | "piensa" | "responde" | "celebra";
/** @deprecated usar TejivaMood */
export type AureliaMood = TejivaMood;

/** Emociones legacy TEO → estados TEJIVA. */
export const TEO_TO_TEJIVA: Record<string, TejivaMood> = {
  calma: "base",
  curiosidad: "escucha",
  duda: "piensa",
  energia: "celebra",
};
/** @deprecated usar TEO_TO_TEJIVA */
export const TEO_TO_AURELIA = TEO_TO_TEJIVA;

const TEJIVA_PATHS = {
  base: `${Q}/tejiva/tejiva-base.svg`,
  escucha: `${Q}/tejiva/tejiva-escucha.svg`,
  piensa: `${Q}/tejiva/tejiva-piensa.svg`,
  responde: `${Q}/tejiva/tejiva-responde.svg`,
  celebra: `${Q}/tejiva/tejiva-celebra.svg`,
} as const satisfies Record<TejivaMood, string>;

export const brandAsset = {
  logo: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoClaro: `${Q}/logo/quintia-horizontal-claro.svg`,
  logoSobreVerde: `${Q}/logo/quintia-horizontal-claro.svg`,
  logoSobreCrema: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoSobreNaranja: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoVertical: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoVerticalSobreVerde: `${Q}/logo/quintia-horizontal-claro.svg`,
  logoVerticalSobreCrema: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  isotipo: `${Q}/logo/quintia-fuerzas.svg`,
  isotipoNaranja: `${Q}/logo/quintia-fuerzas.svg`,
  isotipoLima: `${Q}/logo/quintia-fuerzas.svg`,
  isotipoHueso: `${Q}/logo/quintia-fuerzas.svg`,
  favicon: `${Q}/favicon.svg`,
  tejiva: TEJIVA_PATHS,
  /** @deprecated → brandAsset.tejiva */
  aurelia: TEJIVA_PATHS,
  /** @deprecated → brandAsset.tejiva (misma paleta Quintia) */
  aureliaVerde: TEJIVA_PATHS,
  /** Alias TEO → rutas TEJIVA (legacy en pantallas). */
  teo: {
    calma: TEJIVA_PATHS.base,
    curiosidad: TEJIVA_PATHS.escucha,
    duda: TEJIVA_PATHS.piensa,
    energia: TEJIVA_PATHS.celebra,
  },
  herramienta: (id: string) => `${Q}/herramientas/${id}.svg`,
} as const;

/** Tres públicos · tono de voz (PPT p.32) */
export const BRAND_VOICE = {
  mayores: {
    label: "Personas mayores",
    address: "usted" as const,
    guidance: "De usted. Frases cortas. Letra grande y alto contraste.",
  },
  cuidadores: {
    label: "Cuidadores",
    address: "tú" as const,
    guidance: "De tú. Reconoce el esfuerzo antes de enseñar.",
  },
  equipo: {
    label: "Equipo y aliados",
    address: "usted" as const,
    guidance: "Claro y riguroso, sin frialdad institucional.",
  },
} as const;

/** Regla de oro TEJIVA */
export const TEJIVA_DISCLOSURE_ES =
  "Soy TEJIVA, asistente digital de QUINTIA. Si prefiere, en cualquier momento puede hablar con una persona del equipo.";
/** @deprecated usar TEJIVA_DISCLOSURE_ES */
export const AURELIA_DISCLOSURE_ES = TEJIVA_DISCLOSURE_ES;

export const TEJIVA_HANDOFF_LABEL = "Hablar con alguien";
/** @deprecated usar TEJIVA_HANDOFF_LABEL */
export const AURELIA_HANDOFF_LABEL = TEJIVA_HANDOFF_LABEL;

export const TEJIVA_HANDOFF_REPLY_ES =
  "Claro. Puedo orientarle aquí o conectarle con alguien del equipo QUINTIA. Si es urgente o prefiere voz humana, use «Hablar con alguien» o llame a su contacto de territorio.";
/** @deprecated usar TEJIVA_HANDOFF_REPLY_ES */
export const AURELIA_HANDOFF_REPLY_ES = TEJIVA_HANDOFF_REPLY_ES;

export function tejivaAsset(
  mood: TejivaMood | string,
  _variant: "crema" | "verde" = "crema",
): string {
  const key = (TEO_TO_TEJIVA[mood] || mood) as TejivaMood;
  const safe: TejivaMood = brandAsset.tejiva[key as TejivaMood] ? (key as TejivaMood) : "base";
  return brandAsset.tejiva[safe];
}

/** @deprecated usar tejivaAsset */
export function aureliaAsset(
  mood: TejivaMood | string,
  variant: "crema" | "verde" = "crema",
): string {
  return tejivaAsset(mood, variant);
}

/** Voz TEJIVA / prompts: contexto QUINTIA. */
export const TEJIVA_CONTEXT_ES =
  "QUINTIA integra ciencia, tecnología, experiencias y comunidad para abrir posibilidades de bienestar y autonomía (Núcleo Care). TEJIVA es la asistente digital: acompaña, explica y conecta; siempre se presenta como asistente digital y ofrece hablar con una persona del equipo. Con mayores: de usted, frases cortas. Con cuidadores: de tú, reconoce el esfuerzo.";
/** @deprecated usar TEJIVA_CONTEXT_ES */
export const AURELIA_CONTEXT_ES = TEJIVA_CONTEXT_ES;
/** @deprecated usar TEJIVA_CONTEXT_ES */
export const TEO_CONTEXT_ES = TEJIVA_CONTEXT_ES;
