"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import { useMemo, useState } from "react";
import { PageHead } from "@/components/shared/page-head/PageHead";
import {
  TableSearch,
  filterRowsBySearch,
} from "@/components/shared/table-search/TableSearch";
import { PathServicesList } from "@/modules/admin/rutas/servicios";
import { RulesQuestionsBlock } from "@/modules/admin/rutas/reglas";
import { PathGamesPanel } from "@/modules/admin/rutas/PathGamesPanel";
import { PathAnalizadorPanel } from "@/modules/admin/rutas/PathAnalizadorPanel";
import { ix } from "@/modules/admin/screens/inlineStyle";

function StepNav({
  v,
  showSend,
}: {
  v: Record<string, any>;
  showSend?: boolean;
}) {
  return (
    <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-[#E5E0D5] bg-white/95 p-4 shadow-[0_8px_24px_rgba(39,104,58,0.08)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <p
        className={`font-texto text-sm ${
          v.rulesErr ? "font-medium text-[#9A4D14]" : "text-[#6B7280]"
        }`}
      >
        {showSend ? v.rulesStatus : v.matrixSizeLabel || "Configure la ruta por etapas"}
      </p>
      <div className="flex flex-wrap gap-2">
        {!v.pathTab1 ? (
          <button
            type="button"
            onClick={() => v.pathStepPrev?.()}
            className="h-11 rounded-xl border border-[#E5E0D5] bg-white px-4 font-texto text-sm text-[#0F2D3B] transition hover:bg-[#F7F5EF]"
          >
            Anterior
          </button>
        ) : null}
        {showSend ? (
          <>
            <button
              type="button"
              onClick={() => v.resetRules()}
              className="h-11 rounded-xl border border-[#E5E0D5] bg-white px-4 font-texto text-sm text-[#0F2D3B] transition hover:bg-[#F7F5EF]"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => v.sendRules()}
              disabled={!v.rulesCanSend}
              className="h-11 rounded-xl px-5 font-texto text-sm font-medium text-[#F7F5EF] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: v.sendRulesBg }}
              title={
                v.rulesErr
                  ? String(v.rulesErrText || "Revise los rangos de puntaje")
                  : undefined
              }
            >
              Enviar a aprobación clínica
            </button>
          </>
        ) : !v.pathTabA ? (
          <button
            type="button"
            onClick={() => v.pathStepNext?.()}
            className="h-11 rounded-xl bg-[#0F2D3B] px-5 font-texto text-sm font-medium text-[#F7F5EF] transition hover:opacity-95"
          >
            Siguiente
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Asistente de Rutas: cuestionarios → niveles → matriz → envío. */
export function PathRoutesPanel({ v }: { v: Record<string, any> }) {
  const [resQ, setResQ] = useState("");
  const libRows = useMemo(
    () => filterRowsBySearch(v.lib?.rows || [], resQ),
    [v.lib?.rows, resQ],
  );
  const cols = Math.max(1, Number(v.matrixCols) || 3);

  return (
    <div className="flex flex-col gap-4">
      <PageHead>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-titulos text-[clamp(22px,4vw,28px)] font-extrabold text-[#0F2D3B]">
              Rutas
            </span>
            <span className="max-w-xl font-texto text-[#6B7280]">
              Cuestionarios, niveles, matriz, juegos y analizador por territorio ·
              aprobación clínica
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2D3B] text-[#F7F5EF]"
              aria-hidden
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="2.25" fill="currentColor" />
              </svg>
            </span>
            <label className="flex min-w-[10rem] flex-1 flex-col gap-0.5 sm:min-w-[12rem]">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#6B7280]">
                Territorio
              </span>
              <select
                value={String(v.pathTerr ?? "")}
                onChange={(e) => v.setPathTerr?.(e)}
                className="h-10 rounded-xl border border-[#E5E0D5] bg-white px-3 font-texto text-[15px] font-medium text-[#0F2D3B] outline-none transition focus:border-[#0F2D3B] focus:ring-2 focus:ring-[#E5E0D5]"
              >
                {(v.pathTerrOpts || []).length ? (
                  (v.pathTerrOpts as string[]).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))
                ) : (
                  <option value="">Cree un territorio primero</option>
                )}
              </select>
            </label>
          </div>
        </div>
        <div className="nara-tabs-scroll">
          {v.pathTabs?.map(
            (pt: {
              key?: string;
              label: string;
              bd: string;
              fg: string;
              ml?: number;
              go: () => void;
            }) => (
              <button
                key={pt.key || pt.label}
                type="button"
                onClick={() => pt.go()}
                style={ix`font-family:var(--font-texto), "Space Grotesk", system-ui, sans-serif;font-size:15px;font-weight:500;height:44px;padding:0 16px;border:none;background:none;border-bottom:3px solid ${pt.bd};color:${pt.fg};cursor:pointer;margin-bottom:-1px;margin-left:${pt.ml || 0}px;white-space:nowrap;flex:none`}
              >
                {pt.label}
              </button>
            ),
          )}
        </div>
      </PageHead>

      {/* 1 · Cuestionarios */}
      {v.pathTab1 ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-texto text-sm text-[#6B7280]">
              4 opciones fijas (0–3 pts). Máximo = preguntas × 3. Todo cerrado; abra el que
              necesite editar.
            </p>
            <button
              type="button"
              onClick={() => v.addCustomQuestionnaire?.()}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-[#0F2D3B]/50 bg-white px-4 font-texto text-sm font-medium text-[#0F2D3B] transition hover:border-[#0F2D3B] hover:bg-[#E5E0D5]/35"
            >
              <span className="text-lg leading-none" aria-hidden>
                +
              </span>
              Crear cuestionario
            </button>
          </div>
          <RulesQuestionsBlock
            title="Ánimo y salud"
            subtitle="Ánimo, apetito, energía, movimiento y salud del mayor"
            maxLabel={`Máx. ${v.phqMax} pts`}
            accent="verde"
            questions={v.rPhqQ || []}
            onAddQuestion={() => v.addPhqQ?.()}
            addQuestionLabel="+ Agregar pregunta"
          />
          <RulesQuestionsBlock
            title="Capacidad digital"
            subtitle="Teléfono, apps y acceso al cuidado"
            maxLabel={`Máx. ${v.digMax} pts`}
            accent="naranja"
            questions={v.rDigQ || []}
            onAddQuestion={() => v.addDigQ?.()}
            addQuestionLabel="+ Agregar pregunta digital"
          />
          <RulesQuestionsBlock
            title="Contexto de vida (opcional)"
            subtitle="Soledad, apoyo cercano y duelo"
            maxLabel={`Máx. ${v.ctxMax} pts`}
            accent="lima"
            questions={v.rCtxQ || []}
            onAddQuestion={() => v.addCtxQ?.()}
            addQuestionLabel="+ Agregar pregunta de contexto"
          />
          {(v.rCustom || []).map((c: Record<string, any>) => (
            <RulesQuestionsBlock
              key={c.id}
              title={c.title}
              subtitle={c.subtitle}
              maxLabel={c.maxLabel}
              accent="verde"
              questions={c.questions || []}
              onAddQuestion={() => c.addQuestion?.()}
              addQuestionLabel="+ Agregar pregunta"
              onTitleChange={c.setTitle}
              onRemoveBlock={c.remove}
            />
          ))}
          <StepNav v={v} />
        </div>
      ) : null}

      {/* 2 · Niveles */}
      {v.pathTab2 ? (
        <div className="flex flex-col gap-5">
          <p className="font-texto text-sm text-[#6B7280]">
            Clasifique rangos que cubran de 0 al máximo de cada cuestionario. La matriz será{" "}
            <strong className="font-medium text-[#0F2D3B]">{v.matrixSizeLabel}</strong>.
          </p>
          <section className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-white shadow-[0_1px_0_rgba(39,104,58,0.06)]">
            <header className="relative flex flex-wrap items-end justify-between gap-3 border-b border-[#E5E0D5] bg-[#F7F5EF] px-5 py-4 sm:px-6">
              <div className="absolute inset-y-0 left-0 w-1 bg-[#31C6E6]" aria-hidden />
              <div className="pl-2">
                <h3 className="font-titulos text-[1.35rem] font-extrabold tracking-tight text-[#0F2D3B]">
                  Niveles de riesgo (ánimo)
                </h3>
                <p className="mt-0.5 font-texto text-sm text-[#6B7280]">
                  Cubren 0–{v.phqMax} pts
                </p>
              </div>
            </header>
            <div className="space-y-2 p-4 sm:p-5">
              {v.rRisk?.map((r: Record<string, any>, i: number) => (
                <div
                  key={`${r.k}-${i}`}
                  className="grid grid-cols-[48px_minmax(0,1fr)_72px_72px] items-center gap-2 rounded-xl border border-[#E5E0D5]/80 bg-[#F7F5EF]/50 p-2.5 sm:grid-cols-[48px_minmax(0,1.6fr)_72px_72px_auto]"
                >
                  <input
                    type="color"
                    value={String(r.c ?? "")}
                    onChange={r.setC}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-[#E5E0D5] bg-white p-1"
                  />
                  <input
                    value={String(r.k ?? "")}
                    onChange={r.setK}
                    className="h-10 rounded-lg border border-[#E5E0D5] bg-white px-3 font-texto text-[15px] text-[#222220] outline-none focus:border-[#0F2D3B]"
                  />
                  <input
                    value={String(r.min ?? "")}
                    onChange={r.setMin}
                    inputMode="numeric"
                    className="h-10 rounded-lg border px-2 text-center font-mono text-[15px]"
                    style={{ borderColor: r.bd }}
                  />
                  <input
                    value={String(r.max ?? "")}
                    onChange={r.setMax}
                    inputMode="numeric"
                    className="h-10 rounded-lg border px-2 text-center font-mono text-[15px]"
                    style={{ borderColor: r.bd }}
                  />
                  {r.remove ? (
                    <button
                      type="button"
                      onClick={() => r.remove()}
                      className="rounded-lg px-2 py-2 font-texto text-sm text-[#8A1C14] hover:bg-[#FDE7E4]"
                    >
                      Quitar
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => v.addRiskLevel?.()}
                className="mt-2 flex w-full items-center justify-center rounded-xl border border-dashed border-[#0F2D3B]/40 bg-white py-3 font-texto text-sm font-medium text-[#0F2D3B] hover:bg-[#E5E0D5]/30"
              >
                + Agregar nivel de riesgo
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-white shadow-[0_1px_0_rgba(39,104,58,0.06)]">
            <header className="relative border-b border-[#E5E0D5] bg-[#F7F5EF] px-5 py-4 sm:px-6">
              <div className="absolute inset-y-0 left-0 w-1 bg-[#31C6E6]" aria-hidden />
              <div className="pl-2">
                <h3 className="font-titulos text-[1.35rem] font-extrabold text-[#0F2D3B]">
                  Cortes de capacidad digital
                </h3>
                <p className="mt-0.5 font-texto text-sm text-[#6B7280]">
                  Cubren 0–{v.digMax} pts
                </p>
              </div>
            </header>
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              {v.rCuts?.map((c: Record<string, any>, i: number) => (
                <div
                  key={`${c.k}-${i}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E5E0D5] bg-[#F7F5EF] px-3 py-2"
                >
                  <input
                    value={String(c.k ?? "")}
                    onChange={c.setK}
                    className="h-9 min-w-[7rem] flex-1 rounded-md border border-[#E5E0D5] bg-white px-2 font-texto text-sm"
                  />
                  <input
                    value={String(c.min ?? "")}
                    onChange={c.setMin}
                    inputMode="numeric"
                    className="h-9 w-14 rounded-md border border-[#E5E0D5] bg-white text-center font-mono text-sm"
                  />
                  <span className="text-[#6B7280]">–</span>
                  <input
                    value={String(c.max ?? "")}
                    onChange={c.setMax}
                    inputMode="numeric"
                    className="h-9 w-14 rounded-md border border-[#E5E0D5] bg-white text-center font-mono text-sm"
                  />
                  {c.remove ? (
                    <button
                      type="button"
                      onClick={() => c.remove()}
                      className="rounded-lg px-2 py-1.5 font-texto text-sm text-[#8A1C14] hover:bg-[#FDE7E4]"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => v.addDigCut?.()}
                className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#0F2D3B]/40 bg-white py-3 font-texto text-sm font-medium text-[#0F2D3B] hover:bg-[#E5E0D5]/30"
              >
                + Agregar corte digital
              </button>
            </div>
          </section>
          <StepNav v={v} />
        </div>
      ) : null}

      {/* 3 · Matriz / servicios */}
      {v.pathTab3 ? (
        <div className="flex flex-col gap-4">
          <p className="font-texto text-sm text-[#6B7280]">
            Matriz de servicio: <strong className="text-[#0F2D3B]">{v.matrixSizeLabel}</strong>. Elija
            un perfil y configure sus servicios.
          </p>
          <div className="nara-split-panel-start">
            <div className="nara-scroll-x">
              <div
                className="grid gap-1.5 rounded-[20px] border border-[#E3DFCF] bg-white p-[18px]"
                style={{
                  gridTemplateColumns: `110px repeat(${cols}, minmax(0, 1fr))`,
                  minWidth: Math.max(420, 110 + cols * 100),
                }}
              >
                <span />
                {(v.digHeaders || []).map((h: string) => (
                  <span key={h} className="text-center font-texto text-[13px] text-[#6B7280]">
                    {h}
                  </span>
                ))}
                {v.pm?.map((row: any, rowIdx: number) => (
                  <span key={rowIdx} style={{ display: "contents" } as React.CSSProperties}>
                    <span className="flex items-center gap-1.5 font-texto text-[13px] text-[#6B7280]">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ background: row.c }}
                      />
                      {row.k}
                    </span>
                    {row.cells?.map((cell: any, cellIdx: number) => (
                      <button
                        key={cellIdx}
                        type="button"
                        onClick={() => cell.pick()}
                        style={ix`font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;height:62px;border-radius:10px;border:2px solid ${cell.bd};background:${cell.bg};color:${cell.fg};cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px`}
                      >
                        <span className="text-[15px] font-semibold">{cell.code}</span>
                        <span className="text-xs">{cell.n} servicios</span>
                      </button>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3.5 rounded-[20px] border border-[#E3DFCF] bg-white px-[22px] py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-titulos text-[clamp(20px,4vw,24px)] font-semibold text-[#0F2D3B]">
                    {v.pe?.title}
                  </span>
                  <span className="font-texto text-[#6B7280]">
                    {v.pe?.people} personas hoy en este perfil
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-texto text-[13px] text-[#6B7280]">Territorio</span>
                  <span className="flex h-[42px] items-center rounded-[9px] border-[1.5px] border-[#E3DFCF] bg-[#F7F5EF] px-2.5 font-texto text-[15px] text-[#0F2D3B]">
                    {v.pathTerr || "—"}
                  </span>
                </div>
              </div>
              <PathServicesList rows={v.pe?.rows} />
              <div className="flex flex-wrap items-center gap-3.5 border-t border-[#E5E0D5] pt-3.5">
                <span className="font-medium">Duración total</span>
                {v.pe?.durs?.map((d: any) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => d.pick()}
                    style={ix`font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;font-size:14px;height:38px;padding:0 14px;border-radius:8px;border:1.5px solid ${d.bd};background:${d.bg};color:${d.fg};cursor:pointer`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3.5 border-t border-[#E5E0D5] pt-3.5">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium">Tiempo para establecer inactividad</span>
                  <span className="font-texto text-[13px] text-[#6B7280]">
                    Sin login ni clics en la app · pasa a Inactivo / Sin contacto
                  </span>
                </div>
                {v.pe?.inactiveMins?.map((d: any) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => d.pick()}
                    style={ix`font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;font-size:14px;height:38px;padding:0 14px;border-radius:8px;border:1.5px solid ${d.bd};background:${d.bg};color:${d.fg};cursor:pointer`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-[#E5E0D5] pt-3.5">
                <span className="font-texto text-sm text-[#6B7280]">{v.pe?.status}</span>
              </div>
            </div>
          </div>
          <StepNav v={v} />
        </div>
      ) : null}

      {/* 4 · Envío */}
      {v.pathTab4 ? (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <section className="relative overflow-hidden rounded-3xl border border-[#E5E0D5] bg-gradient-to-br from-white via-[#F7F5EF] to-[#E5E0D5]/35 shadow-[0_12px_40px_rgba(39,104,58,0.08)]">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#31C6E6]/15 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-[#0F2D3B]/10 blur-2xl"
              aria-hidden
            />

            <header className="relative flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E0D5]/80 px-6 py-5 sm:px-8">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
                  Etapa 4 · Cierre
                </p>
                <h3 className="mt-1 font-titulos text-2xl font-extrabold tracking-tight text-[#0F2D3B] sm:text-[1.75rem]">
                  Listo para aprobación
                </h3>
                <p className="mt-1.5 max-w-md font-texto text-sm leading-relaxed text-[#6B7280]">
                  Revise el paquete de {v.pathTerr || "este territorio"}. Si la líder clínica
                  acepta, queda vigente en la entrevista del experto.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#E5E0D5] bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2D3B] text-[#F7F5EF]"
                  aria-hidden
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10" r="2.25" fill="currentColor" />
                  </svg>
                </span>
                <div className="min-w-0 pr-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">
                    Territorio
                  </p>
                  <p className="font-titulos text-base font-extrabold text-[#0F2D3B]">
                    {v.pathTerr || "—"}
                  </p>
                </div>
              </div>
            </header>

            <div className="relative grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
              {[
                {
                  label: "Ánimo y salud",
                  accent: "bg-[#0F2D3B]",
                  lines: [
                    `${v.rPhqQ?.length || 0} preguntas`,
                    `máx. ${v.phqMax} pts`,
                    `${v.rRisk?.length || 0} niveles`,
                  ],
                },
                {
                  label: "Capacidad digital",
                  accent: "bg-[#31C6E6]",
                  lines: [
                    `${v.rDigQ?.length || 0} preguntas`,
                    `máx. ${v.digMax} pts`,
                    `${v.rCuts?.length || 0} cortes`,
                  ],
                },
                {
                  label: "Contexto",
                  accent: "bg-[#31C6E6]",
                  lines: [
                    `${v.rCtxQ?.length || 0} preguntas`,
                    `máx. ${v.ctxMax} pts`,
                    "opcional",
                  ],
                },
                {
                  label: "Matriz",
                  accent: "bg-[#31C6E6]",
                  lines: [
                    String(v.matrixSizeLabel || "—"),
                    Array.isArray(v.pathDirtyCodes) && v.pathDirtyCodes.length
                      ? `${v.pathDirtyCodes.length} perfil(es) con cambios`
                      : "perfiles de servicio",
                  ],
                  highlight: true,
                },
              ].map((card) => (
                <article
                  key={card.label}
                  className={`relative overflow-hidden rounded-2xl border border-[#E5E0D5]/90 bg-white/85 p-4 backdrop-blur-sm ${
                    card.highlight ? "sm:col-span-1 ring-1 ring-[#0F2D3B]/15" : ""
                  }`}
                >
                  <div className={`mb-3 h-1 w-10 rounded-full ${card.accent}`} aria-hidden />
                  <h4 className="font-titulos text-sm font-extrabold text-[#0F2D3B]">
                    {card.label}
                  </h4>
                  <ul className="mt-2 space-y-0.5 font-texto text-sm text-[#6B7280]">
                    {card.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            {(v.rCustom || []).length ? (
              <div className="relative border-t border-[#E5E0D5]/70 px-6 pb-2 sm:px-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">
                  Cuestionarios extra
                </p>
                <div className="mt-2 flex flex-wrap gap-2 pb-4">
                  {(v.rCustom as { title: string; questions?: unknown[] }[]).map((c) => (
                    <span
                      key={c.title}
                      className="rounded-full border border-[#E5E0D5] bg-white px-3 py-1 font-texto text-sm text-[#0F2D3B]"
                    >
                      {c.title}
                      <span className="ml-1.5 font-mono text-xs text-[#6B7280]">
                        {c.questions?.length || 0} preg.
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="relative flex flex-col gap-4 border-t border-[#E5E0D5] bg-white/70 px-5 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="min-w-0">
                <p
                  className={`font-texto text-sm leading-snug ${
                    v.rulesErr ? "font-medium text-[#9A4D14]" : "text-[#6B7280]"
                  }`}
                >
                  {v.rulesStatus}
                </p>
                {v.rulesCanSend ? (
                  <p className="mt-1 font-texto text-xs text-[#31C6E6]">
                    Hay cambios listos para enviar.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => v.pathStepPrev?.()}
                  className="h-11 rounded-xl border border-[#E5E0D5] bg-white px-4 font-texto text-sm text-[#0F2D3B] transition hover:bg-[#F7F5EF]"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => v.resetRules()}
                  className="h-11 rounded-xl border border-[#E5E0D5] bg-white px-4 font-texto text-sm text-[#0F2D3B] transition hover:bg-[#F7F5EF]"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => v.sendRules()}
                  disabled={!v.rulesCanSend}
                  className="h-11 min-w-[12rem] rounded-xl px-5 font-texto text-sm font-medium text-[#F7F5EF] shadow-[0_6px_16px_rgba(39,104,58,0.2)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
                  style={{ background: v.sendRulesBg }}
                  title={
                    v.rulesErr
                      ? String(v.rulesErrText || "Revise los rangos de puntaje")
                      : undefined
                  }
                >
                  Enviar a aprobación clínica
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {/* Juegos */}
      {v.pathTabJ ? (
        <PathGamesPanel
          games={v.pathGames || []}
          onPrev={() => v.pathStepPrev?.()}
          onNext={() => v.pathStepNext?.()}
          onSaveVersion={(gameId, draft) => v.saveGameVersion?.(gameId, draft)}
        />
      ) : null}

      {/* Analizador */}
      {v.pathTabA ? (
        <PathAnalizadorPanel
          key={[
            "an",
            v.pathAnalizador?.version,
            v.pathAnalizador?.partidas,
            v.pathAnalizador?.dias,
            v.pathAnalizador?.descarta,
            v.pathAnalizador?.sens,
            v.pathAnalizador?.plazo,
          ].join("-")}
          fuentes={(v.pathGames || []).map(
            (g: { id: string; nombre: string; hab: string }) => ({
              ...g,
              medidas: v.pathAnalizador?.medidas?.[g.id] || [],
              on: v.pathAnalizador?.fuentesOn?.[g.id] !== false,
            }),
          )}
          cfg={v.pathAnalizador || { version: 2, partidas: 10, dias: 14, descarta: 3, sens: "Media", plazo: 7 }}
          onPrev={() => v.pathStepPrev?.()}
          onSaveVersion={(draft) => v.saveAnalizadorVersion?.(draft)}
        />
      ) : null}

      {/* Biblioteca (desde matriz) */}
      {v.pathTabLib ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => v.closeLib?.()}
            className="self-start border-none bg-transparent p-0 font-texto text-[15px] font-medium text-[#0F2D3B] underline"
          >
            ← Volver a la matriz
          </button>
          <div className="nara-split-panel">
            <div className="min-w-0 overflow-hidden rounded-[20px] border border-[#E3DFCF] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[17px] font-medium">Biblioteca de recursos</span>
                  <span className="text-[13px] text-[#6B7280]">
                    Videos y técnicas · aprueba la coordinadora clínica
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {v.lib?.kinds?.map((k: any) => (
                    <button
                      key={k.label}
                      type="button"
                      onClick={() => k.go()}
                      style={ix`font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;font-size:14px;font-weight:500;height:40px;padding:0 14px;border-radius:14px;border:1.5px solid #0F2D3B;color:#0F2D3B;cursor:pointer;background:${k.bg}`}
                    >
                      {k.label}
                    </button>
                  ))}
                  <TableSearch value={resQ} onChange={setResQ} placeholder="Buscar recurso…" />
                </div>
              </div>
              <div className="nara-scroll-x">
                <div style={{ minWidth: 520 }}>
                  <div className="grid grid-cols-[minmax(0,1.6fr)_150px_60px_90px] gap-2.5 bg-[#F7F5EF] px-[18px] py-2 text-[13px] font-medium text-[#6B7280]">
                    <span>Recurso</span>
                    <span>Estado</span>
                    <span>Versión</span>
                    <span>Aprobado</span>
                  </div>
                  {libRows.map((r: any) => (
                    <div
                      key={r.title}
                      onClick={() => r.pick()}
                      style={ix`display:grid;grid-template-columns:minmax(0,1.6fr) 150px 60px 90px;gap:10px;padding:9px 18px;border-top:1px solid #E5E0D5;align-items:center;cursor:pointer;background:${r.bg}`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {r.hasCover ? (
                          <img
                            src={r.cover}
                            alt=""
                            className="block h-10 w-[31px] flex-none rounded object-cover shadow-sm"
                          />
                        ) : null}
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-medium">{r.title}</span>
                          <span className="text-xs text-[#6B7280]">{r.meta}</span>
                        </span>
                      </span>
                      <span
                        className="justify-self-start rounded-full px-2.5 py-0.5 text-[13px] font-semibold text-[#0F2D3B]"
                        style={{ background: r.sBg }}
                      >
                        {r.estado}
                      </span>
                      <span>v{r.version}</span>
                      <span className="text-[13px]">{r.fecha}</span>
                    </div>
                  ))}
                  {!libRows.length ? (
                    <p className="m-0 px-[18px] py-4 font-texto text-sm text-[#6B7280]">
                      {resQ.trim()
                        ? "Ningún recurso coincide con la búsqueda."
                        : "No hay recursos en este filtro."}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-4 overflow-hidden">
              {v.lib?.hasSel ? (
                <div className="flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-[20px] border border-[#E3DFCF] bg-white px-5 py-[18px]">
                  <div className="flex min-w-0 items-start gap-3">
                    {v.lib.sel.hasCover ? (
                      <img
                        src={v.lib.sel.cover}
                        alt=""
                        className="w-[72px] flex-none rounded-[10px] object-cover shadow"
                        style={{ aspectRatio: "600/780" }}
                      />
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[17px] font-semibold">{v.lib.sel.title}</span>
                      {v.lib.sel.hasTag ? (
                        <span className="self-start rounded-full bg-[#FDE7E4] px-2 py-0.5 text-xs font-semibold text-[#0F2D3B]">
                          {v.lib.sel.tag}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {v.lib.sel.fields?.map((f: any) => (
                    <label key={f.k} className="nara-label-row font-texto text-sm">
                      <span className="text-[#6B7280]">{f.k}</span>
                      <input
                        value={String(f.v ?? "")}
                        onChange={f.set}
                        className="box-border h-10 w-full rounded-[9px] border-[1.5px] border-[#E3DFCF] bg-white px-2.5 font-texto text-sm text-[#0F2D3B]"
                      />
                    </label>
                  ))}
                  <label className="nara-label-row font-texto text-sm">
                    <span className="text-[#6B7280]">Estado</span>
                    <select
                      value={String(v.lib.sel.estado ?? "")}
                      onChange={v.lib.sel.setEstado}
                      className="h-10 w-full rounded-[9px] border-[1.5px] border-[#E3DFCF] bg-white px-2.5 font-texto text-sm text-[#0F2D3B]"
                    >
                      <option>Borrador</option>
                      <option>En revisión clínica</option>
                      <option>Aprobado</option>
                      <option>Retirado</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
