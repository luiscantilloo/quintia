import Link from "next/link";

type Props = {
  /** `null` = solo marca, sin enlace (p. ej. dentro de un botón) */
  href?: string | null;
  tone?: "oscuro" | "claro";
  className?: string;
  /** Solo símbolo (sin texto), p. ej. topbar muy estrecho */
  markOnly?: boolean;
  /** Mostrar lema bajo el wordmark (lockup horizontal) */
  withTagline?: boolean;
  size?: number;
};

/** Símbolo QUINTIA: anillo en degradado + persona / i de IA en carbón. */
export function QuintiaMark({
  size = 36,
  mono = false,
  tone = "oscuro",
}: {
  size?: number;
  /** Una tinta (sin degradado) */
  mono?: boolean;
  tone?: "oscuro" | "claro";
}) {
  const gid = `q-ring-${size}-${mono ? "m" : "g"}-${tone}`;
  const person = tone === "claro" || mono ? (tone === "claro" ? "#F7F5EF" : "#0F2D3B") : "#332F32";
  const monoStroke = tone === "claro" ? "#F7F5EF" : "#0F2D3B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {!mono ? (
        <defs>
          <linearGradient id={gid} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#61F0D2" />
            <stop offset="0.45" stopColor="#31C6E6" />
            <stop offset="1" stopColor="#6C04C9" />
          </linearGradient>
        </defs>
      ) : null}
      {/* Anillo Q · el espacio que acoge */}
      <circle
        cx="22.5"
        cy="21.5"
        r="13.5"
        stroke={mono ? monoStroke : `url(#${gid})`}
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      {/* Persona / i de IA */}
      <circle cx="22.5" cy="15.2" r="3.1" fill={person} />
      <path
        d="M16.2 23.2c1.6 5.4 7.2 8.2 12.4 5.6 1.4-.7 2.6-1.2 4.2.2L39 38.5"
        stroke={person}
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Logo QUINTIA · Presentación de marca 2026. */
export function QuintiaLogo({
  href = "/inicio",
  tone = "oscuro",
  className = "",
  markOnly = false,
  withTagline = false,
  size = 36,
}: Props) {
  const text = tone === "claro" ? "text-[#F7F5EF]" : "text-[#0F2D3B]";
  const tag = tone === "claro" ? "text-[#F7F5EF]/70" : "text-[#0F2D3B]/55";
  const titleClass =
    size <= 24
      ? "font-titulos text-[17px] font-bold tracking-[-0.02em] sm:text-[18px]"
      : size <= 30
        ? "font-titulos text-[20px] font-bold tracking-[-0.02em] sm:text-[22px]"
        : "font-titulos text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]";
  const inner = (
    <span className={`inline-flex items-center gap-2.5 leading-none ${className}`}>
      <QuintiaMark size={size} tone={tone} />
      {markOnly ? (
        <span className="sr-only">Quintia</span>
      ) : (
        <span className={`flex min-w-0 flex-col gap-0.5 ${text}`}>
          <span className={titleClass}>
            Quintia
          </span>
          {withTagline ? (
            <span className={`font-texto text-[11px] font-medium tracking-[0.01em] ${tag}`}>
              Cinco fuerzas. Infinitas posibilidades.
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (href == null) return inner;
  return (
    <Link href={href} aria-label="Quintia, ir al inicio" className="flex shrink-0 items-center">
      {inner}
    </Link>
  );
}
