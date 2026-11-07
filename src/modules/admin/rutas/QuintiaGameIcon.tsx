import type { ReactNode } from "react";

/** Iconos de juegos del prototipo Consciente / QUINTIA (cs-icono). */
const ICONS: Record<string, ReactNode> = {
  frutas: (
    <>
      <rect width="48" height="48" rx="12" fill="#FBEBC8" />
      <circle cx="17" cy="28" r="9" fill="#D9573F" />
      <circle cx="31" cy="27" r="8" fill="#EE9A2E" />
      <rect
        x="20"
        y="10"
        width="7"
        height="7"
        rx="2"
        transform="rotate(45 23.5 13.5)"
        fill="#3E8C60"
      />
    </>
  ),
  simon: (
    <>
      <rect width="48" height="48" rx="12" fill="#E1EDF1" />
      <rect x="9" y="9" width="14" height="14" rx="4" fill="#D9573F" />
      <rect x="25" y="9" width="14" height="14" rx="4" fill="#3A73AE" />
      <rect x="9" y="25" width="14" height="14" rx="4" fill="#3E8C60" />
      <rect x="25" y="25" width="14" height="14" rx="4" fill="#61F0D2" />
    </>
  ),
  duelo: (
    <>
      <rect width="48" height="48" rx="12" fill="#ECE9F2" />
      <rect
        x="11"
        y="12"
        width="16"
        height="23"
        rx="3"
        transform="rotate(-12 19 23)"
        fill="#3A73AE"
      />
      <rect
        x="21"
        y="12"
        width="16"
        height="23"
        rx="3"
        transform="rotate(10 29 23)"
        fill="#F7F5EF"
        stroke="#0F2D3B"
        strokeWidth="2"
      />
      <circle cx="29" cy="24" r="3.5" fill="#D9573F" />
    </>
  ),
  sudoku: (
    <>
      <rect width="48" height="48" rx="12" fill="#0F2D3B" />
      <rect x="10" y="10" width="28" height="28" rx="3" fill="#F7F5EF" />
      <rect x="19" y="10" width="1.6" height="28" fill="#0F2D3B" />
      <rect x="28" y="10" width="1.6" height="28" fill="#0F2D3B" />
      <rect x="10" y="19" width="28" height="1.6" fill="#0F2D3B" />
      <rect x="10" y="28" width="28" height="1.6" fill="#0F2D3B" />
      <rect x="12.5" y="12.5" width="4" height="4" rx="1" fill="#61F0D2" />
      <rect x="31" y="31" width="4" height="4" rx="1" fill="#D9573F" />
    </>
  ),
};

export function QuintiaGameIcon({
  kind,
  size = 40,
  className,
}: {
  kind: string;
  size?: number;
  className?: string;
}) {
  const inner = ICONS[kind] || ICONS.frutas;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-hidden
      style={{ display: "block", flex: "none" }}
    >
      {inner}
    </svg>
  );
}
