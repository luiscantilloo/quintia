"use client";

/**
 * Sudoku clásico 9×9 — UI = Quintia-entrega Paciente + captura de diseño.
 */
import {
  assignOrResumeJuego,
  clearBoardProgress,
  completeJuego,
  findConflictCells,
  isBoardComplete,
  juegosWindowStatusFor,
  loadBoardProgress,
  parseBoard,
  peerIndexes,
  saveBoardProgress,
  syncGameLogsToServer,
} from "@/lib/nara-services/juegos.js";
import { getGameCfg } from "@/lib/nara-services/juegos/gameCfg.js";
import { IconoSudoku } from "@/components/shared/brand/QuintiaIconos";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { useEffect, useMemo, useRef, useState } from "react";

function fmtElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function SudokuGame({
  patientId,
  onBack,
  onGoHome,
}: {
  patientId: string;
  onBack?: () => void;
  onGoHome?: () => void;
}) {
  const store = useNaraStore();
  const live = useNaraLive();
  const cfg = useMemo(() => getGameCfg(store, "sudoku"), [store, live]);
  const [puzzle, setPuzzle] = useState<{
    id: string;
    puzzle: string;
    solution: string;
  } | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [given, setGiven] = useState<boolean[]>([]);
  const [cells, setCells] = useState<number[]>([]);
  const [selected, setSelected] = useState(-1);
  const [done, setDone] = useState(false);
  const [blockedHint, setBlockedHint] = useState("");
  const [tick, setTick] = useState(0);
  const bootRef = useRef(false);

  const status = juegosWindowStatusFor(store, patientId);

  useEffect(() => {
    if (!startedAt || done) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [startedAt, done]);

  const elapsed = startedAt ? Date.now() - startedAt : 0;
  void tick;

  const applyPuzzle = (
    pz: { id: string; puzzle: string; solution: string },
    entryStartedAt: number,
  ) => {
    const base = parseBoard(pz.puzzle);
    const givenMask = base.map((n) => n > 0);
    const saved = loadBoardProgress(patientId, pz.id);
    let board = base.slice();
    let start = entryStartedAt || Date.now();
    if (saved?.cells?.length === 81) {
      board = saved.cells.map((n, i) => (givenMask[i] ? base[i] : n));
      if (saved.startedAt > 0) start = saved.startedAt;
    }
    setPuzzle(pz);
    setGiven(givenMask);
    setCells(board);
    setStartedAt(start);
    setDone(isBoardComplete(board, pz.solution));
    setSelected(-1);
    setBlockedHint("");
  };

  const startGame = () => {
    const res = assignOrResumeJuego(store, patientId);
    if (res.blocked || !res.puzzle) {
      setBlockedHint(String(res.nextHint || status.nextHint || ""));
      setPuzzle(null);
      return;
    }
    applyPuzzle(res.puzzle, Number(res.entry?.startedAt) || Date.now());
    void import("@/lib/store/hydrateProgram").then((m) => {
      if (typeof m.pauseLiveHydrate === "function") m.pauseLiveHydrate(8_000);
    });
  };

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    syncGameLogsToServer(store, patientId);
    if (status.open?.puzzleId || status.needs) {
      startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    if (!puzzle || done || !cells.length) return;
    saveBoardProgress(patientId, puzzle.id, cells, startedAt);
  }, [cells, patientId, puzzle, startedAt, done]);

  const conflicts = useMemo(() => findConflictCells(cells), [cells]);

  const peers = useMemo(
    () => (selected >= 0 ? new Set(peerIndexes(selected)) : new Set<number>()),
    [selected],
  );

  const selectedValue = selected >= 0 ? Number(cells[selected]) || 0 : 0;

  const usedInHouse = useMemo(() => {
    const used = new Set<number>();
    if (selected < 0) return used;
    for (const p of peerIndexes(selected)) {
      const v = Number(cells[p]);
      if (v >= 1 && v <= 9) used.add(v);
    }
    return used;
  }, [selected, cells]);

  const onSelect = (i: number) => {
    if (done) return;
    setSelected(i);
  };

  const onPut = (value: number) => {
    if (done) return;
    if (selected < 0 || selected > 80) return;
    if (given[selected]) return;

    const next = cells.slice();
    if (value === 0) {
      next[selected] = 0;
      setCells(next);
      return;
    }

    next[selected] = value;
    setCells(next);

    if (puzzle && isBoardComplete(next, puzzle.solution)) {
      setDone(true);
      clearBoardProgress(patientId, puzzle.id);
      completeJuego(store, patientId, puzzle.id, startedAt, {
        version: Number(cfg.version) || 1,
        nivel: Number(cfg.nivel) || 1,
      });
      syncGameLogsToServer(store, patientId);
      void import("@/lib/store/hydrateProgram").then((m) => {
        if (typeof m.pauseLiveHydrate === "function") m.pauseLiveHydrate(8_000);
      });
    }
  };

  const progress = useMemo(() => {
    if (!cells.length) return 0;
    return Math.round((cells.filter((n) => n > 0).length / 81) * 100);
  }, [cells]);

  return (
    <div className="relative flex flex-col gap-0 font-texto text-[#0F2D3B] [animation:sudokuIn_.35s_ease-out]">
      <style>{`
        @keyframes sudokuIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes sudokuPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="sudokuIn"], [class*="sudokuPulse"] { animation: none !important; }
        }
      `}</style>

      <div className="overflow-hidden rounded-[20px] border border-[#E4E0EA] bg-white px-3 py-3.5 shadow-[0_8px_28px_-18px_rgba(15,45,59,0.22)] sm:px-3.5">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Volver a juegos"
                className="mt-0.5 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-[#E4E0EA] bg-[#F7F5EF] text-[#0F2D3B] transition hover:border-[#6C04C9]/40 active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
            <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
              <span className="font-titulos text-[22px] font-bold leading-tight tracking-tight">
                Sudoku
              </span>
              <span className="truncate text-[15px] text-[#4D5D66]">
                {status.freqInfo.label}
                {puzzle ? ` · ${puzzle.id}` : ""}
              </span>
            </div>
          </div>
          {startedAt && !done ? (
            <span className="shrink-0 rounded-[14px] border border-[#E4E0EA] bg-[#F7F5EF] px-3 py-1.5 font-mono text-[17px] font-semibold tabular-nums tracking-wide text-[#0F2D3B]">
              {fmtElapsed(elapsed)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 h-px bg-[#E8E2D6]" aria-hidden />

        {!puzzle && !done ? (
          <div className="mt-4 flex flex-col items-center gap-4 py-6 text-center">
            <IconoSudoku className="h-20 w-20" />
            {blockedHint || !status.needs ? (
              <p className="m-0 max-w-xs text-[17px] leading-snug text-[#4D5D66]">
                {blockedHint || status.nextHint}
              </p>
            ) : (
              <p className="m-0 max-w-xs text-[17px] leading-snug text-[#4D5D66]">
                Complete cada fila, columna y bloque con los dígitos 1 a 9.
              </p>
            )}
            {status.needs ? (
              <button
                type="button"
                onClick={startGame}
                className="h-14 min-w-[160px] cursor-pointer rounded-[18px] border-0 bg-[#6C04C9] px-8 font-texto text-[20px] font-semibold text-white transition hover:bg-[#52039A] active:scale-[0.98]"
              >
                Jugar
              </button>
            ) : null}
          </div>
        ) : null}

        {puzzle ? (
          <div className="mt-3.5 flex flex-col gap-3">
            {done ? (
              <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#E4E0EA] bg-[#F7F5EF] px-4 py-6 text-center [animation:sudokuIn_.4s_ease-out]">
                <IconoSudoku className="h-16 w-16" />
                <p className="m-0 font-titulos text-[26px] font-bold text-[#0F2D3B]">
                  ¡Completado!
                </p>
                <p className="m-0 text-[18px] text-[#4D5D66]">
                  Tiempo · {fmtElapsed(elapsed)}
                </p>
                <p className="m-0 text-[15px] text-[#6E4705]">{status.nextHint}</p>
                <div className="mt-1 flex w-full flex-col gap-2">
                  {onBack ? (
                    <button
                      type="button"
                      onClick={onBack}
                      className="h-14 cursor-pointer rounded-[18px] border-0 bg-[#6C04C9] font-texto text-[18px] font-semibold text-white"
                    >
                      Volver a juegos
                    </button>
                  ) : null}
                  {onGoHome ? (
                    <button
                      type="button"
                      onClick={onGoHome}
                      className="h-12 cursor-pointer rounded-[16px] border-2 border-[#6C04C9] bg-white font-texto text-[17px] font-semibold text-[#0F2D3B]"
                    >
                      Volver a inicio
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div
                className="h-1.5 overflow-hidden rounded-full bg-[#EEEBF2]"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-[#6C04C9] transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {!done ? (
              <>
                <div
                  className="mx-auto w-full max-w-[min(100%,324px)] overflow-hidden rounded-lg border-2 border-[#0F2D3B] bg-[#0F2D3B] shadow-[0_10px_24px_-16px_rgba(15,45,59,0.35)]"
                  role="grid"
                  aria-label="Tablero de sudoku 9 por 9"
                >
                  <div
                    className="grid aspect-square w-full"
                    style={{
                      gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
                      gridTemplateRows: "repeat(9, minmax(0, 1fr))",
                    }}
                  >
                    {cells.map((val, i) => {
                      const r = Math.floor(i / 9);
                      const c = i % 9;
                      const isSel = selected === i;
                      const isGiven = !!given[i];
                      const isConflict = conflicts.has(i);
                      const isPeer = peers.has(i);
                      const sameDigit =
                        selectedValue > 0 && val === selectedValue && !isSel;
                      const thickR = c === 2 || c === 5;
                      const thickB = r === 2 || r === 5;

                      let bg = "bg-[#F7F5EF]";
                      if (isConflict) bg = "bg-[#FDE7E4]";
                      else if (isSel) bg = "bg-[#F0E8FB]";
                      else if (sameDigit) bg = "bg-[#E7FAF5]/85";
                      else if (isPeer) bg = "bg-[#EEEBF2]";

                      return (
                        <button
                          key={i}
                          type="button"
                          role="gridcell"
                          aria-selected={isSel}
                          aria-label={
                            val > 0
                              ? `Fila ${r + 1}, columna ${c + 1}, ${val}`
                              : `Fila ${r + 1}, columna ${c + 1}, vacía`
                          }
                          disabled={done}
                          onClick={() => onSelect(i)}
                          className={[
                            "relative box-border min-h-0 min-w-0 overflow-hidden p-0 transition-colors duration-150",
                            bg,
                            c < 8
                              ? thickR
                                ? "border-r-2 border-r-[#0F2D3B]"
                                : "border-r border-r-[#D6CFC2]"
                              : "",
                            r < 8
                              ? thickB
                                ? "border-b-2 border-b-[#0F2D3B]"
                                : "border-b border-b-[#D6CFC2]"
                              : "",
                            done ? "cursor-default" : "cursor-pointer",
                          ].join(" ")}
                        >
                          {isSel && !done ? (
                            <span
                              className="pointer-events-none absolute inset-0 z-[1] ring-2 ring-inset ring-[#6C04C9]"
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={[
                              "pointer-events-none absolute inset-0 flex items-center justify-center font-titulos text-[clamp(14px,4vw,20px)] font-bold leading-none tabular-nums",
                              isConflict
                                ? "text-[#B42318]"
                                : isGiven
                                  ? "text-[#0F2D3B]"
                                  : "text-[#6C04C9]",
                            ].join(" ")}
                          >
                            {val > 0 ? val : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-[min(100%,324px)] flex-col gap-2">
                  <div
                    className="grid w-full gap-1.5"
                    style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                      const blocked =
                        selected >= 0 &&
                        !given[selected] &&
                        usedInHouse.has(n) &&
                        Number(cells[selected]) !== n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => onPut(n)}
                          aria-label={`Colocar ${n}`}
                          className={[
                            "flex aspect-square min-w-0 items-center justify-center rounded-[12px] border p-0 font-titulos text-[clamp(14px,3.8vw,18px)] font-semibold leading-none transition active:scale-95",
                            blocked
                              ? "cursor-default border-[#E4E0EA]/70 bg-[#EEEBF2] text-[#4D5D66]/35"
                              : "cursor-pointer border-[#E4E0EA] bg-[#F7F5EF] text-[#0F2D3B] hover:border-[#6C04C9]/45 hover:bg-[#F0E8FB]",
                          ].join(" ")}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => onPut(0)}
                    className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] border border-[#E4E0EA] bg-[#F7F5EF] font-texto text-[16px] font-medium text-[#4D5D66] transition hover:border-[#0F2D3B]/25 active:scale-[0.99]"
                  >
                    Borrar casilla
                  </button>
                  {onBack ? (
                    <button
                      type="button"
                      onClick={onBack}
                      className="h-11 cursor-pointer border-0 bg-transparent font-texto text-[16px] text-[#0F2D3B] underline underline-offset-2"
                    >
                      Terminar por hoy
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
