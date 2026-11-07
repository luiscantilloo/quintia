/** Rutas del shell administrador (paths en español, sin ?view=). */
export const ADMIN_ROUTES = {
  home: "/inicio",
  terr: "/territorios",
  team: "/equipos",
  paths: "/rutas",
  people: "/personas",
  assets: "/activos",
  users: "/usuarios",
  reports: "/informes",
} as const;

export type AdminNavKey = keyof typeof ADMIN_ROUTES;

export const ADMIN_PATH_TO_VIEW: Record<string, AdminNavKey> = {
  "/admin": "home",
  "/inicio": "home",
  "/territorios": "terr",
  "/equipos": "team",
  "/rutas": "paths",
  "/personas": "people",
  "/activos": "assets",
  "/usuarios": "users",
  "/informes": "reports",
};

/** Nav visible. Activos e Informes quedan fuera por ahora (rutas siguen existiendo). */
export const ADMIN_NAV_ITEMS: [AdminNavKey, string][] = [
  ["home", "Inicio"],
  ["terr", "Territorios"],
  ["team", "Equipos de campo"],
  ["paths", "Rutas"],
  ["people", "Personas"],
  ["users", "Usuarios y permisos"],
];

export function adminPathForView(view: string): string {
  return ADMIN_ROUTES[view as AdminNavKey] ?? ADMIN_ROUTES.home;
}

export function adminViewForPath(pathname: string): AdminNavKey | null {
  const base = pathname.replace(/\/$/, "") || "/inicio";
  return ADMIN_PATH_TO_VIEW[base] ?? null;
}
