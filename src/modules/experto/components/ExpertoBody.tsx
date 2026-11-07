"use client";
// @ts-nocheck

import { useMemo, useState } from "react";
import { FormModal } from "@/components/shared/form-modal/FormModal";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PhoneInput } from "@/components/shared/phone-input/PhoneInput";
import {
  TableSearch,
  filterRowsBySearch,
} from "@/components/shared/table-search/TableSearch";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";

export function ExpertoTopbar({ v }: { v: Record<string, any> }) {
  return (
    <header className="nara-topbar gap-2 px-3 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={() => v.goList?.()}
        className="flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0"
        aria-label="QUINTIA"
      >
        <QuintiaLogo href={null} />
      </button>
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        {v.dev ? (
          <span className="hidden rounded-[5px] border border-[#E5E0D5] px-1.5 py-0.5 font-mono text-[11px] text-[#6B7280] md:inline">
            {v.screenCode}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => v.openAgent?.()}
          aria-label="Abrir TEJIVA, asistente de QUINTIA"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#E5E0D5] bg-[#F7F5EF] px-2.5 font-texto text-sm font-medium text-[#0F2D3B] transition hover:bg-[#E5E0D5]/70 sm:h-11 sm:px-4 sm:text-base"
        >
          <img
            src="/quintia/tejiva/tejiva-base.svg"
            alt=""
            className="block h-7 w-7 sm:-ml-2 sm:h-8 sm:w-8"
          />
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span>TEJIVA</span>
            <span className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
              asistente
            </span>
          </span>
        </button>
        <div
          className="flex max-w-[42vw] items-center gap-2 truncate rounded-full border border-linea px-2.5 py-1.5 text-xs font-medium sm:max-w-none sm:px-3.5 sm:py-2 sm:text-[15px]"
          style={{ background: v.connBg }}
          title={v.connText}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: v.connDot }}
          />
          <span className="truncate">{v.connText}</span>
        </div>
        <UserMenu notifKey={v.ex} />
      </div>
    </header>
  );
}

export function ExpertoBody({ v }: { v: Record<string, any> }) {
  const [worklistQ, setWorklistQ] = useState("");
  const worklistRows = useMemo(
    () => filterRowsBySearch(v.worklist || [], worklistQ),
    [v.worklist, worklistQ],
  );

  return (
    <>
      <NaraMsgAlert msg={v.newMsg} onClear={() => v.clearNewMsg?.()} />
      <NaraMsgAlert msg={v.consentMsg} onClear={() => v.clearConsentMsg?.()} />
      <NaraMsgAlert msg={v.reasonErr} onClear={() => v.clearReasonErr?.()} />
      <div
        data-screen-label="Experto"
        className="min-w-0 w-full bg-[#F7F5EF] font-texto text-[#0F2D3B]"
      >
            <div ref={v.scrollRef} className="relative">
              <div className="mx-auto box-border w-full max-w-[1280px] px-3 sm:px-7">
              {v.isList ? (
                <div
                  className="flex flex-col gap-5 py-4 sm:py-6"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  {(v.notices || []).map((n: Record<string, any>, i: number) => (
                    <div
                      key={i}
                      style={{
                        background: "#fff",
                        border: "1px solid #E5E0D5",
                        borderRadius: 12,
                        padding: "14px 18px",
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: n.tagBg,
                          color: n.tagFg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.tag}
                      </span>
                      <span style={{ fontSize: 16, lineHeight: 1.45, flex: 1 }}>
                        {n.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => n.dismiss?.()}
                        style={{
                          fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                          fontSize: 15,
                          border: "none",
                          background: "none",
                          color: "#0F2D3B",
                          cursor: "pointer",
                          padding: "4px 8px",
                        }}
                      >
                        Entendido
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-3.5 rounded-xl border border-[#E5E0D5] bg-white px-4 py-2.5">
                    <img
                      src="/quintia/tejiva/tejiva-base.svg"
                      alt=""
                      className="block h-9 w-9 shrink-0"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-pretty font-texto text-base leading-snug text-[#0F2D3B]">
                        {v.briefLine}
                      </span>
                      <span className="font-mono text-[12px] text-[#6B7280]">
                        {v.briefSub}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => v.openAgent?.()}
                      className="h-11 shrink-0 cursor-pointer rounded-md border-0 bg-[#31C6E6] px-5 font-texto text-base font-bold !text-[#F7F5EF] transition hover:bg-[#1FA8C4]"
                    >
                      Preguntar
                    </button>
                  </div>
                  <div className="nara-page-head flex flex-wrap items-end justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h1 className="m-0 font-titulos text-[clamp(24px,4vw,28px)] font-extrabold leading-tight text-[#0F2D3B]">
                        Visitas de hoy
                      </h1>
                      {/* H-009: fecha real de hoy; la capa de fechas relativas no debe volver a correrla. */}
                      <span
                        className="font-mono text-sm text-[#6B7280]"
                        data-real-date
                      >
                        {(v.quotaDateLabel as string) || "Hoy"} · Solo cuentan
                        las visitas validadas
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => v.goNew?.()}
                      className="h-12 cursor-pointer whitespace-nowrap rounded-md border-[1.5px] border-[#0F2D3B] bg-white px-5 font-texto text-[17px] font-bold !text-[#0F2D3B] transition hover:bg-[#E5E0D5]/40"
                    >
                      + Nueva persona
                    </button>
                  </div>
                  <div className="nara-kpi-grid gap-3.5">
                    {(v.quotaCards || []).map((q: Record<string, any>, i: number) => (
                      <div
                        key={i}
                        className="flex flex-col gap-2 rounded-2xl border border-[#E5E0D5] bg-white px-[18px] py-4"
                      >
                        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-[#6B7280]">
                          {q.label}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-titulos text-[34px] font-extrabold leading-none text-[#0F2D3B]">
                            {q.val}
                          </span>
                          <span className="font-texto text-base text-[#6B7280]">
                            de {q.target}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-sm bg-[#E5E0D5]">
                          <div
                            className="h-full rounded-sm bg-[#0F2D3B]"
                            style={{ width: q.pct }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <TableSearch
                    value={worklistQ}
                    onChange={setWorklistQ}
                    placeholder="Buscar visita, persona, lugar, perfil…"
                    className="sm:max-w-md"
                  />
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #E5E0D5",
                      borderRadius: 20,
                      overflow: "hidden",
                    }}
                  >
                    <div className="nara-scroll-x">
                      <div style={{ minWidth: 940 }}>
                    {worklistRows.map((w: Record<string, any>, i: number) => (
                      <div
                        key={w.id ?? i}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "70px minmax(0,1.6fr) minmax(0,1.3fr) 90px minmax(0,1.6fr) 190px",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 20px",
                          borderBottom: "1px solid #E5E0D5",
                          background: w.rowBg,
                          boxShadow: w.rowShadow,
                        }}
                      >
                        <span style={{ fontSize: 17, fontWeight: 500 }}>
                          {w.time}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-titulos text-[17px] font-extrabold text-[#0F2D3B]">
                            {w.name}
                          </span>
                          <span className="font-mono text-[13px] text-[#6B7280]">
                            {w.age} años
                          </span>
                        </div>
                        <span style={{ fontSize: 16 }}>{w.place}</span>
                        <span style={{ fontSize: 15, color: "#6B7280" }}>
                          {w.zone}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            className="rounded-md px-2.5 py-1 font-mono text-[12px] font-medium"
                            style={{
                              background: w.tagBg,
                              color: w.tagFg,
                            }}
                          >
                            {w.tag}
                          </span>
                          {w.hasProfile ? (
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: "1px solid #E5E0D5",
                                background: "#fff",
                              }}
                            >
                              {w.profile}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          {w.hasAction ? (
                            <button
                              type="button"
                              onClick={() => w.onAction?.()}
                              className="h-12 cursor-pointer whitespace-nowrap rounded-md border-[1.5px] border-[#0F2D3B] px-[18px] font-texto text-base font-bold transition hover:opacity-90"
                              style={{
                                background: w.btnBg,
                                color: w.btnFg,
                              }}
                            >
                              {w.action}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {!worklistRows.length ? (
                      <p
                        style={{
                          margin: 0,
                          padding: "28px 20px",
                          textAlign: "center",
                          fontSize: 15,
                          color: "#6B7280",
                          borderTop: "1px solid #E5E0D5",
                        }}
                      >
                        {worklistQ.trim()
                          ? "Ninguna visita coincide con la búsqueda."
                          : "No hay visitas en la lista de hoy."}
                      </p>
                    ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <FormModal
                open={!!v.isNew}
                onClose={() => v.closeNewForm?.()}
                title={v.formTitle || "Nueva persona"}
                description={v.formDesc || "Complete la ficha. Territorio, experto, clínico y códigos se asignan solos."}
                size={v.formSize || "lg"}
                footer={(
                  <>
                    <button
                      type="button"
                      onClick={() => v.newSave?.()}
                      className="h-[46px] w-full cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta sm:w-auto"
                    >
                      {v.newSaveRetry
                        ? "Reintentar"
                        : v.formSaveLabel || "Agregar y empezar visita"}
                    </button>
                    <button
                      type="button"
                      onClick={() => v.closeNewForm?.()}
                      className="h-[46px] w-full cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-[18px] font-texto text-[15px] font-medium text-nara-tinta sm:w-auto"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              >
                <div className="flex flex-col gap-6">
                  {(v.newSections || []).map((sec: { title: string; fields: Record<string, any>[] }) => (
                    <section key={sec.title} className="flex flex-col gap-3">
                      <h3 className="font-titulos text-base font-semibold text-nara-tinta">{sec.title}</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {sec.fields.map((f: Record<string, any>) => {
                          const inputClass =
                            "h-11 w-full rounded-[9px] border-[1.5px] border-linea px-3 font-texto text-[15px] text-nara-tinta outline-none " +
                            (f.readOnly || f.kind === "readonly"
                              ? "cursor-default bg-nara-crema"
                              : "bg-nara-blanco");
                          return (
                            <label
                              key={f.key || f.label}
                              className={`flex w-full flex-col gap-1.5 font-medium ${f.span === 2 ? "sm:col-span-2" : ""}`}
                            >
                              <span className="leading-5">{f.label}</span>
                              {f.kind === "phone" ? (
                                <PhoneInput
                                  value={f.value}
                                  onChange={f.onChange}
                                  placeholder={f.ph}
                                />
                              ) : f.kind === "select" ? (
                                <select
                                  value={f.value}
                                  onChange={f.onChange}
                                  className={inputClass}
                                >
                                  <option value="">Seleccione…</option>
                                  {(f.options || []).map((o: string) => (
                                    <option key={o} value={o}>
                                      {o}
                                    </option>
                                  ))}
                                </select>
                              ) : f.onGenerate ? (
                                <div className="relative">
                                  <input
                                    type={f.kind === "email" ? "email" : "text"}
                                    value={f.value}
                                    onChange={f.readOnly || f.kind === "readonly" ? undefined : f.onChange}
                                    readOnly={!!f.readOnly || f.kind === "readonly"}
                                    placeholder={f.ph}
                                    autoComplete={f.kind === "password" ? "new-password" : undefined}
                                    className={`${inputClass} pr-[5.5rem]`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => f.onGenerate?.()}
                                    className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 cursor-pointer rounded-lg border-none bg-nara-crema px-2.5 font-texto text-xs font-medium text-nara-tinta"
                                  >
                                    Generar
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type={f.kind === "date" ? "date" : f.kind === "email" ? "email" : "text"}
                                  value={f.value}
                                  onChange={f.readOnly || f.kind === "readonly" ? undefined : f.onChange}
                                  readOnly={!!f.readOnly || f.kind === "readonly"}
                                  placeholder={f.ph}
                                  className={inputClass}
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
                {v.dupShow ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco p-4">
                    <span className="w-fit rounded-md bg-nara-crema px-2.5 py-1 text-sm font-medium">
                      Posible duplicado
                    </span>
                    <p className="text-[15px] leading-relaxed text-nara-tinta">
                      El teléfono ya está registrado para Marleny Osorio (Vereda Cocora). Puede ser un familiar que comparte teléfono.
                    </p>
                    <button
                      type="button"
                      onClick={() => v.dupConfirm?.()}
                      className="h-11 w-fit cursor-pointer rounded-[10px] border-none bg-nara-tinta px-4 font-texto text-[15px] font-medium text-nara-blanco"
                    >
                      Es otra persona
                    </button>
                  </div>
                ) : null}
              </FormModal>

              {v.inVisit ? (
                <div className="flex flex-col gap-4 px-4 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-7 sm:pt-6">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#5B6770]">
                      Visita · paso {((v.steps || []).findIndex((s: { active?: boolean }) => s.active) + 1) || 1} de 3
                    </p>
                    <h1 className="m-0 font-titulos text-[clamp(22px,3.5vw,28px)] font-extrabold tracking-tight text-nara-tinta">
                      {v.personName}
                    </h1>
                    <p className="m-0 font-texto text-[15px] text-[#5B6770]">
                      {v.personMeta}
                    </p>
                  </div>
                  <nav
                    aria-label="Pasos de la visita"
                    className="nara-tabs-scroll flex items-center gap-1 sm:gap-2"
                  >
                    {(v.steps || []).map((s: Record<string, any>, si: number) => (
                      <div key={si} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <span
                          className={`grid size-8 place-items-center rounded-full font-titulos text-[13px] font-extrabold transition duration-200 ${
                            s.active
                              ? "shadow-[0_0_0_3px_rgba(49,198,230,0.28)]"
                              : ""
                          }`}
                          style={{
                            background: s.bg,
                            color: s.fg,
                            border: `1.5px solid ${s.bd}`,
                          }}
                        >
                          {s.n}
                        </span>
                        <span
                          className={`hidden font-texto text-[14px] sm:inline ${
                            s.active
                              ? "font-bold text-nara-tinta"
                              : s.done
                                ? "font-medium text-nara-tinta"
                                : "font-medium text-[#5B6770]"
                          }`}
                        >
                          {s.label}
                        </span>
                        {s.arrow ? (
                          <span
                            className="px-0.5 font-texto text-[#5B6770]/50 sm:px-1"
                            aria-hidden
                          >
                            →
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </nav>
                </div>
              ) : null}

              {v.isConsent ? (
                <div className="grid grid-cols-1 gap-4 px-4 py-5 sm:gap-5 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] lg:items-start">
                  <section className="relative flex flex-col gap-3 overflow-hidden rounded-[24px] border border-[#E5E0D5] bg-white p-5 shadow-[0_18px_48px_rgba(15,45,59,0.06)] sm:gap-3.5 sm:p-6">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
                      style={{
                        background:
                          "linear-gradient(90deg, #61F0D2 0%, #31C6E6 45%, #6C04C9 100%)",
                      }}
                      aria-hidden
                    />
                    <header className="flex flex-col gap-1 pt-1">
                      <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B6770]">
                        Consentimiento informado
                      </p>
                      <p className="m-0 font-texto text-[15px] leading-snug text-nara-tinta">
                        Lea cada punto en voz alta y marque lo que la persona acepta.
                      </p>
                    </header>
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {(v.consentItems || []).map(
                        (c: Record<string, any>, ci: number) => {
                          const on = !!c.on || !!c.mark;
                          return (
                            <li key={ci}>
                              <button
                                type="button"
                                onClick={() => c.toggle?.()}
                                aria-pressed={on}
                                className={`flex w-full min-h-[56px] cursor-pointer items-start gap-3.5 rounded-2xl border px-3.5 py-3.5 text-left transition duration-200 ${
                                  on
                                    ? "border-[#31C6E6]/60 bg-[#E4F7FB] shadow-[0_10px_28px_rgba(49,198,230,0.14)]"
                                    : "border-[#E5E0D5] bg-white/90 hover:border-[#0F2D3B]/25 hover:bg-[#F7F5EF]/80"
                                }`}
                                style={{
                                  animationDelay: `${ci * 40}ms`,
                                }}
                              >
                                <span
                                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] border-2 text-[14px] font-bold transition ${
                                    on
                                      ? "border-nara-tinta bg-nara-tinta text-[#F7F5EF]"
                                      : "border-[#5B6770] bg-transparent text-transparent"
                                  }`}
                                  aria-hidden
                                >
                                  {on ? "✓" : ""}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col gap-1">
                                  <span className="font-texto text-[15px] font-medium leading-snug text-nara-tinta sm:text-[16px]">
                                    {c.text}
                                  </span>
                                  <span
                                    className={`w-fit rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                                      c.required
                                        ? "bg-nara-tinta text-[#F7F5EF]"
                                        : "bg-[#F7F5EF] text-[#5B6770]"
                                    }`}
                                  >
                                    {c.kind}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </section>

                  <aside className="flex flex-col gap-4">
                    <section className="flex flex-col gap-3 rounded-[24px] border border-[#E5E0D5] bg-white p-5 shadow-[0_18px_48px_rgba(15,45,59,0.06)] sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B6770]">
                            Firma
                          </p>
                          <h2 className="m-0 mt-1 font-titulos text-[18px] font-extrabold text-nara-tinta">
                            {v.sigTitle}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => v.sigClear?.()}
                          className="h-9 cursor-pointer rounded-xl border border-[#E5E0D5] bg-[#F7F5EF] px-3 font-texto text-[13px] font-semibold text-nara-tinta transition hover:border-[#31C6E6] hover:bg-[#E4F7FB]"
                        >
                          Borrar
                        </button>
                      </div>
                      <canvas
                        ref={v.sigRef}
                        width={440}
                        height={150}
                        className="box-border h-[150px] w-full cursor-crosshair touch-none rounded-2xl border-[1.5px] border-dashed border-[#31C6E6]/55 bg-[#F7F5EF]"
                      />
                      <p className="m-0 font-texto text-[13px] text-[#5B6770]">
                        {v.sigHint}
                      </p>
                      <button
                        type="button"
                        onClick={() => v.toggleRuego?.()}
                        aria-pressed={!!v.ruegoOn || !!v.ruego}
                        className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                          v.ruegoOn || v.ruego
                            ? "border-[#31C6E6]/55 bg-[#E4F7FB]"
                            : "border-[#E5E0D5] bg-white hover:bg-[#F7F5EF]"
                        }`}
                      >
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-[7px] border-2 text-[12px] font-bold ${
                            v.ruegoOn || v.ruego
                              ? "border-nara-tinta bg-nara-tinta text-[#F7F5EF]"
                              : "border-[#5B6770] bg-transparent text-transparent"
                          }`}
                          aria-hidden
                        >
                          {v.ruegoMark || ""}
                        </span>
                        <span className="font-texto text-[15px] font-medium text-nara-tinta">
                          Firma a ruego (un testigo firma por quien no puede escribir)
                        </span>
                      </button>
                      {v.ruego ? (
                        <input
                          value={v.witness}
                          onChange={v.setWitness}
                          placeholder="Nombre del testigo"
                          className="box-border h-12 w-full rounded-2xl border border-transparent bg-[#F7F5EF] px-4 font-texto text-[16px] text-nara-tinta shadow-[inset_0_0_0_1px_rgba(15,45,59,0.1)] outline-none transition focus:bg-white focus:shadow-[inset_0_0_0_2px_#31C6E6]"
                        />
                      ) : null}
                    </section>

                    <section className="flex flex-col gap-2.5 rounded-[24px] border border-[#E5E0D5] bg-gradient-to-br from-white to-[#E4F7FB]/50 p-5 sm:p-5">
                      <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B6770]">
                        Evidencia · automática
                      </p>
                      {(v.evidence || []).map(
                        (e: Record<string, any>, ei: number) => (
                          <div
                            key={ei}
                            className="flex items-baseline justify-between gap-3 border-t border-[#E5E0D5]/80 pt-2 first:border-t-0 first:pt-0"
                          >
                            <span className="shrink-0 font-texto text-[13px] text-[#5B6770]">
                              {e.k}
                            </span>
                            <span className="text-right font-texto text-[14px] font-medium text-nara-tinta">
                              {e.v}
                            </span>
                          </div>
                        ),
                      )}
                    </section>

                    {v.consentMsg ? (
                      <p
                        role="alert"
                        className="m-0 rounded-2xl border border-[#F2C4C0] bg-[#FDF2F1] px-4 py-3 font-texto text-[14px] text-[#8B2E2A]"
                      >
                        {String(v.consentMsg)}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => v.consentNext?.()}
                      className={`h-14 w-full cursor-pointer rounded-2xl border-none font-titulos text-[16px] font-extrabold tracking-tight transition duration-200 ${
                        v.consentReady
                          ? "bg-[#31C6E6] text-nara-tinta shadow-[0_14px_32px_rgba(49,198,230,0.35)] hover:-translate-y-0.5 hover:brightness-[1.03] active:translate-y-0"
                          : "bg-[#A8B0B6] text-[#F7F5EF]"
                      }`}
                      style={{
                        background: v.consentBtnBg,
                        color: v.consentBtnFg || undefined,
                      }}
                    >
                      Continuar a la evaluación
                    </button>
                  </aside>
                </div>
              ) : null}

              {v.isEval ? (
                <div
                  style={{
                    padding: "14px 28px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {v.crisis ? (
                    <div
                      style={{
                        background: "#FDE7E4",
                        border: "2px solid #B42318",
                        borderRadius: 14,
                        padding: "20px 22px",
                        display: "flex",
                        gap: 22,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#fff",
                            background: "#B42318",
                            alignSelf: "flex-start",
                            padding: "4px 10px",
                            borderRadius: 6,
                          }}
                        >
                          Crisis · protocolo activado
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif',
                        fontWeight: 800,
                            fontSize: 24,
                          }}
                        >
                          {v.crisisStay}
                        </span>
                        <span style={{ fontSize: 17, lineHeight: 1.5 }}>
                          La alerta ya se envió a la Dra. Lucía Marín, clínica de
                          turno. La meta es que llame en menos de 30 minutos. Si hay
                          peligro ahora: llame al 123. Si la persona necesita hablar
                          con alguien: Línea 192, opción 4.
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            background: "#fff",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 16,
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            Estado de la alerta:
                          </span>
                          <span>{v.alertStatusText}</span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          minWidth: 220,
                        }}
                      >
                        {(v.crisisLines || []).map(
                          (cl: Record<string, any>, cli: number) => (
                            <a
                              key={cli}
                              href={cl.tel}
                              style={{
                                minHeight: 54,
                                padding: "6px 12px",
                                boxSizing: "border-box",
                                borderRadius: 12,
                                border: "2px solid #B42318",
                                background: cl.bg,
                                color: cl.fg,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 17,
                                fontWeight: 500,
                                textAlign: "center",
                                textDecoration: "none",
                              }}
                            >
                              <span>{cl.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 400 }}>
                                {cl.sub}
                              </span>
                            </a>
                          ),
                        )}
                        <button
                          type="button"
                          onClick={() => v.goResult?.()}
                          style={{
                            fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                            fontSize: 16,
                            fontWeight: 500,
                            height: 54,
                            borderRadius: 12,
                            border: "1.5px solid #0F2D3B",
                            background: "#fff",
                            color: "#0F2D3B",
                            cursor: "pointer",
                          }}
                        >
                          Ver ruta de crisis
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>
                      <b style={{ fontWeight: 500 }}>{v.progressOk}</b>
                      <span style={{ color: "#0F2D3B" }}>{v.progressDraft}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => v.calc?.()}
                      style={{
                        fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                        fontSize: 17,
                        fontWeight: 500,
                        height: 50,
                        padding: "0 22px",
                        borderRadius: 12,
                        border: "none",
                        background: v.calcBg,
                        color: v.calcFg,
                        cursor: "pointer",
                      }}
                    >
                      Calcular resultado
                    </button>
                  </div>
                  <div
                    style={{ display: "flex", gap: 16, alignItems: "stretch" }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        width: "100%",
                        background: "#fff",
                        border: "1px solid #E5E0D5",
                        borderRadius: 20,
                        display: "flex",
                        flexDirection: "column",
                        height: 540,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          borderBottom: "1px solid #E5E0D5",
                        }}
                      >
                        {(v.secTabs || []).map(
                          (t: Record<string, any>, ti: number) => (
                            <button
                              key={ti}
                              type="button"
                              onClick={() => t.go?.()}
                              style={{
                                flex: 1,
                                fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                                fontSize: 16,
                                fontWeight: 500,
                                height: 54,
                                border: "none",
                                borderBottom: `3px solid ${t.bd}`,
                                background: "#fff",
                                color: t.fg,
                                cursor: "pointer",
                              }}
                            >
                              {t.label}{" "}
                              <span
                                style={{
                                  fontSize: 14,
                                  color: "#6B7280",
                                  fontWeight: 400,
                                }}
                              >
                                {t.count}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          overflow: "auto",
                          padding: "12px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {(v.rows || []).map((r: Record<string, any>, ri: number) => (
                          <div
                            key={ri}
                            style={{
                              border: `1.5px solid ${r.bd}`,
                              borderRadius: 12,
                              padding: "12px 14px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              background: "#fff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: 16, lineHeight: 1.4 }}>
                                <b style={{ fontWeight: 500 }}>{r.n}.</b> {r.q}
                              </span>
                              <span
                                style={{
                                  flex: "none",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  padding: "4px 9px",
                                  borderRadius: 6,
                                  background: r.tagBg,
                                  color: r.tagFg,
                                  border: `1px solid ${r.tagBd}`,
                                }}
                              >
                                {r.tag}
                              </span>
                            </div>
                            {r.sensitive ? (
                              <div
                                style={{
                                  background: "#F7F5EF",
                                  borderLeft: 0,
                                  borderRadius: 8,
                                  padding: "10px 12px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "#0F2D3B",
                                  }}
                                >
                                  Pregunta sensible · lea esta redacción exacta
                                </span>
                                <span style={{ fontSize: 16, lineHeight: 1.45 }}>
                                  «{v.q9}»
                                </span>
                              </div>
                            ) : null}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              {(r.opts || []).map(
                                (o: Record<string, any>, oi: number) => (
                                  <button
                                    key={oi}
                                    type="button"
                                    onClick={() => o.pick?.()}
                                    style={{
                                      fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                                      fontSize: 15,
                                      minHeight: 44,
                                      padding: "0 14px",
                                      borderRadius: 10,
                                      border: `1.5px solid ${o.bd}`,
                                      background: o.bg,
                                      color: o.fg,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {o.label}
                                  </button>
                                ),
                              )}
                              {r.isDraft ? (
                                <button
                                  type="button"
                                  onClick={() => r.confirm?.()}
                                  style={{
                                    fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                                    fontSize: 15,
                                    fontWeight: 500,
                                    minHeight: 44,
                                    padding: "0 14px",
                                    borderRadius: 14,
                                    border: "none",
                                    background: "#31C6E6",
                                    color: "#F7F5EF",
                                    cursor: "pointer",
                                    marginLeft: "auto",
                                  }}
                                >
                                  Confirmar
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          borderTop: "1px solid #E5E0D5",
                          padding: "10px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 14, color: "#6B7280" }}>
                          {v.secNote}
                        </span>
                        <button
                          type="button"
                          onClick={() => v.confirmSection?.()}
                          style={{
                            fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                            fontSize: 15,
                            fontWeight: 500,
                            height: 44,
                            padding: "0 16px",
                            borderRadius: 10,
                            border: `1.5px solid ${(v.confirmBtnBd as string) || "#0F2D3B"}`,
                            background: (v.confirmBtnBg as string) || "#fff",
                            color: (v.confirmBtnFg as string) || "#0F2D3B",
                            cursor: "pointer",
                          }}
                        >
                          {v.secDraftN
                            ? `Confirmar las revisadas · ${v.secDraftN}`
                            : "Confirmar las revisadas"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {v.isResult ? (
                <div
                  className="flex flex-col gap-4 py-3.5 sm:py-7"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <button
                      type="button"
                      onClick={() => v.saveVisit?.()}
                      className="h-[58px] w-full shrink-0 cursor-pointer rounded-[14px] border-0 bg-[#31C6E6] px-6 font-texto text-lg font-medium text-[#F7F5EF] sm:w-auto sm:min-w-[220px]"
                    >
                      Guardar visita
                    </button>
                    <span className="text-[15px] text-[#6B7280]">
                      {v.saveNote as string}
                    </span>
                  </div>
                  {v.crisis ? (
                    <div
                      className="flex flex-wrap items-center gap-5"
                      style={{
                        background: "#FDE7E4",
                        border: "2px solid #B42318",
                        borderRadius: 14,
                        padding: "18px 22px",
                        gap: 22,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#fff",
                            background: "#B42318",
                            alignSelf: "flex-start",
                            padding: "4px 10px",
                            borderRadius: 6,
                          }}
                        >
                          Crisis · el perfil queda suspendido
                        </span>
                        <span style={{ fontSize: 17, lineHeight: 1.5 }}>
                          {v.crisisStay} La Dra. Lucía Marín tiene la alerta. Si hay
                          peligro ahora: llame al 123. Si la persona necesita hablar
                          con alguien: Línea 192, opción 4.
                        </span>
                        <span style={{ fontSize: 16 }}>
                          <b style={{ fontWeight: 500 }}>Estado:</b>{" "}
                          {v.alertStatusText}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          minWidth: 220,
                        }}
                      >
                        {(v.crisisLines || []).map(
                          (cl: Record<string, any>, cli: number) => (
                            <a
                              key={cli}
                              href={cl.tel}
                              style={{
                                minHeight: 52,
                                padding: "6px 18px",
                                boxSizing: "border-box",
                                borderRadius: 12,
                                border: "2px solid #B42318",
                                background: cl.bg,
                                color: cl.fg,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 17,
                                fontWeight: 500,
                                textAlign: "center",
                                textDecoration: "none",
                              }}
                            >
                              <span>{cl.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 400 }}>
                                {cl.sub}
                              </span>
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className="nara-form-grid-3" style={{ gap: 16, alignItems: "start" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          background: "#fff",
                          border: "1px solid #E5E0D5",
                          borderRadius: 20,
                          padding: "18px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 15, color: "#6B7280" }}>
                          Salud mental · PHQ-9
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif',
                        fontWeight: 800,
                              fontSize: 30,
                            }}
                          >
                            {v.riskName}
                          </span>
                          <span style={{ fontSize: 17, color: "#6B7280" }}>
                            {v.phqTotal} de 27
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(v.riskScale || []).map(
                            (s: Record<string, any>, si: number) => (
                              <div
                                key={si}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    height: 12,
                                    borderRadius: 3,
                                    background: s.c,
                                    opacity: s.op,
                                    outline: s.ol,
                                    outlineOffset: 2,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: s.fg,
                                    fontWeight: s.fw,
                                  }}
                                >
                                  {s.k}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#fff",
                          border: "1px solid #E5E0D5",
                          borderRadius: 20,
                          padding: "18px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 15, color: "#6B7280" }}>
                          Capacidad digital
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif',
                        fontWeight: 800,
                              fontSize: 30,
                            }}
                          >
                            {v.digName}
                          </span>
                          <span style={{ fontSize: 17, color: "#6B7280" }}>
                            {v.digTotal} de 11
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(v.digScale || []).map(
                            (s: Record<string, any>, si: number) => (
                              <div
                                key={si}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    height: 12,
                                    borderRadius: 3,
                                    background: s.c,
                                    opacity: s.op,
                                    outline: s.ol,
                                    outlineOffset: 2,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: s.fg,
                                    fontWeight: s.fw,
                                  }}
                                >
                                  {s.k}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                        <span style={{ fontSize: 15, color: "#0F2D3B" }}>
                          {v.digNote}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #E5E0D5",
                        borderRadius: 20,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 15, color: "#6B7280" }}>Perfil</span>
                      <div className="nara-scroll-x">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "96px repeat(3,minmax(0,1fr))",
                          gap: 5,
                          fontSize: 13,
                          minWidth: 300,
                        }}
                      >
                        <span />
                        <span style={{ textAlign: "center", color: "#6B7280" }}>
                          Baja
                        </span>
                        <span style={{ textAlign: "center", color: "#6B7280" }}>
                          Media
                        </span>
                        <span style={{ textAlign: "center", color: "#6B7280" }}>
                          Alta
                        </span>
                        {(v.matrix || []).flatMap(
                          (row: Record<string, any>, ri: number) => [
                            <span
                              key={`${ri}-k`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                color: "#6B7280",
                              }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background: row.c,
                                }}
                              />
                              {row.k}
                            </span>,
                            ...(row.cells || []).map(
                              (cell: Record<string, any>, ci: number) => (
                                <div
                                  key={`${ri}-${ci}`}
                                  style={{
                                    height: 42,
                                    borderRadius: 8,
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 14,
                                    fontWeight: cell.fw,
                                    background: cell.bg,
                                    color: cell.fg,
                                    border: `2px ${cell.bs} ${cell.bd}`,
                                  }}
                                >
                                  {cell.label}
                                </div>
                              ),
                            ),
                          ],
                        )}
                      </div>
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 500 }}>
                        {v.profileLine}
                      </span>
                    </div>
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #E5E0D5",
                        borderRadius: 20,
                        padding: "16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 500 }}>
                        Evidencia de la visita
                      </span>
                      {(v.evidenceEnd || []).map(
                        (e: Record<string, any>, ei: number) => (
                          <div
                            key={ei}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 15,
                              gap: 12,
                            }}
                          >
                            <span style={{ color: "#6B7280" }}>{e.k}</span>
                            <span style={{ textAlign: "right" }}>{e.v}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="nara-split-panel" style={{ gap: 16, alignItems: "start" }}>
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #E5E0D5",
                        borderRadius: 20,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif',
                        fontWeight: 800,
                            fontSize: 22,
                          }}
                        >
                          {v.pathTitle}
                        </span>
                        <span style={{ fontSize: 16, color: "#6B7280" }}>
                          {v.pathDuration}
                        </span>
                      </div>
                      {(v.path || []).map((p: Record<string, any>, pi: number) => (
                        <div
                          key={pi}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 0",
                            borderTop: "1px solid #E5E0D5",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                            }}
                          >
                            <span style={{ fontSize: 16, fontWeight: 500 }}>
                              {p.name}
                            </span>
                            <span style={{ fontSize: 14, color: "#6B7280" }}>
                              {p.sub}
                            </span>
                          </div>
                          {p.main ? (
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                padding: "4px 9px",
                                borderRadius: 6,
                                background: "#0F2D3B",
                                color: "#fff",
                              }}
                            >
                              Servicio principal
                            </span>
                          ) : null}
                          <span
                            style={{
                              fontSize: 15,
                              minWidth: 130,
                              textAlign: "right",
                            }}
                          >
                            {p.freq}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => v.saveVisit?.()}
                        style={{
                          fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                          fontSize: 18,
                          fontWeight: 500,
                          height: 58,
                          borderRadius: 14,
                          border: "none",
                          background: "#31C6E6",
                          color: "#F7F5EF",
                          cursor: "pointer",
                        }}
                      >
                        Guardar visita
                      </button>
                      <span style={{ fontSize: 15, color: "#6B7280" }}>
                        {v.saveNote}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {v.toast ? (
                <div
                  style={{
                    position: "sticky",
                    bottom: 18,
                    margin: "0 auto",
                    width: "max-content",
                    maxWidth: "90%",
                    background: "#0F2D3B",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "14px 20px",
                    fontSize: 16,
                  }}
                >
                  {v.toastText}
                </div>
              ) : null}
              </div>
            </div>
      </div>

      <FormModal
        open={!!v.crisisConfirmOpen}
        title="Confirmar respuesta de crisis"
        description="Marcó una respuesta distinta de «Nunca» en la pregunta 9. Si confirma, se activará el protocolo de crisis y se avisará a la clínica de turno."
        size="sm"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => v.cancelCrisisPick?.()}
              className="h-11 w-full rounded-xl border border-[#E5E0D5] bg-white px-4 font-texto text-sm text-[#0F2D3B] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => v.confirmCrisisPick?.()}
              className="h-11 w-full rounded-xl bg-[#B42318] px-4 font-texto text-sm font-medium text-white sm:w-auto"
            >
              Confirmar y activar crisis
            </button>
          </div>
        }
      >
        <p className="font-texto text-[15px] leading-snug text-[#0F2D3B]">
          Respuesta elegida:{" "}
          <span className="font-medium">{v.crisisConfirmLabel || "—"}</span>
        </p>
        <p className="mt-2 font-texto text-sm text-[#6B7280]">
          Si fue un toque por error, cancele y elija de nuevo.
        </p>
      </FormModal>

    </>
  );
}
