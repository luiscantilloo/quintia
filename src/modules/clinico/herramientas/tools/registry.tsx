import type { ComponentType } from "react";
import type { HerramientaCardProps, HerramientaId } from "../types";
import { AnalizadorToolCard } from "./analizador/AnalizadorToolCard";
import { ClinToolCard } from "./clin/ClinToolCard";
import { IaToolCard } from "./ia/IaToolCard";
import { GameToolCard } from "./juegos/GameToolCard";
import { JuegosToolCard } from "./juegos/JuegosToolCard";
import { MoodToolCard } from "./mood/MoodToolCard";
import { PlaceholderToolCard } from "./PlaceholderToolCard";

/**
 * Registro de herramientas.
 * Cada persona desarrolla solo su carpeta bajo `tools/<id>/`.
 * Los 4 juegos van como tarjetas independientes (misma ruta / hub paciente).
 */
export const HERRAMIENTA_CARDS: Partial<
  Record<HerramientaId, ComponentType<HerramientaCardProps>>
> = {
  mood: MoodToolCard,
  clin: ClinToolCard,
  ia: IaToolCard,
  juegos: JuegosToolCard,
  frutas: GameToolCard,
  simon: GameToolCard,
  duelo: GameToolCard,
  sudoku: GameToolCard,
  analizador: AnalizadorToolCard,
};

export function resolveHerramientaCard(
  id: HerramientaId,
): ComponentType<HerramientaCardProps> {
  return HERRAMIENTA_CARDS[id] || PlaceholderToolCard;
}
