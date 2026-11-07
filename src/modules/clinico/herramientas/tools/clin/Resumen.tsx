"use client";
import { naraAsset } from "@/modules/paciente/app/naraAsset";
import { fecha, hora12, larga, sumarDias } from "./fechas";
import type { AgendaVM } from "./useAgenda";

const prom = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function Promedio({ titulo, valor, nota }: { titulo: string; valor: number | null; nota: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] text-texto-secundario">{titulo}</span>
      {valor == null ? (
        <span className="font-titulos text-[40px] font-semibold leading-none text-nara-tinta/30">—</span>
      ) : (
        <span className="font-titulos text-[40px] font-semibold leading-none clin-tnum">
          {valor.toFixed(1).replace(".", ",")}
          <span className="text-[17px] font-medium text-texto-secundario">/5</span>
        </span>
      )}
      <span className="text-[12px] text-texto-secundario">{nota}</span>
    </div>
  );
}

/** Resumen general de todos los pacientes (no cambia al seleccionar una fecha). */
export function Resumen({ vm }: { vm: AgendaVM }) {
  const { vista: citas, fijas, hoy, proxGlobal: prox, porCerrar } = vm;
  const hechas = citas.filter((c) => c.hecha);
  const pend = fijas.filter(porCerrar);
  const conRc = hechas.filter((c) => c.rc);
  const conRp = hechas.filter((c) => c.rp);
  const pc = prom(conRc.map((c) => c.rc as number));
  const pp = prom(conRp.map((c) => c.rp as number));
  const pct = citas.length ? Math.round((hechas.length / citas.length) * 100) : 0;
  const lunes = sumarDias(hoy, -((fecha(hoy).getDay() + 6) % 7));
  const domingo = sumarDias(lunes, 6);
  const semana = citas.filter((c) => c.fecha >= lunes && c.fecha <= domingo);
  const quedan = semana.filter((c) => !c.hecha && c.fecha >= hoy).length;

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-4" aria-label="Resumen de todos sus pacientes">
      <div className="flex items-center gap-2">
        <img
          src={naraAsset("marca/teo/teo-energia.svg")}
          alt=""
          className="h-8 w-auto shrink-0"
        />
        <div className="min-w-0">
          <h2 className="m-0 font-titulos text-[18px] font-semibold leading-tight">
            Resumen
          </h2>
          <span className="text-[12px] text-texto-secundario">todos sus pacientes</span>
        </div>
      </div>
      {(vm.agenda?.solicitudes || []).length ? (
        <div role="status" className="rounded-[12px] bg-nara-crema px-3 py-2">
          <span className="text-[12px] text-texto-secundario">Citas que pidieron sus pacientes</span>
          <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0 text-[14px]">
            {(vm.agenda?.solicitudes || []).map((s) => (
              <li key={s.id}>
                {vm.P(s.patientId)?.name || s.code} · prefiere la {s.franja}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <span className="text-[12px] text-texto-secundario">Citas realizadas</span>
        <p className="m-0 mt-0.5 flex items-baseline gap-1.5">
          <span className="font-titulos text-[28px] font-semibold leading-none clin-tnum">{hechas.length}</span>
          <span className="text-[15px] text-texto-secundario clin-tnum">de {citas.length}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Citas realizadas">
          <div className="h-full rounded-full bg-estado-al-dia" style={{ width: `${pct}%` }} />
        </div>
        {pend.length ? (
          <button type="button" onClick={() => vm.irACita(pend[0].id)} className="mt-1.5 cursor-pointer text-[12px] underline decoration-dashed underline-offset-4 hover:text-texto-secundario">
            {pend.length === 1 ? "1 por cerrar" : `${pend.length} por cerrar`} · ver la más antigua
          </button>
        ) : (
          <p className="m-0 mt-1.5 text-[12px] text-texto-secundario">Ninguna por cerrar.</p>
        )}
      </div>
      <div className="border-t border-linea pt-3">
        <span className="text-[12px] font-medium">Calificación promedio</span>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Promedio titulo="Suya" valor={pc} nota={pc == null ? "Al calificar una realizada" : `${conRc.length} de ${hechas.length} citas`} />
          <Promedio titulo="Pacientes" valor={pp} nota={pp == null ? "Cuando califiquen" : `${conRp.length} de ${hechas.length} citas`} />
        </div>
      </div>
      <div className="border-t border-linea pt-3">
        <span className="text-[12px] text-texto-secundario">Próxima cita</span>
        {prox ? (
          <>
            {prox.borr ? (
              <p className="m-0 font-titulos text-[17px] font-semibold leading-snug first-letter:uppercase">{larga(prox.fecha)}</p>
            ) : (
              <button type="button" onClick={() => vm.irACita(prox.id)} className="block cursor-pointer text-left font-titulos text-[17px] font-semibold leading-snug underline underline-offset-4 first-letter:uppercase hover:text-texto-secundario">
                {larga(prox.fecha)}
              </button>
            )}
            <p className="m-0 text-[13px] clin-tnum text-texto-secundario">
              {hora12(prox.hora)} · {vm.P(prox.patientId)?.name}
              {prox.borr ? " · propuesta" : ""}
            </p>
          </>
        ) : (
          <p className="m-0 text-[14px] text-nara-tinta/60">{citas.length ? "No quedan citas agendadas." : "Sin agendar"}</p>
        )}
      </div>
      <div className="mt-auto flex h-10 items-center justify-between gap-2 rounded-[12px] bg-nara-crema px-3 text-[13px]">
        <span>Esta semana</span>
        <span className="font-semibold clin-tnum">
          {semana.length === 1 ? "1 cita" : `${semana.length} citas`}
          {semana.length ? <span className="font-normal text-texto-secundario"> · {quedan === 0 ? "ninguna pendiente" : quedan === 1 ? "queda 1" : `quedan ${quedan}`}</span> : null}
        </span>
      </div>
    </section>
  );
}
