/** Ids canónicos = SERVICES del store / herramientas del clínico. */
export type PacienteHerramientaId =
  | "mood"
  | "clin"
  | "ia"
  | "juegos";

export type PacienteHerramientaMeta = {
  id: PacienteHerramientaId;
  /** Nombre completo (ficha / títulos). */
  name: string;
  /** Etiqueta corta para la barra inferior. */
  navLabel: string;
};

export type PacienteHerramientaPanelProps = {
  patientId: string;
};
