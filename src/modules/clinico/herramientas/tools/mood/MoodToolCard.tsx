"use client";

/**
 * Estado de ánimo — historial + estadísticas (vista clínico).
 */
import {
  computeMoodStats,
  getMoodFreqForPatient,
  listMoodHistoryFor,
} from "@/lib/nara-services/mood.js";
import { useNaraStore } from "@/providers/nara-provider";
import { useEffect, useState } from "react";
import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

function moodFace(value: number | null) {
  if (value == null) return "/quintia/tejiva/tejiva-escucha.svg";
  if (value <= 2) return "/quintia/tejiva/tejiva-piensa.svg";
  if (value === 3) return "/quintia/tejiva/tejiva-base.svg";
  return "/quintia/tejiva/tejiva-celebra.svg";
}

function moodChip(value: number) {
  if (value <= 2) return "bg-[#FDE7E4] text-[#8A1C14] border-[#E8B4B4]";
  if (value === 3) return "bg-[#E7FAF5] text-[#6B7280] border-[#E0D4A8]";
  return "bg-[#E8F0E4] text-[#3a5570] border-[#E5E0D5]";
}

export function MoodToolCard({ item, patientId }: HerramientaCardProps) {
  const store = useNaraStore();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    setTick((n) => n + 1);
  }, [open]);

  void tick;
  const hist = listMoodHistoryFor(store, patientId);
  const last = hist[0] || null;
  const freq = getMoodFreqForPatient(store, patientId);
  const stats = computeMoodStats(hist);

  return (
    <>
      <ToolCardShell
        onClick={() => setOpen(true)}
        iconId="mood"
        title={item.name}
      >
        {last ? (
          <span>
            {last.value}/5 · {last.label}
          </span>
        ) : (
          <span>Sin registros</span>
        )}
        <span>{freq.label}</span>
      </ToolCardShell>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Historial de estado de ánimo"
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
                <img
                  src={moodFace(last?.value ?? null)}
                  alt=""
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-titulos text-[20px] font-semibold leading-tight">
                    Historial de ánimo
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

            <div className="grid grid-cols-2 gap-2 px-5 py-4 sm:grid-cols-4">
              {[
                { k: "Media", v: stats.mediaLabel },
                { k: "Mediana", v: stats.medianaLabel },
                { k: "Desv.", v: stats.desvLabel },
                { k: "% mal", v: stats.pctMalLabel },
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

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-5">
              {hist.length ? (
                hist.map((row, i) => (
                  <div
                    key={`${row.at}-${row.value}-${i}`}
                    className="flex items-center gap-3 rounded-[20px] border border-linea bg-nara-blanco px-3.5 py-3"
                  >
                    <img
                      src={moodFace(row.value)}
                      alt=""
                      className="h-10 w-10 shrink-0 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[15px] font-medium leading-snug">
                        {row.label}
                      </p>
                      <p className="m-0 mt-0.5 text-[12px] text-texto-secundario">
                        {row.when}
                      </p>
                    </div>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border font-titulos text-sm font-semibold ${moodChip(row.value)}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-linea bg-nara-blanco px-5 py-10 text-center">
                  <img
                    src="/quintia/tejiva/tejiva-base.svg"
                    alt=""
                    className="mx-auto mb-3 h-16 w-16 object-contain"
                  />
                  <p className="m-0 font-titulos text-[17px] font-semibold">
                    Aún no hay registros
                  </p>
                  <p className="m-0 mt-1 text-[13px] text-texto-secundario">
                    Cuando registre su ánimo en la app, verá el historial aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
