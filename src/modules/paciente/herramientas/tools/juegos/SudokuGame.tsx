"use client";

/**
 * Sudoku clásico 9×9 (reglas estándar):
 * — Cada fila, columna y bloque 3×3 debe tener los dígitos 1–9 sin repetir.
 * — Las pistas (verdes) no se pueden cambiar.
 * — Toque una casilla vacía y luego un número (solo esa casilla).
 * — Gana cuando el tablero coincide con la solución única.
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
import { useNaraStore } from "@/providers/nara-provider";
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
  /** Volver al hub de juegos */
  onBack?: () => void;
  onGoHome?: () => void;
}) {
  const store = useNaraStore();
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
      // Solo reponer celdas editables; las pistas siempre desde el puzzle.
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
    // Subir partidas locales al servidor (el clínico no ve localStorage del paciente).
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

  /** Dígitos ya usados en la casa (fila+col+bloque) de la casilla seleccionada. */
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

    // Regla clásica: no repetir en fila, columna ni bloque (si choca, queda en rojo).
    next[selected] = value;
    setCells(next);

    if (puzzle && isBoardComplete(next, puzzle.solution)) {
      setDone(true);
      clearBoardProgress(patientId, puzzle.id);
      completeJuego(store, patientId, puzzle.id, startedAt);
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
    <div className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-3 font-texto text-nara-tinta sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver a juegos"
              className="mt-0.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-linea bg-[#F7F5EF] text-[#0F2D3B]"
            >
              ←
            </button>
          ) : null}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-titulos text-[17px] font-semibold">Sudoku</span>
            <span className="text-[13px] text-texto-secundario">
              {status.freqInfo.label}
              {puzzle ? ` · ${puzzle.id}` : ""}
            </span>
          </div>
        </div>
        {startedAt && !done ? (
          <span className="rounded-full border border-linea bg-nara-crema px-3 py-1 font-titulos text-sm font-semibold tabular-nums">
            {fmtElapsed(elapsed)}
          </span>
        ) : null}
      </div>

      {!puzzle && !done ? (
        <div className="flex flex-col gap-3">
          {blockedHint || !status.needs ? (
            <p className="m-0 rounded-xl border border-linea bg-superficie-2 px-3 py-3 text-[14px] leading-snug text-texto-secundario">
              {blockedHint || status.nextHint}
            </p>
          ) : null}
          {status.needs ? (
            <button
              type="button"
              onClick={startGame}
              className="h-12 rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta"
            >
              Jugar sudoku
            </button>
          ) : null}
        </div>
      ) : null}

      {puzzle ? (
        <>
          {done ? (
            <div className="flex flex-col gap-3 rounded-xl border border-[#E5E0D5] bg-[#E8F0E4] px-3 py-3">
              <div>
                <p className="m-0 font-titulos text-[16px] font-semibold text-[#3a5570]">
                  ¡Sudoku completado!
                </p>
                <p className="m-0 mt-1 text-[13px] text-texto-secundario">
                  Tiempo: {fmtElapsed(elapsed)} · {status.nextHint}
                </p>
              </div>
              {onGoHome ? (
                <button
                  type="button"
                  onClick={onGoHome}
                  className="h-11 rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta"
                >
                  Volver al inicio
                </button>
              ) : null}
            </div>
          ) : (
            <div className="h-1.5 overflow-hidden rounded-full bg-superficie-2">
              <div
                className="h-full rounded-full bg-nara-verde-vivo transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div
            className="mx-auto w-full max-w-[min(100%,340px)] overflow-hidden rounded-xl border-2 border-[#0F2D3B] bg-[#0F2D3B]"
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
                else if (isSel) bg = "bg-[#FFF6E8]";
                else if (sameDigit) bg = "bg-[#E7FAF5]/70";
                else if (isPeer) bg = "bg-[#E8F0E4]/80";

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
                      "relative box-border min-h-0 min-w-0 overflow-hidden p-0",
                      bg,
                      c < 8
                        ? thickR
                          ? "border-r-2 border-r-[#0F2D3B]"
                          : "border-r border-r-[#E5E0D5]"
                        : "",
                      r < 8
                        ? thickB
                          ? "border-b-2 border-b-[#0F2D3B]"
                          : "border-b border-b-[#E5E0D5]"
                        : "",
                      done ? "cursor-default" : "cursor-pointer",
                    ].join(" ")}
                  >
                    {isSel && !done ? (
                      <span
                        className="pointer-events-none absolute inset-0 z-[1] ring-2 ring-inset ring-[#31C6E6]"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={[
                        "pointer-events-none absolute inset-0 flex items-center justify-center font-titulos text-[clamp(13px,3.8vw,18px)] font-semibold leading-none tabular-nums",
                        isConflict
                          ? "text-[#8A1C14]"
                          : isGiven
                            ? "text-[#0F2D3B]"
                            : "text-[#31C6E6]",
                      ].join(" ")}
                    >
                      {val > 0 ? val : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {!done ? (
            <div className="mx-auto flex w-full max-w-[min(100%,340px)] flex-col gap-1.5">
              <div
                className="grid w-full gap-1"
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
                        "flex aspect-square min-w-0 items-center justify-center rounded-lg border p-0 font-titulos text-[clamp(13px,3.8vw,17px)] font-semibold leading-none active:bg-[#E7FAF5]",
                        blocked
                          ? "border-linea/60 bg-superficie-2 text-texto-secundario/45"
                          : "border-linea bg-nara-crema text-nara-tinta",
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
                className="flex h-10 w-full items-center justify-center rounded-xl border border-linea bg-nara-blanco text-[13px] font-medium text-texto-secundario"
              >
                Borrar casilla
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
