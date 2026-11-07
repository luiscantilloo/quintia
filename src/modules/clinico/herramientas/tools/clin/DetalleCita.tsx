"use client";
import { naraAsset } from "@/modules/paciente/app/naraAsset";
import { FESTIVOS, corta, fecha, hora12, larga } from "./fechas";
import { Ico } from "./iconos";
import type { AgendaVM } from "./useAgenda";

const RIESGOS = ["Mínimo", "Leve", "Moderado", "Moderado-severo", "Severo"];
const corto = (n: string) => n.replace(/^Paciente /, "P. ");

export function EscalaMini({ nombre, valor, activa, onElegir }: { nombre: string; valor: number | null; activa: boolean; onElegir?: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label={nombre} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = valor === n;
        return (
          <button key={n} type="button" role="radio" aria-checked={on} disabled={!activa} onClick={activa && onElegir ? () => onElegir(n) : undefined}
            className={`h-8 w-8 rounded-[8px] border-[1.5px] text-[13px] font-semibold clin-tnum pointer-coarse:h-11 pointer-coarse:w-11 ${on ? (activa ? "border-nara-tinta bg-nara-tinta text-nara-blanco" : "border-nara-rosa bg-nara-energia text-nara-tinta") : "border-linea bg-nara-blanco"} ${activa ? "cursor-pointer hover:border-nara-tinta" : "cursor-not-allowed text-nara-tinta/45"}`}>
            {n}
          </button>
        );
      })}
    </div>
  );
}

function Vacio({ img, titulo, texto, extra }: { img: string; titulo: string; texto: string; extra?: string }) {
  return (
    <section className={`flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-[20px] border px-6 py-8 text-center ${extra || "border-linea bg-nara-blanco"}`} aria-label="Detalle">
      <img src={naraAsset(img)} alt="" className="h-14 w-auto" />
      <h2 className="m-0 font-titulos text-[18px] font-semibold first-letter:uppercase">{titulo}</h2>
      <p className="m-0 max-w-[32ch] text-sm text-texto-secundario">{texto}</p>
    </section>
  );
}

export function DetalleCita({ vm }: { vm: AgendaVM }) {
  const { hoy, fijas, selDia, citaActual: c, proxGlobal: prox, porCerrar, guardando } = vm;
  if (selDia) {
    const fest = FESTIVOS[selDia];
    const finde = [0, 6].includes(fecha(selDia).getDay());
    const sig = fijas.find((x) => x.fecha > selDia);
    return (
      <section className="flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-[20px] border border-linea bg-nara-blanco px-6 py-8 text-center" aria-label="Detalle">
        <img src={naraAsset("marca/logo/plateado-isotipo.svg")} alt="" className="h-14 w-auto" />
        <h2 className="m-0 font-titulos text-[18px] font-semibold first-letter:uppercase">{larga(selDia)}</h2>
        <p className="m-0 max-w-[32ch] text-sm text-texto-secundario">
          Este día no tiene ninguna cita.{fest ? ` Es festivo (${fest}).` : finde ? " Las citas se agendan de lunes a viernes." : ""}
        </p>
        {sig ? (
          <button type="button" onClick={() => vm.irACita(sig.id)} className="mt-2 h-10 cursor-pointer rounded-[12px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 text-[14px] font-medium hover:bg-nara-crema">
            Ver la siguiente: <span className="clin-tnum">{corta(sig.fecha)}</span> · {corto(vm.P(sig.patientId)?.name || "")}
          </button>
        ) : null}
      </section>
    );
  }
  if (!c && vm.conBorrador)
    return <Vacio img="marca/personajes/teo-curiosidad.svg" titulo="Revise la propuesta de TEJIVA" texto="Las fechas en verde son un borrador. Al aceptarlas aparece aquí el detalle de la próxima cita." extra="border-[1.5px] border-dashed border-teo-curiosidad bg-ia-borrador/50" />;
  if (!c) return <Vacio img="marca/teo/teo-curiosidad.svg" titulo="Aún no hay citas" texto="Use «Organizar con IA» para proponer las citas de todos sus pacientes, sin cruces." />;

  const p = vm.P(c.patientId);
  const n = fijas.indexOf(c) + 1;
  const propias = fijas.filter((x) => x.patientId === c.patientId);
  const sesion = propias.indexOf(c) + 1;
  const ant = fijas[n - 2];
  const sig = fijas[n];
  const mismoDia = fijas.filter((x) => x.fecha === c.fecha);
  const estado = c.hecha ? "Realizada" : porCerrar(c) ? "Por cerrar" : c === prox ? "Próxima cita" : "Agendada";
  const sePuede = c.fecha <= hoy;
  const pista = c.hecha
    ? c.rp ? "El paciente ya calificó la cita." : "El paciente todavía no la ha calificado."
    : sePuede ? (porCerrar(c) ? "Esta cita ya pasó: ciérrela para que cuente en el resumen." : "Ciérrela al terminar la sesión.") : `Se califica y se cierra desde el ${larga(c.fecha)}.`;
  const flecha = (x: typeof c | undefined, n: "izq" | "der", etiqueta: string) => (
    <button type="button" disabled={!x} onClick={x ? () => vm.irACita(x.id) : undefined} aria-label={etiqueta}
      className={`grid h-8 w-8 place-items-center rounded-full border border-linea pointer-coarse:h-11 pointer-coarse:w-11 ${x ? "cursor-pointer hover:border-nara-tinta" : "cursor-not-allowed opacity-40"}`}>
      <Ico n={n} className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-4" aria-label="Detalle de la cita">
      <div className="flex items-center gap-2 text-[12px]">
        <img
          src={naraAsset("marca/teo/teo-curiosidad.svg")}
          alt=""
          className="h-7 w-auto shrink-0"
        />
        <span className={`rounded-full px-2 py-0.5 font-semibold ${c.hecha ? "bg-exito-suave" : porCerrar(c) ? "border border-dashed border-texto-secundario" : c === prox ? "bg-nara-amarillo" : "bg-superficie-2"}`}>{estado}</span>
        <span className="clin-tnum text-texto-secundario">
          Cita {n} de {fijas.length}
        </span>
        <span className="ml-auto flex gap-1">
          {flecha(ant, "izq", "Cita anterior en la agenda")}
          {flecha(sig, "der", "Cita siguiente en la agenda")}
        </span>
      </div>
      <div>
        <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] font-medium">
          {p?.name}
          <span className="font-normal text-texto-secundario">
            · {p?.profile} · {RIESGOS[p?.riesgo ?? 0]} · sesión {sesion} de {propias.length}
          </span>
          {p?.status === "Crisis" ? <span className="rounded-full bg-crisis-suave px-2 py-0.5 text-[11px] font-semibold text-crisis-texto">En crisis</span> : null}
        </p>
        {p && !p.clinEnModulos ? <p className="m-0 mt-0.5 text-[12px] text-texto-secundario">Dato por revisar en la base: «clin» no está en sus servicios activos.</p> : null}
        <h2 className="m-0 mt-0.5 font-titulos text-[19px] font-semibold leading-tight first-letter:uppercase">{larga(c.fecha)}</h2>
        <p className="m-0 mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-texto-secundario">
          <span className="flex items-center gap-1">
            <Ico n="reloj" className="h-3.5 w-3.5" />
            {hora12(c.hora)}
          </span>
          <span className="flex items-center gap-1">
            <Ico n="tel" className="h-3.5 w-3.5" />
            {c.canal}
          </span>
        </p>
        {mismoDia.length > 1 ? (
          <div className="mt-2 flex flex-wrap gap-1" aria-label="Otras citas de este día">
            {mismoDia.map((x) => (
              <button key={x.id} type="button" onClick={() => vm.irACita(x.id)} aria-pressed={x === c}
                className={`h-7 cursor-pointer rounded-full border px-2.5 text-[12px] clin-tnum ${x === c ? "border-nara-tinta bg-nara-tinta text-nara-blanco" : "border-linea hover:border-nara-tinta"}`}>
                {hora12(x.hora)} · {corto(vm.P(x.patientId)?.name || "")}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex min-h-[72px] flex-1 flex-col rounded-[12px] bg-nara-crema/70 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium">Observaciones</span>
          <button type="button" onClick={() => vm.setModal({ tipo: "obs", id: c.id })} className="-mr-2 h-8 cursor-pointer rounded-[8px] px-2 text-[13px] underline underline-offset-4 hover:bg-nara-blanco pointer-coarse:h-11">
            {c.obs ? "Editar" : "Agregar"}
          </button>
        </div>
        {c.obs ? <p className="m-0 mt-1 line-clamp-3 whitespace-pre-line text-[14px] leading-snug">{c.obs}</p> : <p className="m-0 mt-1 text-[13px] text-texto-secundario">Sin observaciones.</p>}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Su calificación</span>
          <EscalaMini nombre="Calificación del clínico" valor={c.rc} activa={sePuede && !guardando} onElegir={(v) => vm.cambiar(c.id, { rc: c.rc === v ? null : v })} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1 text-[13px] font-medium">
            Calificación del paciente{" "}
            <span className="text-texto-secundario">
              <Ico n="candado" className="h-3 w-3" />
            </span>
          </span>
          <EscalaMini nombre="Calificación del paciente (solo lectura)" valor={c.rp} activa={false} />
        </div>
      </div>
      <p className="m-0 text-[12px] leading-4 text-texto-secundario">{pista}</p>
      {c.hecha ? (
        <div className="mt-auto flex h-10 items-center gap-2 rounded-[12px] bg-exito-suave px-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-estado-al-dia text-nara-blanco">
            <Ico n="check" className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1 text-[14px] font-medium">Cita realizada</span>
          <button type="button" disabled={guardando} onClick={() => vm.cambiar(c.id, { accion: "deshacer" })} title={`Vuelve a «por cerrar»${c.rp ? " y borra la calificación del paciente" : ""}`}
            className="cursor-pointer text-[13px] underline underline-offset-4 hover:text-texto-secundario">
            Deshacer
          </button>
        </div>
      ) : (
        <button type="button" disabled={!sePuede || guardando} onClick={() => vm.cambiar(c.id, { accion: "realizada" })}
          className={`mt-auto flex h-10 w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium ${sePuede ? "cursor-pointer bg-nara-tinta text-nara-blanco hover:bg-nara-tinta/90" : "cursor-not-allowed border-[1.5px] border-linea bg-nara-blanco text-nara-tinta/45"}`}>
          <Ico n="check" className="h-4 w-4" />
          Marcar cita como realizada
        </button>
      )}
    </section>
  );
}
