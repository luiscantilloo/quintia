/**
 * Contrato de evento de partida (REQUISITOS EVT-*).
 * El juego no calcula nada clínico: solo emite este sobre.
 */

export const GAMES_META = {
  frutas: {
    id: "frutas",
    nombre: "Frutas",
    hab: "Atención visual y planificación",
    medida: "Puntaje por partida",
    unidad: "pts",
    cod: "FRU",
    mejor: "alto",
    exitoFn: (e) => Number(e?.medida?.valor ?? e?.valor) >= 500,
  },
  simon: {
    id: "simon",
    nombre: "Simón dice",
    hab: "Memoria de trabajo y atención",
    medida: "Secuencia más larga",
    unidad: "pasos",
    cod: "SIM",
    mejor: "alto",
    exitoFn: (e) => Number(e?.medida?.valor ?? e?.valor) >= 5,
  },
  duelo: {
    id: "duelo",
    nombre: "Duelo de cartas",
    hab: "Flexibilidad y decisiones",
    medida: "Jugadas dentro de la regla",
    unidad: "%",
    cod: "DUE",
    mejor: "alto",
    exitoFn: (e) => !!e?.gano,
  },
  sudoku: {
    id: "sudoku",
    nombre: "Sudoku",
    hab: "Lógica y planificación",
    medida: "Tiempo total",
    unidad: "min",
    cod: "SDK",
    mejor: "bajo",
    exitoFn: (e) => !!e?.completo,
  },
};

export const SENALES = {
  menos: { id: "menos", label: "Juega menos" },
  peor: { id: "peor", label: "Juega peor" },
  gana: { id: "gana", label: "Gana menos" },
};

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Construye el sobre común (esquema 1).
 * @param {object} p
 */
export function buildEventoPartida(p) {
  const g = GAMES_META[p.game];
  if (!g) throw new Error(`Juego desconocido: ${p.game}`);
  const inicioMs = Number(p.inicio) || Date.now();
  const finMs = Number(p.fin) || Date.now();
  const valor = Number(p.valor);
  const completo = p.completo !== false && p.evento !== "partida.abandonada";
  const e = {
    evento:
      p.evento ||
      (completo ? "partida.terminada" : "partida.abandonada"),
    esquema: 1,
    id: String(p.id || p.codigo || uid(g.cod)),
    pid: String(p.pid),
    game: p.game,
    version: Number(p.version) || 1,
    inicio: new Date(inicioMs).toISOString(),
    fin: new Date(finMs).toISOString(),
    dur: Number.isFinite(Number(p.dur))
      ? Number(p.dur)
      : Math.max(0, Math.round((finMs - inicioMs) / 1000)),
    tipo: p.tipo === "Libre" ? "Libre" : "Programada",
    medida: {
      nombre: g.medida,
      valor,
      unidad: g.unidad,
      mejor: g.mejor,
    },
    valor,
    completo: !!completo,
    gano: p.gano === undefined || p.gano === null ? null : !!p.gano,
    metr: p.metr && typeof p.metr === "object" ? p.metr : {},
    offline: !!p.offline,
    sync: !p.offline,
    // Compat con gameLogs legacy
    type: "juego",
    status: completo ? "completed" : "abandoned",
    startedAt: inicioMs,
    completedAt: finMs,
    durationMs: Math.max(0, finMs - inicioMs),
    at: finMs,
    puzzleId: p.puzzleId || undefined,
    score: Number.isFinite(valor) ? valor : undefined,
  };
  e.exito = completo ? !!g.exitoFn(e) : false;
  return e;
}

/** Normaliza un gameLog viejo al contrato. */
export function normalizeGameLog(raw, pid) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.evento && raw.esquema && raw.medida) {
    return { ...raw, pid: String(raw.pid || pid) };
  }
  const game = String(raw.game || "sudoku");
  const g = GAMES_META[game];
  if (!g) return null;
  const start = Number(raw.startedAt || raw.at) || Date.now();
  const end = Number(raw.completedAt || raw.at) || start;
  const completo =
    /completed/i.test(String(raw.status || "")) ||
    raw.completo === true ||
    raw.evento === "partida.terminada";
  const medidaRaw = raw.medida;
  let valor = Number(
    medidaRaw && typeof medidaRaw === "object"
      ? medidaRaw.valor
      : (medidaRaw ?? raw.score ?? raw.valor),
  );
  if (game === "sudoku" && !Number.isFinite(valor)) {
    valor = Math.max(1, Math.round((end - start) / 60000));
  }
  if (game === "duelo" && !Number.isFinite(valor)) {
    valor = Number(raw.score) || 0;
  }
  if (!Number.isFinite(valor)) valor = 0;
  try {
    return buildEventoPartida({
      id: raw.id || raw.eventId || `${g.cod}-${start}`,
      pid,
      game,
      version: raw.version || 1,
      inicio: start,
      fin: end,
      dur: raw.dur,
      tipo: raw.tipo || "Programada",
      valor,
      completo,
      gano: raw.gano,
      metr: raw.metr,
      offline: raw.offline,
      puzzleId: raw.puzzleId,
      evento: completo ? "partida.terminada" : "partida.abandonada",
    });
  } catch {
    return null;
  }
}
