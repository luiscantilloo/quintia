/**
 * Rebanadas del AlientoStore que aún no tienen CRUD dedicado
 * y deben vivir en Mongo (program_settings.key = "app_state").
 */
export const APP_STATE_SLICES = [
  "notes",
  "pathAdjust",
  "referrals",
  "consents",
  "alerts",
  "crisisLog",
  "closedToday",
  "revisits",
  "notifs",
  "notices",
  "pathRequests",
  "pathOverrides",
  "rules",
  "visits",
  "groupSessions",
  "reports",
  "customReports",
  "schedules",
  "agentLog",
  "aiLog",
  /** Check-ins de ánimo por paciente (clínico lee el historial desde aquí). */
  "moodLogs",
  /** Partidas de juegos (Sudoku) por paciente. */
  "gameLogs",
  "recursos",
  "activity",
  "accessLog",
  "weekBase",
  "rejected",
  "pendingSync",
  "terrOv",
  "expertOv",
  "personOv",
  "assetOv",
  "assets",
  "diana",
  "dianaInbox",
  "pins",
  "falsePositives",
  "oscarPlan",
  "rosalbaSummary",
  "rosalbaWA",
] as const;

export type AppStateSlice = (typeof APP_STATE_SLICES)[number];

export const APP_STATE_KEY = "app_state";

export function pickAppStateSlices(source: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of APP_STATE_SLICES) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}
