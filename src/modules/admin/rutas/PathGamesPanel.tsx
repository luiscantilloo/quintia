"use client";

import { useEffect, useMemo, useState } from "react";
import { QuintiaGameIcon } from "@/modules/admin/rutas/QuintiaGameIcon";

type PathGame = {
  id: string;
  nombre: string;
  hab: string;
  version: number;
  campos?: { l: string; opts: string[]; cur: string }[];
  hist?: { v: number; cuando: string; cambio: string; quien: string }[];
};

function StepNavLite({
  onPrev,
  onNext,
  showNext,
  label,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  showNext?: boolean;
  label?: string;
}) {
  return (
    <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-linea bg-white/95 p-4 shadow-[0_8px_24px_rgba(20,47,60,0.08)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="font-texto text-sm text-nara-tinta/55">
        {label || "Configure la ruta por etapas"}
      </p>
      <div className="flex flex-wrap gap-2">
        {onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="h-11 rounded-xl border border-linea bg-white px-4 font-texto text-sm text-nara-tinta transition hover:bg-nara-crema"
          >
            Anterior
          </button>
        ) : null}
        {showNext ? (
          <button
            type="button"
            onClick={onNext}
            className="h-11 rounded-xl bg-nara-tinta px-5 font-texto text-sm font-medium text-white transition hover:opacity-95"
          >
            Siguiente
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Parte cambios tipo "Campo: 20 → 18" en piezas visuales. */
function CambioParts({ text }: { text: string }) {
  const m = text.match(/^(.*?):\s*(.+?)\s*(?:→|->)\s*(.+)$/);
  if (!m) {
    return <span>{text.replace(/->/g, "→")}</span>;
  }
  const [, label, from, to] = m;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-nara-tinta/70">{label}:</span>
      <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[12px] text-nara-tinta/50 line-through decoration-nara-tinta/30">
        {from.trim()}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className="text-[#31C6E6]"
        aria-hidden
      >
        <path
          d="M2 6h7.5M6.5 3.5 9.5 6l-3 2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="rounded-md bg-[#E7F4EF] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[#1F6B5A]">
        {to.trim()}
      </span>
    </span>
  );
}

function SegmentedOptions({
  opts,
  value,
  onChange,
  numeric,
}: {
  opts: string[];
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap rounded-2xl border border-linea bg-[#F3F0EA] p-1 ${
        numeric ? "gap-0" : "gap-1"
      }`}
      role="group"
    >
      {opts.map((o) => {
        const sel = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`h-9 rounded-xl px-3.5 font-texto text-[13px] transition-all duration-200 ${
              numeric ? "min-w-10 px-0 sm:min-w-11" : ""
            } ${
              sel
                ? "bg-nara-tinta font-semibold text-white shadow-[0_4px_12px_rgba(20,47,60,0.18)]"
                : "bg-transparent font-medium text-nara-tinta/55 hover:bg-white/70 hover:text-nara-tinta"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function GameConfigBody({
  game,
  open,
  onSaveVersion,
}: {
  game: PathGame;
  open: boolean;
  onSaveVersion?: (
    gameId: string,
    draftCampos: Record<string, string>,
  ) => { version?: number } | void;
}) {
  const base = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of game.campos || []) m[f.l] = f.cur;
    return m;
  }, [game]);

  const [draft, setDraft] = useState<Record<string, string>>(base);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    setDraft(base);
    setSavedMsg("");
  }, [base]);

  const dirty = (game.campos || []).some((f) => draft[f.l] !== f.cur);

  return (
    <div
      className={`border-t border-linea/80 px-4 pb-5 pt-4 transition-[opacity,transform] duration-300 ease-out sm:px-5 ${
        open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
      }`}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        {/* Config */}
        <div className="rounded-2xl border border-linea bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
                Configuración
              </p>
              <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
                Parámetros del módulo
              </p>
            </div>
            <span className="rounded-full bg-nara-crema px-2.5 py-1 font-mono text-[11px] text-nara-tinta/55">
              v{game.version}
            </span>
          </div>

          <div className="flex flex-col divide-y divide-linea/70">
            {(game.campos || []).map((f) => {
              const allNumeric = f.opts.every((o) => /^\d+$/.test(o));
              return (
                <div
                  key={f.l}
                  className="flex flex-col gap-2.5 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <span className="shrink-0 font-texto text-sm font-medium text-nara-tinta">
                    {f.l}
                  </span>
                  <SegmentedOptions
                    opts={f.opts}
                    value={draft[f.l] ?? f.cur}
                    numeric={allNumeric}
                    onChange={(v) => {
                      setDraft((d) => ({ ...d, [f.l]: v }));
                      setSavedMsg("");
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-linea/70 pt-4">
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                if (!dirty) return;
                const saved = onSaveVersion?.(game.id, draft);
                const v = Number(saved?.version) || game.version + 1;
                setSavedMsg(`Versión ${v} vigente. Ya aplica en las partidas nuevas.`);
              }}
              className={`h-10 rounded-xl px-4 font-texto text-sm font-semibold transition ${
                dirty
                  ? "bg-[#31C6E6] text-white shadow-[0_6px_16px_rgba(43,138,116,0.28)] hover:brightness-105"
                  : "cursor-default border border-linea bg-nara-crema text-nara-tinta/40"
              }`}
            >
              {dirty
                ? `Guardar como versión ${game.version + 1}`
                : "Sin cambios"}
            </button>
            {savedMsg ? (
              <span className="font-texto text-[13px] text-[#2C6247]">
                {savedMsg}
              </span>
            ) : dirty ? (
              <span className="font-texto text-[13px] text-[#8B4AD4]">
                Se creará una versión nueva y aplicará al instante
              </span>
            ) : null}
          </div>
        </div>

        {/* Historial */}
        <div className="rounded-2xl border border-linea bg-nara-crema/60 p-4 sm:p-5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-nara-tinta/45">
            Historial
          </p>
          <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
            Versiones publicadas
          </p>

          {(game.hist || []).length ? (
            <ul className="mt-4 flex flex-col gap-3">
              {game.hist!.map((h, i) => (
                <li
                  key={h.v}
                  className={`rounded-xl border px-3.5 py-3 transition ${
                    i === 0
                      ? "border-[#31C6E6]/35 bg-white shadow-[0_2px_8px_rgba(43,138,116,0.08)]"
                      : "border-transparent bg-white/55"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex h-6 items-center rounded-md px-2 font-mono text-[11px] font-semibold ${
                        i === 0
                          ? "bg-[#31C6E6] text-white"
                          : "bg-nara-tinta/8 text-nara-tinta/70"
                      }`}
                    >
                      v{h.v}
                    </span>
                    {i === 0 ? (
                      <span className="font-texto text-[11px] font-medium text-[#31C6E6]">
                        Vigente
                      </span>
                    ) : null}
                    <span className="ml-auto font-texto text-[11px] text-nara-tinta/45">
                      {h.cuando}
                    </span>
                  </div>
                  <p className="mt-2 font-texto text-[13px] leading-snug text-nara-tinta/80">
                    <CambioParts text={h.cambio} />
                  </p>
                  <p className="mt-1 font-texto text-[12px] text-nara-tinta/45">
                    {h.quien}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 font-texto text-sm text-nara-tinta/45">
              Aún no hay versiones.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PathGamesPanel({
  games,
  onPrev,
  onNext,
  onSaveVersion,
}: {
  games: PathGame[];
  onPrev?: () => void;
  onNext?: () => void;
  onSaveVersion?: (
    gameId: string,
    draftCampos: Record<string, string>,
  ) => { version?: number } | void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-[#D4CFE3] bg-[#F7F5FA] px-4 py-3 font-texto text-sm text-[#4F4868]">
        Cambiar la configuración crea una versión nueva. El analizador compara cada
        partida con partidas de la misma versión.
      </div>
      {games.map((j) => {
        const open = openId === j.id;
        return (
          <div
            key={j.id}
            className="overflow-hidden rounded-2xl border border-linea bg-white shadow-[0_1px_0_rgba(20,47,60,0.04)]"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : j.id)}
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center gap-3.5 border-0 bg-transparent px-5 py-4 text-left transition-colors hover:bg-nara-crema/50"
            >
              <QuintiaGameIcon kind={j.id} size={40} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-titulos text-lg font-extrabold text-nara-tinta">
                  {j.nombre}
                </span>
                <span className="font-texto text-[13px] text-nara-tinta/55">
                  {j.hab}
                </span>
              </span>
              <span className="hidden font-mono text-[11px] text-nara-tinta/45 sm:inline">
                v{j.version}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-300 ease-out ${
                  open
                    ? "rotate-180 bg-[#E1EDF1] text-[#31C6E6]"
                    : "bg-nara-crema text-nara-tinta/60"
                }`}
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6.2 8 10.2 12 6.2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="min-h-0 overflow-hidden">
                <GameConfigBody
                  game={j}
                  open={open}
                  onSaveVersion={onSaveVersion}
                />
              </div>
            </div>
          </div>
        );
      })}
      <StepNavLite
        onPrev={onPrev}
        onNext={onNext}
        showNext={!!onNext}
        label="4 juegos activos"
      />
    </div>
  );
}
