/** Logos de las casillas de Herramientas (ficha clínico / app paciente). Marca QUINTIA — no monigotes NARA. */
export const HERRAMIENTA_LOGOS: Record<string, string> = {
  mood: "/quintia/herramientas/mood.svg",
  clin: "/quintia/herramientas/clin.svg",
  ia: "/quintia/herramientas/ia.svg",
  juegos: "/quintia/herramientas/juegos.svg",
  tech: "/quintia/herramientas/tech.svg",
  revisit: "/quintia/herramientas/revisit.svg",
  cursos: "/quintia/herramientas/cursos.svg",
};

export function logoForHerramienta(id: string): string | undefined {
  return HERRAMIENTA_LOGOS[id];
}
