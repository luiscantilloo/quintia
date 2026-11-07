"use client";

import {
  computeJuegosStats,
  getJuegosFreqForPatient,
  listGameHistoryFor,
} from "@/lib/nara-services/juegos.js";
import { GAME_SERVICES } from "@/lib/nara-services/gamesCatalog.js";
import { useNaraStore } from "@/providers/nara-provider";
import { useMemo, useState } from "react";
import { SudokuGame } from "./SudokuGame";

export type JuegoId = "frutas" | "simon" | "duelo" | "sudoku";

type Props = {
  patientId: string;
  /** Juegos ON en la ruta del paciente */
  activeIds?: JuegoId[];
  onGoHome?: () => void;
};

const META: Record<
  JuegoId,
  { name: string; hint: string; accent: string; bg: string }
> = {
  frutas: {
    name: "Frutas",
    hint: "Atención visual y planificación",
    accent: "#C27241",
    bg: "#FFF4E8",
  },
  simon: {
    name: "Simón dice",
    hint: "Memoria de trabajo y atención",
    accent: "#436FD2",
    bg: "#EEF3FB",
  },
  duelo: {
    name: "Duelo de cartas",
    hint: "Flexibilidad y decisiones",
    accent: "#6C04C9",
    bg: "#F3EBFB",
  },
  sudoku: {
    name: "Sudoku",
    hint: "Lógica y planificación",
    accent: "#2B8A74",
    bg: "#E8F5F1",
  },
};

/** Hub de juegos activos (lista) + partida de Sudoku. */
export function JuegosPanel({
  patientId,
  activeIds,
  onGoHome,
}: Props) {
  const store = useNaraStore();
  const [playing, setPlaying] = useState<JuegoId | null>(null);

  const ids = useMemo(() => {
    const fromProp = (activeIds || []).filter((id) => META[id]);
    if (fromProp.length) return fromProp;
    // Fallback: todos los del catálogo si la ruta aún trae hub legacy
    return GAME_SERVICES.map((g) => g.id as JuegoId);
  }, [activeIds]);

  const freq = getJuegosFreqForPatient(store, patientId);
  const hist = listGameHistoryFor(store, patientId);
  const sudokuStats = computeJuegosStats(hist);

  if (playing === "sudoku") {
    return (
      <SudokuGame
        patientId={patientId}
        onBack={() => setPlaying(null)}
        onGoHome={onGoHome}
      />
    );
  }

  if (playing && playing !== "sudoku") {
    const m = META[playing];
    return (
      <div className="flex flex-col gap-4 rounded-[20px] border border-[#E5E0D5] bg-white p-4 font-texto text-[#0F2D3B]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying(null)}
            aria-label="Volver a juegos"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[#E5E0D5] bg-[#F7F5EF]"
          >
            ←
          </button>
          <h2 className="m-0 font-titulos text-[20px] font-bold">{m.name}</h2>
        </div>
        <div
          className="flex flex-col items-center gap-3 rounded-3xl px-5 py-10 text-center"
          style={{ background: m.bg }}
        >
          <GameGlyph id={playing} className="h-16 w-16" />
          <p className="m-0 max-w-xs font-texto text-[15px] leading-relaxed text-[#5B6770]">
            {m.hint}. La partida jugable llega en la siguiente entrega; por ahora
            puede seguir con Sudoku.
          </p>
          <button
            type="button"
            onClick={() => setPlaying(null)}
            className="mt-2 h-11 cursor-pointer rounded-2xl border-0 bg-[#0F2D3B] px-5 font-texto text-[15px] font-semibold text-[#F7F5EF]"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  const recordFor = (id: JuegoId) => {
    if (id === "sudoku") {
      if (!sudokuStats.completed) return "Aún sin récord";
      return `Mejor tiempo: ${sudokuStats.minLabel}`;
    }
    return "Aún sin récord";
  };

  return (
    <div className="flex flex-col gap-5 font-texto text-[#0F2D3B]">
      <header>
        <h2 className="m-0 font-titulos text-[clamp(26px,6vw,32px)] font-extrabold tracking-tight">
          Juegos
        </h2>
        <p className="m-0 mt-1 font-texto text-[15px] text-[#5B6770]">
          {freq.label} · en su ruta
        </p>
      </header>

      <section aria-label="Le toca hoy" className="flex flex-col gap-2.5">
        <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#DA9E46]">
          Le toca hoy
        </p>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {ids.map((id) => {
            const m = META[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setPlaying(id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#DA9E46]/55 bg-white px-3.5 py-3 text-left shadow-[0_8px_24px_-18px_rgba(15,45,59,0.35)] transition hover:border-[#DA9E46] active:scale-[0.99]"
                >
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-2xl"
                    style={{ background: m.bg }}
                  >
                    <GameGlyph id={id} className="h-8 w-8" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-titulos text-[17px] font-bold leading-tight">
                      {m.name}
                    </span>
                    <span className="mt-0.5 block truncate font-texto text-[13px] text-[#5B6770]">
                      {m.hint}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#0F2D3B] px-3.5 py-2 font-texto text-[13px] font-semibold text-[#F7F5EF]">
                    Jugar →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Mis juegos" className="flex flex-col gap-2.5">
        <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
          Mis juegos
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {ids.map((id) => {
            const m = META[id];
            return (
              <li
                key={`hist-${id}`}
                className="flex items-center gap-3 rounded-2xl border border-[#E5E0D5] bg-white px-3.5 py-3"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl"
                  style={{ background: m.bg }}
                >
                  <GameGlyph id={id} className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-titulos text-[16px] font-semibold">
                    {m.name}
                  </p>
                  <p className="m-0 mt-0.5 font-texto text-[13px] text-[#5B6770]">
                    {freq.label}
                    <span className="mx-1.5 text-[#E5E0D5]">·</span>
                    {recordFor(id)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function GameGlyph({
  id,
  className = "h-8 w-8",
}: {
  id: JuegoId;
  className?: string;
}) {
  if (id === "frutas") {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="11" cy="14" r="6" fill="#C27241" />
        <circle cx="21" cy="12" r="5.5" fill="#DA9E46" />
        <circle cx="17" cy="21" r="5" fill="#2B8A74" />
      </svg>
    );
  }
  if (id === "simon") {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="5" fill="#436FD2" />
        <circle cx="21" cy="11" r="5" fill="#31C6E6" />
        <circle cx="11" cy="21" r="5" fill="#DA9E46" />
        <circle cx="21" cy="21" r="5" fill="#C27241" />
      </svg>
    );
  }
  if (id === "duelo") {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="5" y="6" width="14" height="20" rx="2" fill="#6C04C9" />
        <rect x="13" y="6" width="14" height="20" rx="2" fill="#31C6E6" opacity="0.9" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="6" fill="#0F2D3B" />
      <path stroke="#61F0D2" strokeWidth="1.4" d="M10.7 4v24M21.3 4v24M4 10.7h24M4 21.3h24" />
      <rect x="4" y="4" width="24" height="24" rx="2" stroke="#F7F5EF" strokeWidth="1.5" />
    </svg>
  );
}
