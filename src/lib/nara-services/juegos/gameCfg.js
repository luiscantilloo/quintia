/**
 * Configuración por juego (admin → Rutas → Juegos).
 * Vigente en store.gameCfg[id]; el paciente la lee al abrir cada módulo.
 */

export const GAME_IDS = ["frutas", "simon", "duelo", "sudoku"];

/** Defaults alineados a la UI de admin. */
export const DEFAULT_GAME_CFG = {
  frutas: {
    version: 3,
    nivel: 1,
    sube: "Automático según desempeño",
    mov: 18,
    sonido: true,
    historial: [
      {
        v: 3,
        cuando: "Hace 3 semanas",
        quien: "Marcela Ríos",
        cambio: "Movimientos por partida: 20 → 18",
      },
      {
        v: 2,
        cuando: "Hace 2 meses",
        quien: "Marcela Ríos",
        cambio: "Sonido activado",
      },
      {
        v: 1,
        cuando: "Hace 4 meses",
        quien: "Marcela Ríos",
        cambio: "Versión inicial",
      },
    ],
  },
  simon: {
    version: 3,
    nivel: 2,
    sube: "Automático según desempeño",
    corazones: 2,
    sonido: true,
    historial: [
      {
        v: 3,
        cuando: "Hace 5 semanas",
        quien: "Marcela Ríos",
        cambio: "Corazones: 3 → 2",
      },
      {
        v: 2,
        cuando: "Hace 3 meses",
        quien: "Marcela Ríos",
        cambio: "Velocidad de la secuencia más lenta",
      },
      {
        v: 1,
        cuando: "Hace 4 meses",
        quien: "Marcela Ríos",
        cambio: "Versión inicial",
      },
    ],
  },
  duelo: {
    version: 2,
    nivel: 1,
    sube: "Fijo",
    cartas: 5,
    sonido: false,
    historial: [
      {
        v: 2,
        cuando: "Hace 2 meses",
        quien: "Marcela Ríos",
        cambio: "La regla cambia cada 4 jugadas",
      },
      {
        v: 1,
        cuando: "Hace 4 meses",
        quien: "Marcela Ríos",
        cambio: "Versión inicial",
      },
    ],
  },
  sudoku: {
    version: 1,
    nivel: 1,
    sube: "Fijo",
    sonido: false,
    historial: [
      {
        v: 1,
        cuando: "Hace 6 meses",
        quien: "Marcela Ríos",
        cambio: "Versión inicial",
      },
    ],
  },
};

const LABEL_TO_KEY = {
  "Nivel inicial": "nivel",
  "Cómo sube el nivel": "sube",
  "Movimientos por partida": "mov",
  "Corazones por partida": "corazones",
  "Cartas por mano": "cartas",
  Sonido: "sonido",
};

function numOr(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asBoolSonido(v) {
  if (typeof v === "boolean") return v;
  const s = String(v || "").trim().toLowerCase();
  return s === "sí" || s === "si" || s === "1" || s === "true";
}

function isAutoSube(sube) {
  return String(sube || "").toLowerCase().includes("autom");
}

/** Normaliza un pack de un juego. */
export function normalizeGameCfg(id, raw) {
  const base = DEFAULT_GAME_CFG[id] || {
    version: 1,
    nivel: 1,
    sube: "Fijo",
    sonido: true,
    historial: [],
  };
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {
    version: Math.max(1, numOr(src.version, base.version)),
    nivel: Math.min(5, Math.max(1, numOr(src.nivel, base.nivel))),
    sube: String(src.sube || base.sube),
    sonido: src.sonido !== undefined ? asBoolSonido(src.sonido) : !!base.sonido,
    historial: Array.isArray(src.historial)
      ? src.historial.slice()
      : (base.historial || []).slice(),
  };
  if (id === "frutas") {
    const mov = numOr(src.mov, base.mov ?? 18);
    out.mov = [12, 18, 24].includes(mov) ? mov : 18;
  }
  if (id === "simon") {
    const c = numOr(src.corazones, base.corazones ?? 2);
    out.corazones = c === 3 ? 3 : 2;
  }
  if (id === "duelo") {
    const c = numOr(src.cartas, base.cartas ?? 5);
    out.cartas = c === 7 ? 7 : 5;
  }
  return out;
}

export function getGameCfg(store, gameId) {
  const S = typeof store?.get === "function" ? store.get() : store || {};
  const fromStore = S.gameCfg && S.gameCfg[gameId];
  const fromDemo = S.quintiaDemo?.storeDefaults?.gameCfg?.[gameId];
  return normalizeGameCfg(gameId, fromStore || fromDemo || null);
}

export function getAllGameCfgs(store) {
  const out = {};
  for (const id of GAME_IDS) out[id] = getGameCfg(store, id);
  return out;
}

/** Convierte el draft de campos de la UI admin → patch tipado. */
export function patchFromCampos(gameId, draftCampos) {
  const patch = {};
  const entries =
    draftCampos && typeof draftCampos === "object"
      ? Object.entries(draftCampos)
      : [];
  for (const [label, value] of entries) {
    const key = LABEL_TO_KEY[label];
    if (!key) continue;
    if (key === "sonido") patch.sonido = asBoolSonido(value);
    else if (key === "sube") patch.sube = String(value);
    else patch[key] = numOr(value, undefined);
  }
  return normalizeGameCfg(gameId, {
    ...DEFAULT_GAME_CFG[gameId],
    ...patch,
  });
}

function summarizeGameChange(prev, next) {
  const bits = [];
  if (prev.nivel !== next.nivel) bits.push(`Nivel inicial: ${prev.nivel} → ${next.nivel}`);
  if (prev.sube !== next.sube) bits.push(`Subida: ${prev.sube} → ${next.sube}`);
  if (prev.mov != null && prev.mov !== next.mov)
    bits.push(`Movimientos por partida: ${prev.mov} → ${next.mov}`);
  if (prev.corazones != null && prev.corazones !== next.corazones)
    bits.push(`Corazones: ${prev.corazones} → ${next.corazones}`);
  if (prev.cartas != null && prev.cartas !== next.cartas)
    bits.push(`Cartas por mano: ${prev.cartas} → ${next.cartas}`);
  if (prev.sonido !== next.sonido)
    bits.push(next.sonido ? "Sonido activado" : "Sonido desactivado");
  return bits.length ? bits.join(" · ") : "Ajuste de configuración";
}

/**
 * Guarda nueva versión de config de un juego (vigente de inmediato).
 * También alinea anCfg.gameVersions para el analizador.
 */
export function saveGameCfgVersion(store, gameId, draftCampos, who = "Administrador") {
  const prev = getGameCfg(store, gameId);
  const parsed = patchFromCampos(gameId, draftCampos);
  const nextV = Number(prev.version || 1) + 1;
  const next = {
    ...parsed,
    version: nextV,
    historial: [
      {
        v: nextV,
        cuando: "Hoy",
        quien: who,
        cambio: summarizeGameChange(prev, parsed),
      },
      ...(prev.historial || []),
    ].slice(0, 20),
  };
  store.set((s) => {
    s.gameCfg = s.gameCfg && typeof s.gameCfg === "object" ? { ...s.gameCfg } : {};
    s.gameCfg[gameId] = next;
    if (s.anCfg && typeof s.anCfg === "object") {
      s.anCfg = {
        ...s.anCfg,
        gameVersions: {
          ...(s.anCfg.gameVersions || {}),
          [gameId]: nextV,
        },
      };
    } else {
      s.anCfg = {
        gameVersions: { [gameId]: nextV },
      };
    }
    if (s.quintiaDemo?.storeDefaults) {
      s.quintiaDemo = {
        ...s.quintiaDemo,
        storeDefaults: {
          ...s.quintiaDemo.storeDefaults,
          gameCfg: {
            ...(s.quintiaDemo.storeDefaults.gameCfg || {}),
            [gameId]: next,
          },
        },
      };
    }
  });
  return next;
}

/** Helpers para iframes / React. */
export function frutasQueryFromCfg(cfg, extra = {}) {
  const c = normalizeGameCfg("frutas", cfg);
  return {
    version: String(c.version),
    mov: String(c.mov),
    sonido: c.sonido ? "1" : "0",
    nivel: String(c.nivel),
    sube: isAutoSube(c.sube) ? "auto" : "fijo",
    ...extra,
  };
}

export function isSubeAuto(cfg) {
  return isAutoSube(cfg?.sube);
}
