"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { FormModal } from "@/components/shared/form-modal/FormModal";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { TableSearch } from "@/components/shared/table-search/TableSearch";
import { ix } from "../inlineStyle";

export function AdminInformesContent({ v }: { v: Record<string, any> }) {
  return (
    <>
      <PageHead>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold text-nara-tinta">
            Informes
          </span>
          <span className="text-[15px] text-texto-secundario">
            Biblioteca, informes programados y creación de informes nuevos
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex w-full min-w-0 overflow-hidden rounded-[10px] border-[1.5px] border-nara-tinta sm:w-auto">
            {v.tabs?.map((t: any) => (
              <button
                key={t.key}
                type="button"
                onClick={() => t.go()}
                className="h-11 min-w-0 flex-1 cursor-pointer border-none px-3 font-texto text-sm font-medium whitespace-nowrap sm:flex-none sm:px-[18px] sm:text-[15px]"
                style={{ background: t.bg, color: t.fg }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => v.openNewForm()}
            className="h-11 w-full cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta sm:w-auto sm:shrink-0"
          >
            + Crear informe
          </button>
        </div>
      </PageHead>

      <NaraMsgAlert msg={v.msg} onClear={() => v.clearMsg?.()} />

      <FormModal
        open={!!v.shareTarget}
        title="Compartir informe"
        description={
          v.shareTarget
            ? `Elija con quién compartir «${v.shareTarget.name}».`
            : undefined
        }
        size="md"
        footer={
          <button
            type="button"
            onClick={() => v.closeShare?.()}
            className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
          >
            Cancelar
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-texto-secundario">{v.shareTarget?.shareNote}</p>
          <div className="flex flex-wrap gap-2">
            {v.shareTarget?.shareTo?.map((s: any) => (
              <button
                key={s.key}
                type="button"
                onClick={() => s.go()}
                disabled={s.off}
                title={s.why}
                className="h-9 cursor-pointer rounded-lg border border-linea px-3 font-texto text-[13px] font-medium disabled:cursor-not-allowed"
                style={{ background: s.bg, color: s.fg }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </FormModal>

      {v.tLib ? (
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-end">
            <label className="flex min-w-0 flex-col gap-1 text-[13px] text-texto-secundario">
              Tipo
              <select
                value={v.ft}
                onChange={v.setFt}
                className="box-border h-10 w-full min-w-0 rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2.5 font-texto text-sm text-nara-tinta"
              >
                <option value="">Todos</option>
                {v.typeOpts?.map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-[13px] text-texto-secundario">
              Autor
              <select
                value={v.fa}
                onChange={v.setFa}
                className="box-border h-10 w-full min-w-0 rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-2.5 font-texto text-sm text-nara-tinta"
              >
                <option value="">Todos</option>
                {v.authorOpts?.map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <TableSearch
              value={String(v.fq ?? "")}
              onChange={v.setFq}
              placeholder="Buscar por cualquier campo…"
              className="sm:col-span-2 lg:col-span-1 sm:max-w-none"
            />
            <span className="self-center text-sm text-texto-secundario sm:col-span-2 lg:col-span-1 lg:justify-self-end lg:pb-2">
              {v.libCount}
            </span>
          </div>

          {/* Móvil: tarjetas */}
          <div className="flex flex-col gap-2 md:hidden">
            {v.lib?.map((r: any) => (
              <article
                key={r.key}
                className="flex flex-col gap-3 rounded-2xl border border-linea bg-nara-blanco px-4 py-3.5"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium text-nara-tinta">{r.name}</span>
                  <span className="text-xs text-texto-secundario">{r.scope}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-secundario">
                  <span>{r.type}</span>
                  <span>{r.date}</span>
                  <span>{r.author}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={r.href}
                    className="inline-flex h-9 items-center rounded-lg bg-nara-tinta px-3 text-sm font-medium text-white"
                  >
                    Abrir
                  </Link>
                  <button
                    type="button"
                    onClick={() => r.toggleShare()}
                    className="h-9 cursor-pointer rounded-lg border-[1.5px] border-nara-tinta bg-nara-blanco px-3 font-texto text-sm font-medium text-nara-tinta"
                  >
                    Compartir
                  </button>
                </div>
              </article>
            ))}
            {v.noLib ? (
              <div className="rounded-2xl border border-linea bg-nara-blanco px-5 py-5 text-[15px] text-texto-secundario">
                No hay informes con ese filtro.
              </div>
            ) : null}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden overflow-hidden rounded-[20px] border border-linea bg-nara-blanco md:block">
            <div className="nara-scroll-x">
              <div style={{ minWidth: 860 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) 130px minmax(0,1fr) 250px",
                    gap: 12,
                    padding: "10px 20px",
                    background: "#F7F5EF",
                    color: "#6B7280",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  <span>Informe</span>
                  <span>Tipo</span>
                  <span>Fecha</span>
                  <span>Autor</span>
                  <span />
                </div>
                {v.lib?.map((r: any) => (
                  <div key={r.key} style={{ borderTop: "1px solid #E5E0D5" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) 130px minmax(0,1fr) 250px",
                        gap: 12,
                        padding: "11px 20px",
                        alignItems: "center",
                        fontSize: 14,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{r.scope}</span>
                      </div>
                      <span>{r.type}</span>
                      <span>{r.date}</span>
                      <span>{r.author}</span>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link
                          href={r.href}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: 36,
                            padding: "0 12px",
                            borderRadius: 8,
                            background: "#0F2D3B",
                            color: "#fff",
                            fontWeight: 500,
                          }}
                        >
                          Abrir
                        </Link>
                        <button
                          type="button"
                          onClick={() => r.toggleShare()}
                          style={{
                            fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                            fontSize: 14,
                            fontWeight: 500,
                            height: 36,
                            padding: "0 12px",
                            borderRadius: 8,
                            border: "1.5px solid #0F2D3B",
                            background: "#fff",
                            color: "#0F2D3B",
                            cursor: "pointer",
                          }}
                        >
                          Compartir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {v.noLib ? (
                  <span style={{ display: "block", padding: 20, color: "#6B7280" }}>
                    No hay informes con ese filtro.
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {v.tSched ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {v.scheds?.map((s: any) => (
            <div
              key={s.key}
              className="nara-form-grid-3"
              style={{
                background: "#fff",
                border: "1px solid #E5E0D5",
                borderRadius: 20,
                padding: "18px 20px",
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 17 }}>{s.name}</span>
                <span style={{ fontSize: 14, color: "#6B7280" }}>Próximo envío: {s.next}</span>
                <Link href={s.href} style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                  Ver el último →
                </Link>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500, fontSize: 14 }}>
                Frecuencia
                <select
                  value={s.freq}
                  onChange={s.setFreq}
                  style={{
                    height: 42,
                    borderRadius: 9,
                    border: "1.5px solid #E5E0D5",
                    padding: "0 10px",
                    fontSize: 15,
                    background: "#fff",
                  }}
                >
                  <option>Semanal · lunes</option>
                  <option>Semanal · viernes</option>
                  <option>Quincenal · viernes</option>
                  <option>Mensual · primer día hábil</option>
                  <option>Pausado</option>
                </select>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>Destinatarios</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.to?.map((t: any) => (
                    <span
                      key={t.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        padding: "5px 6px 5px 10px",
                        borderRadius: 999,
                        background: "#E7FAF5",
                      }}
                    >
                      {t.name}
                      <button
                        type="button"
                        onClick={() => t.remove()}
                        aria-label="Quitar"
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 14,
                          color: "#0F2D3B",
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={s.addSel}
                    onChange={s.setAdd}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 38,
                      borderRadius: 9,
                      border: "1.5px solid #E5E0D5",
                      padding: "0 8px",
                      fontSize: 14,
                      background: "#fff",
                    }}
                  >
                    <option value="">Agregar destinatario</option>
                    {s.addOpts?.map((o: any) => (
                      <option key={o.key} value={o.v} disabled={o.off}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => s.add()}
                    style={{
                      fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                      fontSize: 14,
                      fontWeight: 500,
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 9,
                      border: "1.5px solid #0F2D3B",
                      background: "#fff",
                      color: "#0F2D3B",
                      cursor: "pointer",
                    }}
                  >
                    Agregar
                  </button>
                </div>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <FormModal
        open={!!v.tNew}
        onClose={() => v.closeNewForm()}
        title="Crear informe"
        description="Elija plantilla, período y secciones. Puede guardar o descargar."
        size="lg"
        footer={(
          <>
            <button
              type="button"
              onClick={() => v.saveNew()}
              className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-[18px] font-texto text-[15px] font-medium text-nara-tinta"
            >
              Guardar en la biblioteca
            </button>
            <button
              type="button"
              onClick={() => v.closeNewForm()}
              className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
            >
              Cancelar
            </button>
          </>
        )}
      >
        <div className="nara-split-panel">
          <div
            style={{
              background: "#fff",
              border: "1px solid #E5E0D5",
              borderRadius: 20,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minWidth: 0,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500 }}>
              Nombre del informe
              <input
                value={v.nf.name}
                onChange={v.nfSet.name}
                style={{
                  height: 44,
                  borderRadius: 9,
                  border: "1.5px solid #E5E0D5",
                  padding: "0 12px",
                  fontSize: 15,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </label>
            <div className="nara-form-grid-3">
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500 }}>
                Plantilla
                <select
                  value={v.nf.tpl}
                  onChange={v.nfSet.tpl}
                  style={{
                    height: 44,
                    borderRadius: 9,
                    border: "1.5px solid #E5E0D5",
                    padding: "0 10px",
                    fontSize: 15,
                    background: "#fff",
                  }}
                >
                  <option value="ops">Operaciones</option>
                  <option value="board">Junta · agregado</option>
                  <option value="qc">Calidad de campo</option>
                  <option value="terr">Territorio</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500 }}>
                Período
                <select
                  value={v.nf.per}
                  onChange={v.nfSet.per}
                  style={{
                    height: 44,
                    borderRadius: 9,
                    border: "1.5px solid #E5E0D5",
                    padding: "0 10px",
                    fontSize: 15,
                    background: "#fff",
                  }}
                >
                  <option value="w">Última semana</option>
                  <option value="m">Último mes</option>
                  <option value="all">Desde el inicio (3 ago)</option>
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontWeight: 500 }}>
                Territorio
                <select
                  value={v.nf.terr}
                  onChange={v.nfSet.terr}
                  style={{
                    height: 44,
                    borderRadius: 9,
                    border: "1.5px solid #E5E0D5",
                    padding: "0 10px",
                    fontSize: 15,
                    background: "#fff",
                  }}
                >
                  <option value="">Todos</option>
                  {v.terrOpts?.map((o: string) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontWeight: 500 }}>Secciones</span>
              <div className="nara-form-grid-3" style={{ gap: "4px 14px" }}>
                {v.secs?.map((c: any) => (
                  <div
                    key={c.key}
                    onClick={() => c.toggle()}
                    style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", minHeight: 36 }}
                  >
                    <span
                      style={ix`width:20px;height:20px;border-radius:5px;border:2px solid ${c.bd};background:${c.bg};color:#fff;font-size:12px;display:grid;place-items:center;box-sizing:border-box`}
                    >
                      {c.mark}
                    </span>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                borderTop: "1px solid #E5E0D5",
                paddingTop: 14,
              }}
            >
              <Link
                href={v.previewHref}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 44,
                  padding: "0 18px",
                  borderRadius: 10,
                  border: "1.5px solid #0F2D3B",
                  fontWeight: 500,
                }}
              >
                Vista previa
              </Link>
              <Link
                href={v.pdfHref}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 44,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "1.5px solid #0F2D3B",
                  fontWeight: 500,
                }}
              >
                Descargar PDF
              </Link>
              <button
                type="button"
                onClick={() => v.excel()}
                style={{
                  fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                  fontSize: 15,
                  fontWeight: 500,
                  height: 44,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "1.5px solid #0F2D3B",
                  background: "#fff",
                  color: "#0F2D3B",
                  cursor: "pointer",
                }}
              >
                Descargar Excel
              </button>
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
            <span style={{ fontWeight: 500, fontSize: 17 }}>Contenido</span>
            {v.outline?.map((o: any) => (
              <div
                key={o.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  borderTop: "1px solid #E5E0D5",
                  paddingTop: 8,
                }}
              >
                <span style={{ fontWeight: 500 }}>{o.t}</span>
                <span style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.4 }}>{o.x}</span>
              </div>
            ))}
            <span
              style={{
                fontSize: 13,
                color: "#6B7280",
                borderTop: "1px solid #E5E0D5",
                paddingTop: 8,
              }}
            >
              {v.aggNote}
            </span>
          </div>
        </div>
      </FormModal>

    </>
  );
}
