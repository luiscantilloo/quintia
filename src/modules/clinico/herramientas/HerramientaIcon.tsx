import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  id: string;
  className?: string;
};

/** Iconos de herramientas en SVG inline (evita caché immutable de /public). */
export function HerramientaIcon({ id, className = "h-10 w-10", ...rest }: Props) {
  const common = {
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
    className,
    ...rest,
  };

  switch (id) {
    case "mood":
      return (
        <svg {...common}>
          <rect width="64" height="64" rx="16" fill="#E4F7FB" />
          <circle cx="32" cy="32" r="18" fill="#31C6E6" />
          <circle cx="25.5" cy="28.5" r="2.4" fill="#0F2D3B" />
          <circle cx="38.5" cy="28.5" r="2.4" fill="#0F2D3B" />
          <path
            d="M23 36.5c2.8 4.2 7 6.5 9 6.5s6.2-2.3 9-6.5"
            stroke="#0F2D3B"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "clin":
      return (
        <svg {...common}>
          {/* Referencia marca: silueta persona sobre menta */}
          <rect width="64" height="64" rx="14" fill="#E5F2E9" />
          <circle cx="32" cy="22" r="9" fill="#2D5A43" />
          <rect x="14" y="34" width="36" height="18" rx="9" fill="#2D5A43" />
        </svg>
      );
    case "ia":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hia" x1="16" y1="16" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#61F0D2" />
              <stop offset="0.45" stopColor="#31C6E6" />
              <stop offset="1" stopColor="#6C04C9" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="#F1E8FB" />
          <circle cx="30" cy="30" r="14" stroke="url(#hia)" strokeWidth="4.5" />
          <circle cx="30" cy="24.5" r="3" fill="#0F2D3B" />
          <path
            d="M23.5 32.5c1.5 5 6.5 7.5 11.5 5.2 1.3-.6 2.4-1.1 3.9.2L48 48"
            stroke="#0F2D3B"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "juegos":
      return (
        <svg {...common}>
          <rect width="64" height="64" rx="16" fill="#FFF4E8" />
          <rect x="12" y="12" width="18" height="18" rx="5" fill="#DA9E46" />
          <rect x="34" y="12" width="18" height="18" rx="5" fill="#436FD2" />
          <rect x="12" y="34" width="18" height="18" rx="5" fill="#2B8A74" />
          <rect x="34" y="34" width="18" height="18" rx="5" fill="#C27241" />
          <circle cx="21" cy="21" r="3" fill="#F7F5EF" />
          <circle cx="43" cy="21" r="3" fill="#F7F5EF" />
          <circle cx="21" cy="43" r="3" fill="#F7F5EF" />
          <circle cx="43" cy="43" r="3" fill="#F7F5EF" />
        </svg>
      );
    case "tech":
      return (
        <svg {...common}>
          <rect width="64" height="64" rx="16" fill="#EEF3FB" />
          <rect x="18" y="12" width="28" height="40" rx="6" fill="#436FD2" />
          <rect x="22" y="18" width="20" height="26" rx="2" fill="#F7F5EF" />
          <circle cx="32" cy="48" r="2.2" fill="#61F0D2" />
        </svg>
      );
    case "revisit":
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
    case "cursos":
      return (
        <svg {...common}>
          <rect width="64" height="64" rx="16" fill="#EEF3FB" />
          <path d="M12 20l20-6 20 6v24l-20 6-20-6V20z" fill="#436FD2" />
          <path d="M32 14v36" stroke="#61F0D2" strokeWidth="2.5" />
          <path d="M18 26h10M18 32h10M18 38h8" stroke="#F7F5EF" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 26h10M36 32h10M36 38h8" stroke="#F7F5EF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function hasHerramientaIcon(id: string): boolean {
  return ["mood", "clin", "ia", "juegos", "tech", "revisit", "cursos"].includes(id);
}
