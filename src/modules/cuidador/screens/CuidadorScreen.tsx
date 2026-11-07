"use client";

import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import {
  useCuidadorScreen,
  type CuidadorTab,
} from "../hooks/useCuidadorScreen";

const TABS: { id: CuidadorTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "citas", label: "Citas" },
  { id: "avisos", label: "Avisos" },
];

function fmtWhen(at: number) {
  if (!at) return "";
  try {
    return new Date(at).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

type Vm = ReturnType<typeof useCuidadorScreen>;

function EmptyLane({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="cuid-in border border-dashed border-[#E5E0D5] bg-white/70 px-6 py-14 text-center">
      <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
        {title}
      </p>
      <p className="mx-auto mt-3 m-0 max-w-sm font-titulos text-lg font-semibold leading-snug text-[#0F2D3B]">
        {children}
      </p>
    </div>
  );
}

export function CuidadorScreen() {
  const v = useCuidadorScreen();

  if (!v.session) return <NaraLoadingScreen />;

  const firstName =
    String(v.session.name || "Cuidadora").split(/\s+/)[0] || "Cuidadora";
  const crisisN = v.crisisAvisos.length;

  return (
    <div
      data-screen-label="Cuidadora"
      className="cuid-shell flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#F7F5EF] font-texto text-[#0F2D3B]"
    >
      <style>{`
        @keyframes cuid-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cuid-shell .cuid-in {
          animation: cuid-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .cuid-shell .cuid-in-2 { animation-delay: 70ms; }
        .cuid-shell .cuid-in-3 { animation-delay: 140ms; }
        .cuid-shell .cuid-in-4 { animation-delay: 210ms; }
      `}</style>

      {/* Topbar global fijo — fuera del scroll */}
      <header className="nara-topbar px-4 sm:px-6">
        <QuintiaLogo href="/cuidador" />
        <UserMenu />
      </header>

      <div className="nara-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {/* Cabecera compacta — altura = contenido, sin franja vacía */}
      <div className="cuid-in relative h-auto shrink-0 bg-[#0F2D3B] text-[#F7F5EF]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 92% 0%, rgba(67,111,210,0.35), transparent 38%), radial-gradient(circle at 0% 100%, rgba(43,138,116,0.28), transparent 40%), radial-gradient(circle at 55% 80%, rgba(194,114,65,0.18), transparent 36%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6 sm:pt-6">
          <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#E5E0D5]">
            Cuidadora / familiar · sin datos clínicos
          </p>
          <h1 className="m-0 mt-1.5 font-titulos text-[clamp(1.65rem,5vw,2.15rem)] font-extrabold leading-none tracking-[-0.03em]">
            Hola, {firstName}
          </h1>
          <p className="m-0 mt-1.5 max-w-lg font-texto text-[14px] leading-snug text-[#E5E0D5]">
            Usted cuida. Nosotros respondemos cuando haga falta.
          </p>

          <nav
            aria-label="Secciones"
            className="mt-4 flex gap-0 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((t) => {
              const on = v.tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => v.setTab(t.id)}
                  className={
                    on
                      ? "relative flex cursor-pointer items-baseline gap-2 border-b-[3px] border-[#31C6E6] px-3 py-2.5 text-[#F7F5EF] transition sm:px-4"
                      : "relative flex cursor-pointer items-baseline gap-2 border-b-[3px] border-transparent px-3 py-2.5 text-[#E5E0D5] transition hover:text-[#F7F5EF] sm:px-4"
                  }
                >
                  <span className="whitespace-nowrap font-texto text-[13px] font-semibold uppercase tracking-[0.08em]">
                    {t.label}
                  </span>
                  {t.id === "avisos" && crisisN > 0 ? (
                    <span className="font-titulos text-base font-extrabold leading-none text-[#31C6E6]">
                      {crisisN}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        {v.msg ? (
          <div
            role="status"
            className="cuid-in border-l-4 border-[#31C6E6] bg-[#E7FAF5]/70 px-4 py-3 font-texto text-[16px] text-[#0F2D3B]"
          >
            {v.msg}
            <button
              type="button"
              className="ml-3 font-mono text-sm underline underline-offset-2"
              onClick={v.clearMsg}
            >
              Cerrar
            </button>
          </div>
        ) : null}
        {v.err ? (
          <div
            role="alert"
            className="cuid-in border-l-4 border-[#B42318] bg-[#FDE7E4] px-4 py-3 font-texto text-[16px] text-[#B42318]"
          >
            {v.err}
            <button
              type="button"
              className="ml-3 font-mono text-sm underline underline-offset-2"
              onClick={v.clearErr}
            >
              Cerrar
            </button>
          </div>
        ) : null}

        {v.personas.length > 1 ? (
          <label className="cuid-in cuid-in-2 flex flex-col gap-2 font-texto text-[15px] font-medium text-[#0F2D3B]">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6B7280]">
              Persona
            </span>
            <select
              value={v.selectedId}
              onChange={(e) => v.setSelectedId(e.target.value)}
              className="min-h-12 border-[1.5px] border-[#E5E0D5] bg-white px-3 font-texto text-[17px] text-[#0F2D3B] outline-none focus:border-[#0F2D3B]"
            >
              {v.personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {v.tab === "resumen" ? (
          <section className="flex flex-col gap-5">
            {v.personas.length === 0 ? (
              <EmptyLane title="Sin vínculos">
                Todavía no hay personas vinculadas a su cuenta. Cuando el
                administrador o el gestor la asocien, verá aquí el resumen.
              </EmptyLane>
            ) : v.selected ? (
              <>
                {/* Ficha de acompañamiento */}
                <article className="cuid-in cuid-in-2 relative overflow-hidden border border-[#E5E0D5] bg-white">
                  <div
                    className={[
                      "flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-7",
                      v.selectedInCrisis
                        ? "bg-[#6B0000] text-white"
                        : "bg-[#0F2D3B] text-[#F7F5EF]",
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span
                        className={
                          v.selectedInCrisis
                            ? "grid size-16 shrink-0 place-items-center border border-white/25 bg-white/10 font-titulos text-xl font-extrabold"
                            : "grid size-16 shrink-0 place-items-center border border-[#E5E0D5]/40 bg-[#0F2D3B] font-titulos text-xl font-extrabold text-[#31C6E6]"
                        }
                        aria-hidden
                      >
                        {initials(v.selected.name)}
                      </span>
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
                          Persona a cargo
                        </p>
                        <h2 className="m-0 font-titulos text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                          {v.selected.name}
                        </h2>
                        <p className="m-0 text-[14px] opacity-80">
                          {[
                            v.selected.age != null
                              ? `${v.selected.age} años`
                              : null,
                            v.selected.place || null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Ficha vinculada"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                        Estado
                      </span>
                      <span
                        className={
                          v.selectedInCrisis
                            ? "font-titulos text-2xl font-extrabold text-[#E7FAF5]"
                            : "font-titulos text-2xl font-extrabold text-[#31C6E6]"
                        }
                      >
                        {v.selectedInCrisis ? "Crisis" : v.selected.status || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-[#E3DFCF] border-t border-[#E5E0D5] bg-[#F7F5EF]">
                    <div className="px-4 py-4 sm:px-5">
                      <p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">
                        Edad
                      </p>
                      <p className="m-0 mt-1 font-titulos text-xl font-bold text-[#0F2D3B]">
                        {v.selected.age ?? "—"}
                      </p>
                    </div>
                    <div className="px-4 py-4 sm:px-5">
                      <p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">
                        Lugar
                      </p>
                      <p className="m-0 mt-1 truncate font-titulos text-lg font-bold text-[#0F2D3B]">
                        {v.selected.place || "—"}
                      </p>
                    </div>
                    <div className="px-4 py-4 sm:px-5">
                      <p className="m-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">
                        Avisos
                      </p>
                      <p className="m-0 mt-1 font-titulos text-xl font-bold text-[#0F2D3B]">
                        {crisisN}
                      </p>
                    </div>
                  </div>
                </article>

                {/* Acción de crisis — el cuidador avisa al equipo si la persona no puede */}
                <div className="cuid-in cuid-in-3">
                  {v.selectedInCrisis ? (
                    <div className="flex flex-col gap-4 border border-[#B42318]/40 bg-[#6B0000] px-5 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
                      <div className="flex flex-col gap-1">
                        <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7FAF5]">
                          Crisis activa
                        </p>
                        <p className="m-0 font-titulos text-xl font-bold leading-snug">
                          El equipo clínico ya fue avisado
                        </p>
                        <p className="m-0 text-[14px] text-white/75">
                          Siga el detalle en Avisos · solo lectura
                          {v.locShare === "sharing"
                            ? " · Su ubicación sigue compartiéndose"
                            : v.locShare === "asking"
                              ? " · Pidiendo ubicación…"
                              : v.locShare === "denied"
                                ? " · Active la ubicación en el navegador"
                                : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => v.setTab("avisos")}
                        className="h-12 shrink-0 cursor-pointer border-0 bg-[#E7FAF5] px-6 font-texto text-sm font-bold text-[#6B0000] transition hover:opacity-95"
                      >
                        Ver en avisos →
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={v.busy}
                      onClick={() => void v.openCrisisHelp()}
                      className="group relative flex w-full cursor-pointer flex-col gap-3 overflow-hidden border-0 bg-[#B42318] px-5 py-6 text-left !text-[#F7F5EF] transition hover:bg-[#9C2F25] disabled:opacity-70 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-7"
                    >
                      <div
                        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#31C6E6]/40 blur-2xl transition group-hover:opacity-80"
                        aria-hidden
                      />
                      <div className="relative flex items-start gap-4">
                        <span className="mt-0.5 grid size-12 shrink-0 place-items-center border border-white/30 bg-white/10">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="3.5" />
                            <path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
                          </svg>
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7FAF5]">
                            Emergencia
                          </span>
                          <span className="font-titulos text-[clamp(1.35rem,3.5vw,1.75rem)] font-extrabold leading-tight">
                            {v.busy ? "Avisando al equipo…" : "Reportar una crisis"}
                          </span>
                          <span className="text-[13px] text-white/80">
                            Avisa al clínico ahora y comparte tu ubicación
                          </span>
                        </div>
                      </div>
                      <span className="relative font-mono text-2xl font-bold opacity-80 transition group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {v.tab === "citas" ? (
          <section className="cuid-in flex flex-col gap-3">
            {v.citas.length === 0 ? (
              <EmptyLane title="Agenda">
                No hay citas o visitas próximas registradas.
              </EmptyLane>
            ) : (
              v.citas.map((c, i) => (
                <article
                  key={c.id}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="cuid-in flex gap-0 overflow-hidden border border-[#E5E0D5] bg-white"
                >
                  <span className="w-1.5 shrink-0 bg-[#31C6E6]" aria-hidden />
                  <div className="flex min-w-0 flex-1 flex-col gap-1 px-5 py-4">
                    <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#31C6E6]">
                      Cita / visita
                    </p>
                    <p className="m-0 font-titulos text-xl font-extrabold text-[#0F2D3B]">
                      {c.name}
                    </p>
                    <p className="m-0 font-mono text-[13px] text-[#6B7280]">
                      {c.when}
                      {c.place ? ` · ${c.place}` : ""}
                    </p>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : null}

        {v.tab === "avisos" ? (
          <section className="cuid-in flex flex-col gap-5">
            {v.crisisAvisos.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="m-0 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#31C6E6]">
                    Crisis · solo lectura
                  </p>
                  <span className="font-titulos text-2xl font-extrabold text-[#0F2D3B]">
                    {v.crisisAvisos.length}
                  </span>
                </div>
                {v.crisisAvisos.map((a, i) => (
                  <article
                    key={a.id}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="cuid-in overflow-hidden border border-[#B42318]/25 bg-white"
                  >
                    <div className="bg-[#6B0000] px-5 py-5 text-white sm:px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-white/30 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                          {a.sevLabel}
                        </span>
                        <span className="bg-[#E7FAF5] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-[#6B0000]">
                          {a.statusLabel}
                        </span>
                        <span className="ml-auto font-mono text-[11px] text-white/70">
                          {a.ago}
                        </span>
                      </div>
                      <h3 className="m-0 mt-3 font-titulos text-[clamp(1.35rem,3vw,1.75rem)] font-extrabold leading-tight tracking-tight">
                        {a.name}
                      </h3>
                      {a.meta ? (
                        <p className="m-0 mt-1 text-[14px] text-white/70">{a.meta}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 border-t border-[#E3DFCF] px-5 py-4 sm:px-6">
                      <p className="m-0 font-texto text-[16px] leading-snug text-[#0F2D3B]">
                        {a.what}
                      </p>
                      <p className="m-0 font-mono text-[12px] text-[#6B7280]">
                        {a.source}
                      </p>
                      {a.takenBy ? (
                        <p className="m-0 text-[14px] font-medium text-[#0F2D3B]">
                          En atención · {a.takenBy}
                        </p>
                      ) : null}
                      {a.outcome ? (
                        <p className="m-0 border-l-4 border-[#31C6E6] bg-[#F7F5EF] px-3 py-2 text-[14px] text-[#0F2D3B]">
                          Resultado: {a.outcome}
                        </p>
                      ) : null}
                      <p className="m-0 pt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">
                        Solo lectura · sin acciones clínicas
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {v.avisos.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                  Otros avisos
                </p>
                {v.avisos.map((a) => (
                  <article
                    key={a.id}
                    className="flex gap-0 border border-[#E5E0D5] bg-white"
                  >
                    <span className="w-1 shrink-0 bg-[#E5E0D5]" aria-hidden />
                    <div className="px-5 py-4">
                      <p className="m-0 font-texto text-[17px] leading-snug text-[#0F2D3B]">
                        {a.text}
                      </p>
                      {a.at ? (
                        <p className="mt-2 m-0 font-mono text-[12px] text-[#6B7280]">
                          {fmtWhen(a.at)}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {v.crisisAvisos.length === 0 && v.avisos.length === 0 ? (
              <EmptyLane title="Sin avisos">
                No hay avisos por ahora. Si hay una crisis o inactividad,
                aparecerá aquí.
              </EmptyLane>
            ) : null}
          </section>
        ) : null}
      </main>
      </div>

    </div>
  );
}
