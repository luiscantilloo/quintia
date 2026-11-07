import type { ReactNode } from "react";

export function ClinShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col gap-5 overflow-x-hidden px-4 pb-8 pt-4 font-texto text-[#0F2D3B] sm:px-5">
      <style>{`
        @keyframes clinIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="[animation:clinIn"] { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 0% 0%, rgba(231,250,245,0.9), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 20%, rgba(228,247,251,0.75), transparent 50%)",
        }}
      />
      {children}
    </div>
  );
}

export function ClinHeader({ showSub }: { showSub?: boolean }) {
  return (
    <header className="[animation:clinIn_.45s_cubic-bezier(.22,1,.36,1)_both]">
      <p className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
        Atención clínica
      </p>
      <h2 className="m-0 mt-1.5 font-titulos text-[clamp(26px,6vw,32px)] font-extrabold tracking-tight text-[#0F2D3B]">
        Psicólogo clínico
      </h2>
      {showSub ? (
        <p className="m-0 mt-1 font-texto text-[15px] text-[#5B6770]">
          Espacio para sus citas con el equipo
        </p>
      ) : null}
    </header>
  );
}

export function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l5 5L19 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PulseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12h4l2.5-5 4 10L16 12h5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
