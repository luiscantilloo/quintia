import { listGameHistoryFor } from "@/lib/nara-services/juegos.js";
import { GAME_SERVICES } from "@/lib/nara-services/gamesCatalog.js";
import {
  ANALIZADOR_RANK,
  ESTADOS_AN,
  type AnalizadorEstadoId,
} from "./estados";

export type AnalizadorAviso = {
  id: string;
  pid: string;
  nombre: string;
  juego: string;
  hab: string;
  texto: string;
  desde: string;
  plazo: string;
  estadoAviso: string;
  senales: string[];
};

export type AnalizadorCargaRow = {
  pid: string;
  nombre: string;
  perfil: string;
  semanas: number | string;
  estado: AnalizadorEstadoId;
  label: string;
  icon: string;
  bg: string;
  fg: string;
  resumen: string;
  adh: string;
  lectura: string;
  sugerencia: string | null;
  seriesByGame: Record<string, number[]>;
  bandByGame: Record<string, [number, number] | null>;
  habByGame: Record<string, AnalizadorEstadoId>;
  senales: string[];
  baseN: number;
  baseNeed: number;
};

export type AnalizadorTotal = {
  key: string;
  label: string;
  n: number;
  icon: string;
  fg: string;
};

type PatientLite = {
  id: string;
  name?: string;
  profile?: string;
  weeks?: number;
  week?: number;
  adherence?: number | null;
};

type Snap = {
  estado?: string;
  lectura?: string;
  sugerencia?: string | null;
  baseN?: number;
  seriesByGame?: Record<string, number[]>;
  bandByGame?: Record<string, [number, number] | null>;
  hab?: Record<string, string>;
  senales?: string[];
};

function gameMeta(id: string) {
  const g = GAME_SERVICES.find((x) => x.id === id);
  return {
    nombre: g?.name || id,
    hab: (g?.note || "").split("·")[0]?.trim() || "Habilidad",
  };
}

function semanasLabel(p: PatientLite): number | string {
  const w = p.weeks ?? p.week;
  return Number.isFinite(Number(w)) ? Number(w) : "—";
}

function asEstado(raw: unknown): AnalizadorEstadoId {
  const s = String(raw || "base");
  if (s === "estable" || s === "mejorando" || s === "cambio" || s === "base") {
    return s;
  }
  return "base";
}

/**
 * Totales, avisos y carga del Analizador clínico (lee snaps del motor + avisos).
 */
export function buildAnalizadorPanel(opts: {
  store: {
    get?: () => Record<string, unknown>;
    pathList?: Function;
    parseCode?: Function;
    ctxFor?: Function;
  };
  patients: PatientLite[];
  avisosVistos?: Set<string> | string[];
}): {
  totales: AnalizadorTotal[];
  avisos: AnalizadorAviso[];
  sinAvisos: boolean;
  carga: AnalizadorCargaRow[];
  anCardTxt: string;
  avisosAbiertosN: number;
} {
  const { store, patients } = opts;
  const vistos = new Set(
    opts.avisosVistos
      ? Array.isArray(opts.avisosVistos)
        ? opts.avisosVistos
        : [...opts.avisosVistos]
      : [],
  );
  const S = (typeof store.get === "function" ? store.get() : {}) || {};
  const byId = new Map(patients.map((p) => [p.id, p]));
  const snaps =
    (S.analizadorByPid as Record<string, Snap> | undefined) || {};

  const counts: Record<AnalizadorEstadoId, number> & { bajaConst: number } = {
    base: 0,
    estable: 0,
    mejorando: 0,
    cambio: 0,
    bajaConst: 0,
  };

  const carga: AnalizadorCargaRow[] = [];
  const cfgPartidas =
    Number((S.anCfg as { partidas?: number } | undefined)?.partidas) || 10;

  for (const p of patients) {
    const hist = listGameHistoryFor(store, p.id);
    const snap = snaps[p.id];
    const baseN = Number(snap?.baseN) || 0;
    // Solo con actividad real (partidas o línea base empezada).
    // Tener juegos en la ruta no basta: evita filas "0 de N · sin partidas".
    if (!(hist.length > 0 || baseN > 0)) continue;

    const estado = asEstado(snap?.estado);
    counts[estado]++;
    const adhN = p.adherence;
    if (
      estado !== "base" &&
      typeof adhN === "number" &&
      Number.isFinite(adhN) &&
      adhN < 50
    ) {
      counts.bajaConst++;
    }
    const e = ESTADOS_AN[estado];
    const label =
      estado === "base"
        ? `Línea base · ${baseN} de ${cfgPartidas}`
        : e.label;
    const lectura =
      snap?.lectura ||
      (hist.length
        ? "Aún sin lectura del motor — abra el panel para recalcular."
        : "Aún sin partidas registradas");
    const habByGame: Record<string, AnalizadorEstadoId> = {};
    for (const [g, h] of Object.entries(snap?.hab || {})) {
      habByGame[g] = asEstado(h);
    }
    carga.push({
      pid: p.id,
      nombre: p.name || p.id,
      perfil: p.profile || "Sin perfil",
      semanas: semanasLabel(p),
      estado,
      label,
      icon: e.icon,
      bg: e.bg,
      fg: e.fg,
      resumen: lectura,
      adh:
        adhN == null || !Number.isFinite(Number(adhN))
          ? "—"
          : `${adhN} %`,
      lectura,
      sugerencia: snap?.sugerencia || null,
      seriesByGame: snap?.seriesByGame || {},
      bandByGame: (snap?.bandByGame || {}) as Record<
        string,
        [number, number] | null
      >,
      habByGame,
      senales: Array.isArray(snap?.senales) ? snap!.senales!.map(String) : [],
      baseN,
      baseNeed: cfgPartidas,
    });
  }

  carga.sort(
    (a, b) =>
      ANALIZADOR_RANK[a.estado] - ANALIZADOR_RANK[b.estado] ||
      String(a.nombre).localeCompare(String(b.nombre), "es"),
  );

  const rawAvisos = Array.isArray(S.avisos)
    ? (S.avisos as Record<string, unknown>[])
    : [];
  const avisos: AnalizadorAviso[] = rawAvisos
    .filter(
      (a) =>
        a &&
        (a.estado === "abierto" || a.estado === "tomado") &&
        !vistos.has(String(a.id)),
    )
    .map((a) => {
      const pid = String(a.pid || "");
      const p = byId.get(pid);
      const gameId = String(a.game || "");
      const meta = gameMeta(gameId);
      const desdeN = Number(a.desde);
      const plazoN = Number(a.plazo);
      const created = Number(a.createdAt) || 0;
      const daysOpen = created
        ? Math.max(0, Math.floor((Date.now() - created) / 86400000))
        : Number.isFinite(desdeN)
          ? desdeN
          : 0;
      const rest = Number.isFinite(plazoN)
        ? Math.max(0, plazoN - daysOpen)
        : null;
      return {
        id: String(a.id || `${pid}-${gameId}`),
        pid,
        nombre: p?.name || pid || "Persona",
        juego: meta.nombre,
        hab: meta.hab,
        texto: String(a.texto || ""),
        desde:
          daysOpen === 0
            ? "hoy"
            : `hace ${daysOpen} día${daysOpen === 1 ? "" : "s"}`,
        plazo:
          rest == null
            ? "plazo por definir"
            : `${rest} día${rest === 1 ? "" : "s"} restantes`,
        estadoAviso: String(a.estado || "abierto"),
        senales: Array.isArray(a.senales) ? a.senales.map(String) : [],
      };
    });

  const totales: AnalizadorTotal[] = [
    ...(
      [
        ["base", "En línea base"],
        ["estable", "Estables"],
        ["mejorando", "Mejorando"],
        ["cambio", "Cambio a revisar"],
      ] as [AnalizadorEstadoId, string][]
    ).map(([k, l]) => ({
      key: k,
      label: l,
      n: counts[k],
      icon: ESTADOS_AN[k].icon,
      fg: ESTADOS_AN[k].fg,
    })),
    {
      key: "bajaConst",
      label: "Constancia baja",
      n: counts.bajaConst,
      icon: "○",
      fg: "#5B6770",
    },
  ];

  const avisosAbiertosN = avisos.length;
  const anCardTxt = avisosAbiertosN
    ? `◆ Avisos · ${avisosAbiertosN}`
    : counts.cambio
      ? `${counts.cambio} cambio${counts.cambio === 1 ? "" : "s"} a revisar`
      : "sin cambios por revisar";

  return {
    totales,
    avisos,
    sinAvisos: avisos.length === 0,
    carga,
    anCardTxt,
    avisosAbiertosN,
  };
}
