/** Estados del analizador (mismo criterio que Clinico.dc.html). */
export const ESTADOS_AN = {
  base: {
    id: "base",
    label: "Construyendo línea base",
    fg: "#4F4868",
    bg: "#ECE9F2",
    icon: "◔",
  },
  estable: {
    id: "estable",
    label: "Estable",
    fg: "#24566A",
    bg: "#E1EDF1",
    icon: "●",
  },
  mejorando: {
    id: "mejorando",
    label: "Mejorando",
    fg: "#2C6247",
    bg: "#E0EFE5",
    icon: "▲",
  },
  cambio: {
    id: "cambio",
    label: "Cambio a revisar",
    fg: "#6E4705",
    bg: "#FAE7BF",
    icon: "◆",
  },
} as const;

export type AnalizadorEstadoId = keyof typeof ESTADOS_AN;

/** Partidas mínimas para salir de línea base (config admin por defecto). */
export const ANALIZADOR_BASELINE_N = 10;

export const ANALIZADOR_RANK: Record<AnalizadorEstadoId, number> = {
  cambio: 0,
  mejorando: 1,
  base: 2,
  estable: 3,
};
