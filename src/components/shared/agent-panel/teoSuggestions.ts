/** Preguntas naturales sobre el programa (rotan al abrir TEJIVA). */
export const TEO_SUGGESTIONS: Record<string, string[]> = {
  admin: [
    "¿Cómo va el programa en general?",
    "¿Qué territorio va más atrasado en captación?",
    "¿Cuántas personas hay por estado?",
    "¿Cuántos pacientes están inactivos?",
    "¿Hay alguien en crisis ahora?",
    "¿Cuántas evaluaciones esperan aprobación?",
    "¿Hay cambios de ruta pendientes?",
    "¿Qué expertos están activos y en qué territorio?",
    "¿Cuántas cuentas hay por rol?",
    "¿Hay alertas abiertas?",
    "¿Cómo van las tablets de campo?",
    "Resuma el estado del programa en tres puntos.",
  ],
  clin: [
    "¿Cuántas evaluaciones tengo por aprobar?",
    "¿Hay pacientes en crisis?",
    "¿Cuántos están inactivos?",
    "¿Hay cambios de ruta esperando mi visto bueno?",
    "¿Hay un cambio de reglas pendiente?",
    "¿Quiénes empeoraron recientemente?",
    "Resuma mi caseload en tres puntos.",
    "¿Cómo va la captación por territorio?",
  ],
  experto: [
    "¿Cómo va la captación en mi territorio?",
    "¿Cuántas visitas tengo pendientes?",
    "¿Hay alertas en mi zona?",
    "¿Cuántas personas captadas hay por estado?",
    "¿Hay pacientes en crisis?",
    "¿Cómo va mi meta de la semana?",
  ],
  observador: [
    "¿Cuántas personas hay en el programa?",
    "¿Cómo va la captación en general?",
    "¿Qué territorios concentran más personas?",
    "¿Cómo se distribuyen por estado?",
    "Resuma el avance del programa sin datos personales.",
  ],
};

const ROLE_ALIAS: Record<string, string> = {
  obs: "observador",
  observador: "observador",
  clin: "clin",
  clinico: "clin",
  expert: "experto",
  experto: "experto",
  admin: "admin",
};

export function pickTeoSuggestions(role: string, count = 4): string[] {
  const raw = role.split(":")[0];
  const key = ROLE_ALIAS[raw] || raw;
  const pool = TEO_SUGGESTIONS[key] || TEO_SUGGESTIONS.admin;
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}
