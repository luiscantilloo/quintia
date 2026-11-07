/** Íconos de la agenda (trazo 1.75, estilo Lucide). */
const TRAZOS = {
  izq: <path d="m15 18-6-6 6-6" />,
  der: <path d="m9 18 6-6-6-6" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  tel: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  check: <path d="M20 6 9 17l-5-5" />,
  candado: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  cerrar: <path d="M18 6 6 18M6 6l12 12" />,
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
};

export function Ico({ n, className = "h-[18px] w-[18px]" }: { n: keyof typeof TRAZOS; className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[n]}
    </svg>
  );
}

/** Estilos de animación de la agenda (solo dentro del modal; respetan «reducir movimiento»). */
export const ANIMACIONES = `
@keyframes clin-aparecer { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: none; } }
@keyframes clin-girar { to { transform: rotate(360deg); } }
@keyframes clin-velo { from { opacity: 0; backdrop-filter: blur(0); } to { opacity: 1; backdrop-filter: blur(3px); } }
@keyframes clin-latir { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
@keyframes clin-saltar { 0%, 100% { transform: translateY(0) scale(1, 1); } 12% { transform: translateY(0) scale(1.1, .9); } 40% { transform: translateY(-14px) scale(.95, 1.06); } 62% { transform: translateY(0) scale(1.08, .93); } 78% { transform: translateY(0) scale(1, 1); } }
@keyframes clin-sombra { 0%, 100%, 78% { transform: scaleX(1); opacity: .22; } 40% { transform: scaleX(.6); opacity: .1; } }
@keyframes clin-flotar-in { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes clin-fondo-in { from { opacity: 0; } to { opacity: 1; } }
.clin-velo-in { animation: clin-velo .35s cubic-bezier(.16,1,.3,1) both; }
.clin-salta { animation: clin-saltar 1.1s cubic-bezier(.4,0,.2,1) infinite; transform-origin: 50% 100%; }
.clin-sombra { animation: clin-sombra 1.1s cubic-bezier(.4,0,.2,1) infinite; }
.clin-flotante-in { animation: clin-flotar-in .4s cubic-bezier(.16,1,.3,1) both; }
.clin-fondo-in { animation: clin-fondo-in .2s ease-out both; }
.clin-modal-in { animation: clin-flotar-in .3s cubic-bezier(.16,1,.3,1) both; }
.clin-puntos span { animation: clin-latir 1.2s ease-in-out infinite; }
.clin-puntos span:nth-child(2) { animation-delay: .2s; } .clin-puntos span:nth-child(3) { animation-delay: .4s; }
.clin-borrador-in { animation: clin-aparecer .42s cubic-bezier(.16,1,.3,1) both; }
.clin-spin { animation: clin-girar .9s linear infinite; }
.clin-tnum { font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) {
  .clin-borrador-in, .clin-velo-in, .clin-puntos span, .clin-salta, .clin-sombra, .clin-flotante-in, .clin-modal-in, .clin-fondo-in { animation: none; }
  .clin-spin { animation-duration: 2.4s; }
}`;
