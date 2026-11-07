"use client";

import { Suspense } from "react";
import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { useAdminPersonaScreen } from "./useAdminPersonaScreen";

function AdminPersonaInner() {
  const { v } = useAdminPersonaScreen();

  if (!v?.ready) {
    return <NaraLoadingScreen />;
  }

  return (
    <AgentDrawerShell
      data-screen-label="Persona"
      open={!!v.agentOpen}
      drawerWidth="480px"
      onClose={() => v.closeAgent()}
      className="bg-nara-crema font-texto text-nara-tinta"
      drawer={
        <AgentPanel
          role="admin"
          mode="drawer"
          open={!!v.agentOpen}
          context="people"
          contextLabel={"Sobre: " + (v.code || "Persona")}
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
          active="people"
          onOpenAgent={() => v.openAgent()}
          agentOpen={!!v.agentOpen}
        />
      }
    >
      <div className="nara-page flex flex-col gap-4 md:gap-5">
        <NaraMsgAlert msg={v.msg} onClear={() => v.clearMsg()} />
        <NaraMsgAlert msg={v.err} onClear={() => v.clearErr()} options={{ icon: "warning" }} />

        <PageHead>
          <div className="flex w-full min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => v.back()}
                className="self-start border-none bg-transparent p-0 font-texto text-sm text-texto-secundario underline"
              >
                ← Personas
              </button>
              <span className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold text-nara-tinta">
                {v.missing ? "Persona no encontrada" : v.showName ? v.name : v.code}
              </span>
              <span className="text-[15px] text-texto-secundario">
                {v.missing
                  ? `No hay ficha con código «${v.code}».`
                  : `${v.code} · ${v.profile} · ${v.status}`}
              </span>
            </div>
            {!v.missing ? (
              <span
                className="inline-flex items-center gap-2 rounded-lg border border-linea bg-nara-blanco px-3 py-1.5 text-sm font-medium"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: v.riskColor }}
                />
                {v.hasProfile
                  ? `${v.riskLabel} · digital ${String(v.digLabel || "").toLowerCase()}`
                  : "Sin perfil de ruta"}
              </span>
            ) : null}
          </div>
        </PageHead>

        {v.missing ? (
          <div className="rounded-[20px] border border-linea bg-nara-blanco p-5">
            <p className="text-[15px] text-texto-secundario">
              Vuelva al listado o busque otro código. Si acaba de migrar datos, recargue la página.
            </p>
            <button
              type="button"
              onClick={() => v.back()}
              className="mt-4 h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta"
            >
              Volver a Personas
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Territorio", val: v.terr },
                { label: "Vereda o barrio", val: v.place },
                { label: "Fecha de nacimiento", val: v.birthDate || (v.age != null && v.age !== "—" ? `${v.age} años` : "—") },
                { label: "Avance", val: v.prog },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex flex-col gap-1.5 rounded-[20px] border border-linea bg-nara-blanco px-[18px] py-4"
                >
                  <span className="text-sm text-texto-secundario">{k.label}</span>
                  <span className="font-titulos text-xl font-semibold leading-tight">{k.val}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-5">
                <h2 className="font-titulos text-lg font-semibold">Datos de la ficha</h2>
                <dl className="flex flex-col gap-2.5 text-sm">
                  {[
                    ["Código", v.code],
                    ["Id interno", v.id],
                    v.firstName || v.lastName
                      ? ["Nombre", v.firstName || "—"]
                      : v.showName
                        ? ["Nombre", v.name]
                        : null,
                    v.firstName || v.lastName
                      ? ["Apellido", v.lastName || "—"]
                      : null,
                    ["Correo", v.email],
                    ["Teléfono", v.phone],
                    ["Experto", v.expert],
                    ["Clínico", v.clin],
                    v.sexo ? ["Sexo", v.sexo] : null,
                    v.genero ? ["Género", v.genero] : null,
                    v.estadoCivil ? ["Estado civil", v.estadoCivil] : null,
                    v.estrato ? ["Estrato", v.estrato] : null,
                    v.source ? ["Origen", v.source] : null,
                  ]
                    .filter(Boolean)
                    .map((row) => {
                      const [dt, dd] = row as [string, string];
                      return (
                        <div key={dt} className="grid grid-cols-[120px_minmax(0,1fr)] gap-2 border-t border-[#E5E0D5] pt-2 first:border-0 first:pt-0">
                          <dt className="text-texto-secundario">{dt}</dt>
                          <dd className="min-w-0 break-words font-medium">{dd || "—"}</dd>
                        </div>
                      );
                    })}
                </dl>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5E0D5]">
                    <div
                      className="h-full rounded-full bg-nara-tinta"
                      style={{ width: v.pct }}
                    />
                  </div>
                  <span className="text-xs text-texto-secundario whitespace-nowrap">{v.pct}</span>
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-5">
                <div className="flex flex-col gap-1">
                  <h2 className="font-titulos text-lg font-semibold">Servicios de su ruta</h2>
                  <p className="text-sm text-texto-secundario">
                    Solo consulta: la misma configuración de{" "}
                    <strong className="font-medium text-nara-tinta">Rutas · Servicios por perfil</strong>
                    {v.hasProfile ? ` para ${v.profile}` : ""}. Los cambios se hacen allá (y pasan por
                    aprobación clínica); aquí solo se previsualiza.
                  </p>
                </div>
                {!v.hasProfile ? (
                  <p className="border-t border-[#E5E0D5] pt-3 text-sm text-texto-secundario">
                    Sin perfil de ruta aún. Cuando el experto complete el cuestionario y quede
                    clasificada, aquí aparecerán los servicios activos de ese perfil.
                  </p>
                ) : !v.modules?.length ? (
                  <p className="border-t border-[#E5E0D5] pt-3 text-sm text-texto-secundario">
                    Este perfil no tiene servicios activos en la ruta actual.
                  </p>
                ) : (
                  v.modules.map((m: {
                    key: string;
                    name: string;
                    desc: string;
                    swBg: string;
                    x: string;
                  }) => (
                    <div
                      key={m.key}
                      className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-2.5 border-t border-[#E5E0D5] py-2"
                    >
                      <span
                        className="relative h-[26px] w-11 rounded-full"
                        style={{ background: m.swBg }}
                        aria-hidden
                      >
                        <span
                          className="absolute top-[3px] h-5 w-5 rounded-full bg-white"
                          style={{ left: m.x }}
                        />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className="text-xs text-texto-secundario">{m.desc}</span>
                      </span>
                    </div>
                  ))
                )}
              </section>
            </div>

            {/* H-014 (reporte TRL 2026-10-10): archivar desde la interfaz, con motivo y registro. */}
            <section className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-5" aria-labelledby="archivar-titulo">
              <h2 id="archivar-titulo" className="font-titulos text-lg font-semibold">Archivar persona</h2>
              <p className="text-sm text-texto-secundario">
                La ficha deja de aparecer en las listas y los conteos. No se borra: queda registrado quién la archivó, cuándo y por qué.
              </p>
              {!v.archivo?.abierto ? (
                <button
                  type="button"
                  onClick={() => v.abrirArchivo?.()}
                  className="h-11 cursor-pointer self-start rounded-[14px] border-[1.5px] border-[#9C2F25] bg-nara-blanco px-5 font-texto text-[15px] font-medium text-[#9C2F25]"
                >
                  Archivar
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Motivo
                    <textarea
                      value={v.archivo.motivo}
                      onChange={(e) => v.motivoArchivo?.(e.target.value)}
                      rows={2}
                      placeholder="Por ejemplo: la persona pidió retirar sus datos del programa"
                      className="rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3.5 py-2.5 font-texto text-base text-nara-tinta"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={v.archivo.enviando}
                      onClick={() => void v.confirmarArchivo?.()}
                      className="h-11 cursor-pointer rounded-[14px] border-none bg-[#9C2F25] px-5 font-texto text-[15px] font-medium text-white disabled:cursor-wait disabled:opacity-70"
                    >
                      {v.archivo.enviando ? "Archivando…" : "Confirmar archivo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => v.cancelarArchivo?.()}
                      className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-5 font-texto text-[15px] font-medium text-nara-tinta"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AgentDrawerShell>
  );
}

export function AdminPersonaScreen() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminPersonaInner />
    </Suspense>
  );
}
