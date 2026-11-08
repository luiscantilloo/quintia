"use client";

import { useState } from "react";
import { AnalizadorFichaModal } from "@/modules/clinico/components/AnalizadorFichaModal";
import type { AnalizadorEstadoId } from "@/modules/clinico/analizador/estados";

type Total = {
  key: string;
  label: string;
  n: number;
  icon: string;
  fg: string;
};

type Aviso = {
  id: string;
  nombre: string;
  juego: string;
  hab: string;
  texto: string;
  desde: string;
  plazo: string;
  estadoAviso?: string;
  senales?: string[];
  abrir: () => void;
  tomar?: () => void;
  decidir?: (tipo: string) => void;
  vista: () => void;
};

type CargaRow = {
  pid: string;
  nombre: string;
  perfil: string;
  semanas: number | string;
  estado?: AnalizadorEstadoId;
  label: string;
  icon: string;
  bg: string;
  fg: string;
  resumen: string;
  adh: string;
  lectura?: string;
  sugerencia?: string | null;
  seriesByGame?: Record<string, number[]>;
  bandByGame?: Record<string, [number, number] | null>;
  habByGame?: Record<string, AnalizadorEstadoId | string>;
  senales?: string[];
  baseN?: number;
  baseNeed?: number;
  open: () => void;
};

type Props = {
  totales: Total[];
  avisos: Aviso[];
  sinAvisos: boolean;
  carga: CargaRow[];
  goHome?: () => void;
};

const DECISIONES = [
  { id: "seguir", label: "Sin cambios · seguir observando" },
  { id: "repetir", label: "Repetir la medición" },
  { id: "ajustar", label: "Ajustar la ruta" },
  { id: "remitir", label: "Remitir a valoración" },
  { id: "otra", label: "Otra" },
];

export function AnalizadorPanel({
  totales,
  avisos,
  sinAvisos,
  carga,
  goHome,
}: Props) {
  const [ficha, setFicha] = useState<CargaRow | null>(null);
  const [decidirId, setDecidirId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      {goHome ? (
        <button
          type="button"
          onClick={goHome}
          className="w-fit cursor-pointer border-none bg-transparent p-0 font-texto text-[15px] font-medium text-nara-tinta"
        >
          ← Volver a Inicio
        </button>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <span className="font-titulos text-[clamp(26px,4vw,30px)] font-semibold tracking-tight text-nara-tinta">
          Analizador
        </span>
        <span className="text-[15px] text-texto-secundario">
          Desempeño de cada persona frente a su propia historia. Los avisos no
          son crisis: el analizador sugiere y usted decide.
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        {totales.map((t) => (
          <div
            key={t.key}
            className="flex flex-col gap-1.5 rounded-2xl border border-linea bg-nara-blanco p-4"
          >
            <span
              className="flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: t.fg }}
            >
              <span aria-hidden>{t.icon}</span>
              {t.label}
            </span>
            <span className="font-titulos text-[32px] font-semibold leading-none text-nara-tinta">
              {t.n}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="font-titulos text-[19px] font-semibold text-nara-tinta">
          Avisos abiertos
        </span>
        {avisos.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E4C98C] bg-[#FFF8EA] p-[18px]"
          >
            <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[17px] font-semibold text-nara-tinta">
                  {a.nombre}
                </span>
                <span className="rounded-md bg-[#FAE7BF] px-2 py-0.5 text-xs font-semibold text-[#6E4705]">
                  ◆ {a.estadoAviso === "tomado" ? "En revisión" : "Cambio a revisar"}
                </span>
              </span>
              <span className="text-[13px] text-texto-secundario">
                {a.juego} · {a.hab}
                {a.senales?.length
                  ? ` · ${a.senales.join(" · ")}`
                  : ""}
              </span>
              <span className="text-[15px] text-nara-tinta">{a.texto}</span>
              <span className="font-mono text-xs text-[#6E4705]">
                Desde {a.desde} · plazo para revisar: {a.plazo}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => a.abrir()}
                className="h-10 cursor-pointer rounded-[10px] border-0 bg-nara-tinta px-4 font-texto text-sm font-semibold text-white"
              >
                Abrir ficha
              </button>
              {a.estadoAviso === "abierto" && a.tomar ? (
                <button
                  type="button"
                  onClick={() => a.tomar?.()}
                  className="h-10 cursor-pointer rounded-[10px] border border-[#E4C98C] bg-[#FAE7BF] px-4 font-texto text-sm font-semibold text-[#6E4705]"
                >
                  Tomar
                </button>
              ) : null}
              {a.decidir ? (
                <button
                  type="button"
                  onClick={() =>
                    setDecidirId((id) => (id === a.id ? null : a.id))
                  }
                  className="h-10 cursor-pointer rounded-[10px] border border-linea bg-nara-blanco px-4 font-texto text-sm text-nara-tinta"
                >
                  Decidir y cerrar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => a.vista()}
                  className="h-10 cursor-pointer rounded-[10px] border border-linea bg-nara-blanco px-4 font-texto text-sm text-nara-tinta"
                >
                  Marcar como vista
                </button>
              )}
            </div>
            {decidirId === a.id && a.decidir ? (
              <div className="flex w-full flex-wrap gap-2 border-t border-[#E4C98C]/60 pt-3">
                {DECISIONES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      a.decidir?.(d.id);
                      setDecidirId(null);
                    }}
                    className="h-9 cursor-pointer rounded-lg border border-linea bg-white px-3 font-texto text-[13px] text-nara-tinta"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {sinAvisos ? (
          <div className="rounded-2xl border border-dashed border-[#D6CFC2] px-[18px] py-[18px] text-[15px] text-texto-secundario">
            No hay avisos abiertos. Los avisos revisados quedan en la línea de
            tiempo de cada ficha.
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="font-titulos text-[19px] font-semibold text-nara-tinta">
          Toda su carga
        </span>
        <div className="overflow-hidden rounded-2xl border border-linea bg-nara-blanco">
          {carga.map((c) => (
            <button
              key={c.pid}
              type="button"
              onClick={() => setFicha(c)}
              className="grid w-full cursor-pointer grid-cols-1 items-center gap-3 border-0 border-b border-[#EFEAE0] bg-transparent px-[18px] py-3.5 text-left font-texto text-nara-tinta last:border-b-0 sm:grid-cols-[minmax(180px,1.3fr)_minmax(170px,1fr)_minmax(220px,2fr)_90px] sm:gap-3"
            >
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">{c.nombre}</span>
                <span className="text-[13px] text-texto-secundario">
                  {c.perfil} · {c.semanas} semanas
                </span>
              </span>
              <span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={{ background: c.bg, color: c.fg }}
                >
                  <span aria-hidden>{c.icon}</span>
                  {c.label}
                </span>
              </span>
              <span className="text-sm text-texto-secundario">{c.resumen}</span>
              <span className="text-sm font-semibold">{c.adh}</span>
            </button>
          ))}
          {!carga.length ? (
            <div className="px-[18px] py-8 text-center text-sm text-texto-secundario">
              Nadie de su carga tiene juegos activos todavía.
            </div>
          ) : null}
        </div>
      </div>

      {ficha ? (
        <AnalizadorFichaModal ficha={ficha} onClose={() => setFicha(null)} />
      ) : null}
    </div>
  );
}
