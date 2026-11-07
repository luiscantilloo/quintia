"use client";

import { useEffect, useState } from "react";
import { landingAssets } from "./assets";
import { IngresarCta, LandingFooter, LandingHeader } from "./LandingChrome";

const FUERZAS = [
  {
    id: "01",
    name: "Explorar",
    dim: "Cognitiva",
    line: "Toda idea es una posibilidad.",
    detail: "Memoria, atención, lenguaje, orientación y funciones ejecutivas.",
    bar: "bg-pl-explorar",
  },
  {
    id: "02",
    name: "Sentir",
    dim: "Sensorial",
    line: "El mundo todavía tiene mucho por descubrir.",
    detail: "Percepción visual, auditiva, táctil, olfativa y propioceptiva.",
    bar: "bg-pl-sentir",
  },
  {
    id: "03",
    name: "Moverse",
    dim: "Funcional y física",
    line: "Cada movimiento cuenta.",
    detail: "Movilidad, coordinación, equilibrio y actividades de la vida cotidiana.",
    bar: "bg-pl-moverse",
  },
  {
    id: "04",
    name: "Conectar",
    dim: "Psicosocial",
    line: "La vida también sucede entre nosotros.",
    detail: "Emociones, autoestima, vínculos y participación.",
    bar: "bg-pl-conectar",
  },
  {
    id: "05",
    name: "Acompañar",
    dim: "Cuidado",
    line: "Cuidar también es crear posibilidades.",
    detail: "Cuidadores, formación, autocuidado y continuidad de las experiencias.",
    bar: "bg-pl-acompanar",
  },
] as const;

const EXPERIENCIAS = [
  {
    n: "01",
    label: "Espacios",
    title: "Salas multisensoriales",
    detail: "Ambientes físicos para explorar y sentir con calma.",
    accent: "bg-pl-explorar",
    glow: "rgba(108,4,201,0.4)",
    img: landingAssets.canal1Jpg,
  },
  {
    n: "02",
    label: "Estaciones",
    title: "Cabinas tecnológicas",
    detail: "Puntos de experiencia con rigor y accesibilidad.",
    accent: "bg-pl-sentir",
    glow: "rgba(49,198,230,0.4)",
    img: landingAssets.canal2Jpg,
  },
  {
    n: "03",
    label: "Explora",
    title: "Juegos interactivos",
    detail: "Estimulación integral con propósito, no pasividad.",
    accent: "bg-pl-moverse",
    glow: "rgba(97,240,210,0.4)",
    img: landingAssets.canal3Jpg,
  },
  {
    n: "04",
    label: "Gestión",
    title: "Plataforma de acompañamiento",
    detail: "Rutas, equipo clínico y seguimiento en territorio.",
    accent: "bg-pl-conectar",
    glow: "rgba(139,74,212,0.4)",
    img: landingAssets.heroJpg,
  },
] as const;

const ADN = [
  { n: "01", t: "Humanidad", d: "La persona es protagonista; la tecnología, el medio." },
  { n: "02", t: "Ciencia aplicada", d: "Innovación validable, confiable y útil." },
  { n: "03", t: "Autonomía", d: "Decisiones, capacidades y ritmos propios." },
  { n: "04", t: "Conexión territorial", d: "Instituciones, cuidadores y comunidades." },
  { n: "05", t: "Exploración", d: "Experiencias significativas, no pasividad." },
] as const;

const TEJIVA_MOODS = [
  { id: "base", label: "Base", src: landingAssets.tejiva.base },
  { id: "escucha", label: "Escucha", src: landingAssets.tejiva.escucha },
  { id: "piensa", label: "Piensa", src: landingAssets.tejiva.piensa },
  { id: "responde", label: "Responde", src: landingAssets.tejiva.responde },
  { id: "celebra", label: "Celebra", src: landingAssets.tejiva.celebra },
] as const;

function ForceOrbit({ className = "" }: { className?: string }) {
  return (
    <img
      src={landingAssets.simbolo}
      alt=""
      aria-hidden
      className={`motion-safe:animate-[pl-pulse_8s_ease-in-out_infinite] ${className}`}
    />
  );
}

export function LandingScreen() {
  const [mood, setMood] = useState<(typeof TEJIVA_MOODS)[number]["id"]>("base");
  const activeMood = TEJIVA_MOODS.find((m) => m.id === mood) ?? TEJIVA_MOODS[0];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.style.scrollSnapType = "y mandatory";
    root.style.scrollBehavior = reduce ? "auto" : "smooth";

    const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    let io: IntersectionObserver | undefined;

    if (!reduce && "IntersectionObserver" in window) {
      reveals.forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(18px)";
        el.style.transition = "opacity .8s ease, transform .8s ease";
        el.style.transitionDelay = `${el.dataset.delay || 0}ms`;
      });
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            const t = e.target as HTMLElement;
            if (!e.isIntersecting) {
              t.style.opacity = "0";
              t.style.transform = "translateY(22px)";
              return;
            }
            t.style.opacity = "1";
            t.style.transform = "none";
          });
        },
        { threshold: 0.1 },
      );
      reveals.forEach((el) => io!.observe(el));
    }

    return () => {
      io?.disconnect();
      root.style.scrollSnapType = "";
      root.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="min-h-svh overflow-x-clip bg-pl-hueso font-texto text-pl-tinta">
      <LandingHeader />

      <main>
        {/* 01 Hero — marca primero */}
        <section
          id="inicio"
          className="relative flex min-h-svh snap-start snap-always flex-col justify-end overflow-hidden bg-pl-verde-raiz px-[clamp(16px,6vw,96px)] pb-16 pt-[120px]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 55% at 78% 28%, rgba(108,4,201,0.4) 0%, transparent 55%), radial-gradient(ellipse 55% 50% at 18% 70%, rgba(49,198,230,0.35) 0%, transparent 50%), radial-gradient(ellipse 40% 40% at 62% 88%, rgba(97,240,210,0.28) 0%, transparent 55%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[8%] top-[18%] h-[min(52vw,420px)] w-[min(52vw,420px)] opacity-80"
          >
            <ForceOrbit className="h-full w-full" />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-full"
            style={{
              background:
                "linear-gradient(90deg, #61F0D2 0%, #31C6E6 45%, #6C04C9 100%)",
            }}
          />

          <div data-reveal="" className="relative z-10 flex max-w-[720px] flex-col gap-5">
            <p className="flex items-center gap-4 font-titulos text-[clamp(48px,9vw,88px)] font-extrabold leading-none tracking-[-0.03em] text-pl-hueso">
              <svg
                width={72}
                height={72}
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden
                className="h-[clamp(40px,7vw,72px)] w-[clamp(40px,7vw,72px)] shrink-0"
              >
                <defs>
                  <linearGradient id="heroQ" x1="8" y1="6" x2="40" y2="42">
                    <stop stopColor="#61F0D2" />
                    <stop offset="0.45" stopColor="#31C6E6" />
                    <stop offset="1" stopColor="#6C04C9" />
                  </linearGradient>
                </defs>
                <circle
                  cx="22.5"
                  cy="21.5"
                  r="13.5"
                  stroke="url(#heroQ)"
                  strokeWidth="5.2"
                />
                <circle cx="22.5" cy="15.2" r="3.1" fill="#F7F5EF" />
                <path
                  d="M16.2 23.2c1.6 5.4 7.2 8.2 12.4 5.6 1.4-.7 2.6-1.2 4.2.2L39 38.5"
                  stroke="#F7F5EF"
                  strokeWidth="4.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Quintia
            </p>
            <h1 className="text-balance font-titulos text-[clamp(26px,4.2vw,44px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-pl-hueso">
              Una marca para las posibilidades de la vida.
            </h1>
            <p className="max-w-[34rem] text-pretty font-texto text-[clamp(16px,1.7vw,19px)] leading-[1.5] text-pl-menta">
              Cinco fuerzas. Infinitas posibilidades. Del déficit a la posibilidad:
              capacidades, experiencias y acompañamiento con rigor.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <IngresarCta />
              <a
                href="#fuerzas"
                className="inline-flex min-h-14 items-center rounded-md border-2 border-pl-menta/70 bg-transparent px-6 font-texto text-[18px] font-bold !text-pl-menta transition hover:bg-pl-menta hover:!text-pl-verde-raiz"
              >
                Las cinco fuerzas
              </a>
            </div>
          </div>
        </section>

        {/* 02 Tesis */}
        <section className="relative flex min-h-svh snap-start snap-always items-center overflow-hidden bg-pl-menta px-[clamp(16px,6vw,96px)] pb-16 pt-[110px]">
          <div className="relative z-10 mx-auto grid w-full max-w-[1100px] gap-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
            <div data-reveal="" className="relative mx-auto w-full max-w-[280px]">
              <div className="absolute -inset-8 rounded-full bg-pl-hueso/80 blur-2xl" />
              <ForceOrbit className="relative w-full" />
            </div>
            <div data-reveal="" className="flex flex-col gap-5">
              <p className="font-mono text-sm font-medium uppercase tracking-[0.16em] text-pl-comunidad">
                Del déficit a la posibilidad
              </p>
              <h2 className="text-balance font-titulos text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.12] text-pl-verde-raiz">
                No una marca para la vejez. Una marca para lo que es posible.
              </h2>
              <p className="text-pretty font-texto text-[clamp(17px,1.8vw,21px)] leading-[1.55] text-pl-verde-raiz/80">
                Mantenemos el rigor clínico y científico, pero comunicamos desde la dignidad y la
                participación: capacidades, experiencias y posibilidades.
              </p>
              <p className="font-mono text-[14px] leading-snug text-pl-verde-raiz/70">
                El bienestar se construye en conexión.
              </p>
            </div>
          </div>
        </section>

        {/* 03 Cinco fuerzas */}
        <section
          id="fuerzas"
          className="flex min-h-svh snap-start snap-always flex-col justify-center gap-10 bg-pl-hueso px-[clamp(16px,5vw,80px)] py-24"
        >
          <div data-reveal="" className="mx-auto max-w-[42rem] text-center">
            <p className="font-mono text-sm font-medium uppercase tracking-[0.16em] text-pl-comunidad">
              Sistema vivo
            </p>
            <h2 className="mt-3 text-balance font-titulos text-[clamp(28px,4.2vw,46px)] font-extrabold leading-[1.12] text-pl-verde-raiz">
              Cinco fuerzas. Un solo sistema.
            </h2>
            <p className="mt-3 font-texto text-[18px] leading-snug text-pl-texto2">
              No son cinco partes sueltas: el valor aparece en la interacción.
            </p>
          </div>
          <div className="mx-auto grid w-full max-w-[1200px] gap-3 md:grid-cols-5">
            {FUERZAS.map((f, i) => (
              <article
                key={f.id}
                data-reveal=""
                data-delay={String(i * 80)}
                className="flex min-h-[260px] flex-col overflow-hidden rounded-[22px] bg-white"
              >
                <div className={`h-2 w-full ${f.bar}`} />
                <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                  <div>
                    <p className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-pl-texto2">
                      {f.id} · {f.dim}
                    </p>
                    <p className="mt-2 font-titulos text-[22px] font-extrabold leading-none text-pl-verde-raiz">
                      {f.name}
                    </p>
                  </div>
                  <div>
                    <p className="font-titulos text-[16px] font-bold leading-snug text-pl-verde-raiz">
                      {f.line}
                    </p>
                    <p className="mt-2 font-mono text-[12px] leading-snug text-pl-texto2">{f.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 04 Ecosistema — bento editorial */}
        <section className="relative flex min-h-svh snap-start snap-always flex-col justify-center overflow-hidden bg-pl-verde-raiz px-[clamp(16px,5vw,80px)] py-24 text-pl-hueso">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 55% 45% at 12% 20%, rgba(67,111,210,0.28) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 88% 75%, rgba(43,138,116,0.32) 0%, transparent 50%), radial-gradient(ellipse 40% 35% at 70% 15%, rgba(218,158,70,0.18) 0%, transparent 55%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col gap-12">
            <div
              data-reveal=""
              className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-end"
            >
              <div className="flex flex-col gap-4">
                <p className="font-mono text-sm font-medium uppercase tracking-[0.16em] text-pl-ciencia">
                  Un ecosistema, no un producto
                </p>
                <h2 className="text-balance font-titulos text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.08] tracking-[-0.02em]">
                  Cuatro experiencias.
                  <span className="mt-1 block text-pl-comunidad">Una identidad.</span>
                </h2>
              </div>
              <p className="max-w-[28rem] text-pretty font-mono text-[15px] leading-snug text-pl-menta/90 md:justify-self-end md:text-right">
                Del territorio a la plataforma: salas, cabinas, juegos y acompañamiento bajo la
                misma marca QUINTIA.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
              {EXPERIENCIAS.map((e, i) => {
                const featured = i === 0;
                return (
                  <article
                    key={e.label}
                    data-reveal=""
                    data-delay={String(i * 100)}
                    className={`group relative overflow-hidden rounded-[28px] border border-pl-hueso/10 ${
                      featured
                        ? "min-h-[340px] lg:col-span-7 lg:row-span-2 lg:min-h-[520px]"
                        : "min-h-[200px] lg:col-span-5"
                    }`}
                  >
                    <img
                      src={e.img}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.05] transition duration-700 ease-out group-hover:scale-105 group-hover:grayscale-[40%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pl-verde-raiz via-pl-verde-raiz/75 to-pl-verde-raiz/25" />
                    <div
                      aria-hidden
                      className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-100"
                      style={{ background: e.glow }}
                    />
                    <div className={`absolute left-0 top-0 h-full w-1.5 ${e.accent}`} />

                    <div
                      className={`relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 ${
                        featured ? "sm:p-10" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-mono text-[13px] font-medium uppercase tracking-[0.18em] text-pl-menta">
                          QUINTIA · {e.label}
                        </span>
                        <span
                          className={`font-titulos font-extrabold leading-none text-pl-hueso/25 ${
                            featured ? "text-[72px]" : "text-[40px]"
                          }`}
                        >
                          {e.n}
                        </span>
                      </div>
                      <div className="max-w-[28rem]">
                        <div className={`mb-4 h-1 w-12 rounded-full ${e.accent}`} />
                        <h3
                          className={`font-titulos font-extrabold leading-[1.12] tracking-[-0.02em] ${
                            featured
                              ? "text-[clamp(28px,3.5vw,40px)]"
                              : "text-[clamp(22px,2.2vw,28px)]"
                          }`}
                        >
                          {e.title}
                        </h3>
                        <p
                          className={`mt-3 font-mono leading-snug text-pl-menta ${
                            featured ? "text-[16px]" : "text-[14px]"
                          }`}
                        >
                          {e.detail}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 05 Fotografía atmósfera */}
        <section className="relative flex min-h-svh snap-start snap-always items-center overflow-hidden bg-pl-verde-raiz">
          <div className="absolute inset-0">
            <img
              src={landingAssets.canal1Jpg}
              alt=""
              className="h-full w-full scale-105 object-cover grayscale contrast-[1.05] motion-safe:animate-[pl-drift_28s_ease-in-out_infinite_alternate]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-pl-verde-raiz/55 via-pl-verde-raiz/35 to-pl-verde-raiz/85" />
          </div>
          <div
            data-reveal=""
            className="relative z-10 mx-auto flex min-h-svh w-full max-w-[42rem] flex-col items-center justify-center px-[clamp(16px,6vw,96px)] py-28 text-center"
          >
            <p className="font-mono text-sm font-medium uppercase tracking-[0.16em] text-pl-explorar">
              Persona en el centro
            </p>
            <h2 className="mt-3 text-balance font-titulos text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.12] text-pl-hueso">
              La tecnología conecta las fuerzas. Nunca sustituye el protagonismo humano.
            </h2>
          </div>
        </section>

        {/* 06 TEJIVA */}
        <section
          id="tejiva"
          className="flex min-h-svh snap-start snap-always items-center bg-pl-conectar px-[clamp(16px,6vw,96px)] py-24 text-pl-hueso"
        >
          <div className="mx-auto grid w-full max-w-[1100px] gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div data-reveal="" className="flex flex-col gap-5">
              <p className="font-mono text-sm font-medium uppercase tracking-[0.16em] text-pl-menta">
                TEJIVA · tejer + vida
              </p>
              <h2 className="text-balance font-titulos text-[clamp(32px,4.5vw,50px)] font-extrabold leading-[1.1]">
                Hola, soy TEJIVA.
              </h2>
              <p className="max-w-[36rem] text-pretty font-texto text-[20px] leading-[1.55] text-pl-menta">
                La voz humana de QUINTIA. Acompaña, explica y conecta con empatía: cercana, clara y
                profesional — sin frialdad clínica.
              </p>

              <div className="mt-2 flex flex-wrap items-end gap-4">
                <div className="flex h-28 w-28 items-center justify-center rounded-[22px] border border-pl-hueso/25 bg-pl-verde-raiz/35">
                  <img
                    key={activeMood.id}
                    src={activeMood.src}
                    alt={`TEJIVA · ${activeMood.label}`}
                    className="h-[78%] w-[78%] object-contain"
                  />
                </div>
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Estados de TEJIVA">
                  {TEJIVA_MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="tab"
                      aria-selected={mood === m.id}
                      onClick={() => setMood(m.id)}
                      className={`min-h-11 rounded-md px-3.5 font-mono text-sm font-medium transition ${
                        mood === m.id
                          ? "bg-pl-hueso text-pl-comunidad"
                          : "bg-pl-hueso/10 text-pl-menta hover:bg-pl-hueso/20"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div data-reveal="" className="mx-auto w-full max-w-[340px]">
              <div className="overflow-hidden rounded-[32px] border-[3px] border-pl-hueso/25 bg-pl-hueso text-pl-verde-raiz shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-3 border-b border-pl-linea bg-pl-menta px-4 py-3">
                  <img src={landingAssets.tejiva.base} alt="" className="h-10 w-10" />
                  <div>
                    <p className="font-titulos text-[15px] font-bold leading-none">TEJIVA</p>
                    <p className="mt-1 font-mono text-[11px] text-pl-texto2">asistente de QUINTIA</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 px-4 py-4 font-texto text-[15px] leading-snug">
                  <div className="max-w-[90%] rounded-[4px_16px_16px_16px] bg-pl-menta px-3.5 py-2.5">
                    ¡Hola don Mario, ¿qué tal se siente hoy?
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-[16px_4px_16px_16px] bg-white px-3.5 py-2.5">
                    Bien. ¿Qué juego toca hoy?
                  </div>
                  <div className="max-w-[92%] rounded-[4px_16px_16px_16px] bg-pl-menta px-3.5 py-2.5">
                    ¡Lo hizo muy bien! Ahora vamos al siguiente paso.
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-pl-conectar px-3.5 py-2 font-mono text-[12px] font-medium text-pl-hueso">
                      Seguir
                    </span>
                    <span className="rounded-full border border-pl-verde-raiz/30 px-3.5 py-2 font-mono text-[12px] text-pl-verde-raiz">
                      Hablar con alguien
                    </span>
                  </div>
                </div>
                <div className="border-t border-pl-linea bg-pl-hueso px-4 py-3">
                  <p className="rounded-full bg-pl-menta/70 px-4 py-2.5 font-mono text-[13px] text-pl-texto2">
                    Escriba aquí…
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 07 ADN */}
        <section className="flex min-h-svh snap-start snap-always flex-col justify-center gap-10 bg-pl-hueso px-[clamp(16px,5vw,80px)] py-24">
          <div data-reveal="" className="mx-auto max-w-[36rem] text-center">
            <p className="font-mono text-sm font-medium uppercase tracking-[0.16em] text-pl-comunidad">
              ADN de marca
            </p>
            <h2 className="mt-3 text-balance font-titulos text-[clamp(28px,4.2vw,46px)] font-extrabold leading-[1.12] text-pl-verde-raiz">
              Ciencia y confianza, sin perder calidez.
            </h2>
          </div>
          <ol className="mx-auto grid w-full max-w-[1100px] list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
            {ADN.map((a, i) => (
              <li
                key={a.n}
                data-reveal=""
                data-delay={String(i * 60)}
                className="flex min-h-[200px] flex-col gap-3 rounded-[22px] bg-pl-menta/70 px-5 py-5"
              >
                <span className="font-mono text-sm font-medium text-pl-comunidad">{a.n}</span>
                <span className="font-titulos text-[18px] font-extrabold leading-snug text-pl-verde-raiz">
                  {a.t}
                </span>
                <span className="font-mono text-[13px] leading-snug text-pl-texto2">{a.d}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 08 Cierre */}
        <section className="relative flex min-h-svh snap-start snap-always flex-col">
          <div className="relative flex flex-1 items-center overflow-hidden bg-pl-comunidad px-[clamp(16px,7vw,120px)] py-24">
            <ForceOrbit className="pointer-events-none absolute -right-10 top-8 h-[45%] w-[45%] opacity-35" />
            <div data-reveal="" className="relative z-10 flex max-w-[560px] flex-col gap-5">
              <h2 className="text-balance font-titulos text-[clamp(34px,5vw,54px)] font-extrabold leading-[1.08] text-pl-hueso">
                El bienestar se construye en conexión.
              </h2>
              <p className="text-pretty font-mono text-[clamp(15px,1.8vw,19px)] leading-[1.5] text-pl-hueso/85">
                Sus datos son suyos. Usted decide quién los ve. Ley 1581 de 2012.
              </p>
              <div className="pt-2">
                <IngresarCta tone="profundidad" />
              </div>
            </div>
          </div>
          <LandingFooter />
        </section>
      </main>
    </div>
  );
}
