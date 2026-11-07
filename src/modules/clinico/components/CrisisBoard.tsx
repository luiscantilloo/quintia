"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TableSearch } from "@/components/shared/table-search/TableSearch";
import { CrisisLiveMap } from "@/modules/clinico/components/CrisisLiveMap";
import type { CrisisLoc } from "@/lib/crisis/crisisLocation";

type CrisisAlert = Record<string, unknown>;

type CrisisTab = {
  id: string;
  label: string;
  n: number;
  active: boolean;
  pick: () => void;
  hint: string;
};

type Props = {
  crisisTab: string;
  tabs: CrisisTab[];
  lateCount: number;
  crisisQ: string;
  setCrisisQ: (q: string) => void;
  goCrisisHistory: () => void;
  toTake: CrisisAlert[];
  mine: CrisisAlert[];
  others: CrisisAlert[];
  info: CrisisAlert[];
  /** Esperan «estoy bien» del paciente. */
  awaiting: CrisisAlert[];
  /** Cerradas hoy de verdad. */
  closed: CrisisAlert[];
};

function alertKey(a: CrisisAlert, i: number) {
  return String(a.id || a.pid || `${a.name}-${i}`);
}

/**
 * Sala de crisis — tablero de despacho.
 * Una composición: franja de mando + cola densa + ficha de trabajo.
 */
export function CrisisBoard({
  crisisTab,
  tabs,
  lateCount,
  crisisQ,
  setCrisisQ,
  goCrisisHistory,
  toTake,
  mine,
  awaiting,
  closed,
}: Props) {
  /** Colas operativas (por tomar / en atención) — con ficha de trabajo. */
  const queue = useMemo(() => {
    if (crisisTab === "take") return toTake;
    if (crisisTab === "mine") return mine;
    return [];
  }, [crisisTab, toTake, mine]);

  const pending = toTake.length + mine.length;
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!queue.length) {
      setFocusId(null);
      return;
    }
    const stillThere = queue.some((a, i) => alertKey(a, i) === focusId);
    if (!stillThere) setFocusId(alertKey(queue[0]!, 0));
  }, [queue, focusId]);

  const focused = useMemo(() => {
    if (!queue.length) return null;
    const idx = queue.findIndex((a, i) => alertKey(a, i) === focusId);
    return queue[idx >= 0 ? idx : 0] || null;
  }, [queue, focusId]);

  const emptyCopy = crisisQ.trim()
    ? "Ningún caso coincide con la búsqueda."
    : crisisTab === "take"
      ? "Cola limpia. No hay crisis por tomar."
      : crisisTab === "mine"
        ? "Sin casos a su cargo. Tome uno en «Por tomar»."
        : crisisTab === "done"
          ? "Todavía no hay crisis cerradas hoy."
          : "Nadie espera confirmación del paciente.";

  return (
    <div className="crisis-board -mx-[var(--nara-page-pad-x)] flex flex-col">
      <style>{`
        @keyframes crisis-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes crisis-pulse-rail {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .crisis-board .cb-in {
          animation: crisis-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .crisis-board .cb-rail-late {
          animation: crisis-pulse-rail 1.4s ease-in-out infinite;
        }
      `}</style>

      {/* Franja de mando — full bleed */}
      <header className="cb-in relative overflow-hidden bg-[#0F2D3B] text-[#F7F5EF]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 40%, rgba(218,158,70,0.12) 70%, transparent 100%), repeating-linear-gradient(-12deg, transparent, transparent 28px, rgba(0,0,0,0.04) 28px, rgba(0,0,0,0.04) 29px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-8 top-0 h-full w-1/3 bg-gradient-to-l from-[#31C6E6]/25 to-transparent"
          aria-hidden
        />

        <div className="relative px-[var(--nara-page-pad-x)] pb-5 pt-[var(--nara-page-pad-y)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:gap-8">
              <div className="flex flex-col gap-1">
                <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#E5E0D5]">
                  Sala de crisis · despacho
                </p>
                <h1 className="m-0 font-titulos text-[clamp(2.4rem,7vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
                  Crisis
                </h1>
              </div>
              <div className="flex items-baseline gap-3 border-l-0 sm:border-l sm:border-[#E5E0D5]/35 sm:pl-8">
                <span className="font-titulos text-[clamp(2.75rem,8vw,4rem)] font-extrabold leading-none tracking-tight text-[#31C6E6]">
                  {pending}
                </span>
                <span className="max-w-[7rem] pb-1 font-texto text-[13px] leading-snug text-[#E5E0D5]">
                  abiertas ahora
                  {lateCount > 0 ? (
                    <>
                      <br />
                      <span className="font-semibold text-[#E7FAF5]">
                        {lateCount} fuera de meta
                      </span>
                    </>
                  ) : null}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <TableSearch
                value={crisisQ}
                onChange={setCrisisQ}
                placeholder="Buscar paciente…"
                className="w-full sm:w-56 [&_input]:h-10 [&_input]:rounded-none [&_input]:border-[#E5E0D5]/35 [&_input]:bg-[#0F2D3B] [&_input]:text-[#F7F5EF] [&_input]:placeholder:text-[#E5E0D5]/70"
              />
              <button
                type="button"
                onClick={goCrisisHistory}
                className="inline-flex h-10 cursor-pointer items-center gap-2 border border-[#E5E0D5]/40 bg-transparent px-4 font-texto text-sm font-medium text-[#F7F5EF] transition hover:bg-white/10"
              >
                Historial
                <span aria-hidden className="font-mono text-xs">
                  →
                </span>
              </button>
            </div>
          </div>

          <nav
            className="mt-6 flex gap-0 overflow-x-auto border-b border-[#E5E0D5]/25"
            aria-label="Filtros de crisis"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => t.pick?.()}
                title={t.hint}
                className={
                  t.active
                    ? "relative -mb-px flex cursor-pointer items-baseline gap-2 border-b-[3px] border-[#31C6E6] px-4 py-3 text-[#F7F5EF] transition"
                    : "relative -mb-px flex cursor-pointer items-baseline gap-2 border-b-[3px] border-transparent px-4 py-3 text-[#E5E0D5] transition hover:text-[#F7F5EF]"
                }
              >
                <span className="font-titulos text-xl font-bold leading-none">{t.n}</span>
                <span className="whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.06em]">
                  {t.label}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {lateCount > 0 ? (
        <div className="cb-in flex items-center gap-3 border-b border-[#6B0000]/20 bg-[#6B0000] px-[var(--nara-page-pad-x)] py-2.5 text-[#E7FAF5]">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#E7FAF5]" />
          <p className="m-0 text-[13px] font-medium">
            {lateCount === 1
              ? "1 alerta supera los 30 minutos — priorizar."
              : `${lateCount} alertas superan los 30 minutos — priorizar.`}
          </p>
        </div>
      ) : null}

      <div className="px-[var(--nara-page-pad-x)] pb-2 pt-5">
        {crisisTab === "done" ? (
          closed.length ? (
            <ClosedList items={closed} title={`Gestionadas hoy · ${closed.length}`} />
          ) : (
            <EmptyState>{emptyCopy}</EmptyState>
          )
        ) : crisisTab === "all" ? (
          awaiting.length ? (
            <ClosedList
              items={awaiting}
              title={`Esperan «estoy bien» · ${awaiting.length}`}
            />
          ) : (
            <EmptyState>{emptyCopy}</EmptyState>
          )
        ) : !queue.length ? (
          <EmptyState>{emptyCopy}</EmptyState>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-stretch">
            {/* Cola — log denso */}
            <aside className="cb-in flex flex-col border border-[#E5E0D5] bg-white lg:border-r-0">
              <div className="flex items-center justify-between border-b border-[#E5E0D5] bg-[#F7F5EF] px-4 py-3">
                <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                  Cola
                </p>
                <span className="font-mono text-[12px] tabular-nums text-[#0F2D3B]">
                  {queue.length}
                </span>
              </div>
              <ul className="m-0 flex max-h-[min(70vh,640px)] list-none flex-col overflow-y-auto p-0">
                {queue.map((a, i) => {
                  const id = alertKey(a, i);
                  const active = focusId ? id === focusId : i === 0;
                  const late = !!a.isLate;
                  const rail = a.canTake
                    ? "bg-[#6B0000]"
                    : a.isMine
                      ? "bg-[#31C6E6]"
                      : a.isOther
                        ? "bg-[#31C6E6]"
                        : "bg-[#E5E0D5]";
                  return (
                    <li key={id} className="border-b border-[#E3DFCF] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setFocusId(id)}
                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                        className={
                          active
                            ? "cb-in relative flex w-full cursor-pointer gap-0 bg-[#0F2D3B] text-left text-[#F7F5EF] transition"
                            : "cb-in relative flex w-full cursor-pointer gap-0 bg-white text-left text-[#0F2D3B] transition hover:bg-[#F7F5EF]"
                        }
                      >
                        <span
                          className={[
                            "w-1.5 shrink-0 self-stretch",
                            rail,
                            late && !active ? "cb-rail-late" : "",
                          ].join(" ")}
                          aria-hidden
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-3.5">
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate font-titulos text-[15px] font-bold leading-tight">
                              {String(a.name || "Paciente")}
                            </span>
                            <span
                              className={
                                active
                                  ? "shrink-0 font-mono text-[11px] text-[#E5E0D5]"
                                  : "shrink-0 font-mono text-[11px] text-[#6B7280]"
                              }
                            >
                              {String(a.ago || "")}
                            </span>
                          </span>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {late ? (
                              <span
                                className={
                                  active
                                    ? "font-mono text-[10px] font-bold uppercase tracking-wider text-[#E7FAF5]"
                                    : "font-mono text-[10px] font-bold uppercase tracking-wider text-[#6B0000]"
                                }
                              >
                                Tarde
                              </span>
                            ) : null}
                            <span
                              className={
                                active
                                  ? "text-[11px] text-[#E5E0D5]"
                                  : "text-[11px] text-[#6B7280]"
                              }
                            >
                              {a.canTake
                                ? "Por tomar"
                                : a.isMine
                                  ? "Su caso"
                                  : a.isOther
                                    ? String(a.takenBy || "Colega")
                                    : String(a.sevLabel || "Info")}
                            </span>
                            {a.place ? (
                              <span
                                className={
                                  active
                                    ? "truncate font-mono text-[11px] text-[#E5E0D5]/80"
                                    : "truncate font-mono text-[11px] text-[#6B7280]"
                                }
                              >
                                · {String(a.place)}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Ficha de trabajo */}
            <div className="cb-in min-w-0 border border-[#E5E0D5] bg-white" style={{ animationDelay: "80ms" }}>
              {focused ? <CaseSheet a={focused} /> : <EmptyState>{emptyCopy}</EmptyState>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center border border-dashed border-[#E5E0D5] bg-[#F7F5EF]/60 px-8 py-16 text-center">
      <p className="m-0 mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B7280]">
        Cola vacía
      </p>
      <p className="m-0 max-w-sm font-titulos text-lg font-semibold leading-snug text-[#0F2D3B]">
        {children}
      </p>
    </div>
  );
}

function ClosedList({
  items,
  title,
}: {
  items: CrisisAlert[];
  title?: string;
}) {
  if (!items.length) {
    return <EmptyState>Todavía no ha registrado atenciones hoy.</EmptyState>;
  }
  return (
    <div className="cb-in overflow-hidden border border-[#E5E0D5] bg-white">
      <div className="border-b border-[#E5E0D5] bg-[#F7F5EF] px-5 py-3">
        <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
          {title || `Gestionadas hoy · ${items.length}`}
        </p>
      </div>
      {items.map((c, i) => (
        <div
          key={String(c.id || i)}
          className="flex flex-col gap-3 border-t border-[#E3DFCF] px-5 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={
                c.waiting
                  ? "mt-1 h-3 w-3 shrink-0 rounded-full bg-[#31C6E6] ring-4 ring-[#31C6E6]/25"
                  : "mt-1 h-3 w-3 shrink-0 rounded-full bg-[#31C6E6] ring-4 ring-[#E5E0D5]/60"
              }
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-titulos text-lg font-bold text-[#0F2D3B]">
                {String(c.name || "")}
              </span>
              <span className="text-[14px] text-[#0F2D3B]">{String(c.outcome || "")}</span>
              <span className="text-[13px] text-[#6B7280]">{String(c.meta || "")}</span>
            </div>
          </div>
          {c.canReopen ? (
            <button
              type="button"
              onClick={() => (c.reopen as () => void)?.()}
              className="h-10 shrink-0 cursor-pointer border-[1.5px] border-[#0F2D3B] bg-white px-4 font-texto text-[13px] font-semibold text-[#0F2D3B]"
            >
              {(c.reopenLabel as string) || "Reabrir"}
            </button>
          ) : (
            <span
              className={
                c.waiting
                  ? "shrink-0 border border-[#31C6E6] bg-[#E7FAF5] px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-[#0F2D3B]"
                  : "shrink-0 border border-[#E5E0D5] bg-[#E5E0D5]/50 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-[#0F2D3B]"
              }
            >
              {(c.statusLabel as string) ||
                (c.waiting ? "Esperando paciente" : "Cerrada")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function CaseSheet({ a }: { a: CrisisAlert }) {
  const late = !!a.isLate;
  const mine = !!a.isMine;
  const take = !!a.canTake;
  const phone = String(a.phone || "—");
  const telHref = phone.replace(/\s/g, "");
  const loc = (a.loc as CrisisLoc | undefined) || null;
  const showMap = !!a.isCrisis || take || mine || !!a.isOther;

  return (
    <article className="flex h-full min-h-[320px] flex-col">
      {/* Cabecera del caso */}
      <div
        className={[
          "relative px-5 py-5 sm:px-7 sm:py-6",
          take
            ? "bg-[#6B0000] text-white"
            : mine
              ? "bg-[#0F2D3B] text-[#F7F5EF]"
              : "bg-[#F7F5EF] text-[#0F2D3B]",
        ].join(" ")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  take || mine
                    ? "border border-white/25 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
                    : "border border-[#E5E0D5] bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
                }
              >
                {String(a.sevLabel || "Crisis")}
              </span>
              {late ? (
                <span className="inline-flex items-center gap-1.5 bg-[#E7FAF5] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[#6B0000]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6B0000]" />
                  Fuera de tiempo
                </span>
              ) : null}
            </div>
            <h2 className="m-0 font-titulos text-[clamp(1.75rem,4vw,2.35rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
              {String(a.name || "")}
            </h2>
            <p
              className={
                take || mine
                  ? "m-0 text-[14px] text-white/75"
                  : "m-0 text-[14px] text-[#6B7280]"
              }
            >
              {String(a.metaLine || "—")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-0.5 sm:items-end sm:text-right">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] opacity-80">
              {String(a.ago || "")}
            </span>
            {a.cd ? (
              <span className="max-w-[15rem] font-titulos text-[15px] font-semibold leading-snug">
                {String(a.cd)}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={
            take || mine
              ? "mt-5 border-t border-white/20 pt-4"
              : "mt-5 border-t border-[#E5E0D5] pt-4"
          }
        >
          <p className="m-0 text-[16px] leading-snug">{String(a.what || "")}</p>
          {a.source ? (
            <p
              className={
                take || mine
                  ? "mt-1.5 m-0 font-mono text-[12px] text-white/60"
                  : "mt-1.5 m-0 font-mono text-[12px] text-[#6B7280]"
              }
            >
              {String(a.source)}
            </p>
          ) : null}
        </div>
      </div>

      {a.isInfo ? (
        <div className="mt-auto flex flex-wrap justify-end gap-2 bg-[#F7F5EF] px-5 py-5 sm:px-7">
          <button
            type="button"
            onClick={() => (a.dismiss as () => void)?.()}
            className="h-11 cursor-pointer border-[1.5px] border-[#E5E0D5] bg-white px-4 font-texto text-sm font-medium text-[#0F2D3B]"
          >
            Marcar como vista
          </button>
          {a.hasFile ? (
            <button
              type="button"
              onClick={() => (a.open as () => void)?.()}
              className="h-11 cursor-pointer border-0 bg-[#31C6E6] px-5 font-texto text-sm font-semibold text-[#F7F5EF]"
            >
              Abrir ficha
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-auto grid lg:grid-cols-2 lg:items-stretch">
          {/* Gestión: llamar + resultado / tomar */}
          <div className="relative flex flex-col gap-5 overflow-hidden border-b border-[#E5E0D5] bg-[#F7F5EF] px-5 py-6 sm:px-7 lg:border-b-0 lg:border-r">
            <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#31C6E6]">
              Gestión
            </p>

            {take ? (
              <>
                <p className="m-0 text-sm leading-snug text-[#6B7280]">
                  Al tomar el caso pasa a su cargo: llame, registre el resultado y
                  verá la ubicación en vivo a la derecha.
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {a.hasFile ? (
                    <button
                      type="button"
                      onClick={() => (a.open as () => void)?.()}
                      className="h-12 cursor-pointer border-[1.5px] border-[#0F2D3B] bg-white px-5 font-texto text-sm font-semibold text-[#0F2D3B]"
                    >
                      Ver ficha
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => (a.take as () => void)?.()}
                    className="h-12 min-w-[10rem] cursor-pointer border-0 bg-[#6B0000] px-7 font-texto text-sm font-bold tracking-wide text-white shadow-[0_12px_28px_rgba(107,0,0,0.3)] transition hover:opacity-95"
                  >
                    Tomar caso
                  </button>
                </div>
              </>
            ) : null}

            {a.isOther ? (
              <div className="inline-flex items-center gap-3 border border-[#E5E0D5] bg-white px-4 py-3 text-sm font-medium text-[#0F2D3B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#31C6E6]" />
                En atención · {String(a.takenBy || "colega")}
              </div>
            ) : null}

            {mine ? (
              <>
                <div className="flex flex-col gap-3">
                  <a
                    href={`tel:${telHref}`}
                    className="select-all font-mono text-[clamp(1.75rem,4vw,2.4rem)] font-bold leading-none tracking-tight text-[#0F2D3B] no-underline transition hover:text-[#31C6E6]"
                  >
                    {phone}
                  </a>
                  {a.retryText ? (
                    <p className="m-0 border-l-4 border-[#31C6E6] bg-[#31C6E6]/12 px-3.5 py-3 text-sm font-medium leading-snug text-[#0F2D3B]">
                      {String(a.retryText)}
                    </p>
                  ) : (
                    <p className="m-0 text-sm text-[#6B7280]">
                      Pulse el número para marcar, o cópielo.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => (a.copy as () => void)?.()}
                      className="h-10 cursor-pointer border-[1.5px] border-[#0F2D3B] bg-white px-4 font-texto text-sm font-semibold text-[#0F2D3B] transition hover:bg-[#E5E0D5]/50"
                    >
                      {String(a.copyLabel || "Copiar")}
                    </button>
                    {a.hasFile ? (
                      <button
                        type="button"
                        onClick={() => (a.open as () => void)?.()}
                        className="h-10 cursor-pointer border-0 bg-transparent px-2 font-texto text-sm font-semibold text-[#0F2D3B] underline decoration-[#E5E0D5] underline-offset-4"
                      >
                        Abrir ficha
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-[#E5E0D5] pt-4">
                  <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                    Resultado de la acción
                  </p>
                  {(
                    a.outcomes as {
                      label: string;
                      selected: boolean;
                      pick: () => void;
                    }[]
                  )?.map((o, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => o.pick?.()}
                      className={
                        o.selected
                          ? "flex cursor-pointer items-start gap-3 border-[1.5px] border-[#0F2D3B] bg-[#31C6E6]/20 px-3.5 py-3 text-left transition"
                          : "flex cursor-pointer items-start gap-3 border border-[#E3DFCF] bg-white px-3.5 py-3 text-left transition hover:border-[#0F2D3B]/50"
                      }
                    >
                      <span
                        className={
                          o.selected
                            ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[#0F2D3B] font-mono text-[11px] font-bold text-[#F7F5EF]"
                            : "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-[#E5E0D5] bg-white font-mono text-[11px] font-bold text-[#6B7280]"
                        }
                      >
                        {j + 1}
                      </span>
                      <span className="text-[13px] font-medium leading-snug text-[#0F2D3B]">
                        {o.label}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => (a.close as () => void)?.()}
                    disabled={!a.hasOutcome}
                    className={
                      a.hasOutcome
                        ? "mt-1 h-12 w-full cursor-pointer border-0 bg-[#31C6E6] font-texto text-[15px] font-bold text-[#F7F5EF] shadow-[0_10px_24px_rgba(194,114,65,0.28)] transition hover:opacity-95"
                        : "mt-1 h-12 w-full cursor-not-allowed border-0 bg-[#E3DFCF] font-texto text-[15px] font-medium text-[#6B7280]"
                    }
                  >
                    {String(a.closeLabel || "Registrar atención")}
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {showMap ? (
            <div className="flex min-h-[360px] flex-col lg:min-h-full">
              <CrisisLiveMap loc={loc} patientName={String(a.name || "")} />
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
