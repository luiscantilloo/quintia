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
      className="grid w-full shrink-0 border-t border-[#E5E0D5] bg-white px-0.5 pt-1.5"
      style={{
        paddingBottom: 10,
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
          className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-0.5 font-mono outline-none after:pointer-events-none after:absolute after:right-1 after:bottom-0 after:left-1 after:h-[3px] after:content-[''] ${
            t.disabled
              ? "cursor-not-allowed text-[#6B7280]/50 after:bg-transparent"
              : t.on
                ? "cursor-pointer font-semibold !text-[#0F2D3B] after:bg-[#31C6E6]"
                : "cursor-pointer font-medium text-[#6B7280] after:bg-transparent"
          }`}
        >
          <span className="grid h-7 place-items-center">
            <NavIcon id={t.id} active={t.on} disabled={t.disabled} />
          </span>
          <span className={`max-w-full truncate text-center ${labelClass}`}>
            {t.navLabel}
          </span>
        </button>
      ))}
    </div>
  );
}
