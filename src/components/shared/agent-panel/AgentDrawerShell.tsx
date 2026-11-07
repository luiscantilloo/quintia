"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type Props = {
  open: boolean;
  drawerWidth?: string;
  drawer: ReactNode;
  /** Topbar fijo: nunca entra al scroll. */
  header?: ReactNode;
  /** Único área con scroll vertical (debajo del topbar). */
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
  "data-screen-label"?: string;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const MS = 480;
const OVERLAY_MAX = 1279;

/**
 * Columna principal: [topbar fijo] + [contenido con scroll].
 * TEJIVA a la derecha (push) o overlay en ventana estrecha.
 */
export function AgentDrawerShell({
  open,
  drawerWidth = "420px",
  drawer,
  header,
  children,
  onClose,
  className = "",
  style,
  "data-screen-label": screenLabel,
}: Props) {
  const [overlay, setOverlay] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= OVERLAY_MAX,
  );
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const mqOverlay = window.matchMedia(`(max-width: ${OVERLAY_MAX}px)`);
    const mqNarrow = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setOverlay(mqOverlay.matches);
      setNarrow(mqNarrow.matches);
    };
    sync();
    mqOverlay.addEventListener("change", sync);
    mqNarrow.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mqOverlay.removeEventListener("change", sync);
      mqNarrow.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    if (!open || !overlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, overlay]);

  const overlayPanelW = narrow ? "100%" : "min(480px, 100vw)";
  const pushPanelW = drawerWidth;

  return (
    <div
      data-screen-label={screenLabel}
      className={`flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden ${className}`}
      style={style}
    >
      {/* Columna de app: topbar fijo + scroll solo abajo */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {header ? (
          <div className="relative z-40 shrink-0">
            {header}
          </div>
        ) : null}

        <div
          data-shell-scroll
          className="nara-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
      </div>

      {overlay ? (
        <div
          aria-hidden={!open}
          className="fixed inset-0 z-40"
          style={{ pointerEvents: open ? "auto" : "none" }}
        >
          <button
            type="button"
            aria-label="Cerrar asistente"
            className="absolute inset-0 border-none bg-[rgba(22,20,19,.45)] transition-opacity duration-300"
            style={{ opacity: open ? 1 : 0 }}
            onClick={() => onClose?.()}
          />
          <aside
            role="dialog"
            aria-label="Asistente"
            className="absolute inset-y-0 right-0 flex max-w-full flex-col bg-nara-blanco shadow-[-10px_0_30px_rgba(22,20,19,.18)] will-change-transform"
            style={{
              width: overlayPanelW,
              transform: open ? "translateX(0)" : "translateX(100%)",
              transition: `transform ${MS}ms ${EASE}`,
            }}
          >
            {drawer}
          </aside>
        </div>
      ) : (
        <div
          aria-hidden={!open}
          className="z-20 flex h-full shrink-0 justify-end overflow-hidden"
          style={{
            width: open ? pushPanelW : 0,
            transition: `width ${MS}ms ${EASE}`,
            willChange: "width",
          }}
        >
          <aside
            role="dialog"
            aria-label="Asistente"
            className="flex h-full flex-col border-l border-linea bg-nara-blanco"
            style={{
              width: pushPanelW,
              minWidth: pushPanelW,
              height: "100%",
              boxShadow: open ? "-10px 0 30px rgba(22,20,19,.14)" : "none",
              pointerEvents: open ? "auto" : "none",
              transition: `box-shadow ${MS}ms ${EASE}`,
            }}
          >
            {drawer}
          </aside>
        </div>
      )}
    </div>
  );
}
