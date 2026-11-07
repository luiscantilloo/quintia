"use client";
import { naraAsset } from "@/modules/paciente/app/naraAsset";
import { corta, hora12 } from "./fechas";
import { Ico } from "./iconos";
import type { AgendaVM } from "./useAgenda";

const corto = (n: string) => n.replace(/^Paciente /, "P. ");

/** Ventana flotante con la propuesta de TEJIVA: aceptar o descartar. */
export function PropuestaTeo({ vm }: { vm: AgendaVM }) {
  const { borrador, conBorrador, citas, hoy } = vm;
  if (!borrador || !conBorrador) return null;
  const filas = Object.entries(borrador.porPid).filter(([, l]) => l.length);
  const total = filas.reduce((a, [, l]) => a + l.length, 0);
  const notas = [...new Map(borrador.notas.map((x) => [x.n, x])).values()];
  const perdidas = Object.entries(borrador.porPid).flatMap(([pid, l]) =>
    citas.filter((c) => c.patientId === pid && !c.hecha && c.fecha >= hoy && c.obs && !l.some((x) => x.fecha === c.fecha)),
  );

  return (
    <div role="dialog" aria-labelledby="clin-borrador-titulo"
      className="clin-flotante-in fixed inset-x-4 bottom-4 z-[70] flex max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[20px] border-[1.5px] border-teo-curiosidad bg-nara-blanco shadow-[0_18px_48px_-8px_rgba(22,20,19,.28)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px]">
      <div className="flex items-start gap-3 bg-ia-borrador px-5 py-4">
        <img src={naraAsset("marca/personajes/teo-curiosidad.svg")} alt="" className="h-12 w-auto shrink-0" />
        <div className="min-w-0 flex-1">
          <p id="clin-borrador-titulo" className="m-0 font-titulos text-[18px] font-semibold leading-snug">
            TEJIVA propone {total} citas para {filas.length === 1 ? "1 paciente" : `${filas.length} pacientes`}
          </p>
          <p className="m-0 mt-0.5 text-[12px] text-nara-tinta/70">{borrador.origen}</p>
        </div>
        <button type="button" onClick={() => vm.setBorrador(null)} className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-nara-blanco/60" aria-label="Cerrar y descartar la propuesta">
          <Ico n="cerrar" className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto px-5 py-4 text-[14px]">
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {filas.map(([pid, l]) => {
            const p = vm.P(pid);
            return (
              <li key={pid}>
                <span className="font-medium">{p?.name}</span> · {p?.periodicidad.toLowerCase()} · {l.length} citas
                <br />
                <span className="clin-tnum text-[13px] text-texto-secundario">
                  {corta(l[0].fecha)} a {corta(l[l.length - 1].fecha)}, {hora12(l[0].hora)} · {l[0].canal.toLowerCase()}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="m-0 mt-3 text-[13px] text-texto-secundario">Las fechas en verde del calendario son la propuesta. Las citas realizadas y las que están por cerrar se conservan.</p>
        {perdidas.length ? (
          <p className="m-0 mt-2 flex items-start gap-1.5 text-[13px] text-crisis-texto">
            <Ico n="info" className="mt-0.5 h-3.5 w-3.5" />
            <span>
              {perdidas.length === 1 ? "1 cita futura tiene" : `${perdidas.length} citas futuras tienen`} observaciones y no coincide con una fecha de la propuesta: se perderá al aceptar.
            </span>
          </p>
        ) : null}
        {notas.length ? (
          <>
            <p className="m-0 mt-3 text-[13px] font-medium">Ajustes</p>
            <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-[13px] text-nara-tinta/85">
              {notas.slice(0, 5).map((x, i) => (
                <li key={i}>
                  {corto(vm.P(x.pid)?.name || "")}: {x.n}
                </li>
              ))}
              {notas.length > 5 ? <li className="-ml-5 list-none text-texto-secundario">y {notas.length - 5} ajustes más</li> : null}
            </ul>
          </>
        ) : null}
      </div>
      <div className="flex gap-2 border-t border-linea px-5 py-4">
        <button type="button" onClick={vm.aceptar} disabled={vm.guardando} className="h-11 flex-1 cursor-pointer rounded-[12px] bg-nara-tinta px-4 text-[15px] font-medium text-nara-blanco disabled:cursor-wait disabled:opacity-70">
          {vm.guardando ? "Guardando…" : "Aceptar propuesta"}
        </button>
        <button type="button" onClick={() => vm.setBorrador(null)} disabled={vm.guardando} className="h-11 cursor-pointer rounded-[12px] border-[1.5px] border-nara-tinta bg-transparent px-4 text-[15px] font-medium">
          Descartar
        </button>
      </div>
    </div>
  );
}
