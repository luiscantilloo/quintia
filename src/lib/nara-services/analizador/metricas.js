/**
 * Métricas por juego que alimentan el analizador (mismas que la ficha clínica).
 * Cada partida aporta valores vía medida.valor + metr.*.
 */

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function avg(arr) {
  const xs = (Array.isArray(arr) ? arr : [])
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** @typedef {{ id: string, label: string, mejor: 'alto'|'bajo', primary?: boolean, extract: (p: object) => number|null }} MetricDef */

/** @type {Record<string, MetricDef[]>} */
export const GAME_METRIC_DEFS = {
  frutas: [
    {
      id: "tiempo_mov",
      label: "Tiempo hasta cada movimiento",
      mejor: "bajo",
      extract: (p) => avg(p?.metr?.tiempos),
    },
    {
      id: "invalidos",
      label: "Movimientos inválidos",
      mejor: "bajo",
      extract: (p) => num(p?.metr?.invalidos),
    },
    {
      id: "puntaje",
      label: "Puntaje",
      mejor: "alto",
      primary: true,
      extract: (p) => num(p?.medida?.valor ?? p?.valor ?? p?.score),
    },
    {
      id: "nivel",
      label: "Nivel",
      mejor: "alto",
      extract: (p) => num(p?.nivel ?? p?.metr?.nivel ?? p?.version),
    },
  ],
  simon: [
    {
      id: "secuencia",
      label: "Secuencia más larga",
      mejor: "alto",
      primary: true,
      extract: (p) =>
        num(p?.metr?.secuencia ?? p?.medida?.valor ?? p?.valor ?? p?.score),
    },
    {
      id: "error_at",
      label: "Posición del error",
      mejor: "alto", // fallar más tarde = mejor
      extract: (p) => {
        const v = p?.metr?.errorAt;
        return v == null ? null : num(v);
      },
    },
    {
      id: "rondas",
      label: "Rondas",
      mejor: "alto",
      extract: (p) =>
        num(p?.metr?.secuencia ?? p?.medida?.valor ?? p?.valor ?? p?.score),
    },
    {
      id: "nivel",
      label: "Nivel",
      mejor: "alto",
      extract: (p) => num(p?.nivel ?? p?.version),
    },
  ],
  duelo: [
    {
      id: "tiempo_jugada",
      label: "Tiempo por jugada",
      mejor: "bajo",
      extract: (p) => {
        const ms = num(p?.durationMs);
        return ms != null && ms > 0 ? ms : num(p?.dur) != null ? num(p.dur) * 1000 : null;
      },
    },
    {
      id: "fuera",
      label: "Jugadas fuera de la regla",
      mejor: "bajo",
      extract: (p) => num(p?.metr?.fuera),
    },
    {
      id: "resultado",
      label: "Resultado",
      mejor: "alto",
      primary: true,
      extract: (p) => {
        if (p?.gano === true) return 1;
        if (p?.gano === false) return 0;
        return num(p?.medida?.valor ?? p?.valor);
      },
    },
  ],
  sudoku: [
    {
      id: "tiempo",
      label: "Tiempo total",
      mejor: "bajo",
      primary: true,
      extract: (p) => {
        const ms = num(p?.durationMs);
        if (ms != null && ms > 0) return ms / 60000;
        return num(p?.medida?.valor ?? p?.valor);
      },
    },
    {
      id: "borradas",
      label: "Casillas borradas",
      mejor: "bajo",
      extract: (p) => num(p?.metr?.borradas),
    },
    {
      id: "errores",
      label: "Errores",
      mejor: "bajo",
      extract: (p) => num(p?.metr?.errores),
    },
    {
      id: "terminado",
      label: "Terminado o no",
      mejor: "alto",
      extract: (p) => {
        if (p?.completo === true || /completed/i.test(String(p?.status || "")))
          return 1;
        if (p?.completo === false) return 0;
        return null;
      },
    },
  ],
};

export function defsForGame(game) {
  return GAME_METRIC_DEFS[String(game || "")] || [];
}

/** Serie de una métrica desde la 1.ª partida (gane, pierda o la deje). */
export function seriesForMetric(partidas, def) {
  const out = [];
  for (const p of partidas || []) {
    if (!p) continue;
    const v = def.extract(p);
    if (v == null || !Number.isFinite(v)) continue;
    out.push({
      v,
      at: Date.parse(p.inicio || p.fin) || Number(p.startedAt) || 0,
      id: p.id,
    });
  }
  return out;
}

/**
 * Compara mitad reciente vs mitad base de la serie.
 * @returns {{ peor: boolean, mejor: boolean, baseMed: number|null, recentMed: number|null, n: number }}
 */
export function compareMetricSeries(series, mejor) {
  const empty = {
    peor: false,
    mejor: false,
    baseMed: null,
    recentMed: null,
    n: 0,
  };
  if (!series || series.length < 4) return empty;
  const vals = series.map((x) => x.v);
  const mid = Math.floor(vals.length / 2);
  const base = vals.slice(0, Math.max(2, mid));
  const recent = vals.slice(-Math.max(2, vals.length - mid));
  const med = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  };
  const baseMed = med(base);
  const recentMed = med(recent);
  const peor =
    mejor === "alto" ? recentMed < baseMed * 0.85 : recentMed > baseMed * 1.15;
  const ok =
    mejor === "alto" ? recentMed > baseMed * 1.1 : recentMed < baseMed * 0.9;
  return { peor, mejor: ok, baseMed, recentMed, n: vals.length };
}

/**
 * Evalúa métricas secundarias (+ primaria) de un juego.
 * @returns {{ peores: object[], mejores: object[], resumen: object[] }}
 */
export function evalMetricasJuego(game, partidas) {
  const defs = defsForGame(game);
  const peores = [];
  const mejores = [];
  const resumen = [];
  for (const def of defs) {
    const series = seriesForMetric(partidas, def);
    const cmp = compareMetricSeries(series, def.mejor);
    const last = series.length ? series[series.length - 1].v : null;
    resumen.push({
      id: def.id,
      label: def.label,
      mejor: def.mejor,
      primary: !!def.primary,
      last,
      ...cmp,
    });
    if (cmp.peor) peores.push({ ...def, ...cmp });
    if (cmp.mejor) mejores.push({ ...def, ...cmp });
  }
  return { peores, mejores, resumen };
}

/** Texto corto para lectura / sugerencia clínica. */
export function textoDesdeMetricas(game, evalM, gameName) {
  const nombre = gameName || game;
  if (evalM.peores.length) {
    const labels = evalM.peores.map((m) => m.label).join(", ");
    return {
      lectura: `En ${nombre} empeoraron: ${labels}. Conviene revisarlo en sesión (no es un diagnóstico).`,
      sugerencia: `Conversar sobre ${nombre}: ${evalM.peores[0].label.toLowerCase()} salió de su rango habitual.`,
    };
  }
  if (evalM.mejores.length && !evalM.peores.length) {
    const m = evalM.mejores.find((x) => x.primary) || evalM.mejores[0];
    return {
      lectura: `En ${nombre} mejoró «${m.label}» frente a su historia reciente.`,
      sugerencia: `Reforzar el avance en ${nombre} y mantener la práctica.`,
    };
  }
  return null;
}
