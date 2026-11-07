"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BRAND } from "@/lib/brand";
import { QuintiaMark } from "@/components/shared/brand/QuintiaLogo";

/**
 * Carga a pantalla completa: profundidad Quintia + símbolo Q (degradado).
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
      className={`grid place-items-center ${className}`.trim()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        width: "100vw",
        height: "100dvh",
        minWidth: "100%",
        minHeight: "100%",
        margin: 0,
        background: "#0F2D3B",
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* Degradado vivo de marca */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 70% 20%, rgba(108,4,201,0.35) 0%, transparent 55%), radial-gradient(ellipse 50% 45% at 20% 80%, rgba(49,198,230,0.28) 0%, transparent 50%), radial-gradient(ellipse 40% 35% at 55% 90%, rgba(97,240,210,0.2) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div
          className="motion-safe:animate-[pl-pulse_2.4s_ease-in-out_infinite]"
          style={{
            width: 148,
            height: 148,
            borderRadius: 40,
            background: "#F7F5EF",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          }}
        >
          <QuintiaMark size={96} />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p
            className="font-titulos text-[28px] font-extrabold tracking-[-0.02em]"
            style={{ margin: 0, color: "#F7F5EF" }}
          >
            {BRAND.name}
          </p>
          <p
            className="font-texto text-[13px] font-medium"
            style={{ margin: 0, color: "rgba(247,245,239,0.65)" }}
          >
            Cinco fuerzas. Infinitas posibilidades.
          </p>
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return node;
  }

  return createPortal(node, document.body);
}
