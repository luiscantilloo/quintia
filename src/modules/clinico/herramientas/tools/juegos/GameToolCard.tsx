"use client";

/**
 * Tarjeta de un juego en ficha clínica.
 * Modal = estadísticas propias del juego (no asignados/jugados/terminados).
 */
import { listGameHistoryFor } from "@/lib/nara-services/juegos.js";
import { GAMES_META } from "@/lib/nara-services/analizador/contrato.js";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { useMemo, useState } from "react";
import { ToolCardShell } from "../../ToolCardShell";
import { HerramientaIcon } from "../../HerramientaIcon";
import type { HerramientaCardProps } from "../../types";

type HistEntry = {
  game?: string;
  puzzleId?: string;
  status?: string;
  startedAt?: number;
  at?: number;
  durationMs?: number;
  score?: number;
  medida?: number;
  gano?: boolean;
  completo?: boolean;
  version?: number;
  nivel?: number;
  metr?: Record<string, unknown>;
};

type StatRow = { label: string; value: string };

function fmtWhen(at: number) {
  if (!at) return "—";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMs(ms: number) {
  if (!(ms > 0) || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function completedOf(hist: HistEntry[]) {
  return hist.filter((e) => /completed|terminad/i.test(String(e.status || "")));
}

/** Estadísticas agregadas según el juego (última + resumen de completadas). */
function buildGameStats(gameId: string, hist: HistEntry[]): StatRow[] {
  const done = completedOf(hist);
  const last = done[0] || hist[0] || null;
  const metr = (last?.metr || {}) as Record<string, unknown>;

  if (gameId === "frutas") {
    const tiempos = done
      .flatMap((e) => {
        const t = (e.metr as { tiempos?: number[] } | undefined)?.tiempos;
        return Array.isArray(t) ? t.map(Number).filter((n) => n > 0) : [];
      });
    const inv = done.map((e) =>
      Number((e.metr as { invalidos?: number } | undefined)?.invalidos) || 0,
    );
    const scores = done
      .map((e) => Number(e.score ?? e.medida) || 0)
      .filter((n) => n > 0);
    const nivel =
      Number(last?.nivel ?? last?.version ?? metr.nivel) ||
      (done.length ? 1 : 0);
    const tProm = avg(tiempos);
    return [
      {
        label: "Tiempo hasta cada movimiento",
        value: tProm != null ? fmtMs(tProm) : "—",
      },
      {
        label: "Movimientos inválidos",
        value: inv.length ? String(Math.round(avg(inv) || 0)) : "—",
      },
      {
        label: "Puntaje",
        value: scores.length ? String(Math.max(...scores)) : "—",
      },
      { label: "Nivel", value: nivel > 0 ? String(nivel) : "—" },
    ];
  }

  if (gameId === "simon") {
    const seq = done
      .map(
        (e) =>
          Number(
            (e.metr as { secuencia?: number } | undefined)?.secuencia ??
              e.score ??
              e.medida,
          ) || 0,
      )
      .filter((n) => n > 0);
    const err = done
      .map((e) => (e.metr as { errorAt?: number | null } | undefined)?.errorAt)
      .filter((x) => x != null && Number(x) >= 0)
      .map(Number);
    const nivel = Number(last?.nivel ?? last?.version) || (done.length ? 1 : 0);
    return [
      {
        label: "Secuencia más larga",
        value: seq.length ? String(Math.max(...seq)) : "—",
      },
      {
        label: "Posición del error",
        value: err.length ? String(err[0]) : "—",
      },
      {
        label: "Rondas",
        value: seq.length ? String(seq[0]) : "—",
      },
      { label: "Nivel", value: nivel > 0 ? String(nivel) : "—" },
    ];
  }

  if (gameId === "duelo") {
    const durs = done
      .map((e) => Number(e.durationMs) || 0)
      .filter((n) => n > 0);
    const fuera = done.map(
      (e) => Number((e.metr as { fuera?: number } | undefined)?.fuera) || 0,
    );
    const wins = done.filter((e) => e.gano).length;
    const tProm = avg(durs);
    return [
      {
        label: "Tiempo por jugada",
        value: tProm != null ? fmtMs(tProm) : "—",
      },
      {
        label: "Jugadas fuera de la regla",
        value: fuera.length ? String(Math.round(avg(fuera) || 0)) : "—",
      },
      {
        label: "Resultado",
        value: done.length
          ? `${wins} victoria${wins === 1 ? "" : "s"} / ${done.length}`
          : "—",
      },
    ];
  }

  // sudoku
  const durs = done.map((e) => Number(e.durationMs) || 0).filter((n) => n > 0);
  const borradas = done.map(
    (e) =>
      Number((e.metr as { borradas?: number } | undefined)?.borradas) || 0,
  );
  const errores = done.map(
    (e) => Number((e.metr as { errores?: number } | undefined)?.errores) || 0,
  );
  const ok = done.filter((e) => e.completo !== false).length;
  return [
    {
      label: "Tiempo total",
      value: durs.length ? fmtMs(Math.min(...durs)) : "—",
    },
    {
      label: "Casillas borradas",
      value: borradas.some((n) => n > 0)
        ? String(Math.round(avg(borradas) || 0))
        : "—",
    },
    {
      label: "Errores",
      value: errores.some((n) => n > 0)
        ? String(Math.round(avg(errores) || 0))
        : "—",
    },
    {
      label: "Terminado o no",
      value: done.length
        ? `${ok} de ${done.length} terminado${ok === 1 ? "" : "s"}`
        : "—",
    },
  ];
}

function partidaLines(gameId: string, e: HistEntry): string {
  const m = (e.metr || {}) as Record<string, unknown>;
  if (gameId === "frutas") {
    const t = Array.isArray(m.tiempos)
      ? avg((m.tiempos as number[]).map(Number).filter((n) => n > 0))
      : null;
    return [
      t != null ? `tiempo ${fmtMs(t)}` : null,
      m.invalidos != null ? `${m.invalidos} invál.` : null,
      e.score != null || e.medida != null
        ? `${e.score ?? e.medida} XP`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (gameId === "simon") {
    return [
      `seq. ${m.secuencia ?? e.score ?? e.medida ?? "—"}`,
      m.errorAt != null ? `error en ${m.errorAt}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (gameId === "duelo") {
    return [
      e.gano ? "Victoria" : "Derrota",
      m.fuera != null ? `${m.fuera} fuera` : null,
      e.durationMs ? fmtMs(Number(e.durationMs)) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [
    e.durationMs ? fmtMs(Number(e.durationMs)) : null,
    e.completo === false ? "No terminado" : "Terminado",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function GameToolCard({ item, patientId }: HerramientaCardProps) {
  const store = useNaraStore();
  useNaraLive();
  const [open, setOpen] = useState(false);

  const gameId = String(item.id || "");
  const meta = (GAMES_META as Record<string, { nombre?: string; hab?: string }>)[
    gameId
  ];
  const nombre = item.name || meta?.nombre || gameId;
  const hab = meta?.hab || "Habilidad cognitiva";

  const hist = useMemo(() => {
    const all = listGameHistoryFor(store, patientId) as HistEntry[];
    return all
      .filter(
        (e) =>
          e.game === gameId ||
          (gameId === "sudoku" && (!e.game || e.game === "sudoku")),
      )
      .sort((a, b) => Number(b.at || b.startedAt || 0) - Number(a.at || a.startedAt || 0));
  }, [store, patientId, gameId, open]);

  const stats = useMemo(() => buildGameStats(gameId, hist), [gameId, hist]);
  const doneN = completedOf(hist).length;
  const preview =
    stats.find((s) => s.value !== "—")?.value ||
    (doneN ? `${doneN} partida${doneN === 1 ? "" : "s"}` : "Sin datos");

  return (
    <>
      <ToolCardShell
        onClick={() => setOpen(true)}
        iconId={gameId}
        title={nombre}
      >
        <span className="truncate">{preview}</span>
        <span className="truncate">{hab}</span>
      </ToolCardShell>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${nombre} · estadísticas`}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-linea bg-nara-crema font-texto text-nara-tinta shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="relative overflow-hidden border-b border-linea bg-nara-blanco px-5 pb-4 pt-5">
              <div
                className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-nara-amarillo/25"
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <HerramientaIcon id={gameId} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-titulos text-[20px] font-semibold leading-tight">
                    {nombre}
                  </p>
                  <p className="m-0 mt-0.5 text-[13px] text-texto-secundario">
                    {hab}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative shrink-0 rounded-full border border-linea bg-nara-blanco px-3 py-1.5 text-[13px] text-texto-secundario"
                >
                  Cerrar
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="m-0 mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-texto-secundario">
                Estadísticas
              </p>
              <ul className="m-0 mb-5 flex list-none flex-col gap-2 p-0">
                {stats.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-linea bg-nara-blanco px-3.5 py-3"
                  >
                    <span className="min-w-0 text-[14px] leading-snug text-texto-secundario">
                      {s.label}
                    </span>
                    <span className="shrink-0 font-titulos text-[17px] font-semibold tabular-nums text-nara-tinta">
                      {s.value}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="m-0 mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-texto-secundario">
                Partidas
              </p>
              {!hist.length ? (
                <p className="m-0 rounded-xl border border-dashed border-linea bg-nara-blanco px-3 py-4 text-center text-[14px] text-texto-secundario">
                  Aún no hay partidas de {nombre}.
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {hist.map((e, i) => (
                    <li
                      key={`${e.puzzleId}-${e.startedAt || e.at}-${i}`}
                      className="rounded-xl border border-linea bg-nara-blanco px-3 py-2.5"
                    >
                      <p className="m-0 text-[14px] font-medium leading-snug">
                        {partidaLines(gameId, e) || "Partida"}
                      </p>
                      <p className="m-0 mt-0.5 text-[12px] text-texto-secundario">
                        {fmtWhen(Number(e.at || e.startedAt || 0))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
