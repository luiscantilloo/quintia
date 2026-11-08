"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BRAND } from "@/lib/brand";
import { QuintiaMark } from "@/components/shared/brand/QuintiaLogo";

/**
 * Carga a pantalla completa · marfil Quintia (mismo tono que el shell).
 * Portal a body para cubrir topbar, shell y cualquier stacking context.
 */
export function NaraLoadingScreen({
  className = "",
}: {
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const node = (
    <div
      role="status"
      aria-busy="true"
      aria-label={`Cargando ${BRAND.name}`}
      className={`fixed inset-0 z-[99999] grid h-dvh min-h-full w-screen min-w-full place-items-center overflow-hidden bg-[#F7F5EF] ${className}`.trim()}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 40% at 18% 12%, rgba(49,198,230,0.18), transparent 58%), radial-gradient(ellipse 45% 35% at 88% 18%, rgba(97,240,210,0.16), transparent 52%), radial-gradient(ellipse 50% 40% at 70% 92%, rgba(108,4,201,0.07), transparent 55%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <div className="motion-safe:animate-[pl-fade-up_0.55s_ease-out_both]">
          <QuintiaMark size={72} />
        </div>

        <div className="flex flex-col items-center gap-2 motion-safe:animate-[pl-fade-up_0.55s_ease-out_0.08s_both]">
          <p className="m-0 font-titulos text-[1.5rem] font-extrabold tracking-[-0.02em] text-[#0F2D3B]">
            {BRAND.name}
          </p>
          <p className="m-0 font-texto text-sm font-medium text-[#5B6770]">
            Un momento…
          </p>
        </div>

        <div
          aria-hidden
          className="mt-1 h-[3px] w-36 overflow-hidden rounded-full bg-[#E5E0D5] motion-safe:animate-[pl-fade-up_0.55s_ease-out_0.14s_both]"
        >
          <div className="h-full w-1/2 rounded-full bg-[#31C6E6] motion-safe:animate-[pl-load-bar_1.1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return node;
  }

  return createPortal(node, document.body);
}
