"use client";

/**
 * Duelo de cartas — lógica del prototipo Paciente.dc.html.
 * Mesa de salón: felt tinta, cartas grandes táctiles, regla que cambia cada 4 jugadas.
 */
import { completeDueloPartida } from "@/lib/nara-services/juegos.js";
import { getGameCfg } from "@/lib/nara-services/juegos/gameCfg.js";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const COLS = [
  { n: "Coral", bg: "#D9573F", soft: "#F7A48F" },
  { n: "Azul", bg: "#3A73AE", soft: "#8DBBEB" },
  { n: "Verde", bg: "#3E8C60", soft: "#8ED6AC" },
  { n: "Ámbar", bg: "#D69B22", soft: "#F9D883" },
] as const;

type Card = { c: number; n: number };

type DuState = {
  hand: Card[];
  cpu: Card[];
  deck: Card[];
  center: Card;
  rule: "color" | "numero";
  total: number;
  plays: number;
  fuera: number;
  errSw: number;
  since: number;
  turn: "yo" | "cpu";
  msg: string;
  flash: boolean;
};

type FinState = {
  titulo: string;
  pct: number;
  score: number;
  gano: boolean;
};

function rnd(n: number) {
  return Math.floor(Math.random() * n);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (let k = 0; k < 2; k++) {
    for (let c = 0; c < 4; c++) {
      for (let n = 1; n <= 5; n++) deck.push({ c, n });
    }
  }
  return shuffle(deck);
}

function cardOk(card: Card, du: DuState) {
  return du.rule === "color" ? card.c === du.center.c : card.n === du.center.n;
}

function afterPlay(du: DuState): DuState {
  const next = { ...du, total: du.total + 1 };
  if (next.total % 4 === 0) {
    next.rule = next.rule === "color" ? "numero" : "color";
    next.since = 0;
    next.flash = true;
    next.msg =
      "La regla cambió: ahora por " +
      (next.rule === "color" ? "color" : "número") +
      ".";
  } else {
    next.since += 1;
    next.flash = false;
  }
  return next;
}

function PlayingCard({
  card,
  size = "md",
  onClick,
  disabled,
}: {
  card: Card;
  size?: "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const col = COLS[card.c] || COLS[0];
  const dims =
    size === "lg"
      ? "h-[126px] w-[92px] rounded-2xl border-4"
      : "h-[90px] w-[62px] rounded-xl border-[3px]";
  const numCls = size === "lg" ? "text-[48px]" : "text-[32px]";
  const chipCls = size === "lg" ? "px-2 text-[16px]" : "px-1.5 text-[12px]";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`${dims} flex shrink-0 flex-col items-center justify-center gap-1 border-[#F7F5EF] shadow-[0_6px_16px_rgba(15,45,59,0.22)] transition ${
        onClick && !disabled
          ? "cursor-pointer hover:-translate-y-1 active:scale-95"
          : ""
      } ${disabled ? "opacity-60" : ""}`}
      style={{ background: col.bg }}
      aria-label={onClick ? `Jugar ${col.n} ${card.n}` : undefined}
    >
      <span className={`${numCls} font-titulos font-bold leading-none text-white`}>
        {card.n}
      </span>
      <span
        className={`${chipCls} rounded-md bg-[#F7F5EF] py-0.5 font-texto font-semibold text-[#0F2D3B]`}
      >
        {col.n}
      </span>
    </Tag>
  );
}

export function DueloGame({
  patientId,
  onBack,
}: {
  patientId: string;
  onBack?: () => void;
}) {
  const store = useNaraStore();
  const live = useNaraLive();
  const cfg = useMemo(() => getGameCfg(store, "duelo"), [store, live]);
  const handN = Number(cfg.cartas) === 7 ? 7 : 5;
  const [phase, setPhase] = useState<"intro" | "play" | "fin">("intro");
  const [du, setDu] = useState<DuState | null>(null);
  const [fin, setFin] = useState<FinState | null>(null);
  const startedAt = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const later = useCallback(
    (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
    },
    [],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  const start = () => {
    clearTimers();
    const deck = buildDeck();
    const hand = deck.splice(0, handN);
    const cpu = deck.splice(0, handN);
    const center = deck.pop()!;
    startedAt.current = Date.now();
    setFin(null);
    setDu({
      hand,
      cpu,
      deck,
      center,
      rule: "color",
      total: 0,
      plays: 0,
      fuera: 0,
      errSw: 0,
      since: 9,
      turn: "yo",
      msg: "Su turno. Juegue una carta del mismo color.",
      flash: false,
    });
    setPhase("play");
  };

  const endGame = useCallback(
    (state: DuState, gano: boolean) => {
      clearTimers();
      const pct = Math.round(
        (state.plays / Math.max(1, state.plays + state.fuera)) * 100,
      );
      const score = state.plays * 10 + (gano ? 30 : 0);
      completeDueloPartida(store, patientId, {
        startedAt: startedAt.current,
        score,
        medida: pct,
        gano,
        fuera: state.fuera,
        errCambio: state.errSw,
        version: Number(cfg.version) || 1,
        nivel: Number(cfg.nivel) || 1,
      });
      setFin({
        titulo: gano ? "¡Ganó la partida!" : "¡Buena partida!",
        pct,
        score,
        gano,
      });
      setPhase("fin");
    },
    [cfg.nivel, cfg.version, clearTimers, patientId, store],
  );

  const runCpu = useCallback(
    (snapshot: DuState) => {
      let next = { ...snapshot };
      const k = next.cpu.findIndex((c) => cardOk(c, next));
      if (k >= 0) {
        next = {
          ...next,
          center: next.cpu[k],
          cpu: next.cpu.filter((_, j) => j !== k),
        };
        if (!next.cpu.length) {
          next = {
            ...next,
            msg: "La computadora jugó su última carta.",
          };
          setDu(next);
          later(() => endGame(next, false), 900);
          return;
        }
        const prevRule = next.rule;
        next = afterPlay(next);
        if (next.rule === prevRule) {
          next = { ...next, msg: "La computadora jugó. Su turno." };
        }
      } else if (next.deck.length) {
        const deck = next.deck.slice();
        const drawn = deck.pop()!;
        next = {
          ...next,
          deck,
          cpu: next.cpu.concat(drawn),
          msg: "La computadora tomó una carta. Su turno.",
        };
      } else {
        endGame(next, next.hand.length <= next.cpu.length);
        return;
      }
      next = { ...next, turn: "yo" };
      setDu(next);
    },
    [endGame, later],
  );

  const playCard = (i: number) => {
    if (!du || du.turn !== "yo" || phase !== "play") return;
    const card = du.hand[i];
    if (!cardOk(card, du)) {
      setDu({
        ...du,
        fuera: du.fuera + 1,
        errSw: du.since <= 2 ? du.errSw + 1 : du.errSw,
        msg:
          "Esa no coincide por " +
          (du.rule === "color" ? "color" : "número") +
          ". Pruebe otra.",
      });
      return;
    }
    let next: DuState = {
      ...du,
      hand: du.hand.filter((_, k) => k !== i),
      center: card,
      plays: du.plays + 1,
      msg: "¡Bien jugada!",
      flash: false,
    };
    if (!next.hand.length) {
      setDu(next);
      later(() => endGame(next, true), 700);
      return;
    }
    next = afterPlay(next);
    next = { ...next, turn: "cpu" };
    setDu(next);
    later(() => runCpu(next), 1200);
  };

  const drawCard = () => {
    if (!du || du.turn !== "yo" || phase !== "play") return;
    if (!du.deck.length) {
      endGame(du, du.hand.length <= du.cpu.length);
      return;
    }
    const deck = du.deck.slice();
    const drawn = deck.pop()!;
    const next: DuState = {
      ...du,
      deck,
      hand: du.hand.concat(drawn),
      turn: "cpu",
      msg: "Tomó una carta.",
      flash: false,
    };
    setDu(next);
    later(() => runCpu(next), 1000);
  };

  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-4 overflow-hidden rounded-[22px] border border-[#E5E0D5] bg-[#0F2D3B] p-4 font-texto text-[#F7F5EF] sm:p-5">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver a juegos"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-white/20 bg-white/10 text-[#F7F5EF]"
            >
              ←
            </button>
          ) : null}
          <h2 className="m-0 font-titulos text-[22px] font-bold tracking-tight">
            Duelo de cartas
          </h2>
        </div>
        <div className="relative overflow-hidden rounded-[20px] bg-[#163848] p-5">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(circle, #6C04C9 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-6 h-36 w-36 rounded-full opacity-35"
            style={{
              background:
                "radial-gradient(circle, #31C6E6 0%, transparent 70%)",
            }}
          />
          <p className="relative m-0 font-titulos text-[18px] font-semibold leading-snug">
            Flexibilidad y decisiones
          </p>
          <p className="relative m-0 mt-3 text-[15px] leading-relaxed text-[#C9DBE1]">
            Juegue una carta que coincida con la del centro según la regla de
            arriba: por color o por número. La regla cambia durante la partida.
            Gana quien se quede sin cartas.
          </p>
          <div className="relative mt-5 flex gap-2">
            {COLS.map((c) => (
              <span
                key={c.n}
                className="h-3 flex-1 rounded-full"
                style={{ background: c.bg }}
                title={c.n}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={start}
          className="h-14 cursor-pointer rounded-2xl border-0 bg-[#61F0D2] font-titulos text-[17px] font-bold text-[#0F2D3B] shadow-[0_10px_28px_-12px_rgba(97,240,210,0.7)] transition hover:brightness-105 active:scale-[0.99]"
        >
          Empezar partida
        </button>
      </div>
    );
  }

  if (phase === "fin" && fin) {
    return (
      <div className="flex flex-col gap-4 rounded-[22px] border border-[#E5E0D5] bg-white p-4 font-texto text-[#0F2D3B] sm:p-5">
        <div className="flex flex-col items-center gap-3 rounded-[20px] bg-[#0F2D3B] px-5 py-8 text-center text-[#F7F5EF]">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#61F0D2]">
            Duelo de cartas
          </span>
          <h2 className="m-0 font-titulos text-[28px] font-bold leading-tight">
            {fin.titulo}
          </h2>
          <p className="m-0 text-[15px] text-[#C9DBE1]">
            Jugadas dentro de la regla:{" "}
            <span className="font-semibold text-white">{fin.pct}%</span>
          </p>
          <p className="m-0 font-titulos text-[22px] font-bold text-[#61F0D2]">
            {fin.score} pts
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={start}
            className="h-12 flex-1 cursor-pointer rounded-2xl border-0 bg-[#0F2D3B] font-texto text-[15px] font-semibold text-[#F7F5EF]"
          >
            Jugar otra
          </button>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="h-12 flex-1 cursor-pointer rounded-2xl border border-[#E5E0D5] bg-white font-texto text-[15px] font-semibold text-[#0F2D3B]"
            >
              Volver a la lista
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!du) return null;

  const myTurn = du.turn === "yo";
  const ruleLabel = du.rule === "color" ? "COLOR" : "NÚMERO";

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-[22px] border border-[#E5E0D5] bg-[#0F2D3B] p-3 font-texto text-[#F7F5EF] sm:gap-4 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver a juegos"
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-white/20 bg-white/10"
            >
              ←
            </button>
          ) : null}
          <h2 className="m-0 truncate font-titulos text-[20px] font-bold sm:text-[22px]">
            Duelo de cartas
          </h2>
        </div>
        <span className="rounded-full bg-[#ECE9F2] px-3 py-1.5 font-texto text-[14px] font-semibold text-[#4F4868]">
          Computadora · {du.cpu.length}
        </span>
      </div>

      <div
        className={`rounded-2xl px-3 py-3 text-center font-titulos text-[18px] font-bold text-[#0F2D3B] transition-colors duration-300 sm:text-[20px] ${
          du.flash ? "animate-pulse" : ""
        }`}
        style={{ background: du.flash ? "#F9D883" : "#FBEBC8" }}
        role="status"
      >
        Regla: por {ruleLabel}
      </div>

      <div className="flex items-center justify-center gap-4 py-1 sm:gap-6">
        <PlayingCard card={du.center} size="lg" />
        <div className="max-w-[110px] text-[15px] leading-snug text-[#A8B8BF]">
          Mazo:{" "}
          <span className="font-semibold text-[#F7F5EF]">{du.deck.length}</span>{" "}
          cartas
        </div>
      </div>

      <p
        className="m-0 min-h-[52px] text-center text-[17px] leading-snug text-[#E4EEF1] sm:text-[18px]"
        aria-live="polite"
      >
        {du.msg}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {du.hand.map((card, i) => (
          <PlayingCard
            key={`${card.c}-${card.n}-${i}`}
            card={card}
            onClick={() => playCard(i)}
            disabled={!myTurn}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={drawCard}
        disabled={!myTurn}
        className="h-14 cursor-pointer rounded-2xl border-2 border-[#61F0D2] bg-transparent font-titulos text-[17px] font-semibold text-[#61F0D2] transition enabled:hover:bg-[#61F0D2]/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Tomar carta
      </button>
    </div>
  );
}
