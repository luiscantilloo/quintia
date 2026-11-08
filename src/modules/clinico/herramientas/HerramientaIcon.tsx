import type { SVGProps } from "react";
import {
  QuintiaIcono,
  hasQuintiaIcono,
} from "@/components/shared/brand/QuintiaIconos";

type Props = SVGProps<SVGSVGElement> & {
  id: string;
  className?: string;
};

const LEGACY = new Set(["tech", "revisit", "cursos"]);

/**
 * Iconos de herramientas. Paciente/nav = Quintia-entrega `cs-icono`.
 * tech / revisit / cursos conservan glifos legacy del clínico.
 */
export function HerramientaIcon({ id, className = "h-10 w-10", ...rest }: Props) {
  if (hasQuintiaIcono(id)) {
    return <QuintiaIcono kind={id} className={className} {...rest} />;
  }

  const common = {
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
    className,
    ...rest,
  };

  if (id === "tech") {
    return (
      <svg {...common}>
        <rect width="64" height="64" rx="16" fill="#EEF3FB" />
        <rect x="18" y="12" width="28" height="40" rx="6" fill="#436FD2" />
        <rect x="22" y="18" width="20" height="26" rx="2" fill="#F7F5EF" />
        <circle cx="32" cy="48" r="2.2" fill="#61F0D2" />
      </svg>
    );
  }
  if (id === "revisit") {
    return (
      <svg {...common}>
        <rect width="64" height="64" rx="16" fill="#FBEFE8" />
        <path
          d="M20 30a12 12 0 1 1 3.5 8.5"
          stroke="#C27241"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M18 22v10h10"
          stroke="#C27241"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="32" r="3.2" fill="#0F2D3B" />
      </svg>
    );
  }
  if (id === "cursos") {
    return (
      <svg {...common}>
        <rect width="64" height="64" rx="16" fill="#EEF3FB" />
        <path d="M12 20l20-6 20 6v24l-20 6-20-6V20z" fill="#436FD2" />
        <path d="M32 14v36" stroke="#61F0D2" strokeWidth="2.5" />
        <path
          d="M18 26h10M18 32h10M18 38h8"
          stroke="#F7F5EF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M36 26h10M36 32h10M36 38h8"
          stroke="#F7F5EF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return null;
}

export function hasHerramientaIcon(id: string): boolean {
  return hasQuintiaIcono(id) || LEGACY.has(id);
}
