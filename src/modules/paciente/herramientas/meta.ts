import { NARA_SERVICE_BY_ID } from "@/lib/nara-services";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

/** Hub de la app: módulos + juegos agrupados (la matriz admin tiene los 4 por separado). */
const PACIENTE_HUB_IDS: PacienteHerramientaId[] = [
  "mood",
  "clin",
  "ia",
  "juegos",
];

/** Orden y etiquetas = catálogo compartido (`src/lib/nara-services/<id>.js`). */
export const PACIENTE_HERRAMIENTAS: PacienteHerramientaMeta[] = PACIENTE_HUB_IDS.map(
  (id) => {
    const s = NARA_SERVICE_BY_ID[id];
    if (id === "juegos") {
      return {
        id,
        name: "Juegos",
        navLabel: "Juegos",
      };
    }
    return {
      id,
      name: s?.name || id,
      navLabel: s?.navLabel || s?.name || id,
    };
  },
);

export const PACIENTE_HERRAMIENTA_IDS: PacienteHerramientaId[] =
  PACIENTE_HERRAMIENTAS.map((h) => h.id);

/** Ya no hay herramientas «Próximamente» en la app. */
export const PACIENTE_HERRAMIENTAS_DISABLED = new Set<PacienteHerramientaId>();

export function isPacienteHerramientaDisabled(id: PacienteHerramientaId) {
  return PACIENTE_HERRAMIENTAS_DISABLED.has(id);
}

/** Filtra las activas en la ruta del paciente (mods.on). */
export function activePacienteHerramientas(mods: Record<string, boolean | undefined>) {
  return PACIENTE_HERRAMIENTAS.filter((h) => !!mods[h.id]);
}
