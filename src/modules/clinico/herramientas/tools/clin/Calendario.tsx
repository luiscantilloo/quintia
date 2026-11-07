"use client";
import { naraAsset } from "@/modules/paciente/app/naraAsset";
import { FESTIVOS, MESES, iso, larga, hora12, sumarMeses } from "./fechas";
import { Ico } from "./iconos";
import type { Cita } from "./tipos";
import type { AgendaVM } from "./useAgenda";

const corto = (n: string) => n.replace(/^Paciente /, "P. ");

export function Calendario({ vm }: { vm: AgendaVM }) {
  const { hoy, vista, fijas, citaActual, proxGlobal, borrador, conBorrador, pensando, selDia, porCerrar } = vm;
  const borr = vista.filter((c) => c.borr);
  const mesKey = vm.mesAgenda || (citaActual ? citaActual.fecha : hoy).slice(0, 7);
  const [y, m] = mesKey.split("-").map(Number);
  const off = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const nd = new Date(y, m, 0).getDate();
  const agrupar = (l: Cita[]) => l.reduce<Record<string, Cita[]>>((acc, c) => ((acc[c.fecha] = acc[c.fecha] || []).push(c), acc), {});
  const porFecha = agrupar(fijas);
  const borrF = agrupar(borr);
  const pendientes = fijas.filter(porCerrar).length;
  const moverMes = (n: number) => vm.setMesAgenda(sumarMeses(`${mesKey}-01`, n).slice(0, 7));

  const dias = [];
  for (let i = 0; i < off; i++) dias.push(<span key={`v${i}`} />);
  for (let dd = 1; dd <= nd; dd++) {
    const f = iso(new Date(y, m - 1, dd));
    const dc = porFecha[f] || [];
    const db = borrF[f] || [];
    const esHoy = f === hoy;
    const fest = FESTIVOS[f];
    let cls = "text-nara-tinta";
    let extra = null;
    let onClick: (() => void) | undefined;
    let pressed: boolean | undefined;
    let label = "";
    if (db.length) {
      cls = `${borrador?.visto ? "" : "clin-borrador-in "}bg-ia-borrador text-nara-tinta font-semibold border-[1.5px] border-teo-curiosidad`;
    } else if (dc.length) {
      const todas = dc.every((c) => c.hecha);
      const pend = dc.some(porCerrar);
      const esProx = !!proxGlobal && dc.includes(proxGlobal);
      cls = `${todas ? "bg-exito-suave border-[1.5px] border-estado-al-dia" : pend ? "bg-nara-blanco border-[1.5px] border-dashed border-texto-secundario" : esProx ? "bg-nara-amarillo" : "bg-nara-blanco border-[1.5px] border-nara-tinta"} text-nara-tinta font-semibold`;
      const sel = !selDia && !!citaActual && dc.includes(citaActual);
      if (sel) cls += " ring-2 ring-nara-tinta ring-offset-1";
      const destino = dc.find(porCerrar) || dc.find((c) => !c.hecha) || dc[0];
      onClick = () => vm.irACita(destino.id);
      pressed = sel;
      label = `${larga(f)}: ${dc.length === 1 ? "1 cita" : `${dc.length} citas`} (${dc.map((c) => `${corto(vm.P(c.patientId)?.name || "")} ${hora12(c.hora)}`).join(", ")})`;
      extra = (
        <>
          {todas ? (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-estado-al-dia">
              <Ico n="check" className="h-3 w-3" />
            </span>
          ) : null}
          {dc.length > 1 ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-nara-tinta px-1 text-[10px] font-semibold leading-none text-nara-blanco" aria-hidden="true">
              {dc.length}
            </span>
          ) : null}
        </>
      );
    } else {
      onClick = () => {
        vm.setSelDia(f);
        vm.setSelCita(null);
      };
      pressed = selDia === f;
      label = `${larga(f)}: sin citas`;
      cls += selDia === f ? " bg-nara-crema ring-2 ring-texto-secundario ring-offset-1 font-semibold" : " hover:bg-nara-crema";
    }
    const clase = `relative grid h-9 place-items-center rounded-[8px] text-[13px] clin-tnum ${onClick ? "cursor-pointer" : ""} ${cls} ${esHoy ? "outline outline-2 -outline-offset-2 outline-teo-energia" : ""}`;
    const contenido = (
      <>
        <span className={esHoy ? "underline decoration-teo-energia decoration-2 underline-offset-2" : ""}>{dd}</span>
        {fest && !dc.length && !db.length ? <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-texto-secundario/60" /> : null}
        {extra}
      </>
    );
    const comunes = { title: fest || undefined, "aria-current": esHoy ? ("date" as const) : undefined };
    dias.push(
      onClick ? (
        <button key={f} type="button" onClick={onClick} aria-pressed={pressed} aria-label={label} className={clase} {...comunes}
          style={db.length ? { animationDelay: `${Math.min(borr.indexOf(db[0]) * 18, 600)}ms` } : undefined}>
          {contenido}
        </button>
      ) : (
        <span key={f} className={clase} {...comunes} style={{ animationDelay: `${Math.min(borr.indexOf(db[0]) * 18, 600)}ms` }}>
          {contenido}
        </span>
      ),
    );
  }
  for (let k = off + nd; k < 42; k++) dias.push(<span key={`r${k}`} className="h-9" aria-hidden="true" />);

  const sw = (c: string, t: string) => (
    <span key={t} className="flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-[3px] ${c}`} />
      {t}
    </span>
  );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[20px] border border-linea bg-nara-blanco p-4" aria-label="Calendario">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={naraAsset("marca/teo/teo-calma.svg")}
            alt=""
            className="h-8 w-auto shrink-0"
          />
          <h2 className="m-0 font-titulos text-[18px] font-semibold first-letter:uppercase">
            {MESES[m - 1]} {y}
          </h2>
        </div>
        <div className="flex gap-0.5">
          <button type="button" onClick={() => moverMes(-1)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-nara-crema pointer-coarse:h-11 pointer-coarse:w-11" aria-label="Mes anterior">
            <Ico n="izq" className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => moverMes(1)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-nara-crema pointer-coarse:h-11 pointer-coarse:w-11" aria-label="Mes siguiente">
            <Ico n="der" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="relative">
        {pensando ? (
          <div className="clin-velo-in absolute -inset-1 z-10 flex flex-col items-center justify-center gap-3 rounded-[12px] bg-nara-blanco/80" role="status" aria-live="polite">
            <span className="relative grid h-[84px] w-[84px] place-items-center">
              <span className="absolute inset-0 rounded-full border-[3px] border-superficie-2" />
              <span className="clin-spin absolute inset-0 rounded-full border-[3px] border-transparent border-r-nara-amarillo border-t-nara-amarillo" />
              <span className="relative flex flex-col items-center pt-2">
                <img src={naraAsset("marca/teo/teo-curiosidad.svg")} alt="" className="clin-salta h-[42px] w-auto" />
                <span className="clin-sombra mt-0.5 h-1 w-7 rounded-full bg-nara-tinta" />
              </span>
            </span>
            <span className="text-center">
              <span className="block font-titulos text-[17px] font-semibold">
                Organizando citas
                <span className="clin-puntos">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </span>
              <span className="mt-0.5 block text-[12px] text-texto-secundario">
                {pensando.nombre ? `${pensando.nombre} · paciente ${pensando.i + 1} de ${pensando.n}` : "Revisando festivos, periodicidad y la agenda"}
              </span>
            </span>
          </div>
        ) : null}
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-texto-secundario">
          {["L", "M", "M", "J", "V", "S", "D"].map((x, i) => (
            <span key={i}>{x}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">{dias}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-texto-secundario">
        {sw("bg-exito-suave border-[1.5px] border-estado-al-dia", "Realizada")}
        {sw("bg-nara-amarillo", "Próxima")}
        {sw("border-[1.5px] border-nara-tinta", "Agendada")}
        {pendientes ? sw("border-[1.5px] border-dashed border-texto-secundario", "Por cerrar") : null}
        {conBorrador ? sw("border-[1.5px] border-teo-curiosidad bg-ia-borrador", "Propuesta") : null}
        {sw("outline outline-2 -outline-offset-2 outline-teo-energia", "Hoy")}
        <span className="flex items-center gap-1">
          <span className="grid h-2.5 w-2.5 place-items-center">
            <span className="h-1 w-1 rounded-full bg-texto-secundario" />
          </span>
          Festivo
        </span>
      </div>
      <div className="mt-auto flex gap-2 pt-3">
        <button type="button" onClick={vm.organizar} disabled={!!pensando || conBorrador} aria-busy={pensando ? true : undefined}
          className={`flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-nara-amarillo text-[14px] font-medium text-nara-tinta hover:brightness-[.97] disabled:cursor-wait ${conBorrador ? "disabled:cursor-default disabled:opacity-60" : ""}`}>
          {pensando ? (
            <>
              <svg className="clin-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.2-8.6" />
              </svg>
              Organizando…
            </>
          ) : (
            <>
              <img src={naraAsset("marca/personajes/teo-curiosidad.svg")} alt="" className="h-6 w-auto" />
              {conBorrador ? "Revise la propuesta" : vm.citas.length ? "Reorganizar con IA" : "Organizar con IA"}
            </>
          )}
        </button>
        <button type="button" onClick={() => vm.setModal({ tipo: "agenda" })} className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-[12px] border-[1.5px] border-linea hover:border-nara-tinta" aria-label="Detalles de la agenda" title="Detalles de la agenda">
          <Ico n="info" className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
