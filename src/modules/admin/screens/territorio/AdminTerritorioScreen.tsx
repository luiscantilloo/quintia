"use client";

import { Suspense, useMemo, useState } from "react";
import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import {
  TableSearch,
  filterRowsBySearch,
} from "@/components/shared/table-search/TableSearch";
import { useAdminTerritorioScreen } from "./useAdminTerritorioScreen";

function AdminTerritorioInner() {
  const { v } = useAdminTerritorioScreen();
  const [placesQ, setPlacesQ] = useState("");
  const placesRows = useMemo(
    () => filterRowsBySearch(v?.places || [], placesQ),
    [v?.places, placesQ],
  );

  if (!v) {
    return <NaraLoadingScreen />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Territorio"
      open={!!v.agentOpen}
      drawerWidth={String(v.drawerW || "480px")}
      onClose={() => v.closeAgent()}
      className="bg-nara-crema font-texto text-nara-tinta"
      drawer={
        <AgentPanel
          role="admin"
          mode="drawer"
          open={!!v.agentOpen}
          initialAsk={String(v.pendingAsk || "")}
          context="terr"
          contextLabel={"Sobre: " + v.name}
          onClose={() => v.closeAgent()}
          style={{
            flex: 1,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        />
      }
      header={
        <AdminTopbar
          active="terr"
          onOpenAgent={() => v.openAgent()}
          agentOpen={!!v.agentOpen}
        />
      }
    >
      <div className="nara-page flex flex-col gap-4 md:gap-[18px]">
        <div className="nara-page-head gap-3">
        <button
          type="button"
          onClick={() => v.back()}
          className="w-fit cursor-pointer border-none bg-transparent p-0 font-texto text-[15px] font-medium text-nara-tinta"
        >
          ← Territorios
        </button>

        <NaraMsgAlert msg={v.msg} onClear={() => v.clearMsg()} />

        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold">
              {v.name}
            </h1>
            <p className="text-texto-secundario">
              {v.dep} · {v.level}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 font-medium">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: v.sc }}
            />
            {v.status}
          </span>
        </header>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {v.kpis.map((k) => (
            <article
              key={k.label}
              className="flex flex-col gap-1.5 rounded-2xl border border-linea bg-nara-blanco px-[18px] py-4"
            >
              <span className="text-sm text-texto-secundario">{k.label}</span>
              <span className="font-titulos text-[28px] font-semibold leading-tight">
                {k.val}
              </span>
              <span className="text-sm text-texto-secundario">{k.sub}</span>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="flex flex-col gap-3 rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="font-titulos text-xl font-semibold">Contenido e instituciones</h2>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-texto-secundario">Contenido local</span>
              {v.content.length ? (
                v.content.map((c) => (
                  <span key={c} className="text-[15px]">
                    · {c}
                  </span>
                ))
              ) : (
                <span className="text-[15px] text-texto-secundario">Sin módulos locales registrados.</span>
              )}
            </div>
            <div className="flex flex-col gap-2 border-t border-linea pt-3">
              <span className="text-sm font-medium text-texto-secundario">Instituciones de remisión</span>
              {v.insts.length ? (
                v.insts.map((c) => (
                  <span key={c} className="text-[15px]">
                    · {c}
                  </span>
                ))
              ) : (
                <span className="text-[15px] text-texto-secundario">Sin instituciones.</span>
              )}
            </div>
          </article>

          <article className="flex flex-col gap-3 rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="font-titulos text-xl font-semibold">Acciones</h2>
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1.5 font-medium">
                Línea de crisis local
                <input
                  value={v.crisisLine}
                  onChange={v.setCrisisLine}
                  placeholder="Ej.: 018000…"
                  className="h-11 rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta"
                />
              </label>
              <button
                type="button"
                onClick={() => v.saveCrisis()}
                className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta"
              >
                Guardar línea de crisis
              </button>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-linea pt-3">
              <button
                type="button"
                onClick={() => v.togglePause()}
                className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
              >
                {v.paused ? "Reactivar territorio" : "Desactivar territorio"}
              </button>
              {/* Temporal: ocultos «Asignar 100 manillas», «Asignar expertos» y «Ver personas». */}
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco">
          <div className="flex items-baseline justify-between gap-3 px-5 py-3.5">
            <h2 className="font-titulos text-xl font-semibold">Experto del territorio</h2>
          </div>
          {v.experts.length ? (
            <div className="nara-scroll-x">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.4fr_1fr_90px_90px_1.2fr] gap-3 border-b border-[#E5E0D5] bg-[#F7F5EF] px-5 py-3 text-sm font-medium text-[#6B7280]">
                  <span>Nombre</span>
                  <span>Celular</span>
                  <span>Hoy</span>
                  <span>Semana</span>
                  <span>Capacitación</span>
                </div>
                {v.experts.slice(0, 1).map((e) => (
                  <button
                    key={e.name}
                    type="button"
                    onClick={() => e.open()}
                    className="grid w-full cursor-pointer grid-cols-[1.4fr_1fr_90px_90px_1.2fr] gap-3 border-t border-[#E5E0D5] bg-nara-blanco px-5 py-3 text-left font-texto text-[15px] text-nara-tinta"
                  >
                    <span className="font-medium">{e.name}</span>
                    <span>{e.phone}</span>
                    <span>{e.today}</span>
                    <span>{e.week}</span>
                    <span>{e.training}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="border-t border-[#E5E0D5] px-5 py-4 text-[15px] text-texto-secundario">
              Aún no hay experto asignado a este territorio.
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco">
          <div className="flex flex-col gap-3 px-5 py-3.5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="font-titulos text-xl font-semibold">Veredas y barrios</h2>
                <p className="text-sm text-texto-secundario">{v.placeSummary}</p>
              </div>
              {!v.noPlaces ? (
                <TableSearch
                  value={placesQ}
                  onChange={setPlacesQ}
                  placeholder="Buscar lugar, tipo, alertas…"
                />
              ) : null}
            </div>
          </div>
          {v.noPlaces ? (
            <p className="border-t border-[#E5E0D5] px-5 py-4 text-[15px] text-texto-secundario">
              Sin veredas ni barrios distintos del territorio. La captación está en el resumen de arriba.
            </p>
          ) : (
            <div className="nara-scroll-x">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.4fr_90px_1fr_80px_80px] gap-3 border-b border-[#E5E0D5] bg-[#F7F5EF] px-5 py-3 text-sm font-medium text-[#6B7280]">
                  <span>Lugar</span>
                  <span>Tipo</span>
                  <span>Captación</span>
                  <span>%</span>
                  <span>Alertas</span>
                </div>
                {placesRows.map((p, i) => (
                  <div
                    key={`${p.name}-${p.zone}-${i}`}
                    className="grid grid-cols-[1.4fr_90px_1fr_80px_80px] gap-3 border-t border-[#E5E0D5] px-5 py-3 text-[15px]"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span>{p.zone}</span>
                    <span>
                      {p.n} / {p.goal}
                    </span>
                    <span>{p.pct}</span>
                    <span>{p.alerts}</span>
                  </div>
                ))}
                {!placesRows.length ? (
                  <p className="border-t border-[#E5E0D5] px-5 py-6 text-center text-[15px] text-texto-secundario">
                    Ningún lugar coincide con la búsqueda.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </AgentDrawerShell>
  );
}

export function AdminTerritorioScreen() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminTerritorioInner />
    </Suspense>
  );
}
