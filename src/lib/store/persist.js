/** Persistencia automática del AlientoStore → Mongo (/api/app-state → nara-api). */

import { APP_STATE_SLICES } from "@/lib/db/appState";
import { apiFetch } from "@/lib/api/client";

let paused = true;
let timer = null;
let lastError = null;
// H-011 (TRL 2026-10-10): último estado que coincide con el servidor. Si nada cambió, no hay PUT
// (antes cada pantalla enviaba todo el estado al cargar).
let lastSynced = null;
let flushing = false;

function sesionDe(store) {
  return typeof store.session === "function" ? store.session() || null : null;
}
function rolDe(store) {
  return sesionDe(store)?.roleId || null;
}

export function pausePersist(v = true) {
  paused = v;
}

export function isPersistPaused() {
  return paused;
}

// Lo que cada rol puede escribir en app-state (misma política que nara-api, app-state.policy.ts).
// El navegador no envía lo que la API rechazaría: así un cambio local de otra porción no produce un 403.
/** moodLogs/gameLogs: el paciente escribe solo su historial para que el clínico lo vea. */
const PACIENTE_ESCRIBE = [
  "alerts",
  "crisisLog",
  "closedToday",
  "notifs",
  "consents",
  "moodLogs",
  "gameLogs",
];
const NO_ESCRIBE = {
  experto: ["rules", "pathOverrides", "pathRequests", "recursos", "terrOv", "expertOv", "personOv", "assetOv", "assets", "weekBase", "reports", "customReports", "schedules"],
  clinico: ["terrOv", "expertOv", "personOv", "assetOv", "assets", "weekBase"],
};
const SOLO_ADMIN = ["accessLog", "agentLog", "aiLog", "activity"];

function puedeEscribir(roleId, key) {
  if (roleId === "admin") return true;
  if (roleId === "paciente") return PACIENTE_ESCRIBE.includes(key);
  if (SOLO_ADMIN.includes(key)) return false;
  return !(NO_ESCRIBE[roleId] || []).includes(key);
}

/** Del paciente solo salen sus propias entradas (patientId y/o id de cuenta). */
function soloDelPaciente(out, user) {
  const pid = user?.patientId || "";
  const aid = user?.id || "";
  const own = new Set([pid, aid].filter(Boolean).map(String));
  const propio = (arr) =>
    Array.isArray(arr)
      ? arr.filter((x) =>
          own.has(String(x?.pid ?? x?.personId ?? x?.patientId ?? "")),
        )
      : [];
  for (const k of ["alerts", "crisisLog", "closedToday"]) {
    const v = propio(out[k]);
    if (v.length) out[k] = v;
    else delete out[k];
  }
  if (out.notifs && user?.id && out.notifs[user.id] !== undefined) out.notifs = { [user.id]: out.notifs[user.id] };
  else delete out.notifs;
  if (out.consents && pid && out.consents[pid] !== undefined) out.consents = { [pid]: out.consents[pid] };
  else delete out.consents;
  // Mapas { patientId|accountId: [...] }: solo claves propias.
  for (const k of ["moodLogs", "gameLogs"]) {
    const map = out[k];
    if (!map || typeof map !== "object" || Array.isArray(map)) {
      delete out[k];
      continue;
    }
    const filtered = {};
    Object.keys(map).forEach((key) => {
      if (own.has(String(key))) filtered[key] = map[key];
    });
    if (Object.keys(filtered).length) out[k] = filtered;
    else delete out[k];
  }
  return out;
}

function pickSlices(s, roleId, user) {
  const out = {};
  for (const key of APP_STATE_SLICES) {
    if (roleId && !puedeEscribir(roleId, key)) continue;
    // No enviar null: borraría anCfg/anDraft aprobados en Mongo.
    if (s[key] !== undefined && s[key] !== null) {
      try {
        out[key] = JSON.parse(JSON.stringify(s[key]));
      } catch {
        out[key] = s[key];
      }
    }
  }
  return roleId === "paciente" ? soloDelPaciente(out, user) : out;
}

function alertStatusRank(st) {
  const s = String(st || "");
  if (s === "closed") return 5;
  if (s === "awaiting_patient") return 4;
  if (s === "retry" || s === "mine" || s === "other") return 3;
  if (s === "new") return 2;
  if (s === "open") return 1;
  return 0;
}

function mergeAlertsById(local, remote) {
  const map = new Map();
  const put = (a) => {
    if (!a || typeof a !== "object") return;
    const id = String(a.id || "");
    if (!id) return;
    const prev = map.get(id);
    if (!prev) {
      map.set(id, a);
      return;
    }
    // Misma alerta: unir campos; estado más avanzado + ubicación más reciente.
    const base =
      Number(a.at || 0) >= Number(prev.at || 0)
        ? Object.assign({}, prev, a)
        : Object.assign({}, a, prev);
    if (alertStatusRank(a.status) > alertStatusRank(prev.status)) {
      base.status = a.status;
      if (a.takenAt) base.takenAt = a.takenAt;
      if (a.takenBy) base.takenBy = a.takenBy;
      if (a.outcome) base.outcome = a.outcome;
      if (a.attendedAt) base.attendedAt = a.attendedAt;
    } else if (alertStatusRank(prev.status) > alertStatusRank(a.status)) {
      base.status = prev.status;
      if (prev.takenAt) base.takenAt = prev.takenAt;
      if (prev.takenBy) base.takenBy = prev.takenBy;
      if (prev.outcome) base.outcome = prev.outcome;
      if (prev.attendedAt) base.attendedAt = prev.attendedAt;
    }
    const aLocAt = Number(a.loc && a.loc.at) || 0;
    const pLocAt = Number(prev.loc && prev.loc.at) || 0;
    if (aLocAt > 0 || pLocAt > 0) {
      base.loc = aLocAt >= pLocAt ? a.loc : prev.loc;
    }
    map.set(id, base);
  };
  (Array.isArray(local) ? local : []).forEach(put);
  (Array.isArray(remote) ? remote : []).forEach(put);
  return Array.from(map.values()).sort(
    (a, b) => Number(b.at || 0) - Number(a.at || 0),
  );
}

export async function hydrateAppState(store) {
  try {
    const res = await apiFetch("/api/app-state");
    const data = await res.json();
    if (!res.ok || !data.ok || !data.slices) return;
    const slices = data.slices;
    // ¿Había un cambio local sin enviar antes de traer lo del servidor?
    const pendienteAntes = !!timer || flushing;
    store.set((s) => {
      // closedToday ANTES que alerts: si el clínico ya pasó a awaiting_patient,
      // hay que verlo al filtrar alertas locales stale (si no, «estoy bien» no aparece).
      // Reemplazar (no merge): si el servidor quedó vacío tras limpiar BD, el local
      // no debe seguir mostrando «Gestionadas hoy».
      if (slices.closedToday !== undefined) {
        try {
          s.closedToday = Array.isArray(slices.closedToday)
            ? JSON.parse(JSON.stringify(slices.closedToday))
            : [];
        } catch {
          s.closedToday = Array.isArray(slices.closedToday)
            ? slices.closedToday.slice()
            : [];
        }
      }
      const purgeAlertsAgainstClosed = () => {
        const closed = Array.isArray(s.closedToday) ? s.closedToday : [];
        const doneIds = new Set();
        const awaitingById = new Map();
        closed.forEach((c) => {
          if (!c || c.sev !== "crisis") return;
          const st = String(c.status || "");
          const id = c.id ? String(c.id) : "";
          if (!id) return;
          if (c.patientConfirmedAt || st === "closed") {
            doneIds.add(id);
            return;
          }
          if (st === "awaiting_patient") {
            const attended = Number(c.attendedAt || c.at || 0);
            const prev = awaitingById.get(id);
            if (prev == null || attended >= prev) awaitingById.set(id, attended);
          }
        });
        s.alerts = (s.alerts || []).filter((a) => {
          if (!a || a.sev !== "crisis") return true;
          const aid = String(a.id || "");
          if (doneIds.has(aid)) return false;
          if (awaitingById.has(aid)) {
            const alertAt = Number(a.at || 0);
            const attendedAt = Number(awaitingById.get(aid) || 0);
            // Misma alerta ya gestionada → fuera de cola. Episodio más nuevo → se queda.
            if (alertAt > 0 && attendedAt > 0) return alertAt > attendedAt;
            // Sin timestamps: si está en awaiting, la local ya no es cola abierta.
            return false;
          }
          return true;
        });
      };
      Object.keys(slices).forEach((k) => {
        if (slices[k] === undefined) return;
        if (k === "closedToday") return; // ya fusionado arriba
        // Alertas: unir por id para que crisis del paciente llegue al clínico
        // sin que un persist viejo las borre.
        if (k === "alerts") {
          s.alerts = mergeAlertsById(s.alerts, slices.alerts);
          purgeAlertsAgainstClosed();
          return;
        }
        if (k === "crisisLog") {
          s.crisisLog = mergeAlertsById(s.crisisLog, slices.crisisLog);
          return;
        }
        if (k === "notifs" && slices.notifs && typeof slices.notifs === "object") {
          s.notifs = s.notifs || {};
          Object.keys(slices.notifs).forEach((role) => {
            const remote = slices.notifs[role] || [];
            const local = s.notifs[role] || [];
            const byId = new Map();
            [...local, ...remote].forEach((n) => {
              if (n?.id) byId.set(n.id, n);
            });
            s.notifs[role] = Array.from(byId.values()).sort(
              (a, b) => Number(b.at || 0) - Number(a.at || 0),
            );
          });
          return;
        }
        // Aprobaciones de ruta: unir por id (pending del admin no se pierde).
        if (k === "pathRequests") {
          const map = new Map();
          const put = (row) => {
            if (!row || typeof row !== "object") return;
            const id = String(row.id || `${row.code || ""}-${row.scope || "all"}`);
            if (!id || id === "-") return;
            const norm = { ...row, id };
            const prev = map.get(id);
            if (!prev) {
              map.set(id, norm);
              return;
            }
            const rank = (a) => {
              const st = String(a.status || "pending").toLowerCase();
              if (st === "approved" || st === "rejected") return 3;
              if (st === "superseded") return 2;
              return 1;
            };
            const aAt = Math.max(Number(norm.at || 0), Number(norm.resolvedAt || 0));
            const bAt = Math.max(Number(prev.at || 0), Number(prev.resolvedAt || 0));
            const aSt = String(norm.status || "pending").toLowerCase();
            const bSt = String(prev.status || "pending").toLowerCase();
            // Pending nuevo (reenvío) no lo pisa un approved/rejected viejo del mismo id.
            if (
              aSt === "pending" &&
              (bSt === "approved" || bSt === "rejected" || bSt === "superseded") &&
              Number(norm.at || 0) > bAt
            ) {
              map.set(id, norm);
              return;
            }
            if (rank(norm) > rank(prev) || (rank(norm) === rank(prev) && aAt >= bAt)) {
              map.set(id, { ...prev, ...norm });
            }
          };
          (Array.isArray(s.pathRequests) ? s.pathRequests : []).forEach(put);
          (Array.isArray(slices.pathRequests) ? slices.pathRequests : []).forEach(put);
          s.pathRequests = Array.from(map.values()).sort(
            (a, b) => Number(b.at || 0) - Number(a.at || 0),
          );
          return;
        }
        if (k === "pathOverrides" && slices.pathOverrides && typeof slices.pathOverrides === "object") {
          // Fusionar `s` por servicio: no perder '' (apagado) con parciales.
          const local =
            s.pathOverrides && typeof s.pathOverrides === "object" ? s.pathOverrides : {};
          const remote = slices.pathOverrides;
          const out = { ...local };
          Object.keys(remote).forEach((pk) => {
            const prev =
              local[pk] && typeof local[pk] === "object" ? local[pk] : {};
            const next =
              remote[pk] && typeof remote[pk] === "object" ? remote[pk] : {};
            const prevS =
              prev.s && typeof prev.s === "object" ? prev.s : {};
            const nextS =
              next.s && typeof next.s === "object" ? next.s : {};
            out[pk] = { ...prev, ...next, s: { ...prevS, ...nextS } };
          });
          s.pathOverrides = out;
          return;
        }
        // consents: no pisar appAt local con {} remoto (poll mientras el PUT aún no refleja).
        if (k === "consents" && slices.consents && typeof slices.consents === "object") {
          const local =
            s.consents && typeof s.consents === "object" ? s.consents : {};
          const remote = slices.consents;
          const out = { ...local };
          Object.keys(remote).forEach((pid) => {
            const loc =
              local[pid] && typeof local[pid] === "object" ? local[pid] : {};
            const rem =
              remote[pid] && typeof remote[pid] === "object" ? remote[pid] : {};
            out[pid] = {
              ...loc,
              ...rem,
              appAt: rem.appAt || loc.appAt,
              appVersion: rem.appVersion || loc.appVersion,
            };
          });
          s.consents = out;
          return;
        }
        // moodLogs: unir arrays por paciente (at+value) para que el clínico vea check-ins del paciente.
        if (k === "moodLogs" && slices.moodLogs && typeof slices.moodLogs === "object") {
          const local =
            s.moodLogs && typeof s.moodLogs === "object" ? s.moodLogs : {};
          const remote = slices.moodLogs;
          const out = { ...local };
          Object.keys(remote).forEach((pid) => {
            const map = new Map();
            const put = (row) => {
              if (!row || typeof row !== "object") return;
              const at = Number(row.at || 0);
              const value = Number(row.value || 0);
              // Mismo minuto + valor = un check-in (evita dupes timeline/aiLog/sync).
              const id = `${at > 0 ? Math.floor(at / 60_000) : 0}:${value}:${String(row.label || "")}`;
              const prev = map.get(id);
              if (!prev || at >= Number(prev.at || 0)) map.set(id, row);
            };
            (Array.isArray(local[pid]) ? local[pid] : []).forEach(put);
            (Array.isArray(remote[pid]) ? remote[pid] : []).forEach(put);
            out[pid] = Array.from(map.values()).sort(
              (a, b) => Number(b.at || 0) - Number(a.at || 0),
            );
          });
          s.moodLogs = out;
          return;
        }
        // gameLogs: unir partidas por paciente (puzzleId + startedAt + status).
        if (k === "gameLogs" && slices.gameLogs && typeof slices.gameLogs === "object") {
          const local =
            s.gameLogs && typeof s.gameLogs === "object" ? s.gameLogs : {};
          const remote = slices.gameLogs;
          const out = { ...local };
          Object.keys(remote).forEach((pid) => {
            const map = new Map();
            const put = (row) => {
              if (!row || typeof row !== "object") return;
              const startedAt = Number(row.startedAt || row.at || 0);
              const puzzleId = String(row.puzzleId || row.id || "");
              const status = String(row.status || "");
              const id = `${puzzleId}:${startedAt}:${status}`;
              const prev = map.get(id);
              const at = Number(row.at || row.completedAt || startedAt || 0);
              if (!prev || at >= Number(prev.at || prev.completedAt || prev.startedAt || 0)) {
                map.set(id, row);
              }
            };
            (Array.isArray(local[pid]) ? local[pid] : []).forEach(put);
            (Array.isArray(remote[pid]) ? remote[pid] : []).forEach(put);
            out[pid] = Array.from(map.values()).sort(
              (a, b) =>
                Number(b.at || b.completedAt || b.startedAt || 0) -
                Number(a.at || a.completedAt || a.startedAt || 0),
            );
          });
          s.gameLogs = out;
          return;
        }
        if (k === "rules" && slices.rules && typeof slices.rules === "object") {
          const local = s.rules && typeof s.rules === "object" ? s.rules : {};
          const remote = slices.rules;
          const merged = { ...local, ...remote };
          const lPend = local.pending;
          const rPend = remote.pending;
          if (rPend && lPend) {
            merged.pending =
              Number(rPend.at || 0) >= Number(lPend.at || 0) ? rPend : lPend;
          } else if (rPend) {
            merged.pending = rPend;
          } else if (lPend && (remote.pending === null || remote.pending === undefined)) {
            const verAt = Number(remote.versions?.[0]?.at || 0);
            const cleared = Number(remote.pendingClearedAt || 0);
            const pendAt = Number(lPend.at || 0);
            if (Math.max(verAt, cleared) >= pendAt && pendAt > 0) {
              merged.pending = null;
            } else {
              merged.pending = lPend;
            }
          }
          s.rules = merged;
          return;
        }
        s[k] = slices[k];
      });
      // Por si alerts llegó antes en el payload o no venía en este poll.
      if (slices.closedToday !== undefined || slices.alerts !== undefined) {
        purgeAlertsAgainstClosed();
      }
    });
    // Lo recién traído del servidor no es un cambio local: no se reenvía. Si había un cambio local
    // pendiente, se deja que su guardado siga su curso.
    if (!pendienteAntes) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastSynced = JSON.stringify(pickSlices(store.get(), rolDe(store), sesionDe(store)));
    }
    // Si el clínico ya aprobó (pathRequests) pero anCfg no vino del API (rebanada vieja),
    // materializar y persistir con la lista actualizada de slices.
    try {
      const { ensureAnCfgFromApprovals } = await import(
        "@/lib/nara-services/analizador/cfg.js"
      );
      if (ensureAnCfgFromApprovals(store)) {
        schedulePersist(store);
      }
    } catch {
      /* best-effort */
    }
  } catch (e) {
    lastError = e;
  }
}

export function schedulePersist(store) {
  if (paused || typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushPersist(store);
  }, 450);
}

export async function flushPersist(store) {
  if (paused || typeof window === "undefined") return;
  // H-012: el observador es de solo lectura; no escribe el estado compartido (antes daba 403 en consola).
  // Sin sesión todavía (carga inicial) tampoco hay nada que guardar.
  const roleId = rolDe(store);
  if (!roleId || roleId === "observador") return;
  const slices = pickSlices(store.get(), roleId, sesionDe(store));
  if (!Object.keys(slices).length) return;
  const body = JSON.stringify(slices);
  if (body === lastSynced) return;
  flushing = true;
  try {
    const res = await apiFetch("/api/app-state", {
      method: "PUT",
      body: JSON.stringify({ slices }),
    });
    if (res.ok) lastSynced = body;
    else {
      const data = await res.json().catch(() => ({}));
      lastError = data.error || res.statusText;
    }
  } catch (e) {
    lastError = e;
  } finally {
    flushing = false;
  }
}

/** Espera a que el hydrate suelte pausePersist y luego escribe app-state. */
export async function flushPersistWhenReady(store, tries = 12) {
  if (typeof window === "undefined") return;
  for (let i = 0; i < tries; i++) {
    if (!paused) {
      await flushPersist(store);
      return;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  // Si el hydrate sigue pausando, forzar un PUT (p. ej. consentimiento app).
  const wasPaused = paused;
  paused = false;
  try {
    await flushPersist(store);
  } finally {
    paused = wasPaused;
  }
}

export function getPersistError() {
  return lastError;
}
