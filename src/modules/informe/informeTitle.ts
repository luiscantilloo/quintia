function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function informeTitleFromParams(sp: {
  name?: string | string[];
  t?: string | string[];
  id?: string | string[];
}): string {
  const name = first(sp.name);
  if (name) return name;
  const t = first(sp.t);
  if (t === "admin-weekly") return "Operaciones de la semana";
  if (t === "board") return "Informe mensual para la junta";
  if (first(sp.id)) return "Respuesta del asistente";
  return "Informe";
}
