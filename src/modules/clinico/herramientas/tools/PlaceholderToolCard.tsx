import { ToolCardShell } from "../ToolCardShell";
import type { HerramientaCardProps } from "../types";

/** Casilla genérica (nombre). Usar hasta que exista la herramienta dedicada. */
export function PlaceholderToolCard({ item }: HerramientaCardProps) {
  return (
    <ToolCardShell>
      <span className="text-[15px] font-medium text-nara-tinta">{item.name}</span>
    </ToolCardShell>
  );
}
