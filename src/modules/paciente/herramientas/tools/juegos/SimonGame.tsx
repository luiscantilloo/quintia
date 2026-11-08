"use client";

/**
 * Simón dice — port del prototipo simon-dice-juego (secuencia + audio Web Audio).
 * UI alineada a Quintia; la partida alimenta el analizador vía completeSimonPartida.
 */
import { completeSimonPartida } from "@/lib/nara-services/juegos.js";
import {
  getGameCfg,
  isSubeAuto,
} from "@/lib/nara-services/juegos/gameCfg.js";
import { IconoSimon } from "@/components/shared/brand/QuintiaIconos";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const COLORS = ["red", "green", "yellow", "blue"] as const;
type Color = (typeof COLORS)[number];

const DISPLAY_TIME = 520;
const GAP_TIME = 180;

const TILE: Record<
  Color,
  { label: string; bg: string; lit: string; radius: string }
> = {
  red: {
    label: "Roja",
    bg: "#E84B55",
    lit: "#FF8B91",
    radius: "rounded-tl-[100%] rounded-tr-[18%] rounded-br-[18%] rounded-bl-[18%]",
  },
  green: {
    label: "Verde",
    bg: "#28A879",
    lit: "#70F0BD",
    radius: "rounded-tl-[18%] rounded-tr-[100%] rounded-br-[18%] rounded-bl-[18%]",
  },
  yellow: {
    label: "Amarilla",
    bg: "#E8BD42",
    lit: "#FFE58B",
    radius: "rounded-tl-[18%] rounded-tr-[18%] rounded-br-[18%] rounded-bl-[100%]",
  },
  blue: {
    label: "Azul",
    bg: "#4389E8",
    lit: "#9BC4FF",
    radius: "rounded-tl-[18%] rounded-tr-[18%] rounded-br-[100%] rounded-bl-[18%]",
  },
};

const FREQ: Record<Color, number> = {
  red: 261.63,
  green: 329.63,
  yellow: 392,
  blue: 523.25,
};

const BEST_KEY = (pid: string) => `quintia:simon-best:${pid}`;

function readBest(pid: string) {
  try {
    return Number(window.localStorage.getItem(BEST_KEY(pid)) || 0) || 0;
  } catch {
    return 0;
  }
}

function writeBest(pid: string, score: number) {
  try {
    window.localStorage.setItem(BEST_KEY(pid), String(score));
  } catch {
    /* ok */
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function SimonGame({
  patientId,
  onBack,
}: {
  patientId: string;
  onBack?: () => void;
}) {
  const store = useNaraStore();
  const live = useNaraLive();
  const cfg = useMemo(() => getGameCfg(store, "simon"), [store, live]);
  const autoSube = isSubeAuto(cfg);
  const maxHearts = Number(cfg.corazones) === 3 ? 3 : 2;
  const startNivel = Math.min(5, Math.max(1, Number(cfg.nivel) || 1));

  const [round, setRound] = useState(0);
  const [best, setBest] = useState(0);
  const [hearts, setHearts] = useState(maxHearts);
  const [statusTitle, setStatusTitle] = useState("¿Listo para jugar?");
  const [statusText, setStatusText] = useState(
    "Presiona «Iniciar» para comenzar.",
  );
  const [lit, setLit] = useState<Color | null>(null);
  const [tilesOn, setTilesOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [soundOn, setSoundOn] = useState(() => cfg.sonido !== false);
  const [startLabel, setStartLabel] = useState("Iniciar");
  const [canRepeat, setCanRepeat] = useState(false);

  const sequenceRef = useRef<Color[]>([]);
  const playerIndexRef = useRef(0);
  const roundRef = useRef(0);
  const heartsRef = useRef(maxHearts);
  const lastErrorAtRef = useRef<number | null>(null);
  const acceptingRef = useRef(false);
  const runningRef = useRef(false);
  const playbackTokenRef = useRef(0);
  const startedAtRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundOnRef = useRef(cfg.sonido !== false);
  const recordedRef = useRef(false);
  const autoSubeRef = useRef(autoSube);
  const startNivelRef = useRef(startNivel);

  useEffect(() => {
    setBest(readBest(patientId));
  }, [patientId]);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    setSoundOn(cfg.sonido !== false);
    setHearts(maxHearts);
    heartsRef.current = maxHearts;
    autoSubeRef.current = autoSube;
    startNivelRef.current = startNivel;
  }, [cfg.sonido, maxHearts, autoSube, startNivel]);

  useEffect(
    () => () => {
      playbackTokenRef.current += 1;
      runningRef.current = false;
      try {
        audioCtxRef.current?.close();
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const playTone = useCallback((color: Color, duration = 0.22) => {
    if (!soundOnRef.current) return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = FREQ[color] || 440;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration,
      );
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration + 0.02);
    } catch {
      /* sin audio */
    }
  }, []);

  const flash = useCallback(
    async (color: Color, duration = DISPLAY_TIME) => {
      setLit(color);
      playTone(color, Math.min(duration / 1000, 0.35));
      await wait(duration);
      setLit(null);
    },
    [playTone],
  );

  const currentSpeed = useCallback(() => {
    if (!autoSubeRef.current) return DISPLAY_TIME;
    return Math.max(230, DISPLAY_TIME - Math.max(0, roundRef.current - 1) * 16);
  }, []);

  const playSequence = useCallback(async () => {
    const token = ++playbackTokenRef.current;
    acceptingRef.current = false;
    setTilesOn(false);
    setCanRepeat(false);
    const n = sequenceRef.current.length;
    setStatusTitle("Observa la secuencia");
    setStatusText(
      `Memoriza ${n} ${n === 1 ? "color" : "colores"}.`,
    );
    await wait(450);

    for (const color of sequenceRef.current) {
      if (token !== playbackTokenRef.current || !runningRef.current) return;
      await flash(color, currentSpeed());
      await wait(GAP_TIME);
    }

    if (token !== playbackTokenRef.current || !runningRef.current) return;
    playerIndexRef.current = 0;
    acceptingRef.current = true;
    setTilesOn(true);
    setCanRepeat(true);
    setStatusTitle("Tu turno");
    setStatusText("Repite la secuencia en el mismo orden.");
  }, [currentSpeed, flash]);

  const randomSeq = useCallback((len: number) => {
    const out: Color[] = [];
    for (let i = 0; i < len; i++) {
      out.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    return out;
  }, []);

  const addNextColor = useCallback(() => {
    if (!autoSubeRef.current) {
      const len = Math.max(1, startNivelRef.current);
      sequenceRef.current = randomSeq(len);
      roundRef.current = (roundRef.current || 0) + 1;
      setRound(roundRef.current);
      return;
    }
    const next = COLORS[Math.floor(Math.random() * COLORS.length)];
    sequenceRef.current = [...sequenceRef.current, next];
    roundRef.current = sequenceRef.current.length;
    setRound(roundRef.current);
  }, [randomSeq]);

  const finishGame = useCallback(() => {
    runningRef.current = false;
    acceptingRef.current = false;
    playbackTokenRef.current += 1;
    setRunning(false);
    setTilesOn(false);
    setCanRepeat(false);

    const score = autoSubeRef.current
      ? Math.max(0, sequenceRef.current.length - 1)
      : Math.max(0, roundRef.current - 1);
    setBest((prev) => {
      const next = score > prev ? score : prev;
      if (score > prev) writeBest(patientId, score);
      return next;
    });

    setStatusTitle("Partida terminada");
    setStatusText("Puedes intentarlo nuevamente.");
    const localBest = Math.max(score, readBest(patientId));
    setResultMsg(
      `Completaste ${score} ${score === 1 ? "ronda" : "rondas"}. Récord: ${localBest}.`,
    );
    setGameOver(true);
    setStartLabel("Jugar otra vez");

    if (!recordedRef.current) {
      recordedRef.current = true;
      completeSimonPartida(store, patientId, {
        startedAt: startedAtRef.current,
        pasos: score,
        errorAt:
          lastErrorAtRef.current != null
            ? lastErrorAtRef.current
            : playerIndexRef.current,
        version: Number(cfg.version) || 1,
        nivel: startNivelRef.current,
      });
    }
  }, [cfg.version, patientId, store]);

  const startGame = useCallback(async () => {
    playbackTokenRef.current += 1;
    sequenceRef.current = [];
    playerIndexRef.current = 0;
    roundRef.current = 0;
    heartsRef.current = maxHearts;
    lastErrorAtRef.current = null;
    setHearts(maxHearts);
    runningRef.current = true;
    acceptingRef.current = false;
    recordedRef.current = false;
    startedAtRef.current = Date.now();
    setRound(0);
    setGameOver(false);
    setResultMsg("");
    setRunning(true);
    setStartLabel("Reiniciar");
    setTilesOn(false);
    if (autoSubeRef.current) {
      const seed = Math.max(1, startNivelRef.current);
      sequenceRef.current = randomSeq(seed);
      roundRef.current = seed;
      setRound(seed);
    } else {
      addNextColor();
    }
    await playSequence();
  }, [addNextColor, maxHearts, playSequence, randomSeq]);

  const nextRound = useCallback(async () => {
    acceptingRef.current = false;
    setTilesOn(false);
    setCanRepeat(false);
    addNextColor();
    await wait(500);
    await playSequence();
  }, [addNextColor, playSequence]);

  const handleTile = useCallback(
    async (color: Color) => {
      if (!runningRef.current || !acceptingRef.current) return;
      acceptingRef.current = false;
      setTilesOn(false);
      await flash(color, 180);

      if (color !== sequenceRef.current[playerIndexRef.current]) {
        lastErrorAtRef.current = playerIndexRef.current;
        const left = heartsRef.current - 1;
        heartsRef.current = left;
        setHearts(left);
        if (left <= 0) {
          finishGame();
          return;
        }
        setStatusTitle("Falló un color");
        setStatusText(
          `Le quedan ${left} ${left === 1 ? "corazón" : "corazones"}. Observe de nuevo.`,
        );
        await wait(500);
        if (runningRef.current) await playSequence();
        return;
      }

      playerIndexRef.current += 1;
      setCanRepeat(false);
      if (playerIndexRef.current === sequenceRef.current.length) {
        setStatusTitle("¡Muy bien!");
        setStatusText("Secuencia correcta. Preparando la siguiente ronda…");
        await wait(450);
        if (runningRef.current) await nextRound();
      } else {
        acceptingRef.current = true;
        setTilesOn(true);
        const left = sequenceRef.current.length - playerIndexRef.current;
        setStatusTitle("¡Correcto!");
        setStatusText(
          `Te faltan ${left} ${left === 1 ? "color" : "colores"}.`,
        );
      }
    },
    [finishGame, flash, nextRound, playSequence],
  );

  const onRepeat = () => {
    if (!runningRef.current || !acceptingRef.current || playerIndexRef.current !== 0) {
      return;
    }
    void playSequence();
  };

  return (
    <div className="flex flex-col gap-4 font-texto text-[#0F2D3B] motion-safe:animate-[q-form-in_0.35s_ease-out_both]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-fit cursor-pointer border-0 bg-transparent p-0 font-texto text-[18px] text-[#0F2D3B]"
        >
          ← Juegos
        </button>
        <button
          type="button"
          onClick={() => setSoundOn((v) => !v)}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-white px-3 font-texto text-[13px] text-[#0F2D3B]"
          aria-pressed={soundOn}
          title={soundOn ? "Desactivar sonido" : "Activar sonido"}
        >
          <span aria-hidden>{soundOn ? "🔊" : "🔇"}</span>
          Sonido
        </button>
      </div>

      <header className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#EEF3FB]">
          <IconoSimon className="h-8 w-8" />
        </span>
        <div>
          <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#436FD2]">
            Quintia · Explora
          </p>
          <h2 className="m-0 font-titulos text-[26px] font-extrabold tracking-tight text-[#0F2D3B]">
            Simón dice
          </h2>
          <p className="m-0 font-texto text-[14px] text-[#5B6770]">
            Memoria de trabajo y atención
          </p>
        </div>
      </header>

      <section
        className="grid grid-cols-[64px_1fr_64px] items-center gap-2 rounded-2xl border border-[#E5E0D5] bg-white px-3 py-3.5"
        aria-live="polite"
      >
        <div className="text-center">
          <p className="m-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[#5B6770]">
            Ronda
          </p>
          <p className="m-0 font-titulos text-[26px] font-extrabold tabular-nums text-[#0F2D3B]">
            {round}
          </p>
        </div>
        <div className="min-w-0 text-center">
          <p className="m-0 font-titulos text-[15px] font-bold text-[#0F2D3B]">
            {statusTitle}
          </p>
          <p className="m-0 mt-0.5 font-texto text-[12px] leading-snug text-[#5B6770]">
            {statusText}
          </p>
          <p
            className="m-0 mt-1.5 font-texto text-[16px] tracking-[0.08em] text-[#E84B55]"
            aria-label={`${hearts} corazones`}
          >
            {"♥".repeat(Math.max(0, hearts))}
            <span className="text-[#E5E0D5]">
              {"♥".repeat(Math.max(0, maxHearts - hearts))}
            </span>
          </p>
        </div>
        <div className="text-center">
          <p className="m-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[#5B6770]">
            Récord
          </p>
          <p className="m-0 font-titulos text-[26px] font-extrabold tabular-nums text-[#0F2D3B]">
            {best}
          </p>
        </div>
      </section>

      <section
        className="mx-auto grid w-full max-w-[390px] place-items-center"
        aria-label="Tablero de cuatro colores"
      >
        <div
          className="relative grid aspect-square w-full grid-cols-2 grid-rows-2 gap-3 rounded-full border-[8px] border-[#0F2D3B] bg-[#0F2D3B] p-3 shadow-[0_14px_30px_rgba(15,45,59,0.2)]"
        >
          {COLORS.map((color) => {
            const t = TILE[color];
            const isLit = lit === color;
            return (
              <button
                key={color}
                type="button"
                disabled={!tilesOn}
                onClick={() => void handleTile(color)}
                aria-label={`Tarjeta ${t.label}`}
                className={`border-0 transition duration-100 ${t.radius} ${
                  tilesOn ? "cursor-pointer" : "cursor-default"
                } ${isLit ? "scale-[0.975] opacity-100" : "opacity-[0.82]"} disabled:opacity-70`}
                style={{
                  background: isLit ? t.lit : t.bg,
                  boxShadow: isLit ? `0 0 28px ${t.lit}` : undefined,
                  filter: isLit ? "brightness(1.15) saturate(1.15)" : undefined,
                }}
              />
            );
          })}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 grid size-[112px] -translate-x-1/2 -translate-y-1/2 place-content-center rounded-full border-[5px] border-[#293A52] bg-[#F7F5EF] text-center shadow-md max-[420px]:size-[88px] max-[420px]:border-4"
            aria-hidden
          >
            <span className="font-titulos text-[15px] font-extrabold tracking-[0.12em] text-[#0F2D3B] max-[420px]:text-[13px]">
              SIMÓN
            </span>
            <span className="mt-0.5 font-mono text-[8px] tracking-[0.18em] text-[#5B6770]">
              MEMORY
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={() => void startGame()}
          className="h-12 min-w-[142px] cursor-pointer rounded-xl border-0 bg-[#0F2D3B] px-5 font-texto text-[15px] font-semibold text-[#F7F5EF] transition hover:brightness-110"
        >
          {startLabel}
        </button>
        <button
          type="button"
          disabled={!canRepeat || !running}
          onClick={onRepeat}
          className="h-12 cursor-pointer rounded-xl border border-[#E5E0D5] bg-white px-4 font-texto text-[13px] font-medium text-[#0F2D3B] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Repetir secuencia
        </button>
      </div>

      <p className="m-0 text-center font-texto text-[13px] text-[#5B6770]">
        Observa las luces y repite la secuencia en el mismo orden.
      </p>

      {gameOver ? (
        <section className="rounded-2xl border border-[#E5E0D5] bg-white px-5 py-5 text-center">
          <p className="m-0 text-[22px] text-[#DA9E46]" aria-hidden>
            ✦
          </p>
          <h3 className="m-0 mt-1 font-titulos text-[19px] font-extrabold text-[#0F2D3B]">
            ¡Fin de la partida!
          </h3>
          <p className="m-0 mt-1 font-texto text-[14px] text-[#5B6770]">
            {resultMsg}
          </p>
          <button
            type="button"
            onClick={() => void startGame()}
            className="mt-4 h-11 cursor-pointer rounded-xl border-0 bg-[#31C6E6] px-5 font-texto text-[14px] font-semibold text-[#0F2D3B]"
          >
            Jugar otra vez
          </button>
        </section>
      ) : null}
    </div>
  );
}
