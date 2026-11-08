/**
 * Semilla de partidas para probar el motor (línea base + señal «peor»).
 * Uso en consola del navegador (sesión clínica o paciente):
 *   const { seedAnalizadorDemo } = await import("/…") // o desde window
 *
 * Desde el código: seedAnalizadorDemo(store, patientId, { game: "sudoku" })
 */
import { buildEventoPartida } from "./contrato.js";
import { recalcularPaciente } from "./motor.js";
import { DEFAULT_AN_CFG } from "./cfg.js";

/**
 * @param {*} store AlientoStore
 * @param {string} patientId
 * @param {{ game?: string, peor?: boolean }} [opts]
 */
export function seedAnalizadorDemo(store, patientId, opts = {}) {
  const game = opts.game || "sudoku";
  const peor = opts.peor !== false;
  const cfg = { ...DEFAULT_AN_CFG, ...(store.get?.()?.anCfg || {}) };
  const N = Number(cfg.partidas) || 10;
  const K = Number(cfg.descarta) || 3;
  const W = cfg.sens === "Alta" ? 2 : cfg.sens === "Baja" ? 4 : 3;

  // Consentimiento explícito (PRI)
  store.set((s) => {
    s.consents = s.consents || {};
    s.consents[patientId] = {
      ...(s.consents[patientId] || {}),
      analizador: true,
    };
    if (!s.anCfg) s.anCfg = { ...cfg };
  });

  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const entries = [];

  // K de aprendizaje (descartadas) + N de línea base con valores «habituales»
  const habitual = game === "sudoku" ? 12 : 600; // min o pts
  const totalBase = K + N;
  for (let i = 0; i < totalBase; i++) {
    const t = now - (totalBase + W + 2 - i) * day;
    const jitter = ((i % 5) - 2) * (game === "sudoku" ? 0.4 : 20);
    entries.push(
      buildEventoPartida({
        id: `SEED-${game}-base-${i}`,
        pid: patientId,
        game,
        version: 1,
        inicio: t,
        fin: t + 15 * 60_000,
        valor: Math.round(habitual + jitter),
        completo: true,
        gano: true,
        tipo: "Programada",
      }),
    );
  }

  // Semanas recientes fuera de rango (peor): sudoku = más lento (mejor=bajo)
  if (peor) {
    const bad = game === "sudoku" ? 22 : 200;
    for (let w = 0; w < W; w++) {
      for (let j = 0; j < 3; j++) {
        const t = now - (W - w) * 7 * day + j * day;
        entries.push(
          buildEventoPartida({
            id: `SEED-${game}-peor-${w}-${j}`,
            pid: patientId,
            game,
            version: 1,
            inicio: t,
            fin: t + 20 * 60_000,
            valor: bad + j,
            completo: true,
            gano: false,
            tipo: "Programada",
          }),
        );
      }
    }
  }

  store.set((s) => {
    s.gameLogs = s.gameLogs || {};
    const prev = Array.isArray(s.gameLogs[patientId])
      ? s.gameLogs[patientId].slice()
      : [];
    const seen = new Set(prev.map((x) => x?.id).filter(Boolean));
    for (const e of entries) {
      if (seen.has(e.id)) continue;
      prev.push(e);
      seen.add(e.id);
    }
    s.gameLogs[patientId] = prev;
  });

  const snap = recalcularPaciente(store, patientId);
  return { n: entries.length, snap };
}
