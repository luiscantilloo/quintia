"use client";

/**
 * Analizador en la ficha: estado de lectura de esta persona (no es crisis).
 */
import {
  ESTADOS_AN,
  type AnalizadorEstadoId,
} from "@/modules/clinico/analizador/estados";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ToolCardShell } from "../../ToolCardShell";
import { HerramientaIcon } from "../../HerramientaIcon";
import type { HerramientaCardProps } from "../../types";

type Snap = {
  estado?: string;
  lectura?: string;
  sugerencia?: string | null;
  senales?: string[];
  baseN?: number;
};

function asEstado(raw: unknown): AnalizadorEstadoId {
  const s = String(raw || "base");
  if (s === "estable" || s === "mejorando" || s === "cambio" || s === "base") {
    return s;
  }
  return "base";
}

const SENAL: Record<string, string> = {
  menos: "Juega menos",
  peor: "Juega peor",
  gana: "Gana menos",
};

export function AnalizadorToolCard({ item, patientId }: HerramientaCardProps) {
  const store = useNaraStore();
  useNaraLive();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { snap, avisosN, baseNeed } = useMemo(() => {
    const S = (store.get?.() || {}) as {
      analizadorByPid?: Record<string, Snap>;
      avisos?: { pid?: string; estado?: string }[];
      anCfg?: { partidas?: number };
    };
    const snap = S.analizadorByPid?.[patientId] || null;
    const avisosN = Array.isArray(S.avisos)
      ? S.avisos.filter(
          (a) =>
            a &&
            a.pid === patientId &&
            (a.estado === "abierto" || a.estado === "tomado"),
        ).length
      : 0;
    const baseNeed = Number(S.anCfg?.partidas) || 10;
    return { snap, avisosN, baseNeed };
  }, [store, patientId]);

  const estado = asEstado(snap?.estado);
  const meta = ESTADOS_AN[estado];
  const tieneSnap = !!snap;
  const chip =
    estado === "base" && tieneSnap
      ? `Base · ${Number(snap?.baseN) || 0}/${baseNeed}`
      : tieneSnap
        ? meta.label
        : "Sin lectura";
  const sub =
    avisosN > 0
      ? `${avisosN} aviso${avisosN === 1 ? "" : "s"}`
      : tieneSnap
        ? "App · juegos"
        : "Aún sin partidas";

  return (
    <>
      <ToolCardShell
        onClick={() => setOpen(true)}
        iconId="analizador"
        title={item.name || "Analizador"}
      >
        <span>{chip}</span>
        <span>{sub}</span>
      </ToolCardShell>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Lectura del analizador"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-linea bg-nara-crema font-texto text-nara-tinta shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="relative overflow-hidden border-b border-linea bg-nara-blanco px-5 pb-4 pt-5">
              <div
                className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[#D4CFE3]/50"
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <HerramientaIcon id="analizador" className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-titulos text-[20px] font-semibold leading-tight">
                    Analizador
                  </p>
                  <p className="m-0 mt-0.5 text-[13px] text-texto-secundario">
                    Desempeño frente a su propia historia · no es crisis
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative shrink-0 rounded-full border border-linea bg-nara-blanco px-3 py-1.5 text-[13px] text-texto-secundario"
                >
                  Cerrar
                </button>
              </div>
            </header>

            <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
              <div
                className="inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold"
                style={{ background: meta.bg, color: meta.fg }}
              >
                <span aria-hidden>{meta.icon}</span>
                {tieneSnap ? meta.label : "Sin lectura aún"}
              </div>

              <p className="m-0 border-l-[3px] border-[#31C6E6] pl-3 text-[15px] leading-relaxed">
                {snap?.lectura ||
                  "Cuando juegue con consentimiento, aquí verá si está estable, mejorando o si hay un cambio a revisar."}
              </p>

              {Array.isArray(snap?.senales) && snap!.senales!.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {snap!.senales!.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-[#FAE7BF] px-2 py-0.5 text-[11px] font-semibold text-[#6E4705]"
                    >
                      {SENAL[s] || s}
                    </span>
                  ))}
                </div>
              ) : null}

              {snap?.sugerencia ? (
                <div className="rounded-xl border border-linea bg-nara-blanco px-3 py-3">
                  <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-texto-secundario">
                    Sugerencia
                  </p>
                  <p className="m-0 mt-1 text-[14px]">{snap.sugerencia}</p>
                </div>
              ) : null}

              {avisosN > 0 ? (
                <p className="m-0 rounded-xl bg-[#FFF8EA] px-3 py-2.5 text-[13px] text-[#6E4705]">
                  Tiene {avisosN} aviso{avisosN === 1 ? "" : "s"} abierto
                  {avisosN === 1 ? "" : "s"} en el panel Analizador.
                </p>
              ) : null}
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-linea bg-nara-blanco px-5 py-3.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/clinico/analizador");
                }}
                className="h-11 cursor-pointer rounded-xl border-0 bg-nara-tinta px-4 font-texto text-sm font-semibold text-white"
              >
                Abrir panel Analizador
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 cursor-pointer rounded-xl border border-linea bg-white px-4 font-texto text-sm text-nara-tinta"
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
