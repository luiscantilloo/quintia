import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

/** Revisita del experto — deshabilitada por ahora. */
export function RevisitToolCard({ item, patientId }: HerramientaCardProps) {
  void patientId;
  return (
    <ToolCardShell
      iconId="revisit"
      title={item.name}
      disabled
    >
      <span>Próximamente</span>
    </ToolCardShell>
  );
}
