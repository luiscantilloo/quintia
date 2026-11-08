"use client";

import { useEffect, useMemo, useState } from "react";
import { QuintiaGameIcon } from "@/modules/admin/rutas/QuintiaGameIcon";

type Fuente = {
  id: string;
  nombre: string;
  hab: string;
  medidas?: string[];
  on?: boolean;
};

type Estado = {
  id: string;
  label: string;
  fg?: string;
  bg?: string;
  icon?: string;
};

type Hist = { v: number; cuando: string; cambio: string; quien: string };

type AnalizadorCfg = {
  version: number;
  partidas: number;
  dias: number;
  descarta: number;
  sens: string;
  plazo: number;
  estados?: Estado[];
  sugerencias?: string[];
  hist?: Hist[];
};

const SENS_DET: Record<string, string> = {
  Baja: "Avisa si el cambio se sostiene 4 semanas y sale claramente de su rango habitual.",
  Media: "Avisa si el cambio se sostiene 3 semanas y sale de su rango habitual.",
  Alta: "Avisa si el cambio se sostiene 2 semanas, aunque sea cerca del borde de su rango.",
};

const ESTADO_STYLE: Record<string, { fg: string; bg: string }> = {
  base: { fg: "#4F4868", bg: "#ECE9F2" },
  estable: { fg: "#24566A", bg: "#E1EDF1" },
  mejorando: { fg: "#2C6247", bg: "#E0EFE5" },
  cambio: { fg: "#6E4705", bg: "#FAE7BF" },
};

function EstadoIcon({ id }: { id: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 18 18",
    fill: "none" as const,
    "aria-hidden": true as const,
  };
  if (id === "base") {
    return (
      <svg {...common}>
        <circle
          cx="9"
          cy="9"
          r="6.25"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="3.2 2.4"
          strokeLinecap="round"
        />
        <circle cx="9" cy="9" r="2" fill="currentColor" opacity="0.45" />
      </svg>
    );
  }
  if (id === "estable") {
    return (
      <svg {...common}>
        <circle
          cx="9"
          cy="9"
          r="6.25"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="9" cy="9" r="2.75" fill="currentColor" />
      </svg>
    );
  }
  if (id === "mejorando") {
    return (
      <svg {...common}>
        <path
          d="M4.5 12.5 9 5.5l4.5 7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.2 12.5h5.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
    );
  }
  if (id === "cambio") {
    return (
      <svg {...common}>
        <path
          d="M9 3.2 14.8 9 9 14.8 3.2 9 9 3.2Z"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        <path
          d="M9 6.4v3.2"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
        />
        <circle cx="9" cy="12" r="0.85" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="9" cy="9" r="2.5" fill="currentColor" />
    </svg>
  );
}

function Segment({
  opts,
  value,
  onChange,
}: {
  opts: (string | number)[];
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-2xl border border-linea bg-[#F3F0EA] p-1">
      {opts.map((o) => {
        const s = String(o);
        const sel = String(value) === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`h-9 min-w-10 rounded-xl px-3.5 font-texto text-[13px] transition-all duration-200 ${
              sel
                ? "bg-nara-tinta font-semibold text-white shadow-[0_4px_12px_rgba(20,47,60,0.18)]"
                : "bg-transparent font-medium text-nara-tinta/55 hover:bg-white/70 hover:text-nara-tinta"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex shrink-0 items-center gap-2.5 border-0 bg-transparent p-0 font-texto text-[13px] text-nara-tinta"
      aria-pressed={on}
    >
      <span
        className={`relative block h-[26px] w-11 rounded-full transition-colors duration-200 ${
          on ? "bg-[#31C6E6]" : "bg-[#CFC8BC]"
        }`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
            on ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </span>
      <span className={on ? "font-medium text-[#2C6247]" : "text-nara-tinta/45"}>
        {on ? "Alimenta" : "Pausado"}
      </span>
    </button>
  );
}

export function PathAnalizadorPanel({
  fuentes,
  cfg,
  onPrev,
  onSaveVersion,
}: {
  fuentes: Fuente[];
  cfg: AnalizadorCfg;
  onPrev?: () => void;
  /** Persiste borrador vN+1 y lo manda a aprobación clínica. */
  onSaveVersion?: (draft: {
    partidas: number;
    dias: number;
    descarta: number;
    sens: string;
    plazo: number;
    fuentes: Record<string, boolean>;
    sugerencias: string[];
  }) => void;
}) {
  const cfgPartidas = Number.isFinite(cfg.partidas) ? cfg.partidas : 10;
  const cfgDias = Number.isFinite(cfg.dias) ? cfg.dias : 14;
  const cfgDescarta = Number.isFinite(cfg.descarta) ? cfg.descarta : 3;
  const cfgSens = cfg.sens || "Media";
  const cfgPlazo = Number.isFinite(cfg.plazo) ? cfg.plazo : 7;
  const cfgSugs = cfg.sugerencias || [
    "Repetir la medición en 2 semanas",
    "Conversar en la próxima sesión",
    "Seguir observando",
    "Revisar la constancia con la persona",
  ];

  const [fuentesOn, setFuentesOn] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const f of fuentes) m[f.id] = f.on !== false;
    return m;
  });
  const [partidas, setPartidas] = useState(cfgPartidas);
  const [dias, setDias] = useState(cfgDias);
  const [descarta, setDescarta] = useState(cfgDescarta);
  const [sens, setSens] = useState(cfgSens);
  const [plazo, setPlazo] = useState(cfgPlazo);
  const [sugs, setSugs] = useState(() => cfgSugs);
  const [msg, setMsg] = useState("");

  // Tras aprobar en clínico + hidratar, cfg cambia: hay que refrescar el estado local.
  useEffect(() => {
    const m: Record<string, boolean> = {};
    for (const f of fuentes) m[f.id] = f.on !== false;
    setFuentesOn(m);
    setPartidas(cfgPartidas);
    setDias(cfgDias);
    setDescarta(cfgDescarta);
    setSens(cfgSens);
    setPlazo(cfgPlazo);
    setSugs(cfgSugs);
    setMsg("");
    // Solo cuando llega una versión / valores vigentes nuevos (no en cada tecla).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.version, cfgPartidas, cfgDias, cfgDescarta, cfgSens, cfgPlazo]);

  const dirty = useMemo(() => {
    const baseFuentes = Object.fromEntries(
      fuentes.map((f) => [f.id, f.on !== false]),
    );
    const fuentesChanged = fuentes.some(
      (f) => (fuentesOn[f.id] ?? true) !== baseFuentes[f.id],
    );
    return (
      fuentesChanged ||
      partidas !== cfgPartidas ||
      dias !== cfgDias ||
      descarta !== cfgDescarta ||
      sens !== cfgSens ||
      plazo !== cfgPlazo ||
      JSON.stringify(sugs) !== JSON.stringify(cfgSugs)
    );
  }, [
    fuentes,
    fuentesOn,
    partidas,
    dias,
    descarta,
    sens,
    plazo,
    sugs,
    cfgPartidas,
    cfgDias,
    cfgDescarta,
    cfgSens,
    cfgPlazo,
    cfgSugs,
  ]);

  const nOn = fuentes.filter((f) => fuentesOn[f.id] !== false).length;
  const version = cfg.version || 2;
  const hist = cfg.hist || [
    {
      v: 2,
      cuando: "Hace 1 mes",
      quien: "Marcela Ríos",
      cambio: "Sensibilidad: Alta → Media",
    },
    {
      v: 1,
      cuando: "Hace 4 meses",
      quien: "Marcela Ríos",
      cambio: "Versión inicial",
    },
  ];
  const estados = cfg.estados || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Intro */}
      <div className="rounded-2xl border border-[#D4CFE3] bg-gradient-to-br from-[#F7F5FA] to-white px-5 py-4">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#6A6385]">
          Analizador · v{version}
        </p>
        <p className="mt-1 font-titulos text-lg font-extrabold text-nara-tinta">
          Compara cada partida con la propia historia
        </p>
        <p className="mt-1 max-w-2xl font-texto text-sm leading-relaxed text-nara-tinta/55">
          No es una crisis: avisa al clínico cuando un cambio se sostiene fuera del
          rango habitual de la persona. {nOn} de {fuentes.length} juegos alimentan
          la lectura.
        </p>
      </div>

      {/* Fuentes */}
      <section className="overflow-hidden rounded-2xl border border-linea bg-white shadow-[0_1px_0_rgba(20,47,60,0.04)]">
        <header className="border-b border-linea/80 px-5 py-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
            Fuentes
          </p>
          <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
            Juegos que alimentan el analizador
          </p>
        </header>
        <ul className="m-0 flex list-none flex-col p-0">
          {fuentes.map((f, i) => {
            const on = fuentesOn[f.id] !== false;
            return (
              <li
                key={f.id}
                className={`flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-start ${
                  i ? "border-t border-linea/70" : ""
                } ${on ? "bg-white" : "bg-nara-crema/40"}`}
              >
                <div className="flex min-w-0 flex-1 gap-3.5">
                  <span className={on ? "opacity-100" : "opacity-45"}>
                    <QuintiaGameIcon kind={f.id} size={40} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-titulos text-[15px] font-extrabold text-nara-tinta">
                      {f.nombre}
                      <span className="ml-1.5 font-texto text-[13px] font-normal text-nara-tinta/50">
                        · {f.hab}
                      </span>
                    </p>
                    {(f.medidas || []).length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.medidas!.map((m) => (
                          <span
                            key={m}
                            className="rounded-md bg-nara-crema px-2 py-0.5 font-texto text-[11px] text-nara-tinta/65"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <Toggle
                  on={on}
                  onToggle={() => {
                    setFuentesOn((prev) => ({ ...prev, [f.id]: !on }));
                    setMsg("");
                  }}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Grid: línea base / sensibilidad / avisos / sugerencias */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-linea bg-white p-5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
            Línea base
          </p>
          <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
            Antes de leer cambios
          </p>
          <p className="mt-2 font-texto text-[13px] leading-relaxed text-nara-tinta/60">
            {partidas} partida{partidas === 1 ? "" : "s"} en al menos {dias} día
            {dias === 1 ? "" : "s"}
            {descarta === 0
              ? " · sin descartar partidas de aprendizaje."
              : ` · las ${descarta} primeras no cuentan (práctica / aprendizaje).`}
          </p>
          <div className="mt-4 flex flex-col gap-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-texto text-sm text-nara-tinta/70">
                Partidas necesarias
              </span>
              <Segment
                opts={[1, 6, 10, 15]}
                value={partidas}
                onChange={(v) => {
                  setPartidas(Number(v));
                  setMsg("");
                }}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-texto text-sm text-nara-tinta/70">
                Días como mínimo
              </span>
              <Segment
                opts={[1, 7, 14, 21]}
                value={dias}
                onChange={(v) => {
                  setDias(Number(v));
                  setMsg("");
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-texto text-sm text-nara-tinta/70">
                  Ignorar primeras (aprendizaje)
                </span>
                <Segment
                  opts={[0, 2, 3, 5]}
                  value={descarta}
                  onChange={(v) => {
                    setDescarta(Number(v));
                    setMsg("");
                  }}
                />
              </div>
              <p className="font-texto text-[12px] leading-snug text-nara-tinta/50">
                Las primeras partidas suelen ser de práctica. El analizador las
                salta y arma la línea base con las siguientes.{" "}
                <span className="font-medium text-nara-tinta/65">0 = no ignora ninguna.</span>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-linea bg-white p-5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
            Sensibilidad
          </p>
          <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
            Cuándo avisar
          </p>
          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-linea bg-[#F3F0EA] p-1">
            {(["Baja", "Media", "Alta"] as const).map((s) => {
              const sel = sens === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSens(s);
                    setMsg("");
                  }}
                  className={`h-10 rounded-xl font-texto text-sm transition-all duration-200 ${
                    sel
                      ? "bg-nara-tinta font-semibold text-white shadow-[0_4px_12px_rgba(20,47,60,0.18)]"
                      : "bg-transparent font-medium text-nara-tinta/55 hover:bg-white/70"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {(["Baja", "Media", "Alta"] as const).map((s) => (
              <div
                key={s}
                className={`rounded-xl px-3 py-2.5 transition-colors duration-200 ${
                  sens === s ? "bg-[#FAE7BF]/70" : "bg-transparent"
                }`}
              >
                <span className="font-texto text-[13px] font-bold text-nara-tinta">
                  {s}
                </span>
                <span className="mt-0.5 block font-texto text-[12px] leading-snug text-nara-tinta/60">
                  {SENS_DET[s]}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-linea bg-white p-5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
            Avisos
          </p>
          <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
            Destino y plazo
          </p>
          <p className="mt-2 font-texto text-sm text-nara-tinta/70">
            Llegan a:{" "}
            <span className="font-semibold text-nara-tinta">
              el clínico asignado
            </span>
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-texto text-sm text-nara-tinta/70">
              Plazo para revisarlos
            </span>
            <Segment
              opts={["3 días", "7 días", "14 días"]}
              value={`${plazo} días`}
              onChange={(v) => {
                setPlazo(parseInt(v, 10));
                setMsg("");
              }}
            />
          </div>
          <p className="mt-4 rounded-xl border border-linea bg-nara-crema/70 px-3.5 py-3 font-texto text-[13px] leading-relaxed text-nara-tinta/60">
            Los avisos del analizador no son crisis: no usan el rojo, ni la sala de
            crisis, ni el historial de crisis.
          </p>
        </section>

        <section className="rounded-2xl border border-linea bg-white p-5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
            Sugerencias
          </p>
          <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
            Frases para el clínico
          </p>
          <p className="mt-1 font-texto text-[13px] text-nara-tinta/50">
            El analizador puede proponerlas; quien decide es el clínico.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {sugs.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={t}
                  onChange={(e) => {
                    const next = sugs.slice();
                    next[i] = e.target.value;
                    setSugs(next);
                    setMsg("");
                  }}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-linea bg-nara-crema/50 px-3 font-texto text-sm text-nara-tinta outline-none transition focus:border-[#31C6E6] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSugs(sugs.filter((_, k) => k !== i));
                    setMsg("");
                  }}
                  className="h-10 shrink-0 rounded-xl border border-linea bg-white px-3 font-texto text-xs text-nara-tinta/50 transition hover:bg-nara-crema hover:text-nara-tinta"
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setSugs([...sugs, ""]);
                setMsg("");
              }}
              className="h-10 rounded-xl border border-dashed border-[#B9B0A2] bg-transparent font-texto text-[13px] text-[#0F2D3B] transition hover:border-[#31C6E6] hover:bg-[#E7F4EF]/40"
            >
              + Agregar sugerencia
            </button>
          </div>
        </section>
      </div>

      {/* Estados */}
      {estados.length ? (
        <section className="rounded-2xl border border-linea bg-white p-5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
            Estados
          </p>
          <p className="mt-0.5 font-titulos text-base font-extrabold text-nara-tinta">
            Lectura que ve el clínico
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {estados.map((e) => {
              const st = ESTADO_STYLE[e.id] || {
                fg: "#0F2D3B",
                bg: "#F7F5EF",
              };
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3"
                  style={{ background: e.bg || st.bg, color: e.fg || st.fg }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-[inset_0_0_0_1px_rgba(20,47,60,0.06)]">
                    <EstadoIcon id={e.id} />
                  </span>
                  <span className="font-texto text-sm font-semibold leading-snug">
                    {e.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Guardar + historial */}
      <section className="rounded-2xl border border-linea bg-nara-crema/50 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!dirty}
            onClick={() => {
              if (!dirty) return;
              onSaveVersion?.({
                partidas,
                dias,
                descarta,
                sens,
                plazo,
                fuentes: fuentesOn,
                sugerencias: sugs,
              });
              setMsg(
                `Versión ${version + 1} enviada a aprobación clínica. Sigue vigente la v${version} hasta que la clínica apruebe.`,
              );
            }}
            className={`h-11 rounded-xl px-5 font-texto text-sm font-semibold transition ${
              dirty
                ? "bg-[#31C6E6] text-white shadow-[0_6px_16px_rgba(43,138,116,0.28)] hover:brightness-105"
                : "cursor-default border border-linea bg-white text-nara-tinta/35"
            }`}
          >
            {dirty
              ? `Guardar como versión ${version + 1}`
              : "Sin cambios"}
          </button>
          {msg ? (
            <span className="font-texto text-[13px] text-[#2C6247]">{msg}</span>
          ) : dirty ? (
            <span className="font-texto text-[13px] text-[#8B4AD4]">
              Se creará una versión nueva
            </span>
          ) : null}
        </div>

        <p className="mb-3 mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-nara-tinta/45">
          Historial de versiones
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {hist.map((h, i) => (
            <li
              key={h.v}
              className={`rounded-xl border px-3.5 py-3 ${
                i === 0
                  ? "border-[#31C6E6]/30 bg-white"
                  : "border-transparent bg-white/60"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex h-6 items-center rounded-md px-2 font-mono text-[11px] font-semibold ${
                    i === 0
                      ? "bg-[#31C6E6] text-white"
                      : "bg-nara-tinta/8 text-nara-tinta/65"
                  }`}
                >
                  v{h.v}
                </span>
                {i === 0 ? (
                  <span className="font-texto text-[11px] font-medium text-[#31C6E6]">
                    Vigente
                  </span>
                ) : null}
                <span className="ml-auto font-texto text-[11px] text-nara-tinta/45">
                  {h.cuando}
                </span>
              </div>
              <p className="mt-1.5 font-texto text-[13px] text-nara-tinta/80">
                {h.cambio.replace(/->/g, "→")}
              </p>
              <p className="mt-0.5 font-texto text-[12px] text-nara-tinta/45">
                {h.quien}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-linea bg-white/95 p-4 shadow-[0_8px_24px_rgba(20,47,60,0.08)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-texto text-sm text-nara-tinta/55">
          {nOn} fuentes activas · sensibilidad {sens.toLowerCase()}
        </p>
        {onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="h-11 rounded-xl border border-linea bg-white px-4 font-texto text-sm text-nara-tinta transition hover:bg-nara-crema"
          >
            Anterior
          </button>
        ) : null}
      </div>
    </div>
  );
}
