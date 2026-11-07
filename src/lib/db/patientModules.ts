import {
  ANALIZADOR_SERVICE,
  GAME_SERVICES,
  expandLegacyJuegosInModuleIds,
} from "@/lib/nara-services/gamesCatalog.js";

/** Módulos de la app del paciente alineados con servicios de perfil. */
export const PATIENT_APP_MODULES = [
  { id: "mood", name: "Estado de ánimo", desc: "Check-in «¿Cómo se siente hoy?»" },
  { id: "clin", name: "Psicólogo clínico", desc: "Servicio principal · citas clínicas" },
  { id: "ia", name: "Acompañante con IA (TEJIVA)", desc: "Botón TEJIVA en la app del paciente" },
  ...GAME_SERVICES.map((g) => ({
    id: g.id,
    name: g.name,
    desc: g.note,
  })),
  {
    id: ANALIZADOR_SERVICE.id,
    name: ANALIZADOR_SERVICE.name,
    desc: ANALIZADOR_SERVICE.note,
  },
] as const;

export type PatientModuleId = (typeof PATIENT_APP_MODULES)[number]["id"];

/** Servicios de ruta activos por defecto. */
export const DEFAULT_PATIENT_MODULES: PatientModuleId[] = [
  "mood",
  "clin",
  "ia",
  "frutas",
  "simon",
  "duelo",
  "sudoku",
  "analizador",
];

const ALLOWED = new Set<string>([
  ...PATIENT_APP_MODULES.map((m) => m.id),
  "juegos", // legacy
]);

/** Filtra ids válidos. Si `raw` no es array, usa `fallback` (por defecto los del programa). */
export function normalizeModuleIds(
  raw: unknown,
  fallback: readonly PatientModuleId[] = DEFAULT_PATIENT_MODULES,
): PatientModuleId[] {
  if (!Array.isArray(raw)) return fallback.slice();
  const expanded = expandLegacyJuegosInModuleIds(raw);
  const out = expanded.filter((id): id is PatientModuleId =>
    ALLOWED.has(id) && id !== "juegos",
  );
  return Array.from(new Set(out));
}
