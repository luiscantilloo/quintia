import type { ComponentType } from "react";
import type { HerramientaCardProps, HerramientaId } from "../types";
import { ClinToolCard } from "./clin/ClinToolCard";
import { IaToolCard } from "./ia/IaToolCard";
import { JuegosToolCard } from "./juegos/JuegosToolCard";
import { MoodToolCard } from "./mood/MoodToolCard";
import { PlaceholderToolCard } from "./PlaceholderToolCard";

/**
 * Registro de herramientas.
 * Cada persona desarrolla solo su carpeta bajo `tools/<id>/`.
 */
export const HERRAMIENTA_CARDS: Partial<
  Record<HerramientaId, ComponentType<HerramientaCardProps>>
> = {
  mood: MoodToolCard,
  clin: ClinToolCard,
  ia: IaToolCard,
  juegos: JuegosToolCard,
};

export function resolveHerramientaCard(
  id: HerramientaId,
): ComponentType<HerramientaCardProps> {
  return HERRAMIENTA_CARDS[id] || PlaceholderToolCard;
}
