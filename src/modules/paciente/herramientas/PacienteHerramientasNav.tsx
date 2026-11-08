import {
  HerramientaIcon,
  hasHerramientaIcon,
} from "@/modules/clinico/herramientas/HerramientaIcon";
import type { PacienteHerramientaId, PacienteHerramientaMeta } from "./types";

type NavItem = PacienteHerramientaMeta & {
  on: boolean;
  go: () => void;
  disabled?: boolean;
};

function NavIcon({
  id,
  active,
  disabled,
}: {
  id: PacienteHerramientaId;
  active: boolean;
  disabled?: boolean;
}) {
  if (!hasHerramientaIcon(id)) return null;
  return (
    <HerramientaIcon
      id={id}
      className={`h-7 w-7 ${
        disabled
          ? "opacity-40 grayscale"
          : active
            ? "opacity-100"
            : "opacity-70"
      }`}
    />
  );
}

/**
 * Barra inferior: herramientas activas en la ruta.
 * tech / revisit en gris (próximamente), mismos logos que el clínico.
 */
export function PacienteHerramientasNav({ items }: { items: NavItem[] }) {
  const n = items.length;
  if (!n) return null;

  const labelClass =
    n >= 6
      ? "text-[9px] leading-tight sm:text-[10px]"
      : n >= 5
        ? "text-[10px] leading-tight sm:text-[11px]"
        : n >= 4
          ? "text-[11px] leading-tight sm:text-[12px]"
          : "text-[13px] leading-tight";

  return (
    <div
      role="tablist"
      className="grid h-[84px] w-full shrink-0 border-t border-[#E4E0EA] bg-white px-1.5 pb-2"
      style={{
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
      }}
    >
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.on}
          aria-disabled={t.disabled || undefined}
          disabled={t.disabled}
          onClick={t.go}
          title={t.disabled ? "Próximamente" : t.name}
          className={`relative flex h-full flex-col items-center justify-center gap-0.5 border-0 border-b-4 bg-transparent px-0.5 font-texto outline-none ${
            t.disabled
              ? "cursor-not-allowed border-transparent text-[#6B7280]/50"
              : t.on
                ? "cursor-pointer border-[#6C04C9] font-bold !text-[#0F2D3B]"
                : "cursor-pointer border-transparent font-medium text-[#0F2D3B]"
          }`}
        >
          <span className="grid h-[30px] place-items-center">
            <NavIcon id={t.id} active={t.on} disabled={t.disabled} />
          </span>
          <span className={`max-w-full truncate text-center text-[15px] ${labelClass}`}>
            {t.navLabel}
          </span>
        </button>
      ))}
    </div>
  );
}
