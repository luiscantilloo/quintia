"use client";

/**
 * Juegos — historial clínico (asignados, jugados, terminados + tiempos).
 */
import {
  computeJuegosStats,
  getJuegosFreqForPatient,
  listGameHistoryFor,
} from "@/lib/nara-services/juegos.js";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { useEffect, useState } from "react";
import { ToolCardShell } from "../../ToolCardShell";
import { HerramientaIcon } from "../../HerramientaIcon";
import type { HerramientaCardProps } from "../../types";

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

function statusLabel(s: string) {
  if (/completed|terminad/i.test(s)) return "Terminado";
  if (/started|jugado/i.test(s)) return "En juego";
  return "Asignado";
}

export function JuegosToolCard({ item, patientId }: HerramientaCardProps) {
  const store = useNaraStore();
  useNaraLive();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    setTick((n) => n + 1);
  }, [open]);

  void tick;
  const hist = listGameHistoryFor(store, patientId);
  const freq = getJuegosFreqForPatient(store, patientId);
  const stats = computeJuegosStats(hist);

  return (
    <>
      <ToolCardShell
        onClick={() => setOpen(true)}
        iconId="juegos"
        title={item.name}
      >
        <span>
          {stats.completed} terminado{stats.completed === 1 ? "" : "s"}
        </span>
        <span>{freq.label}</span>
      </ToolCardShell>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Historial de juegos"
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
                <HerramientaIcon id="juegos" className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-titulos text-[20px] font-semibold leading-tight">
                    Juegos · Sudoku
                  </p>
                  <p className="m-0 mt-0.5 text-[13px] text-texto-secundario">
                    {freq.label} · {hist.length} registro
                    {hist.length === 1 ? "" : "s"}
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

            <div className="grid grid-cols-3 gap-2 px-5 py-4">
              {[
                { k: "Asignados", v: String(stats.assigned) },
                { k: "Jugados", v: String(stats.played) },
                { k: "Terminados", v: String(stats.completed) },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-2xl border border-linea bg-nara-blanco px-2.5 py-2.5 text-center"
                >
                  <p className="m-0 text-[11px] leading-tight text-texto-secundario">
                    {s.k}
                  </p>
                  <p className="m-0 mt-0.5 font-titulos text-xl font-semibold tabular-nums">
                    {s.v}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 px-5 pb-3">
              {[
                { k: "Tiempo mín.", v: stats.minLabel },
                { k: "Tiempo máx.", v: stats.maxLabel },
                { k: "Promedio", v: stats.avgLabel },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-2xl border border-linea bg-nara-blanco px-2.5 py-2.5 text-center"
                >
                  <p className="m-0 text-[11px] leading-tight text-texto-secundario">
                    {s.k}
                  </p>
                  <p className="m-0 mt-0.5 font-titulos text-[15px] font-semibold tabular-nums">
                    {s.v}
                  </p>
                </div>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              <p className="m-0 mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-texto-secundario">
                Historial
              </p>
              {!hist.length ? (
                <p className="m-0 rounded-xl border border-dashed border-linea bg-nara-blanco px-3 py-4 text-center text-[14px] text-texto-secundario">
                  Aún no hay juegos asignados.
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {hist.map((e, i) => (
                    <li
                      key={`${e.puzzleId}-${e.startedAt}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-linea bg-nara-blanco px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate font-medium text-[14px]">
                          {e.puzzleId}
                        </p>
                        <p className="m-0 text-[12px] text-texto-secundario">
                          {statusLabel(e.status)} · {fmtWhen(e.at)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-linea bg-nara-crema px-2.5 py-0.5 text-[12px] tabular-nums">
                        {e.durationMs > 0
                          ? (() => {
                              const s = Math.round(e.durationMs / 1000);
                              const m = Math.floor(s / 60);
                              return m ? `${m}m ${s % 60}s` : `${s}s`;
                            })()
                          : "—"}
                      </span>
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
