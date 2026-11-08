import {
  HerramientaIcon,
  hasHerramientaIcon,
} from "@/modules/clinico/herramientas/HerramientaIcon";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

type ToolItem = PacienteHerramientaMeta & {
  on: boolean;
  go: () => void;
  disabled?: boolean;
};

/** Grilla de herramientas = Quintia-entrega Paciente.dc.html (Inicio). */
export function PacienteHomeTools({ items }: { items: ToolItem[] }) {
  if (!items.length) return null;

  return (
    <section
      className="overflow-hidden rounded-[22px] border border-[#E4E0EA] bg-white"
      aria-label="Herramientas"
    >
      <p className="m-0 border-b border-[#EEEBF2] px-4 py-3.5 font-mono text-[16px] font-medium tracking-[0.14em] text-[#6C04C9]">
        HERRAMIENTAS
      </p>
      <div className="grid grid-cols-2 gap-2.5 p-3.5">
        {items.map((t) => {
          const id = t.id as PacienteHerramientaId;
          const className = [
            "flex min-h-[118px] flex-col items-center justify-center gap-2.5 rounded-[18px] border border-[#E4E0EA] bg-[#F7F5EF] px-2 py-3 text-center font-texto text-[#0F2D3B]",
            t.disabled
              ? "cursor-not-allowed opacity-45 grayscale"
              : "cursor-pointer transition hover:border-[#6C04C9]/35 active:scale-[0.98]",
            t.on && !t.disabled ? "border-[#6C04C9]/50" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const body = (
            <>
              {hasHerramientaIcon(id) ? (
                <HerramientaIcon id={id} className="h-14 w-14" />
              ) : null}
              <span className="line-clamp-2 text-[20px] font-semibold leading-tight">
                {t.navLabel}
              </span>
              {t.disabled ? (
                <span className="font-mono text-[12px] text-[#6B7280]">
                  Próximamente
                </span>
              ) : null}
            </>
          );

          if (t.disabled) {
            return (
              <div
                key={t.id}
                className={className}
                aria-disabled
                title="Próximamente"
              >
                {body}
              </div>
            );
          }

          return (
            <button
              key={t.id}
              type="button"
              onClick={t.go}
              title={t.name}
              className={className}
            >
              {body}
            </button>
          );
        })}
      </div>
    </section>
  );
}
