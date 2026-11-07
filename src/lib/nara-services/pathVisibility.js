/** Prototipo QUINTIA: cuidador y experto no ven juegos ni resultados asociados. */

import { GAME_AND_ANALIZADOR_IDS, LEGACY_JUEGOS_ID } from "./gamesCatalog.js";

const ROLES_SIN_JUEGOS = new Set(["experto", "gestor", "cuidador"]);

const HIDDEN_IDS = new Set([LEGACY_JUEGOS_ID, ...GAME_AND_ANALIZADOR_IDS]);

export function roleOcultaJuegos(roleId, roleLabel) {
  const id = String(roleId || "").toLowerCase();
  if (ROLES_SIN_JUEGOS.has(id)) return true;
  const role = String(roleLabel || "");
  return /experto|gestor de campo|gestor|cuidador/i.test(role);
}

export function filtrarRutaSinJuegos(items, roleId, roleLabel) {
  if (!roleOcultaJuegos(roleId, roleLabel)) return items;
  return items.filter((x) => !HIDDEN_IDS.has(x.id));
}

export function filtrarModulosSinJuegos(ids, roleId, roleLabel) {
  if (!roleOcultaJuegos(roleId, roleLabel)) return ids;
  return ids.filter((id) => !HIDDEN_IDS.has(id));
}
