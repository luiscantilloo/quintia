import {
  computeJuegosStats,
  listGameHistoryFor,
} from "@/lib/nara-services/juegos.js";
import { GAME_SERVICES, isGameServiceId } from "@/lib/nara-services/gamesCatalog.js";
import {
  ANALIZADOR_BASELINE_N,
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

function gameMeta(id: string) {
  const g = GAME_SERVICES.find((x) => x.id === id);
  return {
    nombre: g?.name || id,
    hab: (g?.note || "").split("·")[0]?.trim() || "Habilidad",
  };
}

/** Estado provisional a partir del historial de juegos (sin series semanales aún). */
export function estadoDesdeHistorial(
  completed: number,
): AnalizadorEstadoId {
  if (completed < ANALIZADOR_BASELINE_N) return "base";
  return "estable";
}

function hasGamesInPath(
  store: { pathList?: Function; parseCode?: Function; ctxFor?: Function },
  patient: PatientLite,
): boolean {
  try {
    const pc =
      typeof store.parseCode === "function"
        ? store.parseCode(patient.profile || "")
        : { r: -1, d: -1 };
    if (pc.r < 0 || pc.d < 0) return false;
    const ctx =
      typeof store.ctxFor === "function" ? store.ctxFor(patient.id) : null;
    const list =
      typeof store.pathList === "function"
        ? store.pathList(pc.r, pc.d, null, ctx) || []
        : [];
    return list.some(
      (x: { id?: string }) => x?.id && isGameServiceId(x.id),
    );
  } catch {
    return false;
  }
}

function semanasLabel(p: PatientLite): number | string {
  const w = p.weeks ?? p.week;
  return Number.isFinite(Number(w)) ? Number(w) : "—";
}

/**
 * Construye totales, avisos y carga del panel Analizador del clínico.
 * Avisos: solo los abiertos del store (`S.avisos`); sin motor de detección aún.
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

  const counts: Record<AnalizadorEstadoId, number> & { bajaConst: number } = {
    base: 0,
    estable: 0,
    mejorando: 0,
    cambio: 0,
    bajaConst: 0,
  };

  const carga: AnalizadorCargaRow[] = [];

  for (const p of patients) {
    if (!hasGamesInPath(store, p) && !listGameHistoryFor(store, p.id).length) {
      continue;
    }
    const hist = listGameHistoryFor(store, p.id);
    const stats = computeJuegosStats(hist);
    const estado = estadoDesdeHistorial(stats.completed);
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
        ? `Línea base · ${stats.completed} de ${ANALIZADOR_BASELINE_N}`
        : e.label;
    let resumen =
      estado === "base"
        ? `${stats.completed} de ${ANALIZADOR_BASELINE_N} partidas`
        : "Todas las habilidades en su rango habitual";
    if (
      estado !== "base" &&
      typeof adhN === "number" &&
      adhN < 50
    ) {
      resumen = "En su rango habitual · constancia baja";
    } else if (stats.completed === 0) {
      resumen = "Aún sin partidas registradas";
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
      resumen,
      adh:
        adhN == null || !Number.isFinite(Number(adhN))
          ? "—"
          : `${adhN} %`,
    });
  }

  carga.sort(
    (a, b) =>
      ANALIZADOR_RANK[a.estado] - ANALIZADOR_RANK[b.estado] ||
      String(a.nombre).localeCompare(String(b.nombre), "es"),
  );

  const rawAvisos = Array.isArray(S.avisos) ? (S.avisos as Record<string, unknown>[]) : [];
  const avisos: AnalizadorAviso[] = rawAvisos
    .filter((a) => a && a.estado === "abierto" && !vistos.has(String(a.id)))
    .map((a) => {
      const pid = String(a.pid || "");
      const p = byId.get(pid);
      const gameId = String(a.game || "");
      const meta = gameMeta(gameId);
      const desdeN = Number(a.desde);
      const plazoN = Number(a.plazo);
      const rest =
        Number.isFinite(desdeN) && Number.isFinite(plazoN)
          ? Math.max(0, plazoN - desdeN)
          : null;
      return {
        id: String(a.id || `${pid}-${gameId}`),
        pid,
        nombre: p?.name || pid || "Persona",
        juego: meta.nombre,
        hab: meta.hab,
        texto: String(a.texto || ""),
        desde: Number.isFinite(desdeN)
          ? desdeN === 0
            ? "hoy"
            : `hace ${desdeN} día${desdeN === 1 ? "" : "s"}`
          : "reciente",
        plazo:
          rest == null
            ? "plazo por definir"
            : `${rest} día${rest === 1 ? "" : "s"} restantes`,
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

  const nCambio = counts.cambio + avisos.length;
  const anCardTxt = nCambio
    ? `${nCambio} cambio${nCambio === 1 ? "" : "s"} a revisar`
    : "sin cambios por revisar";

  return { totales, avisos, sinAvisos: avisos.length === 0, carga, anCardTxt };
}
