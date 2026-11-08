"use client";

import {
  computeJuegosStats,
  getJuegosFreqForPatient,
  listGameHistoryFor,
} from "@/lib/nara-services/juegos.js";
import { GAME_SERVICES } from "@/lib/nara-services/gamesCatalog.js";
import { QuintiaMark } from "@/components/shared/brand/QuintiaLogo";
import { QuintiaIcono } from "@/components/shared/brand/QuintiaIconos";
import { useNaraStore } from "@/providers/nara-provider";
import { useMemo, useState } from "react";
import { DueloGame } from "./DueloGame";
import { FrutasGame } from "./FrutasGame";
import { SimonGame } from "./SimonGame";
import { SudokuGame } from "./SudokuGame";

export type JuegoId = "frutas" | "simon" | "duelo" | "sudoku";

type Props = {
  patientId: string;
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

/** Hub de juegos = Quintia-entrega Paciente.dc.html */
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
    return GAME_SERVICES.map((g) => g.id as JuegoId);
  }, [activeIds]);

  const freq = getJuegosFreqForPatient(store, patientId);
  const hist = listGameHistoryFor(store, patientId);
  const sudokuStats = computeJuegosStats(
    hist.filter((e: { game?: string }) => !e.game || e.game === "sudoku"),
  );

  // Hooks antes de cualquier return (regla de React).
  const positivos = useMemo(() => {
    const msgs: string[] = [];
    const all = computeJuegosStats(hist);
    if (all.completed >= 1) {
      msgs.push(
        all.completed === 1
          ? "¡Primera partida completa! Bien por empezar."
          : `Lleva ${all.completed} partidas completadas. Constancia que se nota.`,
      );
    }
    if (sudokuStats.completed >= 3 && sudokuStats.minLabel) {
      msgs.push(`Récord en Sudoku: ${sudokuStats.minLabel}.`);
    }
    const dues = hist.filter(
      (e: { game?: string; status?: string; score?: number; gano?: boolean }) =>
        e.game === "duelo" && /completed/i.test(String(e.status || "")),
    );
    if (dues.length) {
      const wins = dues.filter((e: { gano?: boolean }) => e.gano).length;
      if (wins) msgs.push(`En Duelo sumó ${wins} victoria${wins === 1 ? "" : "s"}.`);
    }
    const sims = hist.filter(
      (e: { game?: string; status?: string; score?: number; medida?: number }) =>
        e.game === "simon" && /completed/i.test(String(e.status || "")),
    );
    if (sims.length) {
      const best = Math.max(
        ...sims.map(
          (e: { score?: number; medida?: number }) =>
            Number(e.score ?? e.medida) || 0,
        ),
      );
      if (best > 0) {
        msgs.push(
          `En Simón llegó a ${best} paso${best === 1 ? "" : "s"} de secuencia.`,
        );
      }
    }
    const fru = hist.filter(
      (e: { game?: string; status?: string; score?: number; medida?: number }) =>
        e.game === "frutas" && /completed/i.test(String(e.status || "")),
    );
    if (fru.length) {
      const best = Math.max(
        ...fru.map(
          (e: { score?: number; medida?: number }) =>
            Number(e.score ?? e.medida) || 0,
        ),
      );
      if (best > 0) msgs.push(`En Frutas su mejor puntaje es ${best} XP.`);
    }
    if (!msgs.length) {
      msgs.push("Cuando juegue, aquí verá sus logros y récords.");
    }
    return msgs.slice(0, 3);
  }, [hist, sudokuStats.completed, sudokuStats.minLabel]);

  if (playing === "sudoku") {
    return (
      <SudokuGame
        patientId={patientId}
        onBack={() => setPlaying(null)}
        onGoHome={onGoHome}
      />
    );
  }

  if (playing === "duelo") {
    return (
      <DueloGame patientId={patientId} onBack={() => setPlaying(null)} />
    );
  }

  if (playing === "simon") {
    return (
      <SimonGame patientId={patientId} onBack={() => setPlaying(null)} />
    );
  }

  if (playing === "frutas") {
    return (
      <FrutasGame patientId={patientId} onBack={() => setPlaying(null)} />
    );
  }

  if (playing) {
    const m = META[playing];
    return (
      <div className="flex flex-col gap-4 px-1 font-texto text-[#0F2D3B]">
        <button
          type="button"
          onClick={() => setPlaying(null)}
          className="w-fit cursor-pointer border-0 bg-transparent p-0 font-texto text-[20px] text-[#0F2D3B]"
        >
          ← Juegos
        </button>
        <div
          className="flex flex-col items-center gap-3 rounded-[22px] px-5 py-10 text-center"
          style={{ background: m.bg }}
        >
          <GameGlyph id={playing} className="h-16 w-16" />
          <p className="m-0 max-w-xs text-[17px] leading-relaxed text-[#4D5D66]">
            {m.hint}. La partida jugable llega en la siguiente entrega.
          </p>
          <button
            type="button"
            onClick={() => setPlaying(null)}
            className="mt-2 h-14 min-w-[120px] cursor-pointer rounded-2xl border-0 bg-[#6C04C9] px-5 font-texto text-[18px] font-semibold text-white"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const recordFor = (id: JuegoId) => {
    if (id === "sudoku") {
      if (!sudokuStats.completed) return "Aún sin récord";
      return sudokuStats.minLabel;
    }
    if (id === "duelo") {
      const dues = hist.filter(
        (e: { game?: string; status?: string; score?: number }) =>
          e.game === "duelo" && /completed/i.test(String(e.status || "")),
      );
      if (!dues.length) return "Aún sin récord";
      const best = Math.max(
        ...dues.map((e: { score?: number }) => Number(e.score) || 0),
      );
      return best > 0 ? `${best} pts` : "Aún sin récord";
    }
    if (id === "simon") {
      const sims = hist.filter(
        (e: { game?: string; status?: string; score?: number; medida?: number }) =>
          e.game === "simon" && /completed/i.test(String(e.status || "")),
      );
      if (!sims.length) return "Aún sin récord";
      const best = Math.max(
        ...sims.map(
          (e: { score?: number; medida?: number }) =>
            Number(e.score ?? e.medida) || 0,
        ),
      );
      return best > 0 ? String(best) : "Aún sin récord";
    }
    if (id === "frutas") {
      const fru = hist.filter(
        (e: { game?: string; status?: string; score?: number; medida?: number }) =>
          e.game === "frutas" && /completed/i.test(String(e.status || "")),
      );
      if (!fru.length) return "Aún sin récord";
      const best = Math.max(
        ...fru.map(
          (e: { score?: number; medida?: number }) =>
            Number(e.score ?? e.medida) || 0,
        ),
      );
      return best > 0 ? `${best} pts` : "Aún sin récord";
    }
    return "Aún sin récord";
  };

  const recordUnit = (id: JuegoId, txt: string) => {
    if (txt === "Aún sin récord") return txt;
    if (id === "sudoku") return `${txt}`;
    if (id === "simon") return `${txt} pasos`;
    return txt.includes("pts") ? txt : `${txt} pts`;
  };

  return (
    <div className="flex flex-col gap-4 font-texto text-[#0F2D3B]">
      <div className="flex items-center gap-3">
        <QuintiaMark size={40} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="m-0 font-titulos text-[30px] font-bold leading-tight tracking-tight">
            Juegos
          </h2>
          <span className="font-mono text-[16px] font-semibold tracking-[0.16em] text-[#6C04C9]">
            QUINTIA EXPLORA
          </span>
        </div>
      </div>

      <section
        aria-label="Mi resumen"
        className="flex flex-col gap-2 rounded-[18px] border border-[#E4E0EA] bg-white p-4"
      >
        <p className="m-0 font-mono text-[16px] font-medium tracking-[0.14em] text-[#6C04C9]">
          MI RESUMEN
        </p>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {positivos.map((t) => (
            <li key={t} className="text-[17px] leading-snug text-[#0F2D3B]">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Te toca hoy" className="flex flex-col gap-2">
        <p className="m-0 font-mono text-[16px] font-medium tracking-[0.14em] text-[#6C04C9]">
          TE TOCA HOY
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {ids.map((id) => {
            const m = META[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setPlaying(id)}
                  className="flex min-h-[76px] w-full cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#E9AE35] bg-[#FFF8EA] px-3.5 py-3 text-left text-[#0F2D3B] transition active:scale-[0.99]"
                >
                  <span className="grid size-12 shrink-0 place-items-center">
                    <GameGlyph id={id} className="h-12 w-12" />
                  </span>
                  <span className="min-w-0 flex-1 font-titulos text-[21px] font-semibold leading-tight">
                    {m.name}
                  </span>
                  <span className="shrink-0 font-texto text-[20px] font-semibold text-[#0F2D3B]">
                    Jugar →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Mis juegos" className="flex flex-col gap-2">
        <p className="m-0 font-mono text-[16px] font-medium tracking-[0.14em] text-[#6C04C9]">
          MIS JUEGOS
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {ids.map((id) => {
            const m = META[id];
            const rec = recordUnit(id, recordFor(id));
            return (
              <li key={`hist-${id}`}>
                <button
                  type="button"
                  onClick={() => setPlaying(id)}
                  className="flex w-full cursor-pointer items-center gap-3.5 rounded-[18px] border border-[#E4E0EA] bg-white p-3.5 text-left text-[#0F2D3B] transition hover:border-[#6C04C9]/35 active:scale-[0.99]"
                >
                  <span className="grid size-[60px] shrink-0 place-items-center">
                    <GameGlyph id={id} className="h-[60px] w-[60px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-titulos text-[22px] font-semibold leading-tight">
                      {m.name}
                    </span>
                    <span className="text-[18px] text-[#4D5D66]">
                      {freq.label}
                    </span>
                    <span className="text-[18px] text-[#6E4705]">
                      Tu récord: {rec}
                    </span>
                  </span>
                </button>
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
  return <QuintiaIcono kind={id} className={className} />;
}
