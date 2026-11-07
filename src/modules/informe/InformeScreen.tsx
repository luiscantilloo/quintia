"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";
import { buildInforme } from "@/modules/informe/buildInforme";

function resolveBack(raw: string | null): string {
  if (!raw) return "/informes";
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("AdminInformes")) return "/informes";
  if (raw.startsWith("AdminUsuarios")) return "/usuarios";
  if (raw.startsWith("Admin.")) return "/inicio";
  return "/informes";
}

function rowTone(tone?: "ok" | "warn" | "muted") {
  if (tone === "warn") return "bg-[#FDF3E8]";
  if (tone === "ok") return "bg-[#F3F8F1]";
  return "";
}

export function InformeScreen() {
  const sp = useSearchParams();
  const store = useNaraStore();
  const back = resolveBack(sp.get("back"));
  const autoPrint = sp.get("print") === "1";
  const docRef = useRef<HTMLElement>(null);

  const name = sp.get("name");
  const t = sp.get("t");
  const tpl = sp.get("tpl");
  const per = sp.get("per");
  const terr = sp.get("terr");
  const secs = sp.get("secs");
  const id = sp.get("id");

  const model = useMemo(
    () => buildInforme(store, { name, t, tpl, per, terr, secs, id }),
    [store, name, t, tpl, per, terr, secs, id],
  );

  /** Abre el diálogo de impresión. La URL/fecha del margen las pone Chrome. */
  const printDoc = () => {
    const prevTitle = document.title;
    document.title = "\u00a0";
    let done = false;
    const restore = () => {
      if (done) return;
      done = true;
      document.title = prevTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    window.setTimeout(restore, 2000);
  };

  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => printDoc(), 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint]);

  return (
    <div
      data-screen-label="Informe"
      className="nara-scroll flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto overscroll-contain bg-[#E5E0D5] px-3 py-4 font-texto text-nara-tinta sm:gap-4 sm:px-4 sm:pb-10"
    >
      <style>{`
        @page { size: letter; margin: 9mm; }
        @media print {
          html, body {
            overflow: visible !important;
            height: auto !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          [data-shell-root] {
            position: static !important;
            inset: auto !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            background: #fff !important;
            display: block !important;
          }
          [data-screen-label="Informe"] {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            background: #fff !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          [data-noprint] { display: none !important; }
          [data-informe-doc] {
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            gap: 9px !important;
          }
          [data-informe-doc] h1 { font-size: 18px !important; }
          [data-informe-doc] h2 { font-size: 12px !important; margin: 0 !important; }
          [data-informe-doc] p,
          [data-informe-doc] li,
          [data-informe-doc] dd,
          [data-informe-doc] dt { font-size: 10px !important; }
          [data-informe-doc] table { font-size: 9.5px !important; }
          [data-informe-doc] th,
          [data-informe-doc] td { padding: 2px 5px !important; }
          [data-informe-kpi] span:last-child { font-size: 13px !important; }
        }
      `}</style>

      <div
        data-noprint="1"
        className="flex w-full max-w-[816px] flex-col gap-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={back}
            className="text-sm text-nara-tinta no-underline hover:underline"
          >
            ← Volver
          </Link>
          <button
            type="button"
            onClick={printDoc}
            className="h-9 cursor-pointer rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3.5 font-texto text-sm font-medium text-nara-tinta"
          >
            Imprimir / PDF
          </button>
        </div>
        <p className="text-[12px] leading-snug text-texto-secundario">
          Para quitar la URL y la fecha del PDF: en el diálogo →{" "}
          <span className="font-medium text-nara-tinta">Más ajustes</span> →
          desactive{" "}
          <span className="font-medium text-nara-tinta">
            Encabezados y pies de página
          </span>
          .
        </p>
      </div>

      <article
        ref={docRef}
        data-informe-doc="1"
        className="box-border flex w-full max-w-[816px] flex-col gap-4 bg-nara-blanco px-5 py-6 shadow-[0_8px_30px_rgba(22,20,19,.12)] sm:px-8 sm:py-7"
      >
        <header className="flex flex-col gap-2 border-b border-[#E5E0D5] pb-3">
          <img
            src="/quintia/logo/quintia-horizontal-oscuro.svg"
            alt="QUINTIA"
            className="block h-8 w-auto"
          />
          <div className="flex flex-col gap-0.5">
            <h1 className="font-titulos text-[clamp(22px,3.5vw,26px)] font-semibold leading-tight text-nara-tinta">
              {model.title}
            </h1>
            <p className="text-[13px] leading-snug text-texto-secundario">
              {model.subtitle}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
            {model.meta.map((m) => (
              <div key={m.label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-[10px] font-medium uppercase tracking-wide text-texto-secundario">
                  {m.label}
                </dt>
                <dd className="truncate text-[13px] font-medium text-nara-tinta" data-real-date>
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        {model.answer ? (
          <section className="rounded-[12px] border border-linea bg-nara-crema px-3.5 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-texto-secundario">
              Pregunta guardada
            </span>
            <p className="mt-1 font-titulos text-lg font-semibold leading-snug">
              {model.answer.q}
            </p>
            {model.answer.when ? (
              <p className="mt-1 text-xs text-texto-secundario">{model.answer.when}</p>
            ) : null}
          </section>
        ) : null}

        {model.actions.length ? (
          <section className="rounded-[12px] border border-[#E8D48A] bg-[#FFF8DB] px-3.5 py-2.5">
            <h2 className="font-titulos text-[15px] font-semibold">
              Acciones sugeridas
            </h2>
            <ol className="mt-1.5 mb-0 flex list-decimal flex-col gap-0.5 pl-4 text-[13px] leading-snug">
              {model.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="flex flex-col gap-3">
          {model.sections.map((sec) => (
            <section key={sec.key} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h2 className="font-titulos text-[16px] font-semibold leading-none">
                  {sec.title}
                </h2>
                <p className="text-[12px] leading-snug text-texto-secundario">
                  {sec.blurb}
                </p>
              </div>

              {sec.kpis?.length ? (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {sec.kpis.map((k) => (
                    <div
                      key={k.label}
                      data-informe-kpi="1"
                      className="flex flex-col gap-0.5 rounded-[10px] border border-linea bg-nara-crema px-2.5 py-1.5"
                    >
                      <span className="text-[10px] text-texto-secundario">
                        {k.label}
                      </span>
                      <span className="font-titulos text-lg font-semibold leading-none">
                        {k.value}
                      </span>
                      {k.hint ? (
                        <span className="text-[10px] text-texto-secundario">
                          {k.hint}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {sec.rows.length ? (
                <div className="overflow-hidden rounded-[10px] border border-linea">
                  <table className="w-full border-collapse text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-linea bg-[#F7F4EF]">
                        {sec.columns.map((c) => (
                          <th
                            key={c}
                            className="px-2.5 py-1.5 text-[11px] font-medium text-texto-secundario"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((r, i) => (
                        <tr
                          key={i}
                          className={`border-b border-[#E5E0D5] last:border-b-0 ${rowTone(r.tone)}`}
                        >
                          {r.cells.map((cell, j) => (
                            <td
                              key={j}
                              className={`px-2.5 py-1.5 align-top ${j === 0 ? "font-medium" : ""}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-[10px] border border-dashed border-linea px-3 py-2 text-[12px] text-texto-secundario">
                  {sec.empty || "Sin datos para esta sección."}
                </p>
              )}
            </section>
          ))}
        </div>

        {!model.answer && !model.sections.length ? (
          <p className="text-sm text-texto-secundario">
            Este enlace no incluye secciones para mostrar.
          </p>
        ) : null}

        <footer className="border-t border-[#E5E0D5] pt-2 text-[10px] leading-snug text-texto-secundario">
          One-pager QUINTIA · período indicado. Servicios comunitarios: agregado de
          referencia del programa.
        </footer>
      </article>
    </div>
  );
}
