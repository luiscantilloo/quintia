"use client";

import { useEffect, useState } from "react";
import { HerramientaIcon } from "@/modules/clinico/herramientas/HerramientaIcon";
import { hora12, larga } from "@/modules/clinico/herramientas/tools/clin/fechas";
import {
  calificarCita,
  misCitas,
  solicitarCita,
  type MisCitas,
} from "./acciones";
import {
  ArrowIcon,
  CheckIcon,
  ClinHeader,
  ClinShell,
  PulseIcon,
} from "./ClinPanelChrome";

/** Psicólogo clínico — vista paciente. Próxima cita, solicitud y calificación. */
export function ClinPanel({ patientId }: { patientId: string }) {
  const [datos, setDatos] = useState<MisCitas | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    misCitas().then((r) => (r.ok ? setDatos(r.data) : setError(r.error)));
  }, [patientId]);

  if (!datos) {
    return (
      <ClinShell>
        <ClinHeader />
        <p
          className={`m-0 font-texto text-[16px] ${
            error ? "text-[#B42318]" : "text-[#5B6770]"
          }`}
          role="status"
        >
          {error || "Cargando sus citas…"}
        </p>
      </ClinShell>
    );
  }

  if (!datos.activo) {
    return (
      <ClinShell>
        <ClinHeader />
        <div className="rounded-3xl border border-dashed border-[#E5E0D5] bg-white/70 px-5 py-8 text-center">
          <p className="m-0 font-texto text-[16px] leading-relaxed text-[#5B6770]">
            Su ruta no incluye citas con psicólogo por ahora.
          </p>
        </div>
      </ClinShell>
    );
  }

  const citas = datos.citas;
  const prox = citas.find((c) => !c.hecha && c.fecha >= datos.hoy) || null;
  const ult = citas.filter((c) => c.hecha).pop() || null;

  const calificar = async (v: number) => {
    if (!ult) return;
    setGuardando(true);
    const r = await calificarCita(ult.id, ult.rp === v ? null : v);
    setGuardando(false);
    if (!r.ok) return setError(r.error);
    setError("");
    setDatos((d) =>
      d
        ? { ...d, citas: d.citas.map((c) => (c.id === r.data.id ? r.data : c)) }
        : d,
    );
  };

  const pedir = async (fr: "mañana" | "tarde") => {
    setGuardando(true);
    const r = await solicitarCita(fr);
    setGuardando(false);
    if (!r.ok) return setError(r.error);
    setError("");
    setDatos((d) => (d ? { ...d, solicitud: r.data } : d));
  };

  return (
    <ClinShell>
      <ClinHeader showSub />

      <section
        aria-label="Su próxima cita"
        className="relative overflow-hidden rounded-[28px] bg-[#0F2D3B] px-5 pb-7 pt-6 text-[#F7F5EF] shadow-[0_24px_48px_-28px_rgba(15,45,59,0.55)] [animation:clinIn_.55s_cubic-bezier(.22,1,.36,1)_both]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#31C6E6]/25 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-[#61F0D2]/20 blur-2xl"
        />

        <div className="relative flex items-start gap-3.5">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#F7F5EF]/10 ring-1 ring-[#F7F5EF]/15">
            <HerramientaIcon id="clin" className="h-10 w-10" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#61F0D2]">
              Próxima cita
            </p>
            <p className="m-0 mt-1 font-texto text-[14px] leading-snug text-[#F7F5EF]/75">
              Con {datos.clinico}
            </p>
          </div>
        </div>

        {prox ? (
          <div className="relative mt-5">
            <p className="m-0 font-titulos text-[clamp(26px,7vw,34px)] font-extrabold leading-[1.05] tracking-tight first-letter:uppercase">
              {larga(prox.fecha)}
            </p>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-texto text-[17px] text-[#F7F5EF]/90 [font-variant-numeric:tabular-nums]">
              <span>{hora12(prox.hora)}</span>
              <span aria-hidden className="text-[#61F0D2]">
                ·
              </span>
              <span className="rounded-full bg-[#31C6E6]/20 px-3 py-0.5 text-[14px] font-medium text-[#61F0D2]">
                {prox.canal}
              </span>
            </p>
          </div>
        ) : (
          <div className="relative mt-5">
            <p className="m-0 font-titulos text-[clamp(24px,6.5vw,30px)] font-extrabold leading-tight tracking-tight">
              Todavía no tiene cita
            </p>
            <p className="m-0 mt-2 font-texto text-[15px] leading-relaxed text-[#F7F5EF]/70">
              Puede pedir un horario. {datos.clinico} le confirmará la fecha.
            </p>
          </div>
        )}

        <div className="relative mt-5">
          {datos.solicitud ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl bg-[#61F0D2]/15 px-4 py-3 ring-1 ring-[#61F0D2]/30"
            >
              <span
                aria-hidden
                className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#61F0D2] text-[#0F2D3B]"
              >
                <CheckIcon />
              </span>
              <div className="min-w-0">
                <p className="m-0 font-texto text-[15px] font-semibold text-[#F7F5EF]">
                  Solicitud enviada · {datos.solicitud.franja}
                </p>
                <p className="m-0 mt-0.5 font-texto text-[14px] text-[#F7F5EF]/70">
                  Su psicóloga le responderá pronto.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2.5">
              {(["mañana", "tarde"] as const).map((fr) => (
                <button
                  key={fr}
                  type="button"
                  disabled={guardando}
                  onClick={() => pedir(fr)}
                  className="flex w-full min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-2xl border-0 bg-[#F7F5EF] px-4 py-3 font-texto text-[16px] font-semibold leading-snug text-[#0F2D3B] transition hover:bg-white active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="min-w-0 truncate">
                    Pedir cita en la {fr}
                  </span>
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0F2D3B] text-[#61F0D2]"
                  >
                    <ArrowIcon />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        aria-label="Calificar cita"
        className="rounded-[28px] border border-[#E5E0D5] bg-white px-5 py-6 [animation:clinIn_.55s_cubic-bezier(.22,1,.36,1)_.1s_both]"
      >
        {ult ? (
          <>
            <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
              Su última cita
            </p>
            <h3 className="m-0 mt-2 font-titulos text-[22px] font-bold leading-snug tracking-tight text-[#0F2D3B]">
              ¿Cómo le fue el {larga(ult.fecha)}?
            </h3>
            <p className="m-0 mt-1.5 font-texto text-[15px] text-[#5B6770]">
              1 es muy mal · 5 es muy bien
            </p>
            <div
              role="radiogroup"
              aria-label="Calificación de la cita"
              className="mt-5 grid grid-cols-5 gap-2"
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const on = ult.rp === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={guardando}
                    onClick={() => calificar(n)}
                    className={[
                      "flex h-14 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 font-titulos text-[20px] font-bold [font-variant-numeric:tabular-nums] transition disabled:cursor-wait",
                      on
                        ? "border-[#0F2D3B] bg-[#0F2D3B] text-[#F7F5EF] shadow-[0_10px_24px_-12px_rgba(15,45,59,0.55)]"
                        : "border-[#E5E0D5] bg-[#F7F5EF] text-[#0F2D3B] hover:border-[#31C6E6] hover:bg-[#E4F7FB]",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <p
              className={`m-0 mt-4 font-texto text-[14px] leading-relaxed ${
                error
                  ? "text-[#B42318]"
                  : ult.rp
                    ? "text-[#2B8A74]"
                    : "text-[#5B6770]"
              }`}
            >
              {error ||
                (ult.rp
                  ? "Gracias. Su psicóloga ya puede ver su calificación."
                  : "Su respuesta le ayuda a preparar la próxima cita.")}
            </p>
          </>
        ) : (
          <div className="flex gap-4">
            <span
              aria-hidden
              className="mt-1 grid size-11 shrink-0 place-items-center rounded-2xl bg-[#E7FAF5] text-[#2B8A74]"
            >
              <PulseIcon />
            </span>
            <div>
              <h3 className="m-0 font-titulos text-[18px] font-bold tracking-tight text-[#0F2D3B]">
                Después de cada cita
              </h3>
              <p className="m-0 mt-1.5 font-texto text-[15px] leading-relaxed text-[#5B6770]">
                {prox
                  ? "Podrá calificarla del 1 al 5 cuando su psicóloga la marque como realizada."
                  : "Cuando tenga citas, aquí podrá decirnos cómo le fue."}
              </p>
            </div>
          </div>
        )}
      </section>

      {error ? (
        <p className="m-0 font-texto text-[14px] text-[#B42318]" role="alert">
          {error}
        </p>
      ) : null}
    </ClinShell>
  );
}
