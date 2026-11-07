"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { corta, hora12, larga } from "./fechas";
import { Ico } from "./iconos";
import type { AgendaVM } from "./useAgenda";

const btnSec = "h-10 cursor-pointer rounded-[12px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 text-[14px] font-medium";
const btnPri = "h-10 cursor-pointer rounded-[12px] bg-nara-tinta px-4 text-[14px] font-medium text-nara-blanco disabled:cursor-wait disabled:opacity-70";

function Marco({ titulo, onCerrar, pie, children }: { titulo: string; onCerrar: () => void; pie: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = ref.current?.querySelector<HTMLElement>("textarea, button[data-primero]") || ref.current?.querySelector<HTMLElement>("button");
    t?.focus();
  }, []);
  return (
    <div onClick={(e) => e.target === e.currentTarget && onCerrar()} className="clin-fondo-in fixed inset-0 z-[80] flex items-end justify-center bg-nara-tinta/40 p-4 sm:items-center">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="clin-sub-titulo" className="clin-modal-in flex max-h-[calc(100vh-32px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[20px] bg-nara-blanco shadow-[0_24px_60px_-12px_rgba(22,20,19,.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-linea px-5 py-4">
          <h2 id="clin-sub-titulo" className="m-0 font-titulos text-[19px] font-semibold">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-nara-crema" aria-label="Cerrar">
            <Ico n="cerrar" className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-linea px-5 py-4">{pie}</div>
      </div>
    </div>
  );
}

function ModalObs({ vm, id }: { vm: AgendaVM; id: string }) {
  const c = vm.citas.find((x) => x.id === id);
  const [texto, setTexto] = useState(c?.obs || "");
  if (!c) return null;
  const cerrar = () => vm.setModal(null);
  return (
    <Marco titulo="Observaciones de la cita" onCerrar={cerrar}
      pie={
        <>
          <button type="button" onClick={cerrar} className={btnSec}>Cancelar</button>
          <button type="button" disabled={vm.guardando} onClick={async () => (await vm.cambiar(c.id, { obs: texto.trim() })) && cerrar()} className={btnPri}>
            Guardar observaciones
          </button>
        </>
      }>
      <p className="m-0 text-sm text-texto-secundario">
        {vm.P(c.patientId)?.name} · <span className="inline-block first-letter:uppercase">{larga(c.fecha)}</span>, {hora12(c.hora)}
      </p>
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={8} maxLength={4000} aria-label="Observaciones"
        placeholder="Lo que quiera anotar de esta cita: temas, acuerdos, tareas para la próxima…"
        className="mt-3 w-full resize-y rounded-[12px] border-[1.5px] border-linea bg-nara-blanco px-3 py-2.5 text-[15px] leading-relaxed placeholder:text-texto-secundario focus:border-nara-tinta focus:outline-none" />
    </Marco>
  );
}

function ModalAgenda({ vm }: { vm: AgendaVM }) {
  const ps = vm.agenda?.pacientes || [];
  const cerrar = () => vm.setModal(null);
  return (
    <Marco titulo="Detalles de la agenda" onCerrar={cerrar} pie={<button type="button" onClick={cerrar} className={btnSec}>Cerrar</button>}>
      {ps.length ? (
        <dl className="m-0 grid grid-cols-3 gap-3 text-[13px]">
          <div><dt className="text-texto-secundario">Inicio</dt><dd className="m-0 clin-tnum font-medium">{corta(ps.map((x) => x.inicio).sort()[0])}</dd></div>
          <div><dt className="text-texto-secundario">Fin</dt><dd className="m-0 clin-tnum font-medium">{corta(ps.map((x) => x.fin).sort().pop() as string)}</dd></div>
          <div><dt className="text-texto-secundario">Pacientes</dt><dd className="m-0 clin-tnum font-medium">{ps.length}</dd></div>
        </dl>
      ) : null}
      <ul className="m-0 mt-4 list-none divide-y divide-linea border-y border-linea p-0 text-[14px]">
        {ps.map((x) => (
          <li key={x.id} className="flex flex-wrap justify-between gap-x-4 py-2">
            <span className="font-medium">{x.name} <span className="font-normal text-texto-secundario">· {x.profile}</span></span>
            <span className="clin-tnum text-texto-secundario">{x.periodicidad} · {x.months} meses · {x.canal.toLowerCase()}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-4 text-[13px] text-texto-secundario">
        «Organizar con IA» usa {vm.agenda?.iaReal ? vm.agenda.modelo : "las reglas fijas (no hay clave de IA en el servidor)"}, una llamada por paciente. Cada propuesta se valida: de lunes a viernes, sin festivos de Colombia, sin cruces y dentro de la ruta.
      </p>
    </Marco>
  );
}

function ModalRuta({ vm }: { vm: AgendaVM }) {
  const cerrar = () => vm.setModal(null);
  return (
    <Marco titulo="La ruta cambió" onCerrar={cerrar}
      pie={
        <>
          <button type="button" onClick={cerrar} className={btnSec}>Más tarde</button>
          <button type="button" data-primero onClick={vm.organizar} className={btnPri}>Reorganizar con IA</button>
        </>
      }>
      <p className="m-0 text-[14px]">El administrador cambió la ruta de estos pacientes. Sus citas futuras siguen con la ruta anterior hasta que reorganice el calendario.</p>
      <ul className="m-0 mt-3 list-none divide-y divide-linea border-y border-linea p-0 text-[14px]">
        {vm.desactualizados.map((x) => (
          <li key={x.id} className="flex flex-wrap justify-between gap-x-4 py-2">
            <span className="font-medium">{x.name} <span className="font-normal text-texto-secundario">· {x.profile}</span></span>
            <span className="text-texto-secundario">ahora {x.periodicidad.toLowerCase()}, {x.months} meses</span>
          </li>
        ))}
      </ul>
    </Marco>
  );
}

export function SubModales({ vm }: { vm: AgendaVM }) {
  const m = vm.modal;
  if (!m) return null;
  if (m.tipo === "obs") return <ModalObs key={m.id} vm={vm} id={m.id} />;
  if (m.tipo === "agenda") return <ModalAgenda vm={vm} />;
  return <ModalRuta vm={vm} />;
}
