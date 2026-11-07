/**
 * Catálogo de servicios de ruta activos en QUINTIA.
 * Cada persona edita SOLO su archivo (mood.js, ia.js, …) para no chocar en el merge.
 */
import mood from "./mood.js";
import clin from "./clin.js";
import ia from "./ia.js";
import {
  ANALIZADOR_SERVICE,
  GAME_SERVICES,
} from "./gamesCatalog.js";

/** Manillas, PM+/grupos, cursos/cuentos, técnicas y revisita retirados.
 *  `juegos` agregado → 4 juegos individuales + analizador. */
export const NARA_SERVICES = [
  mood,
  clin,
  ia,
  ...GAME_SERVICES,
  ANALIZADOR_SERVICE,
];

export const NARA_SERVICE_BY_ID = Object.fromEntries(
  NARA_SERVICES.map((s) => [s.id, s]),
);
