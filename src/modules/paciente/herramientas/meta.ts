import { NARA_SERVICE_BY_ID } from "@/lib/nara-services";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

/** Hub inferior: Clínico · TEJIVA · Juegos · Ánimo. */
const PACIENTE_HUB_IDS: PacienteHerramientaId[] = [
  "clin",
  "ia",
  "juegos",
  "mood",
];

/** Orden y etiquetas del hub paciente. */
export const PACIENTE_HERRAMIENTAS: PacienteHerramientaMeta[] = PACIENTE_HUB_IDS.map(
  (id) => {
    const s = NARA_SERVICE_BY_ID[id];
    if (id === "juegos") {
      return { id, name: "Juegos", navLabel: "Juegos" };
    }
    if (id === "mood") {
      return { id, name: "Ánimo", navLabel: "Ánimo" };
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
