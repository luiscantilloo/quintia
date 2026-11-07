/**
 * Juegos individuales + Analizador (matriz de perfiles / rutas).
 * Sustituye el servicio agregado legacy `juegos`.
 */

export const GAME_FREQS = ["2h", "8h", "Diario"];

/** Ids de los 4 juegos del prototipo QUINTIA. */
export const GAME_IDS = ["frutas", "simon", "duelo", "sudoku"];

/** Clave antigua en rutas / modulesEnabled. */
export const LEGACY_JUEGOS_ID = "juegos";

export const GAME_SERVICES = [
  {
    id: "frutas",
    name: "Frutas",
    navLabel: "Frutas",
    note: "Atención visual y planificación · cada 2h, cada 8h o diario",
    freqs: GAME_FREQS.slice(),
  },
  {
    id: "simon",
    name: "Simón dice",
    navLabel: "Simón",
    note: "Memoria de trabajo y atención · cada 2h, cada 8h o diario",
    freqs: GAME_FREQS.slice(),
  },
  {
    id: "duelo",
    name: "Duelo de cartas",
    navLabel: "Duelo",
    note: "Flexibilidad y decisiones · cada 2h, cada 8h o diario",
    freqs: GAME_FREQS.slice(),
  },
  {
    id: "sudoku",
    name: "Sudoku",
    navLabel: "Sudoku",
    note: "Lógica y planificación · cada 2h, cada 8h o diario",
    freqs: GAME_FREQS.slice(),
  },
];

export const ANALIZADOR_SERVICE = {
  id: "analizador",
  name: "Analizador",
  navLabel: "Analizador",
  note: "Compara el desempeño de los juegos con el rango habitual de la persona",
  freqs: [],
};

export const GAME_AND_ANALIZADOR_IDS = [...GAME_IDS, ANALIZADOR_SERVICE.id];

const GAME_ID_SET = new Set(GAME_IDS);

export function isGameServiceId(id) {
  return GAME_ID_SET.has(String(id || ""));
}

/** Si la ruta trae `juegos`, reparte esa frecuencia a los 4 juegos. */
export function expandLegacyJuegosInPathS(s) {
  const raw = s && typeof s === "object" ? { ...s } : {};
  const legacy = raw[LEGACY_JUEGOS_ID];
  if (legacy != null && String(legacy).trim()) {
    const freq = String(legacy).trim();
    for (const id of GAME_IDS) {
      if (!raw[id] || !String(raw[id]).trim()) raw[id] = freq;
    }
  }
  delete raw[LEGACY_JUEGOS_ID];
  return raw;
}

/** modulesEnabled: `juegos` → los 4 ids de juego. */
export function expandLegacyJuegosInModuleIds(ids) {
  if (!Array.isArray(ids)) return [];
  const out = [];
  let sawLegacy = false;
  for (const raw of ids) {
    const id = String(raw || "");
    if (id === LEGACY_JUEGOS_ID) {
      sawLegacy = true;
      continue;
    }
    if (id && !out.includes(id)) out.push(id);
  }
  if (sawLegacy) {
    for (const id of GAME_IDS) {
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}

/** ¿Hay al menos un juego activo en el mapa de servicios? */
export function anyGameOnInPathS(s) {
  const map = s && typeof s === "object" ? s : {};
  if (map[LEGACY_JUEGOS_ID] && String(map[LEGACY_JUEGOS_ID]).trim()) return true;
  return GAME_IDS.some((id) => map[id] && String(map[id]).trim());
}

/**
 * Para app paciente / clínico: une los 4 juegos en un hub `juegos`.
 * El analizador queda como fila aparte.
 */
export function collapsePathListForHub(list) {
  const out = [];
  let gameHit = null;
  for (const x of list || []) {
    if (!x || !x.id) continue;
    if (GAME_ID_SET.has(x.id) || x.id === LEGACY_JUEGOS_ID) {
      if (!gameHit) gameHit = x;
      continue;
    }
    out.push(x);
  }
  if (gameHit) {
    out.push({
      ...gameHit,
      id: LEGACY_JUEGOS_ID,
      name: "Juegos",
      channel: gameHit.channel || "App · juegos QUINTIA",
    });
  }
  return out;
}
