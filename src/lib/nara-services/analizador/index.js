export {
  GAMES_META,
  SENALES,
  buildEventoPartida,
  normalizeGameLog,
} from "./contrato.js";
export {
  DEFAULT_AN_CFG,
  getAnCfgVigente,
  getAnDraft,
  saveAnDraftVersion,
  applyAnCfgApproval,
  ensureAnCfgFromApprovals,
  sensSemanas,
} from "./cfg.js";
export {
  recalcularPaciente,
  recalcularTodos,
  getSnap,
  listAvisosAbiertos,
} from "./motor.js";
export { tomarAviso, decidirAviso, DECISIONES } from "./avisos.js";
export { seedAnalizadorDemo } from "./seedDemo.js";

import { buildEventoPartida } from "./contrato.js";
import { recalcularPaciente } from "./motor.js";

function hasConsent(store, pid) {
  const S = store.get?.() || {};
  return !!(S.consents?.[pid]?.analizador === true);
}

/** Emite partida (contrato) + recalcula analizador. */
export function registrarPartidaYAnalizar(store, payload) {
  const ev = buildEventoPartida(payload);
  const pid = String(ev.pid);
  // Sin consentimiento: se guarda el log de juego, pero no entra al motor.
  if (!hasConsent(store, pid)) {
    store.set((s) => {
      s.gameLogs = s.gameLogs || {};
      const prev = Array.isArray(s.gameLogs[pid]) ? s.gameLogs[pid].slice() : [];
      if (prev.some((x) => x && x.id === ev.id)) return;
      prev.push({ ...ev, analizadorSkip: true });
      s.gameLogs[pid] = prev;
    });
    return { ...ev, analizadorSkip: true };
  }
  if (ev.offline) {
    try {
      const key = "quintia.partidas.pending";
      const q = JSON.parse(localStorage.getItem(key) || "[]");
      q.push(ev);
      localStorage.setItem(key, JSON.stringify(q));
    } catch {
      /* ignore */
    }
  }
  store.set((s) => {
    s.gameLogs = s.gameLogs || {};
    const prev = Array.isArray(s.gameLogs[pid]) ? s.gameLogs[pid].slice() : [];
    if (prev.some((x) => x && x.id === ev.id)) return;
    prev.push(ev);
    s.gameLogs[pid] = prev;
  });
  if (!ev.offline) {
    try {
      recalcularPaciente(store, pid);
    } catch {
      /* best-effort */
    }
  }
  return ev;
}

/** Vacía cola offline al recuperar señal. */
export function flushPartidasPendientes(store) {
  let q = [];
  try {
    q = JSON.parse(localStorage.getItem("quintia.partidas.pending") || "[]");
  } catch {
    q = [];
  }
  if (!q.length) return 0;
  const pids = new Set();
  store.set((s) => {
    s.gameLogs = s.gameLogs || {};
    for (const ev of q) {
      const pid = String(ev.pid);
      pids.add(pid);
      const prev = Array.isArray(s.gameLogs[pid]) ? s.gameLogs[pid].slice() : [];
      if (prev.some((x) => x && x.id === ev.id)) continue;
      prev.push({ ...ev, offline: false, sync: true });
      s.gameLogs[pid] = prev;
    }
  });
  try {
    localStorage.removeItem("quintia.partidas.pending");
  } catch {
    /* ignore */
  }
  for (const pid of pids) {
    try {
      recalcularPaciente(store, pid);
    } catch {
      /* ignore */
    }
  }
  return q.length;
}
