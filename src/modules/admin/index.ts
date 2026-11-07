export { AdminScreen } from "./screens/AdminScreen";
export { AdminUsuariosScreen } from "./screens/usuarios/AdminUsuariosScreen";
export { AdminInformesScreen } from "./screens/informes/AdminInformesScreen";
export { ADMIN_ROUTES, adminPathForView } from "./routes";

export const admin = {
  inicio: { ruta: "/inicio" },
  territorios: { ruta: "/territorios" },
  equipos: { ruta: "/equipos" },
  rutas: { ruta: "/rutas" },
  personas: { ruta: "/personas" },
  activos: { ruta: "/activos" },
  usuarios: { ruta: "/usuarios" },
  informes: { ruta: "/informes" },
  // Detalle (stubs)
  territorio: { ruta: "/admin/territorio" },
  experto: { ruta: "/admin/experto" },
  persona: { ruta: "/admin/persona" },
} as const;
