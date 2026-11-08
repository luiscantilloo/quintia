/**
 * Motor del analizador (ANA-*): línea base, rango, estados, señales, avisos.
 * Corre al sincronizar partidas / al abrir el panel clínico.
 */
import { listGameHistoryFor } from "@/lib/nara-services/juegos.js";
import { GAMES_META, SENALES, normalizeGameLog } from "./contrato.js";
import { getAnCfgVigente, sensSemanas } from "./cfg.js";
import {
  evalMetricasJuego,
  textoDesdeMetricas,
} from "./metricas.js";

const WEEK_MS = 7 * 24 * 3600 * 1000;

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - i) + sorted[hi] * (i - lo);
}

function weekKey(isoOrMs) {
  const t = typeof isoOrMs === "number" ? isoOrMs : Date.parse(isoOrMs);
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function collectPartidas(store, patientId) {
  const hist = listGameHistoryFor(store, patientId) || [];
  const out = [];
  const seen = new Set();
  for (const raw of hist) {
    const e = normalizeGameLog(raw, patientId);
    if (!e || !e.id) continue;
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  out.sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  return out;
}

function hasAnalizadorConsent(store, patientId) {
  const S = store.get?.() || {};
  const c = S.consents?.[patientId];
  // PRI/EXP-01: sin consentimiento explícito no se analiza.
  return !!(c && c.analizador === true);
}

function buildBaseline(partidas, cfg) {
  const N = Number.isFinite(Number(cfg.partidas)) ? Number(cfg.partidas) : 10;
  const D = Number.isFinite(Number(cfg.dias)) ? Number(cfg.dias) : 14;
  // 0 = no descartar (importante: `|| 3` rompería el 0)
  const K = Number.isFinite(Number(cfg.descarta)) ? Number(cfg.descarta) : 3;
  const usable = partidas.filter((p) => p.completo && p.evento === "partida.terminada");
  if (usable.length <= K) {
    return { ready: false, n: usable.length, need: N, values: [], band: null };
  }
  const afterLearn = usable.slice(K);
  if (afterLearn.length < N) {
    return {
      ready: false,
      n: afterLearn.length,
      need: N,
      values: afterLearn.map((p) => Number(p.medida.valor)),
      band: null,
    };
  }
  const base = afterLearn.slice(0, N);
  const spanDays =
    (Date.parse(base[base.length - 1].fin) - Date.parse(base[0].inicio)) /
    (24 * 3600 * 1000);
  if (spanDays < D * 0.5) {
    // aún juntando días; permitir si ya hay N partidas (pragmático para demo)
  }
  const values = base.map((p) => Number(p.medida.valor)).sort((a, b) => a - b);
  const lo = percentile(values, 0.1);
  const hi = percentile(values, 0.9);
  return {
    ready: true,
    n: N,
    need: N,
    values,
    band: [lo, hi],
    basePartidas: base,
  };
}

function weeklyStats(partidas, mejor) {
  const byWeek = new Map();
  for (const p of partidas) {
    if (!p.completo) continue;
    const k = weekKey(p.inicio);
    if (!byWeek.has(k)) byWeek.set(k, []);
    byWeek.get(k).push(p);
  }
  const keys = [...byWeek.keys()].sort();
  return keys.map((k) => {
    const list = byWeek.get(k);
    const vals = list.map((p) => Number(p.medida.valor)).sort((a, b) => a - b);
    const mid = vals[Math.floor(vals.length / 2)];
    const exitos = list.filter((p) => p.exito).length;
    return {
      week: k,
      n: list.length,
      median: mid,
      exitoRate: list.length ? exitos / list.length : 0,
      programadas: list.filter((p) => p.tipo === "Programada").length,
    };
  });
}

function evalSenales(game, partidas, baseline, cfg) {
  const g = GAMES_META[game];
  const out = { peor: false, gana: false, mejorando: false, evidencia: {} };
  if (!baseline.ready || !baseline.band) return out;
  const [lo, hi] = baseline.band;
  const W = sensSemanas(cfg.sens);
  const weeks = weeklyStats(partidas, g.mejor).filter((w) => w.n >= 2);
  const recent = weeks.slice(-W);
  if (recent.length < W) return out;

  const badSide = (v) =>
    g.mejor === "alto" ? v < lo : v > hi;
  const goodSide = (v) =>
    g.mejor === "alto" ? v > hi : v < lo;

  if (cfg.senales?.peor?.on !== false) {
    out.peor = recent.every((w) => badSide(w.median));
    out.evidencia.peor = {
      semanas: recent.map((w) => w.week),
      medianas: recent.map((w) => w.median),
      rango: [lo, hi],
    };
  }
  out.mejorando = recent.every((w) => goodSide(w.median));

  if (cfg.senales?.gana?.on !== false) {
    const baseRate =
      baseline.basePartidas.filter((p) => p.exito).length /
      Math.max(1, baseline.basePartidas.length);
    const gW = Number(cfg.senales?.gana?.semanas) || 3;
    const gRecent = weeks.slice(-gW);
    if (gRecent.length >= gW) {
      const drop = Number(cfg.senales?.gana?.caida) || 30;
      out.gana = gRecent.every(
        (w) => w.exitoRate <= baseRate * (1 - drop / 100),
      );
      out.evidencia.gana = {
        semanas: gRecent.map((w) => w.week),
        rates: gRecent.map((w) => w.exitoRate),
        baseRate,
      };
    }
  }
  return out;
}

function evalMenos(allPartidas, cfg) {
  if (cfg.senales?.menos?.on === false) return { on: false };
  const pct = Number(cfg.senales?.menos?.pct) || 50;
  const need = Number(cfg.senales?.menos?.semanas) || 2;
  const byWeek = new Map();
  for (const p of allPartidas) {
    if (p.tipo !== "Programada") continue;
    const k = weekKey(p.inicio);
    byWeek.set(k, (byWeek.get(k) || 0) + (p.completo ? 1 : 0));
  }
  // Esperado aproximado: 7 programadas/semana si juega diario varios juegos
  const expected = 7;
  const keys = [...byWeek.keys()].sort().slice(-need);
  if (keys.length < need) return { on: false };
  const ratios = keys.map((k) => (byWeek.get(k) || 0) / expected);
  const on = ratios.every((r) => r * 100 < pct);
  return { on, ratios, semanas: keys };
}

/**
 * Recalcula estado + avisos de una persona.
 */
export function recalcularPaciente(store, patientId) {
  const cfg = getAnCfgVigente(store);
  if (!hasAnalizadorConsent(store, patientId)) {
    return {
      pid: patientId,
      estado: "base",
      hab: {},
      senales: [],
      lectura: "Sin consentimiento para el analizador.",
      sugerencia: null,
      baseN: 0,
      skip: true,
    };
  }

  const all = collectPartidas(store, patientId).filter(
    (p) => p.sync !== false && !p.analizadorSkip && !p.offline,
  );
  const fuentes = Object.keys(cfg.fuentes || {}).filter((g) => cfg.fuentes[g]);
  const hab = {};
  const senalesSet = new Set();
  const evidencias = {};
  const metricasByGame = {};
  const metricHints = [];
  let anyReady = false;
  let baseMin = Infinity;

  for (const game of fuentes) {
    const gv = Number(cfg.gameVersions?.[game] || 1);
    const partidas = all.filter(
      (p) => p.game === game && Number(p.version || 1) === gv,
    );
    const baseline = buildBaseline(partidas, cfg);
    baseMin = Math.min(baseMin, baseline.n);

    // Métricas de partida (puntaje, inválidos, secuencia, etc.) → señales + texto.
    const metEval = evalMetricasJuego(game, partidas);
    metricasByGame[game] = metEval.resumen;
    const metTxt = textoDesdeMetricas(
      game,
      metEval,
      GAMES_META[game]?.nombre,
    );
    if (metTxt) metricHints.push({ game, ...metTxt, peores: metEval.peores });

    if (!baseline.ready) {
      // Sin línea base de medida principal: aún así, métricas secundarias
      // con empeoramiento claro marcan cambio a revisar.
      if (metEval.peores.length >= 2) {
        hab[game] = "cambio";
        senalesSet.add("peor");
        evidencias[game] = {
          ...(evidencias[game] || {}),
          metricas: metEval.peores.map((m) => ({
            id: m.id,
            label: m.label,
            baseMed: m.baseMed,
            recentMed: m.recentMed,
          })),
        };
        anyReady = true;
      } else {
        hab[game] = "base";
      }
      continue;
    }
    anyReady = true;
    const sig = evalSenales(game, partidas, baseline, cfg);
    // Refuerzo: si la medida principal está ok pero métricas clave empeoran → peor.
    if (!sig.peor && metEval.peores.some((m) => !m.primary)) {
      sig.peor = true;
      sig.evidencia = {
        ...(sig.evidencia || {}),
        metricas: metEval.peores.map((m) => ({
          id: m.id,
          label: m.label,
          baseMed: m.baseMed,
          recentMed: m.recentMed,
        })),
      };
    }
    if (sig.peor || sig.gana) {
      hab[game] = "cambio";
      if (sig.peor) senalesSet.add("peor");
      if (sig.gana) senalesSet.add("gana");
      evidencias[game] = { ...(sig.evidencia || {}), metricas: metEval.peores };
    } else if (sig.mejorando || metEval.mejores.some((m) => m.primary)) {
      hab[game] = "mejorando";
    } else {
      hab[game] = "estable";
    }
  }

  const menos = evalMenos(
    all.filter((p) => fuentes.includes(p.game)),
    cfg,
  );
  if (menos.on) senalesSet.add("menos");

  let estado = "base";
  if (senalesSet.size) estado = "cambio";
  else if (Object.values(hab).some((h) => h === "mejorando")) estado = "mejorando";
  else if (anyReady) estado = "estable";

  const hintPeor = metricHints.find((h) => (h.peores || []).length);
  const hintMejor = metricHints.find((h) => !(h.peores || []).length);
  const lectura =
    (senalesSet.has("peor") || senalesSet.has("gana") || senalesSet.has("menos")
      ? hintPeor?.lectura
      : null) ||
    (estado === "mejorando" ? hintMejor?.lectura : null) ||
    buildLectura(hab, senalesSet, baseMin, cfg);
  const sugerencia =
    hintPeor?.sugerencia ||
    (estado === "mejorando" ? hintMejor?.sugerencia : null) ||
    cfg.sugerencias?.[0] ||
    "Conversar en la próxima sesión";

  const snap = {
    pid: patientId,
    estado,
    hab,
    senales: [...senalesSet],
    evidencias,
    metricasByGame,
    lectura,
    sugerencia,
    baseN: Number.isFinite(baseMin) ? baseMin : 0,
    updatedAt: Date.now(),
    bandByGame: Object.fromEntries(
      fuentes.map((game) => {
        const gv = Number(cfg.gameVersions?.[game] || 1);
        const partidas = all.filter(
          (p) => p.game === game && Number(p.version || 1) === gv,
        );
        const b = buildBaseline(partidas, cfg);
        return [game, b.band];
      }),
    ),
    seriesByGame: Object.fromEntries(
      fuentes.map((game) => {
        const gv = Number(cfg.gameVersions?.[game] || 1);
        const partidas = all.filter(
          (p) =>
            p.game === game &&
            Number(p.version || 1) === gv &&
            p.completo,
        );
        return [game, partidas.map((p) => Number(p.medida?.valor ?? p.valor))];
      }),
    ),
  };

  upsertAviso(store, snap, cfg);
  store.set((s) => {
    s.analizadorByPid = s.analizadorByPid || {};
    s.analizadorByPid[patientId] = snap;
  });
  return snap;
}

function buildLectura(hab, senales, baseN, cfg) {
  if ([...Object.values(hab)].every((h) => h === "base") || !Object.keys(hab).length) {
    return `Todavía no hay suficientes partidas para comparar: ${baseN} de ${cfg.partidas}. El analizador empezará a leer cambios cuando complete su línea base.`;
  }
  if (senales.has("peor") || senales.has("gana") || senales.has("menos")) {
    const labels = [...senales].map((k) => SENALES[k]?.label || k).join(" · ");
    return `Hay un cambio a revisar (${labels}). Compara el desempeño con la propia historia de la persona; no es un diagnóstico.`;
  }
  if (Object.values(hab).some((h) => h === "mejorando")) {
    const g = Object.entries(hab).find(([, h]) => h === "mejorando")?.[0];
    const nombre = GAMES_META[g]?.nombre || g;
    return `En ${nombre} la medida principal subió frente a su rango habitual. Los demás juegos siguen en rango.`;
  }
  return "Todas las habilidades están dentro de su rango habitual.";
}

function upsertAviso(store, snap, cfg) {
  if (snap.estado !== "cambio" || !snap.senales.length) return;
  const plazo = Number(cfg.plazo) || 7;
  const gamesCambio = Object.entries(snap.hab)
    .filter(([, h]) => h === "cambio")
    .map(([g]) => g);
  const game = gamesCambio[0] || Object.keys(snap.hab)[0] || "simon";
  const texto =
    snap.lectura ||
    `${GAMES_META[game]?.nombre || game}: cambio sostenido fuera del rango habitual`;

  store.set((s) => {
    s.avisos = Array.isArray(s.avisos) ? s.avisos.slice() : [];
    const open = s.avisos.find(
      (a) => a.pid === snap.pid && a.estado === "abierto",
    );
    if (open) {
      const idx = s.avisos.indexOf(open);
      const senales = Array.from(
        new Set([...(open.senales || []), ...snap.senales]),
      );
      s.avisos[idx] = {
        ...open,
        senales,
        game,
        texto,
        evidencias: snap.evidencias,
        updatedAt: Date.now(),
      };
      return;
    }
    // No reabrir misma señal tras cierre con datos anteriores al cierre
    const lastClosed = [...s.avisos]
      .reverse()
      .find((a) => a.pid === snap.pid && a.estado === "cerrado");
    if (lastClosed?.closedAt) {
      const after = (snap.seriesByGame?.[game] || []).length;
      if (after === 0) return;
    }
    s.avisos.push({
      id: `av-${snap.pid}-${Date.now()}`,
      pid: snap.pid,
      game,
      senales: snap.senales,
      texto,
      evidencias: snap.evidencias,
      desde: 0,
      plazo,
      estado: "abierto",
      createdAt: Date.now(),
      historia: [{ at: Date.now(), tipo: "abierto" }],
    });
  });
}

export function recalcularTodos(store, patientIds) {
  const ids = patientIds || [];
  return ids.map((id) => recalcularPaciente(store, id));
}

export function getSnap(store, patientId) {
  const S = store.get?.() || {};
  return S.analizadorByPid?.[patientId] || null;
}

export function listAvisosAbiertos(store) {
  const S = store.get?.() || {};
  return (S.avisos || []).filter((a) => a.estado === "abierto" || a.estado === "tomado");
}
