/**
 * Configuración del analizador (anCfg vigente + borrador pendiente de aprobación).
 */

export const DEFAULT_AN_CFG = {
  version: 2,
  partidas: 10,
  dias: 14,
  descarta: 3,
  sens: "Media",
  plazo: 7,
  fuentes: { frutas: true, simon: true, duelo: true, sudoku: true },
  senales: {
    menos: { on: true, pct: 50, semanas: 2 },
    peor: { on: true },
    gana: { on: true, caida: 30, semanas: 3 },
  },
  sugerencias: [
    "Repetir la medición en 2 semanas",
    "Conversar en la próxima sesión",
    "Seguir observando",
    "Revisar la constancia con la persona",
  ],
  historial: [
    {
      v: 2,
      cuando: "Hace 1 mes",
      quien: "Marcela Ríos",
      cambio: "Sensibilidad: Alta → Media",
    },
    {
      v: 1,
      cuando: "Hace 4 meses",
      quien: "Marcela Ríos",
      cambio: "Versión inicial",
    },
  ],
  gameVersions: { frutas: 1, simon: 1, duelo: 1, sudoku: 1 },
};

export function sensSemanas(sens) {
  const s = String(sens || "Media");
  if (s === "Baja") return 4;
  if (s === "Alta") return 2;
  return 3;
}

/** Última versión aprobada por el clínico (queda en pathRequests.draft). */
function anCfgFromApprovedRequest(S) {
  const list = Array.isArray(S.pathRequests) ? S.pathRequests : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const x = list[i];
    if (!x) continue;
    if (x.tipo !== "analizador" && x.code !== "ANALIZADOR") continue;
    const st = String(x.status || "").toLowerCase();
    if (st !== "aprobada" && st !== "approved") continue;
    if (x.draft?.anCfg && typeof x.draft.anCfg === "object") return x.draft.anCfg;
  }
  return null;
}

export function getAnCfgVigente(store) {
  const S = typeof store.get === "function" ? store.get() : store || {};
  const fromDemo = S.quintiaDemo?.storeDefaults?.anCfg;
  const fromApproved = anCfgFromApprovedRequest(S);
  const raw =
    (S.anCfg && typeof S.anCfg === "object" ? S.anCfg : null) ||
    fromApproved ||
    (fromDemo && typeof fromDemo === "object" ? fromDemo : null) ||
    DEFAULT_AN_CFG;
  return {
    ...DEFAULT_AN_CFG,
    ...raw,
    fuentes: { ...DEFAULT_AN_CFG.fuentes, ...(raw.fuentes || {}) },
    senales: {
      menos: { ...DEFAULT_AN_CFG.senales.menos, ...(raw.senales?.menos || {}) },
      peor: { ...DEFAULT_AN_CFG.senales.peor, ...(raw.senales?.peor || {}) },
      gana: { ...DEFAULT_AN_CFG.senales.gana, ...(raw.senales?.gana || {}) },
    },
    sugerencias: Array.isArray(raw.sugerencias)
      ? raw.sugerencias
      : DEFAULT_AN_CFG.sugerencias,
    historial: Array.isArray(raw.historial)
      ? raw.historial
      : DEFAULT_AN_CFG.historial,
  };
}

/**
 * Si hay una aprobación en pathRequests pero anCfg no está en el store
 * (p. ej. API vieja que no persistía la rebanada), la materializa.
 */
export function ensureAnCfgFromApprovals(store) {
  const S = store.get?.() || {};
  if (S.anCfg && typeof S.anCfg === "object") return false;
  const fromApproved = anCfgFromApprovedRequest(S);
  if (!fromApproved) return false;
  store.set((s) => {
    s.anCfg = { ...fromApproved };
  });
  return true;
}

export function getAnDraft(store) {
  const S = typeof store.get === "function" ? store.get() : store || {};
  return S.anDraft || null;
}

/** Guarda borrador como nueva versión y crea pathRequest tipo analizador. */
export function saveAnDraftVersion(store, draftPatch, who = "Administrador") {
  const vigente = getAnCfgVigente(store);
  const nextV = Number(vigente.version || 1) + 1;
  const draft = {
    ...vigente,
    ...draftPatch,
    version: nextV,
    fuentes: { ...vigente.fuentes, ...(draftPatch.fuentes || {}) },
    senales: {
      ...vigente.senales,
      ...(draftPatch.senales || {}),
    },
    historial: [
      {
        v: nextV,
        cuando: "Hoy",
        quien: who,
        cambio: summarizeChange(vigente, { ...vigente, ...draftPatch }),
      },
      ...(vigente.historial || []),
    ],
  };
  const now = Date.now();
  const reqId = `analizador-${nextV}-${now}`;
  store.set((s) => {
    s.anDraft = { ...draft, pendingAt: now, pendingBy: who };
    s.pathRequests = Array.isArray(s.pathRequests) ? s.pathRequests.slice() : [];
    s.pathRequests = s.pathRequests.map((x) => {
      if (x?.tipo === "analizador" && String(x.status || "").toLowerCase() === "pending") {
        return { ...x, status: "superseded", resolvedAt: now };
      }
      return x;
    });
    s.pathRequests.push({
      id: reqId,
      tipo: "analizador",
      tipoLabel: "Juegos y analizador",
      code: "ANALIZADOR",
      scope: "all",
      draft: { anCfg: draft },
      at: now,
      status: "pending",
      partes: [
        `Analizador v${nextV}`,
        `Fuentes: ${Object.entries(draft.fuentes)
          .filter(([, on]) => on)
          .map(([k]) => k)
          .join(", ")}`,
        `Sensibilidad ${draft.sens}`,
        `Línea base ${draft.partidas} partidas / ${draft.dias} días`,
        `Plazo avisos ${draft.plazo} días`,
      ],
    });
  });
  return { draft, reqId };
}

/** Aplica borrador aprobado como vigente. */
export function applyAnCfgApproval(store, pathRequest, approved) {
  const S0 = store.get?.() || {};
  const fresh =
    (S0.pathRequests || []).find((x) => x && x.id === pathRequest?.id) ||
    pathRequest;
  const draftCfg = fresh?.draft?.anCfg;
  if (!draftCfg || typeof draftCfg !== "object") return false;
  store.set((s) => {
    if (approved) {
      // Copia plana: esta es la config que el motor y el admin deben leer.
      s.anCfg = { ...draftCfg };
      s.anDraft = null;
      // Mantener demo alineada si existe (solo memoria; no es fuente de verdad).
      if (s.quintiaDemo?.storeDefaults) {
        s.quintiaDemo = {
          ...s.quintiaDemo,
          storeDefaults: {
            ...s.quintiaDemo.storeDefaults,
            anCfg: { ...(s.quintiaDemo.storeDefaults.anCfg || {}), ...draftCfg },
          },
        };
      }
    } else if (s.anDraft?.version === draftCfg.version) {
      s.anDraft = null;
    }
    s.pathRequests = (s.pathRequests || []).map((x) =>
      x.id === fresh.id
        ? {
            ...x,
            status: approved ? "aprobada" : "rechazada",
            resolvedAt: Date.now(),
          }
        : x,
    );
  });
  return true;
}

function summarizeChange(prev, next) {
  const bits = [];
  if (prev.sens !== next.sens) bits.push(`Sensibilidad: ${prev.sens} → ${next.sens}`);
  if (prev.partidas !== next.partidas) bits.push(`Partidas: ${prev.partidas} → ${next.partidas}`);
  if (prev.plazo !== next.plazo) bits.push(`Plazo: ${prev.plazo} → ${next.plazo}`);
  const fPrev = Object.keys(prev.fuentes || {}).filter((k) => prev.fuentes[k]);
  const fNext = Object.keys(next.fuentes || {}).filter((k) => next.fuentes[k]);
  if (fPrev.join() !== fNext.join()) bits.push(`Fuentes: ${fNext.join(", ")}`);
  return bits.length ? bits.join(" · ") : "Ajuste de configuración";
}
