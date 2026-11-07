/**
 * Identidad QUINTIA · Presentación de marca 2026
 * «Cinco fuerzas. Infinitas posibilidades.»
 */

export const QUINTIA_TAGLINE = "Cinco fuerzas. Infinitas posibilidades.";
export const QUINTIA_PROMISE = "Una marca para las posibilidades de la vida.";

export const QUINTIA_COLORS = {
  violeta: "#6C04C9",
  cian: "#31C6E6",
  aqua: "#61F0D2",
  carbon: "#332F32",
  profundidad: "#0F2D3B",
  marfil: "#F7F5EF",
  blanco: "#FFFFFF",
  arena: "#E5E0D5",
} as const;

/** Degradado de marca · el espacio que acoge (aqua → cian → violeta). */
export const QUINTIA_GRADIENT =
  "linear-gradient(135deg, #61F0D2 0%, #31C6E6 45%, #6C04C9 100%)";

export type QuintiaFuerzaId =
  | "explorar"
  | "sentir"
  | "moverse"
  | "conectar"
  | "acompanar";

export const QUINTIA_FUERZAS: {
  id: QuintiaFuerzaId;
  n: string;
  label: string;
  dimension: string;
  lema: string;
  color: string;
}[] = [
  {
    id: "explorar",
    n: "01",
    label: "Explorar",
    dimension: "Cognitiva",
    lema: "Toda idea es una posibilidad.",
    color: "#6C04C9",
  },
  {
    id: "sentir",
    n: "02",
    label: "Sentir",
    dimension: "Sensorial",
    lema: "El mundo todavía tiene mucho por descubrir.",
    color: "#31C6E6",
  },
  {
    id: "moverse",
    n: "03",
    label: "Moverse",
    dimension: "Funcional y física",
    lema: "Cada movimiento cuenta.",
    color: "#61F0D2",
  },
  {
    id: "conectar",
    n: "04",
    label: "Conectar",
    dimension: "Psicosocial",
    lema: "La vida también sucede entre nosotros.",
    color: "#8B4AD4",
  },
  {
    id: "acompanar",
    n: "05",
    label: "Acompañar",
    dimension: "Cuidado",
    lema: "Cuidar también es crear posibilidades.",
    color: "#0F2D3B",
  },
];

/** Lenguaje de marca: evitar → proponer */
export const QUINTIA_VOICE = {
  evitar: [
    "Combate el deterioro de tu mente.",
    "No dejes que la edad te limite.",
    "Tecnología para combatir la vejez.",
  ],
  proponer: [
    "Explora nuevas formas de estimular tu mente.",
    "Cada etapa tiene sus propias posibilidades.",
    "Tecnología diseñada alrededor de las personas.",
  ],
} as const;
