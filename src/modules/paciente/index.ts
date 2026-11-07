export { PacientePlanScreen } from "./plan/PacientePlanScreen";
export { PacienteScreen } from "./app/PacienteScreen";

export const paciente = {
  app: { ruta: "/paciente" },
  plan: { ruta: "/paciente/plan" },
} as const;
