import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true as const,
};

/** Iconos = Quintia-entrega `recursos/quintia-ui.js` (`cs-icono`). */

export function IconoFrutas({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#FFF1CC" />
      <circle cx="17" cy="28" r="9" fill="#FF7044" />
      <circle cx="31" cy="27" r="8" fill="#FFB50A" />
      <rect
        x="20"
        y="10"
        width="7"
        height="7"
        rx="2"
        transform="rotate(45 23.5 13.5)"
        fill="#21AECA"
      />
    </svg>
  );
}

export function IconoSimon({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#EEF0FF" />
      <rect x="9" y="9" width="14" height="14" rx="4" fill="#5164FF" />
      <rect x="25" y="9" width="14" height="14" rx="4" fill="#DA3088" />
      <rect x="9" y="25" width="14" height="14" rx="4" fill="#21AECA" />
      <rect x="25" y="25" width="14" height="14" rx="4" fill="#FFB50A" />
    </svg>
  );
}

export function IconoDuelo({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#F1ECF9" />
      <rect
        x="11"
        y="12"
        width="16"
        height="23"
        rx="3"
        transform="rotate(-12 19 23)"
        fill="#6C04C9"
      />
      <rect
        x="21"
        y="12"
        width="16"
        height="23"
        rx="3"
        transform="rotate(10 29 23)"
        fill="#FFFFFF"
        stroke="#0F2D3B"
        strokeWidth="2"
      />
      <circle cx="29" cy="24" r="3.5" fill="#DA3088" />
    </svg>
  );
}

export function IconoSudoku({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#0F2D3B" />
      <rect x="10" y="10" width="28" height="28" rx="3" fill="#FFFFFF" />
      <rect x="19" y="10" width="1.6" height="28" fill="#0F2D3B" />
      <rect x="28" y="10" width="1.6" height="28" fill="#0F2D3B" />
      <rect x="10" y="19" width="28" height="1.6" fill="#0F2D3B" />
      <rect x="10" y="28" width="28" height="1.6" fill="#0F2D3B" />
      <rect x="12.5" y="12.5" width="4" height="4" rx="1" fill="#61F0D2" />
      <rect x="31" y="31" width="4" height="4" rx="1" fill="#6C04C9" />
    </svg>
  );
}

export function IconoClinico({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#DFF7F2" />
      <circle cx="24" cy="18" r="7" fill="#0B6E62" />
      <rect x="12" y="28" width="24" height="12" rx="6" fill="#0B6E62" />
    </svg>
  );
}

export function IconoTejiva({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#F1ECF9" />
      <path
        d="M8.0 14.8 A18.5 18.5 0 0 1 15.3 7.7"
        fill="none"
        stroke="#21AECA"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M32.7 7.7 A18.5 18.5 0 0 1 40.0 14.8"
        fill="none"
        stroke="#5164FF"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M42.3 26.6 A18.5 18.5 0 0 1 38.2 35.9"
        fill="none"
        stroke="#FFB50A"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M30.3 41.4 A18.5 18.5 0 0 1 17.7 41.4"
        fill="none"
        stroke="#FF7044"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M9.8 35.9 A18.5 18.5 0 0 1 5.7 26.6"
        fill="none"
        stroke="#DA3088"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <ellipse
        cx="24"
        cy="22"
        rx="9.6"
        ry="10.8"
        fill="#FFFDF7"
        stroke="#0F2D3B"
        strokeOpacity=".12"
      />
      <circle cx="20.6" cy="20.6" r="1.4" fill="#0F2D3B" />
      <circle cx="27.4" cy="20.6" r="1.4" fill="#0F2D3B" />
      <path
        d="M20.4 24.6 Q24 27.6 27.6 24.6"
        fill="none"
        stroke="#0F2D3B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="16" y="28.6" width="16" height="7.6" rx="3.8" fill="#0F2D3B" />
      <circle cx="20.4" cy="32.4" r="1.1" fill="#FFFFFF" />
      <circle cx="24" cy="32.4" r="1.1" fill="#FFFFFF" />
      <circle cx="27.6" cy="32.4" r="1.1" fill="#FFFFFF" />
    </svg>
  );
}

export function IconoResumen({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#F1ECF9" />
      <rect
        x="11"
        y="12"
        width="26"
        height="24"
        rx="4"
        fill="#FFFFFF"
        stroke="#6C04C9"
        strokeWidth="2"
      />
      <rect x="15" y="18" width="18" height="2.6" rx="1.3" fill="#6C04C9" />
      <rect x="15" y="23" width="14" height="2.6" rx="1.3" fill="#6C04C9" />
      <rect x="15" y="28" width="10" height="2.6" rx="1.3" fill="#61F0D2" />
    </svg>
  );
}

/** Ánimo · cara sonriente (nav paciente). */
export function IconoAnimo({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#E4F7FB" />
      <circle cx="24" cy="24" r="14" fill="#31C6E6" />
      <circle cx="19" cy="21" r="1.8" fill="#0F2D3B" />
      <circle cx="29" cy="21" r="1.8" fill="#0F2D3B" />
      <path
        d="M17.5 27.5c2.2 3.2 5.4 4.8 6.5 4.8s4.3-1.6 6.5-4.8"
        stroke="#0F2D3B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconoAnalizador({ className, ...rest }: IconProps) {
  return (
    <svg {...base} className={className} {...rest}>
      <rect width="48" height="48" rx="12" fill="#ECE9F2" />
      <rect x="9" y="20" width="30" height="10" rx="2" fill="#D4CFE3" />
      <polyline
        points="10,30 18,24 25,27 32,18 38,20"
        fill="none"
        stroke="#4F4868"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="20" r="2.8" fill="#4F4868" />
    </svg>
  );
}

const BY_KIND: Record<string, (p: IconProps) => ReactElement> = {
  frutas: IconoFrutas,
  simon: IconoSimon,
  duelo: IconoDuelo,
  sudoku: IconoSudoku,
  clinico: IconoClinico,
  clin: IconoClinico,
  tejiva: IconoTejiva,
  ia: IconoTejiva,
  resumen: IconoResumen,
  mood: IconoAnimo,
  animo: IconoAnimo,
  juegos: IconoSimon,
  analizador: IconoAnalizador,
};

export function QuintiaIcono({
  kind,
  className,
  ...rest
}: IconProps & { kind: string }) {
  const Comp = BY_KIND[kind];
  if (!Comp) return null;
  return <Comp className={className} {...rest} />;
}

export function hasQuintiaIcono(kind: string) {
  return kind in BY_KIND;
}
