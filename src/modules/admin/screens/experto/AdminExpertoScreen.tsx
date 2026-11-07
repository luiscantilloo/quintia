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
import { useAdminExpertoScreen } from "./useAdminExpertoScreen";

function AdminExpertoInner() {
  const { v } = useAdminExpertoScreen();
  const [peopleQ, setPeopleQ] = useState("");
  const peopleRows = useMemo(
    () => filterRowsBySearch(v?.people || [], peopleQ),
    [v?.people, peopleQ],
  );

  if (!v) {
    return <NaraLoadingScreen />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Experto"
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
          context="team"
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
          active="team"
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
          ← Equipos de campo
        </button>

        <NaraMsgAlert msg={v.msg} onClear={() => v.clearMsg()} />

        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold">
              {v.name}
            </h1>
            <p className="text-texto-secundario">
              {v.terr} · {v.phone}
              {v.tablet ? ` · Tablet ${v.tablet}` : " · Sin tablet"}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: v.sc }} />
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
              <span className="font-titulos text-[28px] font-semibold leading-tight">{k.val}</span>
              <span className="text-sm text-texto-secundario">{k.sub}</span>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <article className="flex h-full flex-col gap-4 rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="font-titulos text-xl font-semibold">Datos</h2>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-texto-secundario">Capacitación</span>
              <span className="text-[15px]">{v.training}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-texto-secundario">
                Territorio (uno solo)
              </span>
              {v.terrNames.length ? (
                <select
                  value={String(v.terr || "")}
                  onChange={(e) => v.setTerr(e.target.value)}
                  className="box-border h-11 w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta"
                >
                  {v.terrNames.map((t: string) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[15px] text-texto-secundario">Sin territorios creados.</span>
              )}
            </div>
          </article>

          <article className="flex h-full flex-col gap-3 rounded-2xl border border-linea bg-nara-blanco p-5">
            <h2 className="font-titulos text-xl font-semibold">Acciones</h2>
            <div className="flex flex-1 flex-col justify-center gap-2.5">
              {v.training === "Pendiente" ? (
                <button
                  type="button"
                  onClick={() => v.completeTraining()}
                  className="h-11 w-full cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-4 font-texto text-[15px] font-medium text-nara-tinta"
                >
                  Marcar capacitación completa
                </button>
              ) : null}
              {!v.tablet ? (
                <button
                  type="button"
                  onClick={() => v.assignTablet()}
                  className="h-11 w-full cursor-pointer rounded-[14px] border-none bg-nara-tinta px-4 font-texto text-[15px] font-medium text-nara-blanco"
                >
                  Asignar tablet
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => v.toggleActive()}
                className="h-11 w-full cursor-pointer rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
              >
                {v.active ? "Desactivar experto" : "Activar experto"}
              </button>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco">
          <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="font-titulos text-xl font-semibold">Personas asignadas</h2>
              <span className="text-sm text-texto-secundario">
                {peopleRows.length}
                {peopleQ.trim() ? ` de ${v.people.length}` : ""}
              </span>
            </div>
            {!v.noPeople ? (
              <TableSearch
                value={peopleQ}
                onChange={setPeopleQ}
                placeholder="Buscar código, nombre, lugar…"
              />
            ) : null}
          </div>
          {v.noPeople ? (
            <p className="border-t border-[#E5E0D5] px-5 py-4 text-[15px] text-texto-secundario">
              Aún no tiene personas. Aparecerán cuando registre visitas de campo.
            </p>
          ) : (
            <div className="nara-scroll-x">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr] gap-3 border-b border-[#E5E0D5] bg-[#F7F5EF] px-5 py-3 text-sm font-medium text-[#6B7280]">
                  <span>Código</span>
                  <span>Nombre</span>
                  <span>Lugar</span>
                  <span>Perfil</span>
                  <span>Estado</span>
                </div>
                {peopleRows.map((p) => (
                  <button
                    key={p.code + p.name}
                    type="button"
                    onClick={() => p.open()}
                    className="grid w-full cursor-pointer grid-cols-[1fr_1.2fr_1fr_1fr_1fr] gap-3 border-t border-[#E5E0D5] bg-nara-blanco px-5 py-3 text-left font-texto text-[15px] text-nara-tinta"
                  >
                    <span className="font-medium">{p.code}</span>
                    <span>{p.name}</span>
                    <span>{p.place}</span>
                    <span>{p.profile}</span>
                    <span>{p.status}</span>
                  </button>
                ))}
                {!peopleRows.length ? (
                  <p className="border-t border-[#E5E0D5] px-5 py-6 text-center text-[15px] text-texto-secundario">
                    Ninguna persona coincide con la búsqueda.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco">
          <div className="px-5 py-3.5">
            <h2 className="font-titulos text-xl font-semibold">Visitas marcadas</h2>
          </div>
          {v.noFlags ? (
            <p className="border-t border-[#E5E0D5] px-5 py-4 text-[15px] text-texto-secundario">
              Sin visitas marcadas por control de calidad.
            </p>
          ) : (
            <ul className="flex flex-col border-t border-[#E5E0D5]">
              {v.flags.map((f) => (
                <li key={f.key} className="flex flex-col gap-1 border-b border-[#E5E0D5] px-5 py-3 last:border-none">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{f.person}</span>
                    <span className="text-sm text-texto-secundario">{f.when} · {f.status}</span>
                  </div>
                  {f.reasons.map((r) => (
                    <span key={r} className="text-sm text-texto-secundario">
                      · {r}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AgentDrawerShell>
  );
}

export function AdminExpertoScreen() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminExpertoInner />
    </Suspense>
  );
}
