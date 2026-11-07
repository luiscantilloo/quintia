"use client";

import type { InputHTMLAttributes } from "react";

function ColombiaFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="24" height="8" y="0" fill="#FCD116" />
      <rect width="24" height="4" y="8" fill="#003893" />
      <rect width="24" height="4" y="12" fill="#CE1126" />
    </svg>
  );
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Campo de teléfono Colombia: bandera +57 + número. */
export function PhoneInput({ className = "", ...props }: Props) {
  return (
    <div
      className={`box-border flex h-14 w-full min-w-0 items-center gap-2 rounded-2xl border border-transparent bg-white/90 px-4 shadow-[inset_0_0_0_1px_rgba(15,45,59,0.1)] transition duration-200 focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_#31C6E6,0_10px_28px_rgba(49,198,230,0.18)] ${className}`}
    >
      <ColombiaFlag className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]" />
      <span className="shrink-0 select-none font-texto text-[15px] text-texto-secundario">
        +57
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className="h-full min-w-0 flex-1 border-none bg-transparent p-0 font-texto text-[16px] text-nara-tinta outline-none ring-0"
        {...props}
      />
    </div>
  );
}
