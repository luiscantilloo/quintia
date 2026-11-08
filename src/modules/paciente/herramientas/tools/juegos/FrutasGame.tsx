"use client";

/**
 * Frutas · mesa de juego a pantalla: chrome mínimo + iframe embebido.
 * Dirección: puesto de frutas / orchard tablet (terracota + crema Quintia).
 */
import { completeFrutasPartida } from "@/lib/nara-services/juegos.js";
import {
  frutasQueryFromCfg,
  getGameCfg,
} from "@/lib/nara-services/juegos/gameCfg.js";
import { IconoFrutas } from "@/components/shared/brand/QuintiaIconos";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { useEffect, useMemo, useRef, useState } from "react";

type PartidaDetail = {
  pid?: string | null;
  game?: string;
  version?: number;
  valor?: number;
  dur?: number;
  tipo?: string;
  metr?: {
    invalidos?: number;
    combos?: number[];
    tiempos?: number[];
    sinUsar?: number;
  };
};

export function FrutasGame({
  patientId,
  onBack,
}: {
  patientId: string;
  onBack?: () => void;
}) {
  const store = useNaraStore();
  const live = useNaraLive();
  const recordedRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const [ready, setReady] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const cfg = useMemo(() => getGameCfg(store, "frutas"), [store, live]);
  const cfgKey = [
    cfg.version,
    cfg.mov,
    cfg.sonido ? 1 : 0,
    cfg.nivel,
    cfg.sube,
  ].join("|");

  const src = useMemo(() => {
    const q = new URLSearchParams({
      ...frutasQueryFromCfg(cfg, {
        pid: String(patientId || ""),
        tipo: "Libre",
        sync: "1",
        embed: "1",
        v: "8",
      }),
    });
    return `/juegos/frutas/index.html?${q.toString()}`;
    // cfgKey fija cuándo recargar el iframe (no en cada tick del store).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, cfgKey]);

  // Solo al cambiar el iframe: no resetear ready en cada tick de live/store
  // (eso dejaba «Preparando el puesto…» para siempre).
  useEffect(() => {
    setReady(false);
    recordedRef.current = false;
    startedAtRef.current = Date.now();
    setLastScore(null);
    const t = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(t);
  }, [src]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || data.type !== "quintia:partida") return;
      const detail = (data.detail || {}) as PartidaDetail;
      if (detail.game && detail.game !== "frutas") return;
      if (recordedRef.current) return;
      recordedRef.current = true;

      const metr = detail.metr || {};
      const score = Number(detail.valor) || 0;
      setLastScore(score);
      const start =
        detail.dur != null
          ? Date.now() - Math.max(1, Number(detail.dur) || 1) * 1000
          : startedAtRef.current;

      completeFrutasPartida(store, patientId, {
        startedAt: start,
        score,
        durSec: detail.dur != null ? Number(detail.dur) : null,
        invalidos: metr.invalidos,
        combos: metr.combos,
        tiempos: metr.tiempos,
        sinUsar: metr.sinUsar,
        version: detail.version || cfg.version || 1,
        tipo: detail.tipo === "Programada" ? "Programada" : "Libre",
        nivel: cfg.nivel,
      });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [patientId, store, cfg]);

  return (
    <div className="relative -mx-[18px] flex min-h-[calc(100dvh-7.25rem)] flex-col font-texto text-[#0F2D3B] motion-safe:animate-[q-form-in_0.35s_ease-out_both] sm:mx-0 sm:min-h-0">
      <div className="flex items-center justify-between gap-3 px-[18px] sm:px-0">
        <button
          type="button"
          onClick={onBack}
          className="w-fit cursor-pointer border-0 bg-transparent p-0 font-texto text-[18px] text-[#0F2D3B] transition active:opacity-70"
        >
          ← Juegos
        </button>
        {lastScore != null ? (
          <span className="rounded-full bg-[#2B8A74]/12 px-3 py-1 font-titulos text-[13px] font-bold tabular-nums text-[#2B8A74]">
            {lastScore} XP
          </span>
        ) : null}
      </div>

      <header className="mt-3 flex items-center gap-3 px-[18px] sm:px-0">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFF0E4] shadow-[inset_0_0_0_1px_rgba(194,114,65,0.18)]">
          <IconoFrutas className="h-8 w-8" />
        </span>
        <div className="min-w-0">
          <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#C27241]">
            Quintia · Explora
          </p>
          <h2 className="m-0 font-titulos text-[26px] font-extrabold tracking-tight text-[#0F2D3B]">
            Frutas
          </h2>
          <p className="m-0 font-texto text-[14px] text-[#5B6770]">
            Atención visual y planificación
          </p>
        </div>
      </header>

      <div className="relative mt-4 flex min-h-[min(68dvh,560px)] flex-1 flex-col overflow-hidden sm:mt-5 sm:min-h-[520px] sm:rounded-[28px] sm:shadow-[0_18px_48px_rgba(15,45,59,0.12)]">
        {!ready ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#F7F5EF]/92 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-2.5 animate-bounce rounded-full bg-[#C27241] [animation-delay:0ms]" />
                <span className="size-2.5 animate-bounce rounded-full bg-[#E8BD42] [animation-delay:120ms]" />
                <span className="size-2.5 animate-bounce rounded-full bg-[#6C04C9] [animation-delay:240ms]" />
              </span>
              <p className="m-0 font-texto text-sm text-[#5B6770]">Preparando el puesto…</p>
            </div>
          </div>
        ) : null}
        <iframe
          title="Frutas · Quintia"
          src={src}
          onLoad={() => setReady(true)}
          className="block h-full min-h-[min(68dvh,560px)] w-full flex-1 border-0 bg-transparent sm:min-h-[520px]"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
