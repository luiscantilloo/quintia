/** Rutas del shell clínico (paths en español, sin ?view=). */
export const CLINICO_ROUTES = {
  home: "/clinico",
  approvals: "/clinico/aprobaciones",
  patients: "/clinico/pacientes",
  analizador: "/clinico/analizador",
  alerts: "/clinico/crisis",
  crisisHistory: "/clinico/crisis/historial",
} as const;

export type ClinicoNavKey = keyof typeof CLINICO_ROUTES;

export const CLINICO_PATH_TO_VIEW: Record<string, ClinicoNavKey> = {
  "/clinico": "home",
  "/clinico/inicio": "home",
  "/clinico/aprobaciones": "approvals",
  "/clinico/pacientes": "patients",
  "/clinico/analizador": "analizador",
  "/clinico/crisis": "alerts",
  "/clinico/crisis/historial": "crisisHistory",
};

/** Compat: viejos ?view= */
export const CLINICO_LEGACY_VIEW: Record<string, ClinicoNavKey> = {
  home: "home",
  approvals: "approvals",
  patients: "patients",
  analizador: "analizador",
  alerts: "alerts",
  crisisHistory: "crisisHistory",
  file: "patients",
};

export function clinicoPathForView(view: string, pid?: string | null): string {
  if (view === "file" && pid) {
    return `/clinico/pacientes/${encodeURIComponent(String(pid))}`;
  }
  return CLINICO_ROUTES[view as ClinicoNavKey] ?? CLINICO_ROUTES.home;
}

export function clinicoViewForPath(pathname: string): {
  view: string;
  pid?: string;
} {
  const base = pathname.replace(/\/$/, "") || "/clinico";
  const fileMatch = base.match(/^\/clinico\/pacientes\/([^/]+)$/);
  if (fileMatch) {
    return { view: "file", pid: decodeURIComponent(fileMatch[1]) };
  }
  const key = CLINICO_PATH_TO_VIEW[base];
  if (key) return { view: key };
  if (base.startsWith("/clinico/")) return { view: "home" };
  return { view: "home" };
}
