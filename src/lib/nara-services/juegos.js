/**
 * Lógica de periodicidad e historial de juegos (Sudoku y similares).
 * Catálogo de matriz: ver gamesCatalog.js (4 juegos + analizador).
 * Frecuencias: 2h · 8h · Diario.
 */
import library from "./juegos/sudoku_library_medium.json";
import { GAME_FREQS, GAME_IDS, LEGACY_JUEGOS_ID } from "./gamesCatalog.js";

const FREQS = GAME_FREQS;
const LS_KEY = "nara.gameLogs.v1";

/** @typedef {'every_2h' | 'every_8h' | 'daily'} JuegosFreqKind */

/**
 * @param {unknown} raw
 * @returns {{ kind: JuegosFreqKind, label: string, hours: number }}
 */
export function normalizeJuegosFreq(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (/^8\s*h|cada\s*8|8h/.test(s)) {
    return { kind: "every_8h", label: FREQS[1], hours: 8 };
  }
  if (/diario|daily|1\s*vez\s*al\s*d[ií]a|cada\s*d[ií]a/.test(s)) {
    return { kind: "daily", label: FREQS[2], hours: 24 };
  }
  // Default producto: cada 2 horas
  return { kind: "every_2h", label: FREQS[0], hours: 2 };
}

export function listSudokuPuzzles() {
  const puzzles = Array.isArray(library?.puzzles) ? library.puzzles : [];
  return puzzles.map((p) => ({
    id: String(p.id),
    difficulty: p.difficulty || "medium",
    clues: Number(p.clues) || 0,
    puzzle: String(p.puzzle || ""),
    solution: String(p.solution || ""),
  }));
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** Ventana actual según frecuencia. */
function currentPeriod(kind, now = Date.now()) {
  const day0 = startOfDay(now);
  if (kind === "daily") {
    return {
      from: day0,
      to: day0 + 24 * 60 * 60 * 1000,
      nextWhenBlocked: "Ya jugó el sudoku de hoy. Vuelve mañana.",
    };
  }
  const hours = kind === "every_8h" ? 8 : 2;
  const ms = hours * 60 * 60 * 1000;
  const slot = Math.floor((now - day0) / ms);
  const from = day0 + slot * ms;
  return {
    from,
    to: from + ms,
    nextWhenBlocked:
      hours === 8
        ? "Ya jugó en esta franja de 8 horas. Vuelve en la siguiente."
        : "Ya jugó en esta franja de 2 horas. Vuelve en la siguiente.",
  };
}

function entryAt(row) {
  if (!row || typeof row !== "object") return 0;
  const n = Number(row.at || row.startedAt || row.completedAt);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function readGameLs() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function writeGameLs(map) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function resolveJuegosPatient(store, patientId) {
  const S = store.get?.() || {};
  const map = {
    ...(S.patients || {}),
    ...(store.PATIENTS || {}),
  };
  const sess = (typeof store.session === "function" && store.session()) || {};
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
  return { patient: hit, id, accountId, aliases };
}

function normalizeEntry(row) {
  if (!row || typeof row !== "object") return null;
  if (row.type && row.type !== "juego" && row.k !== "juego") return null;
  const puzzleId = String(row.puzzleId || row.id || "").trim();
  if (!puzzleId && !row.status) return null;
  const status = String(row.status || "assigned");
  const startedAt = Number(row.startedAt || row.at) || 0;
  const completedAt = Number(row.completedAt) || 0;
  let durationMs = Number(row.durationMs);
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    if (completedAt && startedAt && completedAt >= startedAt) {
      durationMs = completedAt - startedAt;
    } else {
      durationMs = 0;
    }
  }
  return {
    type: "juego",
    game: "sudoku",
    puzzleId,
    status,
    startedAt,
    completedAt: completedAt || null,
    durationMs,
    at: entryAt(row) || startedAt || Date.now(),
  };
}

/** Historial de juegos (timeline + gameLogs + LS). */
export function listGameHistoryFor(store, patientId) {
  const { patient, aliases } = resolveJuegosPatient(store, patientId);
  const S = store.get?.() || {};
  const out = [];
  const seen = new Set();

  const push = (row) => {
    const e = normalizeEntry(row);
    if (!e || !e.puzzleId) return;
    const k = `${e.puzzleId}:${e.startedAt}:${e.status}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(e);
  };

  const tl = Array.isArray(patient?.timeline) ? patient.timeline : [];
  tl.forEach(push);

  const gameLogs =
    S.gameLogs && typeof S.gameLogs === "object" ? S.gameLogs : {};
  aliases.forEach((k) => {
    (Array.isArray(gameLogs[k]) ? gameLogs[k] : []).forEach(push);
  });

  const ls = readGameLs();
  aliases.forEach((k) => {
    (Array.isArray(ls[k]) ? ls[k] : []).forEach(push);
  });

  return out.sort((a, b) => b.at - a.at);
}

export function computeJuegosStats(hist) {
  const assigned = (hist || []).length;
  const started = (hist || []).filter((e) =>
    /started|completed|jugado/i.test(e.status),
  ).length;
  const completed = (hist || []).filter((e) =>
    /completed|terminad/i.test(e.status),
  );
  const times = completed
    .map((e) => Number(e.durationMs))
    .filter((n) => Number.isFinite(n) && n > 0);
  const fmt = (ms) => {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };
  let minMs = null;
  let maxMs = null;
  let avgMs = null;
  if (times.length) {
    minMs = Math.min(...times);
    maxMs = Math.max(...times);
    avgMs = times.reduce((a, b) => a + b, 0) / times.length;
  }
  return {
    assigned,
    played: Math.max(started, completed.length),
    completed: completed.length,
    minMs,
    maxMs,
    avgMs,
    minLabel: fmt(minMs),
    maxLabel: fmt(maxMs),
    avgLabel: fmt(avgMs),
  };
}

export function getJuegosFreqForPatient(store, patientId) {
  const { patient, id } = resolveJuegosPatient(store, patientId);
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
      const j =
        list.find((x) => x && x.id === "sudoku") ||
        list.find((x) => x && GAME_IDS.includes(x.id)) ||
        list.find((x) => x && x.id === LEGACY_JUEGOS_ID);
      if (j && j.freq) freqRaw = j.freq;
    }
  } catch {
    /* ignore */
  }
  return normalizeJuegosFreq(freqRaw || FREQS[0]);
}

export function juegosWindowStatusFor(store, patientId, now = Date.now()) {
  const freqInfo = getJuegosFreqForPatient(store, patientId);
  const hist = listGameHistoryFor(store, patientId);
  const period = currentPeriod(freqInfo.kind, now);
  const inWin = hist.filter((e) => {
    const t = e.startedAt || e.at;
    return t >= period.from && t < period.to;
  });
  // Cuenta como “ya usado” si hay cualquier sesión en la ventana (asignada o terminada).
  const needs = inWin.length === 0;
  const open = inWin.find(
    (e) => e.status === "started" || e.status === "assigned",
  );
  return {
    needs,
    inWindow: inWin,
    open,
    hist,
    freqInfo,
    nextHint: needs
      ? `Frecuencia: ${freqInfo.label}`
      : period.nextWhenBlocked,
    period,
  };
}

function pickRandomPuzzle(hist) {
  const all = listSudokuPuzzles();
  if (!all.length) return null;
  const used = new Set(
    (hist || [])
      .filter((e) => /completed/i.test(e.status))
      .map((e) => e.puzzleId),
  );
  const fresh = all.filter((p) => !used.has(p.id));
  const pool = fresh.length ? fresh : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

function persistGameEntry(store, patientId, entry, replaceStartedAt) {
  const { aliases, id, accountId, patient } = resolveJuegosPatient(
    store,
    patientId,
  );
  // Incluir siempre id de ficha + cuenta: son las claves que el sync del paciente
  // puede enviar a app-state (y las que el clínico resuelve).
  const writeKeys = Array.from(
    new Set(
      [...aliases, id, accountId, patientId].filter(Boolean).map(String),
    ),
  );

  store.set((s) => {
    s.patients = s.patients || {};
    s.gameLogs = s.gameLogs || {};
    writeKeys.forEach((key) => {
      const prev =
        s.patients[key] ||
        (patient && (patient.id === key || patient.accountId === key)
          ? { ...patient }
          : { id: key });
      let timeline = Array.isArray(prev.timeline) ? prev.timeline.slice() : [];
      if (replaceStartedAt) {
        let done = false;
        for (let i = timeline.length - 1; i >= 0; i--) {
          const row = timeline[i];
          if (
            row &&
            (row.type === "juego" || row.k === "juego") &&
            Number(row.startedAt || row.at) === Number(replaceStartedAt)
          ) {
            timeline[i] = { ...row, ...entry };
            done = true;
            break;
          }
        }
        if (!done) timeline.push({ ...entry });
      } else {
        timeline.push({ ...entry });
      }
      s.patients[key] = {
        ...prev,
        id: prev.id || id || key,
        accountId: prev.accountId || accountId || undefined,
        timeline,
      };
      const log = Array.isArray(s.gameLogs[key]) ? s.gameLogs[key].slice() : [];
      if (replaceStartedAt) {
        let done = false;
        for (let i = log.length - 1; i >= 0; i--) {
          if (Number(log[i]?.startedAt || log[i]?.at) === Number(replaceStartedAt)) {
            log[i] = { ...entry };
            done = true;
            break;
          }
        }
        if (!done) log.push({ ...entry });
      } else {
        log.push({ ...entry });
      }
      s.gameLogs[key] = log;
    });
  });

  const map = readGameLs();
  writeKeys.forEach((k) => {
    let arr = Array.isArray(map[k]) ? map[k].slice() : [];
    if (replaceStartedAt) {
      let done = false;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (Number(arr[i]?.startedAt || arr[i]?.at) === Number(replaceStartedAt)) {
          arr[i] = { ...entry };
          done = true;
          break;
        }
      }
      if (!done) arr.push({ ...entry });
    } else {
      arr.push({ ...entry });
    }
    map[k] = arr;
  });
  writeGameLs(map);

  void import("@/lib/store/persist")
    .then((m) => {
      if (typeof m.flushPersistWhenReady === "function") {
        return m.flushPersistWhenReady(store);
      }
      if (typeof m.flushPersist === "function") return m.flushPersist(store);
    })
    .catch(() => {});

  // Persistir timeline del paciente para que el clínico vea el historial.
  const canonId = id || patientId;
  const patAfter = store.get?.()?.patients?.[canonId];
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
      }),
    }).catch(() => {});
  }
}

/** Asigna (o reanuda) un sudoku en la ventana actual. */
export function assignOrResumeJuego(store, patientId) {
  const status = juegosWindowStatusFor(store, patientId);
  if (status.open && status.open.puzzleId) {
    const puzzle = listSudokuPuzzles().find(
      (p) => p.id === status.open.puzzleId,
    );
    if (puzzle) {
      return { entry: status.open, puzzle, resumed: true };
    }
  }
  const orphanOpen =
    !!status.open?.puzzleId &&
    !listSudokuPuzzles().some((p) => p.id === status.open.puzzleId);
  if (!status.needs && !orphanOpen) {
    return { blocked: true, nextHint: status.nextHint };
  }
  const puzzle = pickRandomPuzzle(status.hist);
  if (!puzzle) return { blocked: true, nextHint: "No hay sudokus disponibles." };
  const now = Date.now();
  const entry = {
    type: "juego",
    game: "sudoku",
    puzzleId: puzzle.id,
    status: "started",
    startedAt: now,
    completedAt: null,
    durationMs: 0,
    at: now,
  };
  persistGameEntry(
    store,
    patientId,
    entry,
    orphanOpen ? status.open.startedAt : null,
  );
  return { entry, puzzle, resumed: false };
}

export function completeJuego(store, patientId, puzzleId, startedAt) {
  const now = Date.now();
  const start = Number(startedAt) || now;
  const entry = {
    type: "juego",
    game: "sudoku",
    puzzleId: String(puzzleId),
    status: "completed",
    startedAt: start,
    completedAt: now,
    durationMs: Math.max(0, now - start),
    at: now,
  };
  persistGameEntry(store, patientId, entry, start);
  return entry;
}

export function parseBoard(str81) {
  const s = String(str81 || "").padEnd(81, "0").slice(0, 81);
  return s.split("").map((ch) => {
    const n = Number(ch);
    return Number.isFinite(n) && n >= 1 && n <= 9 ? n : 0;
  });
}

export function boardToString(cells) {
  return (cells || [])
    .map((n) => (n >= 1 && n <= 9 ? String(n) : "0"))
    .join("")
    .slice(0, 81);
}

/** Índice del bloque 3×3 (0..8) para la celda i. */
export function boxIndex(i) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

/** Celdas de la misma fila, columna o bloque (sin incluir i). */
export function peerIndexes(i) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const out = new Set();
  for (let k = 0; k < 9; k++) {
    out.add(r * 9 + k);
    out.add(k * 9 + c);
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++) {
    for (let cc = bc; cc < bc + 3; cc++) {
      out.add(rr * 9 + cc);
    }
  }
  out.delete(i);
  return Array.from(out);
}

/**
 * Regla clásica: el dígito no puede repetirse en fila, columna ni bloque 3×3.
 * @returns {boolean}
 */
export function isValidMove(cells, index, value) {
  if (!(value >= 1 && value <= 9)) return false;
  if (index < 0 || index > 80) return false;
  const peers = peerIndexes(index);
  for (let p = 0; p < peers.length; p++) {
    if (Number(cells[peers[p]]) === value) return false;
  }
  return true;
}

/** Celdas que rompen la regla (duplicado en fila/col/bloque). */
export function findConflictCells(cells) {
  const bad = new Set();
  const rows = Array.from({ length: 9 }, () => new Map());
  const cols = Array.from({ length: 9 }, () => new Map());
  const boxes = Array.from({ length: 9 }, () => new Map());
  for (let i = 0; i < 81; i++) {
    const v = Number(cells[i]);
    if (!(v >= 1 && v <= 9)) continue;
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = boxIndex(i);
    const mark = (map, key) => {
      if (map.has(key)) {
        bad.add(map.get(key));
        bad.add(i);
      } else {
        map.set(key, i);
      }
    };
    mark(rows[r], v);
    mark(cols[c], v);
    mark(boxes[b], v);
  }
  return bad;
}

/** Tablero lleno y sin conflictos (= sudoku válido). */
export function isBoardValidComplete(cells) {
  if (!cells || cells.length !== 81) return false;
  for (let i = 0; i < 81; i++) {
    if (!(Number(cells[i]) >= 1 && Number(cells[i]) <= 9)) return false;
  }
  return findConflictCells(cells).size === 0;
}

/** Completado: coincide con la solución única del puzzle. */
export function isBoardComplete(cells, solutionStr) {
  const sol = parseBoard(solutionStr);
  if (!cells || cells.length !== 81 || sol.length !== 81) return false;
  for (let i = 0; i < 81; i++) {
    if (Number(cells[i]) !== Number(sol[i])) return false;
  }
  return true;
}

/** Progreso local del tablero (para no perder la partida al recargar). */
const BOARD_LS = "nara.sudokuBoard.v1";

export function loadBoardProgress(patientId, puzzleId) {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(BOARD_LS);
    const o = raw ? JSON.parse(raw) : {};
    const row = o?.[String(patientId)]?.[String(puzzleId)];
    if (!row || !Array.isArray(row.cells) || row.cells.length !== 81) return null;
    return {
      cells: row.cells.map((n) => Number(n) || 0),
      startedAt: Number(row.startedAt) || 0,
    };
  } catch {
    return null;
  }
}

export function saveBoardProgress(patientId, puzzleId, cells, startedAt) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(BOARD_LS);
    const o = raw ? JSON.parse(raw) : {};
    const pid = String(patientId);
    o[pid] = o[pid] || {};
    o[pid][String(puzzleId)] = {
      cells: (cells || []).slice(0, 81),
      startedAt: Number(startedAt) || Date.now(),
      at: Date.now(),
    };
    localStorage.setItem(BOARD_LS, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

export function clearBoardProgress(patientId, puzzleId) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(BOARD_LS);
    const o = raw ? JSON.parse(raw) : {};
    const pid = String(patientId);
    if (o[pid]) {
      delete o[pid][String(puzzleId)];
      localStorage.setItem(BOARD_LS, JSON.stringify(o));
    }
  } catch {
    /* ignore */
  }
}

/**
 * Sube el historial local (LS + store) a app-state para que el clínico lo vea.
 * Útil tras partidas jugadas antes de habilitar el permiso de escritura del paciente.
 */
export function syncGameLogsToServer(store, patientId) {
  const { aliases, id, accountId } = resolveJuegosPatient(store, patientId);
  const keys = Array.from(
    new Set([...aliases, id, accountId, patientId].filter(Boolean).map(String)),
  );
  const hist = listGameHistoryFor(store, patientId);
  if (!hist.length || !keys.length) {
    void import("@/lib/store/persist")
      .then((m) => {
        if (typeof m.flushPersistWhenReady === "function") {
          return m.flushPersistWhenReady(store);
        }
      })
      .catch(() => {});
    return hist.length;
  }
  store.set((s) => {
    s.gameLogs = s.gameLogs || {};
    keys.forEach((key) => {
      const prev = Array.isArray(s.gameLogs[key]) ? s.gameLogs[key] : [];
      const byK = new Map();
      const put = (row) => {
        const e = normalizeEntry(row);
        if (!e || !e.puzzleId) return;
        const k = `${e.puzzleId}:${e.startedAt}:${e.status}`;
        const prevE = byK.get(k);
        if (!prevE || Number(e.at) >= Number(prevE.at)) byK.set(k, e);
      };
      prev.forEach(put);
      hist.forEach(put);
      s.gameLogs[key] = Array.from(byK.values()).sort(
        (a, b) => Number(b.at || 0) - Number(a.at || 0),
      );
    });
  });
  void import("@/lib/store/persist")
    .then((m) => {
      if (typeof m.flushPersistWhenReady === "function") {
        return m.flushPersistWhenReady(store);
      }
      if (typeof m.flushPersist === "function") return m.flushPersist(store);
    })
    .catch(() => {});
  return hist.length;
}

/** @deprecated El catálogo usa gamesCatalog; se mantiene por imports legacy. */
const juegosService = {
  id: LEGACY_JUEGOS_ID,
  name: "Juegos",
  navLabel: "Juegos",
  note: "Legacy · use frutas / simon / duelo / sudoku",
  freqs: FREQS.slice(),
};

export default juegosService;
