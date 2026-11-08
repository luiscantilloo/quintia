"use client";

/**
 * Tablero del observador (caso O-02). H-004 (TRL 2026-10-10): /api/people le entrega al observador
 * solo un resumen agregado; los grupos con menos personas que `minGrupo` llegan en null y se muestran
 * como «menos de N» para que nadie sea reidentificable.
 */

import { useEffect, useState } from "react";

type Conteos = Record<string, number | null>;
type Resumen = {
  total: number;
  minGrupo: number;
  porTerritorio: Conteos;
  porEstado: Conteos;
  porRiesgo: Conteos;
  porAnalizador?: Conteos;
};

function isCrisisLabel(label: string) {
  return /^crisis$/i.test(label.trim());
}

function Bloque({
  titulo,
  datos,
  minGrupo,
}: {
  titulo: string;
  datos: Conteos;
  minGrupo: number;
}) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E5E0D5] bg-white">
      <h2 className="border-b border-[#E5E0D5] bg-[#F7F5EF] px-4 py-3 font-titulos text-base font-extrabold text-[#0F2D3B]">
        {titulo}
      </h2>
      <ul className="flex flex-col font-texto text-[15px]">
        {Object.entries(datos).map(([k, v]) => {
          const crisis = isCrisisLabel(k);
          return (
            <li
              key={k}
              className={
                crisis
                  ? "flex justify-between gap-3 border-t border-[#B42318]/25 bg-[#B42318] px-4 py-2.5 !text-[#F7F5EF] first:border-t-0"
                  : "flex justify-between gap-3 border-t border-[#E5E0D5] px-4 py-2.5 text-[#0F2D3B] first:border-t-0"
              }
            >
              <span className={`truncate ${crisis ? "font-semibold" : ""}`}>{k}</span>
              <span
                className={`shrink-0 font-mono text-[13px] font-medium tabular-nums ${
                  crisis ? "!text-[#F7F5EF]" : "text-[#6B7280]"
                }`}
              >
                {v === null ? `menos de ${minGrupo}` : v}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ObservadorTablero() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    const load = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch("/api/people", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((d) => {
          if (!vivo) return;
          if (d?.ok && d.summary) {
            setResumen(d.summary as Resumen);
            setError("");
          } else setError("No se pudieron cargar los datos.");
        })
        .catch(() => vivo && setError("No se pudieron cargar los datos."));
    };
    load();
    const id = setInterval(load, 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      vivo = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (error) {
    return <p className="font-mono text-sm text-[#6B7280]">{error}</p>;
  }
  if (!resumen) {
    return <p className="font-mono text-sm text-[#6B7280]">Cargando datos del programa…</p>;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4" data-testid="observador-tablero">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-sm font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
          Resumen agregado
        </p>
        <h1 className="m-0 font-titulos text-[clamp(22px,4vw,28px)] font-extrabold leading-tight text-[#0F2D3B]">
          {resumen.total.toLocaleString("es-CO")} personas en el programa
        </h1>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Bloque
          titulo="Por territorio"
          datos={resumen.porTerritorio}
          minGrupo={resumen.minGrupo}
        />
        <Bloque titulo="Por estado" datos={resumen.porEstado} minGrupo={resumen.minGrupo} />
        <Bloque
          titulo="Por nivel de riesgo"
          datos={resumen.porRiesgo}
          minGrupo={resumen.minGrupo}
        />
        <Bloque
          titulo="Por analizador"
          datos={resumen.porAnalizador || {}}
          minGrupo={resumen.minGrupo}
        />
      </div>
      <p className="font-mono text-[12px] text-[#6B7280]">
        Solo datos agregados. Grupos con menos de {resumen.minGrupo} aparecen
        como «menos de {resumen.minGrupo}». No se muestran datos personales.
      </p>
    </div>
  );
}
