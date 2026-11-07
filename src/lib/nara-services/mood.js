/**
 * Estado de ánimo — catálogo + lógica (solo este archivo + MoodPanel + MoodToolCard).
 * Default: 2 veces al día. Historial en store + localStorage (no se pierde con el sync).
 */

export const MOOD_LABELS = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"];

export const MOOD_TINTS = [
  { bd: "#E07A7A", bg: "#FDF2F2", bgOn: "#FCE4E4", solid: "#B42318" },
  { bd: "#E0A060", bg: "#FFF6EC", bgOn: "#FFE8D4", solid: "#C27241" },
  { bd: "#D4B84A", bg: "#FFFBEF", bgOn: "#F7F0D4", solid: "#DA9E46" },
  { bd: "#31C6E6", bg: "#E4F7FB", bgOn: "#C8EEF6", solid: "#31C6E6" },
  { bd: "#2B8A74", bg: "#E7FAF5", bgOn: "#C8F0E6", solid: "#2B8A74" },
];

const FREQS = ["2 veces al día", "1 vez por semana", "Cada mes"];
const LS_KEY = "nara.moodLog.v1";

/** @typedef {'twice_daily' | 'weekly' | 'monthly'} MoodFreqKind */

/**
 * Normaliza etiqueta de ruta. Default / Diario legado → 2 veces al día.
 * @param {unknown} raw
 * @returns {{ kind: MoodFreqKind, label: string, limit: number }}
 */
export function normalizeMoodFreq(raw) {
  const s = String(raw || "").trim();
  const low = s.toLowerCase();
  if (/1\s*vez\s*por\s*semana|semanal|weekly/i.test(low) && !/2\s*veces/i.test(low)) {
    return { kind: "weekly", label: FREQS[1], limit: 1 };
  }
  if (/cada\s*mes|mensual|month/i.test(low)) {
    return { kind: "monthly", label: FREQS[2], limit: 1 };
  }
  // Default del producto + legado «Diario» → 2 veces al día
  if (!s || /diario|daily|2\s*veces|dos\s*veces|twice/i.test(low)) {
    return { kind: "twice_daily", label: FREQS[0], limit: 2 };
  }
  return { kind: "twice_daily", label: FREQS[0], limit: 2 };
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/**
 * Periodo actual en el que solo se permite 1 check-in.
 * «2 veces al día» = 1 en la mañana (0–12h) + 1 en la tarde (12–24h).
 */
function currentPeriod(kind, now = Date.now()) {
  if (kind === "weekly") {
    const from = startOfWeek(now);
    return {
      from,
      to: from + 7 * 24 * 60 * 60 * 1000,
      limit: 1,
      slot: "semana",
      nextWhenBlocked: "Ya registró el ánimo de esta semana. Vuelve la próxima.",
    };
  }
  if (kind === "monthly") {
    const from = startOfMonth(now);
    const end = new Date(from);
    end.setMonth(end.getMonth() + 1);
    return {
      from,
      to: end.getTime(),
      limit: 1,
      slot: "mes",
      nextWhenBlocked: "Ya registró el ánimo de este mes. Vuelve el próximo mes.",
    };
  }
  // twice_daily: mañana / tarde
  const day0 = startOfDay(now);
  const noon = day0 + 12 * 60 * 60 * 1000;
  const dayEnd = day0 + 24 * 60 * 60 * 1000;
  if (now < noon) {
    return {
      from: day0,
      to: noon,
      limit: 1,
      slot: "mañana",
      nextWhenBlocked:
        "Ya registró el ánimo de la mañana. El próximo es por la tarde.",
    };
  }
  return {
    from: noon,
    to: dayEnd,
    limit: 1,
    slot: "tarde",
    nextWhenBlocked: "Ya registró el ánimo de la tarde. Vuelve mañana.",
  };
}

function entryAt(row) {
  if (!row || typeof row !== "object") return 0;
  const n = Number(row.at);
  if (Number.isFinite(n) && n > 0) return n;
  if (row.d === "Hoy") return Date.now();
  return 0;
}

/** Misma valoración en el mismo minuto = un solo check-in (timeline + moodLogs + aiLog). */
function softEntryKey(e) {
  const at = Number(e?.at) || 0;
  const minute = at > 0 ? Math.floor(at / 60_000) : 0;
  return `${minute}:${Number(e?.value) || 0}:${String(e?.label || "")}`;
}

function dedupeMoodEntries(entries) {
  const best = new Map();
  (entries || []).forEach((e) => {
    if (!e || !(Number(e.value) >= 1)) return;
    const k = softEntryKey(e);
    const prev = best.get(k);
    if (!prev || Number(e.at) >= Number(prev.at)) best.set(k, e);
  });
  return Array.from(best.values()).sort((a, b) => b.at - a.at);
}

function readMoodLs() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function writeMoodLs(map) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* cuota / privado */
  }
}

function lsEntriesFor(aliases) {
  const map = readMoodLs();
  const out = [];
  const seen = new Set();
  (aliases || []).forEach((id) => {
    const arr = Array.isArray(map[id]) ? map[id] : [];
    arr.forEach((row) => {
      if (!row) return;
      const value = Math.max(1, Math.min(5, Number(row.value) || 0));
      if (value < 1) return;
      const at = entryAt(row);
      const label = row.label || MOOD_LABELS[value - 1];
      const e = { value, label, at, when: formatMoodWhen(at) };
      const k = softEntryKey(e);
      if (seen.has(k)) return;
      seen.add(k);
      out.push(e);
    });
  });
  return out;
}

function persistMoodLs(aliases, entry, replaceAt) {
  const map = readMoodLs();
  (aliases || []).forEach((id) => {
    if (!id) return;
    let arr = Array.isArray(map[id]) ? map[id].slice() : [];
    if (replaceAt) {
      let done = false;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (Number(arr[i]?.at) === Number(replaceAt)) {
          arr[i] = entry;
          done = true;
          break;
        }
      }
      if (!done) arr.push(entry);
    } else {
      arr.push(entry);
    }
    map[id] = arr;
  });
  writeMoodLs(map);
}

/**
 * Resuelve ficha + aliases (id / accountId) para no perder historial entre roles.
 * @param {*} store
 * @param {string} patientId
 */
export function resolveMoodPatient(store, patientId) {
  const S = store.get?.() || {};
  const map = {
    ...(S.patients || {}),
    ...(store.PATIENTS || {}),
  };
  const sess =
    (typeof store.session === "function" && store.session()) || {};
  const want = String(patientId || "");
  const hit =
    (want && map[want]) ||
    Object.values(map).find(
      (p) =>
        p &&
        (String(p.id || "") === want ||
          String(p.accountId || "") === want ||
          (sess.patientId && String(p.id || "") === String(sess.patientId)) ||
          (sess.id && String(p.accountId || "") === String(sess.id))),
    ) ||
    null;

  const id = String(hit?.id || want || sess.patientId || "");
  const accountId = String(hit?.accountId || sess.id || "");
  const aliases = Array.from(
    new Set(
      [want, id, accountId, sess.patientId, sess.id]
        .filter(Boolean)
        .map(String),
    ),
  );

  // Fusionar campos útiles de todos los alias en store
  let patient = hit ? { ...hit } : id ? { id } : null;
  aliases.forEach((k) => {
    const row = map[k];
    if (!row) return;
    if (!patient) patient = { ...row };
    else {
      const tlA = Array.isArray(patient.timeline) ? patient.timeline : [];
      const tlB = Array.isArray(row.timeline) ? row.timeline : [];
      const seen = new Set(
        tlA.map((r) =>
          softEntryKey({ at: entryAt(r), value: r?.value, label: r?.label }),
        ),
      );
      const mergedTl = tlA.slice();
      tlB.forEach((r) => {
        const k2 = softEntryKey({
          at: entryAt(r),
          value: r?.value,
          label: r?.label,
        });
        if (seen.has(k2)) return;
        seen.add(k2);
        mergedTl.push(r);
      });
      patient = {
        ...row,
        ...patient,
        timeline: mergedTl,
        lastMood: patient.lastMood ?? row.lastMood,
        lastMoodLabel: patient.lastMoodLabel ?? row.lastMoodLabel,
        lastCheckin: patient.lastCheckin || row.lastCheckin,
        profile: patient.profile || row.profile,
        name: patient.name || row.name,
      };
    }
  });

  return { patient, id, accountId, aliases };
}

/** Historial desde timeline del paciente (sin LS). */
export function listMoodHistory(patient) {
  const tl = Array.isArray(patient?.timeline) ? patient.timeline : [];
  const fromTl = tl
    .filter((row) => row && (row.type === "mood" || row.k === "mood"))
    .map((row) => {
      const value = Math.max(1, Math.min(5, Number(row.value) || 0));
      const label =
        row.label || MOOD_LABELS[value - 1] || String(row.value || "");
      const at = entryAt(row);
      return { value, label, at, when: formatMoodWhen(at) };
    })
    .filter((x) => x.value >= 1);

  if (!fromTl.length && patient && typeof patient.lastMood === "number") {
    const value = Math.max(1, Math.min(5, Number(patient.lastMood)));
    const at = patient.lastCheckin
      ? Date.parse(String(patient.lastCheckin)) || Date.now()
      : Date.now();
    fromTl.push({
      value,
      label: patient.lastMoodLabel || MOOD_LABELS[value - 1],
      at,
      when: formatMoodWhen(at),
    });
  }

  return dedupeMoodEntries(fromTl);
}

/**
 * Estadísticas clínicas a partir del historial (1–5).
 * «Mal» = Muy mal (1) o Mal (2).
 * @param {Array<{ value: number }>} hist
 */
export function computeMoodStats(hist) {
  const values = (hist || [])
    .map((e) => Number(e.value))
    .filter((v) => Number.isFinite(v) && v >= 1 && v <= 5);
  const n = values.length;
  if (!n) {
    return {
      n: 0,
      media: null,
      mediana: null,
      desv: null,
      pctMal: null,
      mediaLabel: "—",
      medianaLabel: "—",
      desvLabel: "—",
      pctMalLabel: "—",
    };
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const media = sum / n;
  const mediana =
    n % 2 === 1
      ? sorted[(n - 1) / 2]
      : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance =
    n > 1
      ? values.reduce((acc, v) => acc + (v - media) ** 2, 0) / (n - 1)
      : 0;
  const desv = Math.sqrt(variance);
  const mal = values.filter((v) => v <= 2).length;
  const pctMal = (mal / n) * 100;
  const fmt = (x, d = 1) =>
    Number.isFinite(x) ? x.toLocaleString("es-CO", { maximumFractionDigits: d, minimumFractionDigits: 0 }) : "—";
  return {
    n,
    media,
    mediana,
    desv,
    pctMal,
    mediaLabel: fmt(media, 1),
    medianaLabel: fmt(mediana, 1),
    desvLabel: n > 1 ? fmt(desv, 1) : "—",
    pctMalLabel: `${fmt(pctMal, 0)} %`,
  };
}

/** Parsea «Muy bien (5/5)» desde aiLog (legado mientras moodLogs se sincroniza). */
function moodFromAiLogText(text) {
  const m = String(text || "").match(
    /(Muy mal|Mal|Regular|Bien|Muy bien)\s*\((\d)\s*\/\s*5\)/i,
  );
  if (!m) return null;
  const value = Math.max(1, Math.min(5, Number(m[2]) || 0));
  if (value < 1) return null;
  const label =
    MOOD_LABELS.find((l) => l.toLowerCase() === String(m[1]).toLowerCase()) ||
    MOOD_LABELS[value - 1];
  return { value, label };
}

/** Historial completo: timeline + moodLogs + aiLog + localStorage. */
export function listMoodHistoryFor(store, patientId) {
  const { patient, aliases } = resolveMoodPatient(store, patientId);
  const fromStore = listMoodHistory(patient);
  const S = store.get?.() || {};
  const moodLogs = S.moodLogs && typeof S.moodLogs === "object" ? S.moodLogs : {};
  const fromMoodLogs = [];
  const seenMl = new Set();
  aliases.forEach((k) => {
    (Array.isArray(moodLogs[k]) ? moodLogs[k] : []).forEach((row) => {
      const value = Math.max(1, Math.min(5, Number(row?.value) || 0));
      if (value < 1) return;
      const at = entryAt(row);
      const label = row.label || MOOD_LABELS[value - 1];
      const e = { value, label, at, when: formatMoodWhen(at) };
      const key = softEntryKey(e);
      if (seenMl.has(key)) return;
      seenMl.add(key);
      fromMoodLogs.push(e);
    });
  });
  const fromAi = [];
  const aliasSet = new Set(aliases.map(String));
  (Array.isArray(S.aiLog) ? S.aiLog : []).forEach((row) => {
    if (!row || !aliasSet.has(String(row.pid || ""))) return;
    if (!/check-in de ánimo|check.?in.*ánimo|ánimo/i.test(String(row.channel || ""))) {
      return;
    }
    const parsed = moodFromAiLogText(row.text);
    if (!parsed) return;
    const at = Number(row.at) || Date.now();
    fromAi.push({
      value: parsed.value,
      label: parsed.label,
      at,
      when: formatMoodWhen(at),
    });
  });
  const fromLs = lsEntriesFor(aliases);
  // aiLog es legado: solo aporta si no hay ya el mismo check-in en timeline/moodLogs/LS.
  return dedupeMoodEntries([
    ...fromStore,
    ...fromMoodLogs,
    ...fromLs,
    ...fromAi,
  ]);
}

export function formatMoodWhen(at) {
  if (!at) return "—";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) return `Hoy · ${time}`;
  return (
    d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }) +
    " · " +
    time
  );
}

export function getMoodFreqForPatient(store, patientId) {
  const { patient, id } = resolveMoodPatient(store, patientId);
  const profile = (patient && patient.profile) || "P05";
  let freqRaw = "";
  try {
    const { r, d } =
      typeof store.parseCode === "function"
        ? store.parseCode(profile)
        : { r: -1, d: -1 };
    if (r >= 0 && d >= 0 && typeof store.pathList === "function") {
      const ctx =
        typeof store.ctxFor === "function" ? store.ctxFor(id || patientId) : null;
      const list = store.pathList(r, d, null, ctx) || [];
      const mood = list.find((x) => x && x.id === "mood");
      if (mood && mood.freq) freqRaw = mood.freq;
    }
  } catch {
    /* ruta no disponible */
  }
  return normalizeMoodFreq(freqRaw || FREQS[0]);
}

export function moodEntriesInWindowFromHist(hist, freqInfo, now = Date.now()) {
  const period = currentPeriod(freqInfo.kind, now);
  return (hist || [])
    .filter((e) => e.at >= period.from && e.at < period.to)
    .sort((a, b) => a.at - b.at);
}

export function moodWindowStatusFor(store, patientId, now = Date.now()) {
  const freqInfo = getMoodFreqForPatient(store, patientId);
  const hist = listMoodHistoryFor(store, patientId);
  const period = currentPeriod(freqInfo.kind, now);
  const inWin = moodEntriesInWindowFromHist(hist, freqInfo, now);
  const last = inWin.length
    ? inWin[inWin.length - 1]
    : hist[0] || null;
  // 1 solo envío por periodo (mañana/tarde, semana o mes)
  const needs = inWin.length < period.limit;
  const nextHint = needs
    ? `Frecuencia: ${freqInfo.label}`
    : period.nextWhenBlocked;
  return {
    inWindow: inWin,
    count: inWin.length,
    limit: period.limit,
    needs,
    last,
    nextHint,
    freqLabel: freqInfo.label,
    freqInfo,
    hist,
    slot: period.slot,
  };
}

/** @deprecated usar moodWindowStatusFor */
export function moodWindowStatus(patient, freqInfo, now = Date.now()) {
  const hist = listMoodHistory(patient);
  const inWin = moodEntriesInWindowFromHist(hist, freqInfo, now);
  const period = currentPeriod(freqInfo.kind, now);
  const last = inWin.length ? inWin[inWin.length - 1] : null;
  const needs = inWin.length < period.limit;
  return {
    inWindow: inWin,
    count: inWin.length,
    limit: period.limit,
    needs,
    last,
    nextHint: needs ? `Frecuencia: ${freqInfo.label}` : period.nextWhenBlocked,
    freqLabel: freqInfo.label,
  };
}

export function moodEntriesInWindow(patient, freqInfo, now = Date.now()) {
  return moodEntriesInWindowFromHist(listMoodHistory(patient), freqInfo, now);
}

export function moodNeedsCheckin(patient, freqInfo, now = Date.now()) {
  const period = currentPeriod(freqInfo.kind);
  return moodEntriesInWindow(patient, freqInfo).length < period.limit;
}

/** Borra historial de ánimo (pruebas) en store + localStorage. */
export function clearMoodHistoryFor(store, patientId) {
  const { aliases } = resolveMoodPatient(store, patientId);
  const map = readMoodLs();
  aliases.forEach((k) => {
    delete map[k];
  });
  writeMoodLs(map);

  if (!store || typeof store.set !== "function") return;
  store.set((s) => {
    s.patients = s.patients || {};
    s.moodLogs = s.moodLogs || {};
    aliases.forEach((key) => {
      delete s.moodLogs[key];
      const prev = s.patients[key];
      if (!prev) return;
      const timeline = Array.isArray(prev.timeline)
        ? prev.timeline.filter(
            (row) => !(row && (row.type === "mood" || row.k === "mood")),
          )
        : [];
      const { lastMood, lastMoodLabel, lastCheckin, ...rest } = prev;
      void lastMood;
      void lastMoodLabel;
      void lastCheckin;
      s.patients[key] = { ...rest, timeline };
    });
  });
}

/**
 * Guarda check-in en store (todos los aliases) + localStorage.
 */
export function saveMoodCheckin(store, patientId, index0to4, opts = {}) {
  const i = Math.max(0, Math.min(4, Number(index0to4)));
  const label = MOOD_LABELS[i];
  const value = i + 1;
  const now = Date.now();
  const { patient, id, accountId, aliases } = resolveMoodPatient(
    store,
    patientId,
  );
  const status = moodWindowStatusFor(store, patientId, now);
  // No permitir otro envío hasta el próximo periodo (salvo reemplazo explícito).
  if (!status.needs && !opts.replaceLastInWindow) {
    return { blocked: true, label: status.last?.label, value: status.last?.value, at: status.last?.at };
  }
  const replaceAt =
    opts.replaceLastInWindow && status.last ? status.last.at : null;

  const entry = {
    type: "mood",
    label,
    value,
    at: now,
    d: "Hoy",
  };

  store.set((s) => {
    s.patients = s.patients || {};
    s.moodLogs = s.moodLogs || {};

    const writeKeys = aliases.length
      ? aliases
      : [id || patientId].filter(Boolean);

    writeKeys.forEach((key) => {
      const prev =
        s.patients[key] ||
        (patient && (patient.id === key || patient.accountId === key)
          ? { ...patient }
          : typeof store.emptyPatient === "function"
            ? store.emptyPatient(key, (patient && patient.name) || "Paciente", 0)
            : { id: key });

      let timeline = Array.isArray(prev.timeline) ? prev.timeline.slice() : [];

      if (replaceAt) {
        let done = false;
        for (let t = timeline.length - 1; t >= 0; t--) {
          const row = timeline[t];
          if (row && (row.type === "mood" || row.k === "mood") && entryAt(row) === replaceAt) {
            timeline[t] = { ...row, ...entry };
            done = true;
            break;
          }
        }
        if (!done) timeline.push({ ...entry });
      } else {
        timeline.push({ ...entry });
      }

      const prevStatus = String(prev.status || "");
      const becomingActive = /^aprobad/i.test(prevStatus);
      const nextStatus = becomingActive
        ? "Activo"
        : prevStatus || prev.status;

      // Al pasar a Activo, habilitar lo que diga la ruta del perfil (no dejar []).
      let pathMods = null;
      if (
        becomingActive &&
        typeof store.parseCode === "function" &&
        (typeof store.appModuleIdsFromPath === "function" ||
          typeof store.pathList === "function")
      ) {
        try {
          const profile = prev.profile || "P05";
          const { r, d } = store.parseCode(profile);
          if (r >= 0 && d >= 0) {
            const ctx =
              typeof store.ctxFor === "function"
                ? store.ctxFor(prev.id || key)
                : prev.ctx;
            pathMods =
              typeof store.appModuleIdsFromPath === "function"
                ? store.appModuleIdsFromPath(r, d, null, ctx)
                : (store.pathList(r, d, null, ctx) || []).map((x) => x.id);
          }
        } catch {
          pathMods = null;
        }
      }

      s.patients[key] = {
        ...prev,
        id: prev.id || id || key,
        accountId: prev.accountId || accountId || undefined,
        lastCheckin: new Date(now).toISOString(),
        lastMood: value,
        lastMoodLabel: label,
        timeline,
        ...(nextStatus
          ? {
              status: nextStatus,
              signal: nextStatus === "Activo" ? "Activo" : prev.signal,
            }
          : {}),
        ...(Array.isArray(pathMods) && pathMods.length
          ? {
              modulesEnabled: pathMods.slice(),
              modulesVisible: pathMods.slice(),
            }
          : {}),
      };

      // Copia en moodLogs del store (por si el sync pisa patients)
      const log = Array.isArray(s.moodLogs[key]) ? s.moodLogs[key].slice() : [];
      if (replaceAt) {
        let done = false;
        for (let t = log.length - 1; t >= 0; t--) {
          if (Number(log[t]?.at) === Number(replaceAt)) {
            log[t] = { ...entry };
            done = true;
            break;
          }
        }
        if (!done) log.push({ ...entry });
      } else {
        log.push({ ...entry });
      }
      s.moodLogs[key] = log;
    });

    if (Array.isArray(s.people)) {
      const pe = s.people.find(
        (p) => p && (p.id === id || p.id === patientId || p.accountId === accountId),
      );
      if (pe && /^aprobad/i.test(String(pe.status || ""))) pe.status = "Activo";
    }
  });

  // También fusionar moodLogs del store al leer LS
  persistMoodLs(aliases, { ...entry }, replaceAt);

  // Sincronizar LS con lo que haya en s.moodLogs tras el set
  try {
    const S2 = store.get() || {};
    if (S2.moodLogs) {
      const map = readMoodLs();
      aliases.forEach((k) => {
        if (Array.isArray(S2.moodLogs[k])) map[k] = S2.moodLogs[k];
      });
      writeMoodLs(map);
    }
  } catch {
    /* ignore */
  }

  // No escribir en aiLog: el historial vive en timeline + moodLogs; aiLog duplicaba el mismo check-in.

  // Persistir moodLogs (app-state) + ficha paciente para que el clínico lo vea.
  const canonId = id || patientId;
  const patAfter = store.get?.()?.patients?.[canonId];
  void import("@/lib/store/persist")
    .then((m) => {
      if (typeof m.flushPersistWhenReady === "function") {
        return m.flushPersistWhenReady(store);
      }
      if (typeof m.flushPersist === "function") return m.flushPersist(store);
    })
    .catch(() => {});
  if (patAfter && typeof fetch === "function") {
    void fetch("/api/patients", {
      credentials: "same-origin",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: patAfter.id || canonId,
        accountId: patAfter.accountId,
        code: patAfter.code,
        name: patAfter.name,
        timeline: patAfter.timeline,
        lastMood: patAfter.lastMood,
        lastMoodLabel: patAfter.lastMoodLabel,
        lastCheckin: patAfter.lastCheckin,
        status: patAfter.status,
        signal: patAfter.signal,
        modulesEnabled: patAfter.modulesEnabled,
        modulesVisible: patAfter.modulesVisible,
      }),
    }).catch(() => {});
  }

  return { label, value, at: now, aliases };
}

const moodService = {
  id: "mood",
  name: "Estado de ánimo",
  navLabel: "Ánimo",
  note: "Check-in «¿Cómo se siente hoy?» en la app · por defecto 2 veces al día; también 1 vez por semana o cada mes",
  freqs: FREQS.slice(),
};

export default moodService;
