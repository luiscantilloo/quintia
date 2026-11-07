"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { naraAsset } from "@/modules/paciente/app/naraAsset";
import { Calendario } from "./Calendario";
import { DetalleCita } from "./DetalleCita";
import { ANIMACIONES, Ico } from "./iconos";
import { PropuestaTeo } from "./PropuestaTeo";
import { Resumen } from "./Resumen";
import { SubModales } from "./SubModales";
import { useAgenda, type AgendaVM } from "./useAgenda";

function Avisos({ vm }: { vm: AgendaVM }) {
  const pend = vm.fijas.filter(vm.porCerrar);
  return (
    <>
      {vm.desactualizados.length ? (
        <button
          type="button"
          onClick={() => vm.setModal({ tipo: "ruta" })}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-nara-amarillo bg-[color-mix(in_srgb,var(--nara-amarillo)_14%,white)] px-3 text-[13px] font-medium hover:brightness-[.97]"
        >
          <Ico n="info" className="h-3.5 w-3.5" />
          La ruta cambió · reorganizar
        </button>
      ) : null}
      {pend.length ? (
        <button
          type="button"
          onClick={() => vm.irACita(pend[0].id)}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-texto-secundario bg-nara-blanco px-3 text-[13px] font-medium hover:border-nara-tinta"
        >
          {pend.length === 1 ? "1 cita por cerrar" : `${pend.length} citas por cerrar`} · ver
          la más antigua
        </button>
      ) : null}
    </>
  );
}

function Contenido({ vm }: { vm: AgendaVM }) {
  const a = vm.agenda;
  if (!a)
    return (
      <div className="grid place-items-center py-10 text-center" role="status">
        <img
          src={naraAsset("marca/teo/teo-curiosidad.svg")}
          alt=""
          className="mb-3 h-16 w-auto"
        />
        {vm.error ? (
          <p className="m-0 max-w-[46ch] text-crisis-texto">{vm.error}</p>
        ) : (
          <p className="m-0 text-texto-secundario">Cargando la agenda…</p>
        )}
      </div>
    );
  const ps = a.pacientes;
  const fuera = a.sinClin;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="m-0 min-w-0 text-sm text-texto-secundario">
          {ps.length === 1 ? "1 paciente" : `${ps.length} pacientes`} con psicólogo
          {a.terr ? ` · territorio ${a.terr}` : ""}
          {fuera.length
            ? ` · ${fuera.length} sin psicólogo en su ruta (${[...new Set(fuera.map((p) => p.profile))].join(", ")})`
            : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Avisos vm={vm} />
        </div>
      </div>
      {vm.error ? (
        <p
          role="alert"
          className="m-0 mt-3 flex items-center gap-2 rounded-[12px] bg-crisis-suave px-3 py-2 text-[13px] text-crisis-texto"
        >
          <Ico n="info" className="h-4 w-4" />
          <span className="flex-1">{vm.error}</span>
          <button
            type="button"
            onClick={() => vm.setError("")}
            className="cursor-pointer underline underline-offset-4"
          >
            Cerrar aviso
          </button>
        </p>
      ) : null}
      {!ps.length ? (
        <section className="mt-4 flex flex-col items-center gap-3 rounded-[20px] border border-linea bg-nara-blanco px-6 py-8 text-center">
          <img
            src={naraAsset("marca/teo/teo-duda.svg")}
            alt=""
            className="h-20 w-auto"
          />
          <h3 className="m-0 font-titulos text-[20px] font-semibold">
            Ningún paciente de su territorio tiene psicólogo en la ruta
          </h3>
          <p className="m-0 max-w-[46ch] text-sm text-texto-secundario">
            Mientras el servicio esté apagado no hay agenda de citas, y la app de los
            pacientes tampoco muestra la próxima cita. El administrador lo enciende en
            Rutas.
          </p>
        </section>
      ) : (
        <div className="mt-4 grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,.85fr)] [&>*]:h-full [&>*]:min-h-0">
          <Calendario vm={vm} />
          <DetalleCita vm={vm} />
          <Resumen vm={vm} />
        </div>
      )}
    </>
  );
}

/** Modal de agenda: alto al contenido (sin hueco vacío abajo). */
export function AgendaModal({
  patientId,
  onCerrar,
}: {
  patientId: string;
  onCerrar: () => void;
}) {
  const vm = useAgenda(patientId);
  const ref = useRef<HTMLDivElement>(null);
  const modalRef = useRef(vm.modal);
  useEffect(() => {
    modalRef.current = vm.modal;
  }, [vm.modal]);

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modalRef.current) vm.setModal(null);
      else onCerrar();
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
      previo?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="clin-fondo-in fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-nara-tinta/40 p-0 font-texto text-nara-tinta sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && !vm.pensando && onCerrar()}
    >
      <style>{ANIMACIONES}</style>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clin-agenda-titulo"
        className="clin-modal-in my-0 flex w-full max-w-[1240px] flex-col overflow-hidden bg-nara-crema shadow-[0_24px_60px_-12px_rgba(22,20,19,.35)] outline-none sm:my-4 sm:max-h-[min(92dvh,880px)] sm:rounded-[24px]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-linea bg-nara-blanco px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={naraAsset("marca/logo/plateado-isotipo.svg")}
              alt=""
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h2
                id="clin-agenda-titulo"
                className="m-0 truncate font-titulos text-[20px] font-semibold leading-tight sm:text-[22px]"
              >
                Agenda de citas
              </h2>
              <p className="m-0 truncate text-[12px] text-texto-secundario sm:hidden">
                QUINTIA · clínico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={!!vm.pensando}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full hover:bg-nara-crema disabled:cursor-wait disabled:opacity-50"
            aria-label="Cerrar la agenda"
          >
            <Ico n="cerrar" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5 sm:pb-5">
          <Contenido vm={vm} />
        </div>
      </div>
      <PropuestaTeo vm={vm} />
      <SubModales vm={vm} />
    </div>,
    document.body,
  );
}
