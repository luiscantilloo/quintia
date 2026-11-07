"use client";

import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { QuintiaMark } from "@/components/shared/brand/QuintiaLogo";

type Props = {
  open: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-2xl lg:max-w-3xl",
  lg: "sm:max-w-4xl",
};

const DURATION_MS = 320;

/**
 * Modal de formulario QUINTIA · panel de marca + cuerpo animado.
 * Solo se cierra con Cancelar / Guardar del footer.
 */
export function FormModal({
  open,
  title,
  description,
  children,
  footer,
  size = "md",
}: Props) {
  const titleId = useId();
  const descId = useId();
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setShown(true));
      });
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.cancelAnimationFrame(id);
        document.body.style.overflow = prev;
      };
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), DURATION_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!portalReady || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-5"
      role="presentation"
    >
      <div
        className={`absolute inset-0 bg-[#0F2D3B]/60 backdrop-blur-[3px] transition-opacity duration-300 ease-out ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`relative z-[1] flex w-full ${SIZE[size]} max-h-[min(94dvh,920px)] flex-col overflow-hidden rounded-t-[32px] border border-white/20 bg-[#F7F5EF] shadow-[0_40px_100px_rgba(15,45,59,.4)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] sm:max-h-[min(90vh,860px)] sm:rounded-[32px] lg:flex-row ${
          shown
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-8 opacity-0 sm:translate-y-4 sm:scale-[0.96]"
        }`}
      >
        <span id={titleId} className="sr-only">
          {title}
        </span>
        {description ? (
          <span id={descId} className="sr-only">
            {description}
          </span>
        ) : null}
        {/* Panel de marca (desktop) */}
        <aside className="relative hidden w-[240px] shrink-0 flex-col justify-between overflow-hidden bg-[#0F2D3B] p-7 text-[#F7F5EF] lg:flex xl:w-[260px]">
          <div
            className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full opacity-70"
            style={{
              background:
                "radial-gradient(circle, #31C6E6 0%, transparent 70%)",
              animation: "q-form-glow 6s ease-in-out infinite",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -right-8 h-56 w-56 rounded-full opacity-60"
            style={{
              background:
                "radial-gradient(circle, #6C04C9 0%, transparent 68%)",
              animation: "q-form-glow 7.5s ease-in-out infinite reverse",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(circle, #61F0D2 0%, transparent 70%)",
              animation: "q-form-glow 5s ease-in-out infinite",
            }}
            aria-hidden
          />

          <div className="relative flex flex-col gap-5">
            <QuintiaMark size={52} tone="claro" />
            <div className="flex flex-col gap-2">
              <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#61F0D2]">
                Acceso · QUINTIA
              </p>
              <h2 className="m-0 font-titulos text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">
                {title}
              </h2>
              {description ? (
                <p className="m-0 font-texto text-[14px] leading-snug text-[#E5E0D5]/90">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <p className="relative m-0 font-titulos text-[13px] font-semibold leading-snug text-[#31C6E6]/90">
            Cinco fuerzas.
            <br />
            Infinitas posibilidades.
          </p>
        </aside>

        {/* Cuerpo */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className="h-1.5 w-full shrink-0 lg:hidden"
            style={{
              background:
                "linear-gradient(90deg, #61F0D2 0%, #31C6E6 45%, #6C04C9 100%)",
            }}
            aria-hidden
          />

          {/* Header móvil */}
          <header className="relative shrink-0 overflow-hidden border-b border-[#E5E0D5]/80 px-5 pb-4 pt-4 sm:px-7 lg:hidden">
            <div
              className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#31C6E6]/20 blur-3xl"
              style={{ animation: "q-form-glow 5s ease-in-out infinite" }}
              aria-hidden
            />
            <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-[#0F2D3B]/15" aria-hidden />
            <div className="relative flex items-start gap-3">
              <QuintiaMark size={36} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#5B6770]">
                  QUINTIA · Acceso
                </p>
                <h2 className="m-0 font-titulos text-[clamp(22px,5vw,26px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0F2D3B]">
                  {title}
                </h2>
                {description ? (
                  <p className="m-0 font-texto text-[14px] leading-snug text-[#5B6770]">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          <div
            className={[
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6",
              "bg-[radial-gradient(120%_80%_at_100%_0%,rgba(49,198,230,0.08),transparent_55%),radial-gradient(90%_60%_at_0%_100%,rgba(97,240,210,0.1),transparent_50%)]",
              "[&_input]:box-border [&_input]:w-full [&_select]:box-border [&_select]:w-full [&_textarea]:box-border [&_textarea]:w-full",
            ].join(" ")}
          >
            {children}
          </div>

          {footer ? (
            <footer
              className={[
                "flex shrink-0 flex-col gap-2.5 border-t border-[#E5E0D5]/90 bg-white/75 px-5 pt-3.5 backdrop-blur-md",
                "pb-[max(0.85rem,env(safe-area-inset-bottom,0px))]",
                "sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-7 sm:py-4",
                "[&>button]:box-border [&>button]:h-12 [&>button]:w-full [&>button]:shrink-0",
                "[&>button]:rounded-2xl [&>button]:font-texto [&>button]:text-[15px] [&>button]:font-bold",
                "[&>button]:transition [&>button]:duration-200",
                "sm:[&>button]:w-auto sm:[&>button]:min-w-[7.5rem] sm:[&>button]:px-6",
                "[&>span]:order-first [&>span]:w-full [&>span]:text-sm",
                "sm:[&>span]:order-none sm:[&>span]:w-auto",
              ].join(" ")}
            >
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
