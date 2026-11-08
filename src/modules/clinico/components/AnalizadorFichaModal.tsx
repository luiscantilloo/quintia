"use client";

import {
  ESTADOS_AN,
  type AnalizadorEstadoId,
} from "@/modules/clinico/analizador/estados";
import { GAME_SERVICES } from "@/lib/nara-services/gamesCatalog.js";
import { QuintiaMark } from "@/components/shared/brand/QuintiaLogo";

const SENAL_LABEL: Record<string, string> = {
  menos: "Juega menos",
  peor: "Juega peor",
  gana: "Gana menos",
};

const ESTADO_RAIL: Record<AnalizadorEstadoId, string> = {
  base: "#8B84A3",
  estable: "#31C6E6",
  mejorando: "#61F0D2",
  cambio: "#DA9E46",
};

type Ficha = {
  pid: string;
  nombre: string;
  perfil: string;
  semanas: number | string;
  estado?: AnalizadorEstadoId;
  label: string;
  icon: string;
  bg: string;
  fg: string;
  lectura?: string;
  resumen: string;
  sugerencia?: string | null;
  seriesByGame?: Record<string, number[]>;
  bandByGame?: Record<string, [number, number] | null>;
  habByGame?: Record<string, AnalizadorEstadoId | string>;
  senales?: string[];
  baseN?: number;
  baseNeed?: number;
  adh: string;
  open: () => void;
};

function gameMeta(id: string) {
  const g = GAME_SERVICES.find((x: { id: string }) => x.id === id);
  return {
    nombre: g?.name || id,
    hab: (g?.note || "").split("·")[0]?.trim() || "Habilidad",
    unidad: /sudoku/i.test(id)
      ? "min"
      : /duelo/i.test(id)
        ? "%"
        : /simon/i.test(id)
          ? "pasos"
          : "pts",
  };
}

function cleanSeries(raw: number[] | undefined): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v) => Number.isFinite(v));
}

function fmt(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  return Number.isInteger(r) ? String(r) : r.toFixed(digits);
}

function asHab(raw: unknown): AnalizadorEstadoId {
  const s = String(raw || "base");
  if (s === "estable" || s === "mejorando" || s === "cambio" || s === "base") {
    return s;
  }
  return "base";
}

function verdictoClinico(ficha: Ficha, senales: string[]): string {
  const est = asHab(ficha.estado);
  if (est === "base") {
    return "Todavía arma su historia de juego. Nada que revisar todavía.";
  }
  if (est === "cambio") {
    return senales.length
      ? `Cambio sostenido (${senales.join(", ").toLowerCase()}). Conviene mirarlo en sesión — no es crisis.`
      : "Cambio sostenido frente a su propia historia. Conviene mirarlo en sesión — no es crisis.";
  }
  if (est === "mejorando") {
    return "Por encima de su rango habitual en al menos un juego. Puede nombrarlo como avance.";
  }
  return "Dentro de su propio patrón. Sin señales de alerta.";
}

function explicarJuego(opts: {
  nombre: string;
  unidad: string;
  habEstado: AnalizadorEstadoId;
  series: number[];
  band: [number, number] | null;
  need: number;
}): string {
  const { nombre, unidad, habEstado, series, band, need } = opts;
  const n = series.length;
  const last = n ? series[n - 1] : null;

  if (n === 0) {
    return `Aún no ha jugado ${nombre}.`;
  }
  if (habEstado === "base" || !band) {
    return `Lleva ${n} de ${need} partidas para armar su línea base en ${nombre}.`;
  }
  if (band[1] - band[0] < 1e-6) {
    return `Última medida: ${fmt(last!)} ${unidad}. Con pocas partidas el rango aún es un solo valor; la lectura madura con más historia.`;
  }
  if (habEstado === "cambio") {
    return `Última: ${fmt(last!)} ${unidad}, fuera de su rango habitual (${fmt(band[0])}–${fmt(band[1])} ${unidad}).`;
  }
  if (habEstado === "mejorando") {
    return `Última: ${fmt(last!)} ${unidad}, por encima de su rango (${fmt(band[0])}–${fmt(band[1])} ${unidad}).`;
  }
  return `Última: ${fmt(last!)} ${unidad}, dentro de su rango habitual (${fmt(band[0])}–${fmt(band[1])} ${unidad}).`;
}

function BaseProgress({ n, need }: { n: number; need: number }) {
  const pct = Math.min(100, Math.round((n / Math.max(1, need)) * 100));
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#5B6770]">
          Línea base
        </span>
        <span className="font-titulos text-sm font-bold text-[#0F2D3B]">
          {n}
          <span className="font-texto text-[12px] font-medium text-[#5B6770]">
            {" "}
            / {need}
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E0D5]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #61F0D2, #31C6E6)",
          }}
        />
      </div>
    </div>
  );
}

function RangoGauge({
  last,
  band,
  unidad,
  color,
}: {
  last: number;
  band: [number, number];
  unidad: string;
  color: string;
}) {
  const lo = band[0];
  const hi = band[1];
  const span = hi - lo;
  if (span < 1e-6) return null;

  const pad = span * 0.4;
  const min = lo - pad;
  const max = hi + pad;
  const total = max - min;
  const left = ((lo - min) / total) * 100;
  const width = (span / total) * 100;
  const pin = Math.min(100, Math.max(0, ((last - min) / total) * 100));
  const donde =
    last < lo ? "Debajo" : last > hi ? "Encima" : "Dentro";

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#5B6770]">
          Rango habitual
        </span>
        <span
          className="rounded-md px-2 py-0.5 font-texto text-[11px] font-semibold"
          style={{ background: `${color}22`, color }}
        >
          {donde} · {fmt(last)} {unidad}
        </span>
      </div>
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#E5E0D5]" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#FAE7BF]"
          style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
        />
        <div
          className="absolute top-1/2 size-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(15,45,59,0.25)]"
          style={{ left: `${pin}%`, background: color }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-[#5B6770]">
        <span>
          {fmt(lo)} {unidad}
        </span>
        <span>
          {fmt(hi)} {unidad}
        </span>
      </div>
    </div>
  );
}

export function AnalizadorFichaModal({
  ficha,
  onClose,
}: {
  ficha: Ficha;
  onClose: () => void;
}) {
  const seriesMap = ficha.seriesByGame || {};
  const bandMap = ficha.bandByGame || {};
  const habMap = ficha.habByGame || {};
  const need = ficha.baseNeed || 10;
  const estado = asHab(ficha.estado);
  const estMeta = ESTADOS_AN[estado];
  const gameIds = Array.from(
    new Set([
      ...Object.keys(seriesMap),
      ...Object.keys(bandMap),
      ...Object.keys(habMap),
    ]),
  );
  const senales = (ficha.senales || []).map((s) => SENAL_LABEL[s] || s);
  const textoVeredicto = verdictoClinico(ficha, senales);
  const conDatos = gameIds.filter((g) => cleanSeries(seriesMap[g]).length > 0);
  const sinDatos = gameIds.filter((g) => cleanSeries(seriesMap[g]).length === 0);
  const metaLine = [
    ficha.perfil,
    ficha.semanas !== "—" && ficha.semanas !== "" && ficha.semanas != null
      ? `${ficha.semanas} sem.`
      : null,
    ficha.adh !== "—" ? ficha.adh : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-[#0F2D3B]/60 backdrop-blur-[3px]"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal
        aria-labelledby="analizador-ficha-titulo"
        className="relative z-[1] flex max-h-[min(94dvh,920px)] w-full max-w-4xl flex-col overflow-hidden rounded-t-[32px] border border-white/20 bg-[#F7F5EF] shadow-[0_40px_100px_rgba(15,45,59,.4)] motion-safe:animate-[q-form-in_0.35s_cubic-bezier(.22,1,.36,1)_both] sm:max-h-[min(90vh,860px)] sm:rounded-[32px] lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel marca · desktop */}
        <aside className="relative hidden w-[250px] shrink-0 flex-col justify-between overflow-hidden bg-[#0F2D3B] p-7 text-[#F7F5EF] lg:flex xl:w-[270px]">
          <div
            className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full opacity-70"
            style={{
              background: "radial-gradient(circle, #31C6E6 0%, transparent 70%)",
              animation: "q-form-glow 6s ease-in-out infinite",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -right-8 h-56 w-56 rounded-full opacity-55"
            style={{
              background: "radial-gradient(circle, #6C04C9 0%, transparent 68%)",
              animation: "q-form-glow 7.5s ease-in-out infinite reverse",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, #61F0D2 0%, transparent 70%)",
              animation: "q-form-glow 5s ease-in-out infinite",
            }}
            aria-hidden
          />

          <div className="relative flex flex-col gap-5">
            <QuintiaMark size={48} tone="claro" />
            <div className="flex flex-col gap-2">
              <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#61F0D2]">
                Analizador · lectura
              </p>
              <h2
                id="analizador-ficha-titulo"
                className="m-0 font-titulos text-[26px] font-extrabold leading-[1.1] tracking-[-0.03em]"
              >
                {ficha.nombre}
              </h2>
              {metaLine ? (
                <p className="m-0 font-texto text-[13px] leading-snug text-[#E5E0D5]/85">
                  {metaLine}
                </p>
              ) : null}
            </div>

            <div
              className="mt-1 rounded-2xl px-3.5 py-3"
              style={{ background: estMeta.bg, color: estMeta.fg }}
            >
              <p className="m-0 font-mono text-[9px] font-medium uppercase tracking-[0.14em] opacity-70">
                Estado
              </p>
              <p className="m-0 mt-1 font-titulos text-[15px] font-extrabold leading-snug">
                {ficha.icon} {ficha.label}
              </p>
            </div>

            <p className="m-0 font-texto text-[14px] leading-relaxed text-[#F7F5EF]/90">
              {textoVeredicto}
            </p>
          </div>

          <p className="relative m-0 font-titulos text-[13px] font-semibold leading-snug text-[#31C6E6]/90">
            Cinco fuerzas.
            <br />
            Infinitas posibilidades.
          </p>
        </aside>

        {/* Cuerpo */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className="h-1.5 w-full shrink-0"
            style={{
              background:
                "linear-gradient(90deg, #61F0D2 0%, #31C6E6 45%, #6C04C9 100%)",
            }}
            aria-hidden
          />

          {/* Header móvil */}
          <header className="relative shrink-0 overflow-hidden border-b border-[#E5E0D5]/80 px-5 pb-4 pt-4 sm:px-7 lg:hidden">
            <div
              className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#31C6E6]/20 blur-3xl"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <QuintiaMark size={34} />
                <div className="min-w-0">
                  <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#5B6770]">
                    Analizador · lectura
                  </p>
                  <h2 className="m-0 mt-0.5 font-titulos text-[22px] font-extrabold tracking-[-0.02em] text-[#0F2D3B]">
                    {ficha.nombre}
                  </h2>
                  {metaLine ? (
                    <p className="m-0 mt-0.5 font-texto text-[13px] text-[#5B6770]">
                      {metaLine}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#E5E0D5] bg-white font-texto text-xl leading-none text-[#0F2D3B]"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div
              className="mt-3 rounded-xl px-3 py-2.5"
              style={{ background: estMeta.bg, color: estMeta.fg }}
            >
              <p className="m-0 font-titulos text-[14px] font-extrabold">
                {ficha.icon} {ficha.label}
              </p>
              <p className="m-0 mt-1 font-texto text-[13px] leading-snug opacity-90">
                {textoVeredicto}
              </p>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-7">
            {/* Cierre desktop del veredicto en cuerpo si hace falta contexto */}
            <aside className="hidden rounded-2xl border border-[#E5E0D5] bg-white px-4 py-3.5 lg:block">
              <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
                Cómo leer esto
              </p>
              <p className="m-0 mt-1.5 font-texto text-[14px] leading-relaxed text-[#0F2D3B]/75">
                No diagnostica y no es crisis. Compara a la persona{" "}
                <strong className="font-semibold text-[#0F2D3B]">consigo misma</strong>
                : su rango habitual (ámbar) frente a lo reciente. Si el cambio se
                sostiene, le avisa a usted.
              </p>
              <p className="m-0 mt-2 border-l-[3px] border-[#31C6E6] pl-3 font-texto text-[14px] leading-relaxed text-[#0F2D3B]">
                {ficha.lectura || ficha.resumen}
              </p>
              {senales.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {senales.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-[#FAE7BF] px-2 py-0.5 font-texto text-[11px] font-semibold text-[#6E4705]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
            </aside>

            <aside className="rounded-2xl border border-[#E5E0D5] bg-white px-4 py-3.5 lg:hidden">
              <p className="m-0 font-texto text-[13px] leading-relaxed text-[#0F2D3B]/75">
                Compara consigo misma — no diagnostica, no es crisis.
              </p>
              <p className="m-0 mt-2 border-l-[3px] border-[#31C6E6] pl-3 font-texto text-[14px] text-[#0F2D3B]">
                {ficha.lectura || ficha.resumen}
              </p>
            </aside>

            <section className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
                    Por juego
                  </p>
                  <p className="m-0 mt-0.5 font-titulos text-lg font-extrabold tracking-tight text-[#0F2D3B]">
                    Lectura de cada fuerza en juego
                  </p>
                </div>
                <span className="hidden font-mono text-[11px] text-[#5B6770] sm:inline">
                  {conDatos.length} con datos
                </span>
              </div>

              {conDatos.map((g, i) => {
                const meta = gameMeta(g);
                const series = cleanSeries(seriesMap[g]);
                const band = bandMap[g] || null;
                const hab = asHab(habMap[g]);
                const est = ESTADOS_AN[hab];
                const last = series.length ? series[series.length - 1] : null;
                const frase = explicarJuego({
                  nombre: meta.nombre,
                  unidad: meta.unidad,
                  habEstado: hab,
                  series,
                  band,
                  need,
                });
                const armando = hab === "base" || !band;
                const rangoUtil =
                  !!band && band[1] - band[0] >= 1e-6 && last != null;

                return (
                  <article
                    key={g}
                    className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-white shadow-[0_1px_0_rgba(15,45,59,0.04)] motion-safe:animate-[q-form-in_0.4s_cubic-bezier(.22,1,.36,1)_both]"
                    style={{
                      animationDelay: `${80 + i * 60}ms`,
                      boxShadow: `inset 4px 0 0 ${ESTADO_RAIL[hab]}`,
                    }}
                  >
                    <div className="px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#5B6770]">
                            {String(i + 1).padStart(2, "0")} · {meta.hab}
                          </p>
                          <p className="m-0 mt-0.5 font-titulos text-[17px] font-extrabold tracking-tight text-[#0F2D3B]">
                            {meta.nombre}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-texto text-[12px] font-semibold"
                          style={{ background: est.bg, color: est.fg }}
                        >
                          {est.icon} {est.label}
                        </span>
                      </div>

                      <p className="m-0 mt-3 font-texto text-[15px] leading-relaxed text-[#0F2D3B]">
                        {frase}
                      </p>

                      {armando ? (
                        <BaseProgress n={series.length} need={need} />
                      ) : rangoUtil && band && last != null ? (
                        <RangoGauge
                          last={last}
                          band={band}
                          unidad={meta.unidad}
                          color={ESTADO_RAIL[hab]}
                        />
                      ) : band ? (
                        <p className="m-0 mt-3 rounded-xl bg-[#F7F5EF] px-3 py-2.5 font-texto text-[13px] leading-snug text-[#5B6770]">
                          Historia corta: el rango aún no tiene amplitud. Siga
                          observando partidas para afinar la lectura.
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {sinDatos.length ? (
                <div className="rounded-2xl border border-dashed border-[#D6CFC2] bg-white/80 px-4 py-3.5">
                  <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#5B6770]">
                    Sin partidas aún
                  </p>
                  <ul className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0">
                    {sinDatos.map((g) => {
                      const meta = gameMeta(g);
                      return (
                        <li
                          key={g}
                          className="flex items-center justify-between gap-3 border-t border-[#E5E0D5]/80 pt-2 first:border-t-0 first:pt-0"
                        >
                          <span>
                            <span className="font-titulos text-[14px] font-bold text-[#0F2D3B]/70">
                              {meta.nombre}
                            </span>
                            <span className="mt-0.5 block font-texto text-[12px] text-[#5B6770]">
                              {meta.hab}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-[#5B6770]">
                            0
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#E5E0D5] bg-white px-4 py-4 sm:px-5">
              <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
                Qué puede hacer
              </p>
              <p className="m-0 mt-2 font-titulos text-[16px] font-bold leading-snug text-[#0F2D3B]">
                {ficha.sugerencia || "Seguir observando"}
              </p>
              <p className="m-0 mt-1.5 font-texto text-[13px] text-[#5B6770]">
                Sugerencia del analizador. La decisión clínica es suya.
              </p>
            </section>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[#E5E0D5] bg-white px-5 py-3.5 sm:px-7">
            <button
              type="button"
              onClick={() => {
                ficha.open();
                onClose();
              }}
              className="h-11 cursor-pointer rounded-xl border-0 bg-[#0F2D3B] px-5 font-texto text-sm font-semibold text-[#F7F5EF] transition hover:brightness-110"
            >
              Ir a la ficha clínica
            </button>
            <button
              type="button"
              onClick={onClose}
              className="hidden size-9 place-items-center rounded-xl border border-[#E5E0D5] bg-white font-texto text-lg text-[#0F2D3B] transition hover:bg-[#F7F5EF] lg:grid lg:ml-auto"
              aria-label="Cerrar"
            >
              ×
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-11 cursor-pointer rounded-xl border-0 bg-transparent px-3 font-texto text-sm text-[#5B6770] transition hover:text-[#0F2D3B] lg:hidden"
            >
              Cerrar
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
