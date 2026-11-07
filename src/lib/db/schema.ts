/**
 * Esquema QUINTIA en MongoDB.
 * Las colecciones se crean al primer documento o vía `npm run db:init`.
 * Los índices definen la forma operativa esperada.
 */

export type CollectionDef = {
  name: string;
  /** Descripción corta para documentación / init */
  description: string;
  indexes: Array<{
    key: Record<string, 1 | -1>;
    options?: { unique?: boolean; name?: string; sparse?: boolean };
  }>;
};

/** Colecciones principales alineadas al modelo del store. */
export const NARA_COLLECTIONS: CollectionDef[] = [
  {
    name: "roles",
    description: "Catálogo de roles de la aplicación (admin, experto, clínico, paciente, observador)",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "roles_id_unique" } },
      { key: { slug: 1 }, options: { unique: true, name: "roles_slug_unique" } },
    ],
  },
  {
    name: "accounts",
    description: "Usuarios y permisos (admin, experto, clínico, observador, paciente)",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "accounts_id_unique" } },
      { key: { role: 1, status: 1 }, options: { name: "accounts_role_status" } },
      { key: { roleId: 1 }, options: { name: "accounts_roleId" } },
      { key: { email: 1 }, options: { unique: true, sparse: true, name: "accounts_email_unique" } },
    ],
  },
  {
    name: "territories",
    description: "Municipios / territorios del programa",
    indexes: [
      { key: { name: 1 }, options: { unique: true, name: "territories_name_unique" } },
      { key: { dep: 1 }, options: { name: "territories_dep" } },
    ],
  },
  {
    name: "experts",
    description: "Equipos de campo asignados a territorios",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "experts_id_unique" } },
      { key: { terr: 1 }, options: { name: "experts_terr" } },
      { key: { accountId: 1 }, options: { sparse: true, name: "experts_account" } },
    ],
  },
  {
    name: "people",
    description: "Personas captadas (roster operativo)",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "people_id_unique" } },
      { key: { code: 1 }, options: { unique: true, sparse: true, name: "people_code_unique" } },
      { key: { terr: 1 }, options: { name: "people_terr" } },
      { key: { expertId: 1 }, options: { sparse: true, name: "people_expert" } },
      { key: { profile: 1 }, options: { name: "people_profile" } },
    ],
  },
  {
    name: "patients",
    description: "Ficha clínica / paciente (PHQ, plan, adherencia, etc.)",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "patients_id_unique" } },
      { key: { personId: 1 }, options: { sparse: true, name: "patients_person" } },
      { key: { accountId: 1 }, options: { sparse: true, name: "patients_account" } },
    ],
  },
  {
    name: "assets",
    description: "Activos del programa (tablets, etc.)",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "assets_id_unique" } },
      { key: { type: 1, status: 1 }, options: { name: "assets_type_status" } },
      { key: { assignedTo: 1 }, options: { sparse: true, name: "assets_assigned" } },
    ],
  },
  {
    name: "alerts",
    description: "Alertas clínicas y operativas",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "alerts_id_unique" } },
      { key: { status: 1, sev: 1 }, options: { name: "alerts_status_sev" } },
      { key: { expert: 1 }, options: { sparse: true, name: "alerts_expert" } },
      { key: { at: -1 }, options: { name: "alerts_at" } },
    ],
  },
  {
    name: "flags",
    description: "Visitas / casos pendientes de revisión",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "flags_id_unique" } },
      { key: { expert: 1, status: 1 }, options: { name: "flags_expert_status" } },
      { key: { at: -1 }, options: { name: "flags_at" } },
    ],
  },
  {
    name: "visits",
    description: "Visitas de campo registradas",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "visits_id_unique" } },
      { key: { personId: 1, at: -1 }, options: { name: "visits_person_at" } },
      { key: { expertId: 1, at: -1 }, options: { name: "visits_expert_at" } },
    ],
  },
  {
    name: "worklists",
    description: "Listas de trabajo del día por experto",
    indexes: [
      { key: { expertId: 1, date: 1 }, options: { name: "worklists_expert_date" } },
      { key: { personId: 1 }, options: { sparse: true, name: "worklists_person" } },
    ],
  },
  {
    name: "revisits",
    description: "Revisitas programadas",
    indexes: [
      { key: { expertId: 1, when: 1 }, options: { name: "revisits_expert_when" } },
      { key: { personId: 1 }, options: { sparse: true, name: "revisits_person" } },
    ],
  },
  {
    name: "group_sessions",
    description: "Sesiones grupales (retirado en QUINTIA)",
    indexes: [
      { key: { expertId: 1, when: 1 }, options: { name: "group_sessions_expert_when" } },
      { key: { terr: 1 }, options: { sparse: true, name: "group_sessions_terr" } },
    ],
  },
  {
    name: "referrals",
    description: "Remisiones a instituciones",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "referrals_id_unique" } },
      { key: { personId: 1 }, options: { name: "referrals_person" } },
      { key: { institutionId: 1 }, options: { sparse: true, name: "referrals_inst" } },
    ],
  },
  {
    name: "consents",
    description: "Consentimientos informados",
    indexes: [
      { key: { personId: 1 }, options: { unique: true, name: "consents_person_unique" } },
      { key: { at: -1 }, options: { name: "consents_at" } },
    ],
  },
  {
    name: "notes",
    description: "Notas clínicas / de campo por persona",
    indexes: [
      { key: { personId: 1, at: -1 }, options: { name: "notes_person_at" } },
      { key: { authorId: 1 }, options: { sparse: true, name: "notes_author" } },
    ],
  },
  {
    name: "path_requests",
    description: "Solicitudes de cambio de ruta de cuidado",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "path_requests_id_unique" } },
      { key: { status: 1, at: -1 }, options: { name: "path_requests_status_at" } },
    ],
  },
  {
    name: "path_overrides",
    description: "Overrides de rutas por perfil (P01–P15)",
    indexes: [
      { key: { code: 1 }, options: { unique: true, name: "path_overrides_code_unique" } },
    ],
  },
  {
    name: "caseload",
    description: "Carga de casos clínicos asignados",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "caseload_id_unique" } },
      { key: { clinicianId: 1 }, options: { sparse: true, name: "caseload_clinician" } },
    ],
  },
  {
    name: "notifications",
    description: "Notificaciones in-app por bandeja (clin, experto, admin…)",
    indexes: [
      { key: { inbox: 1, at: -1 }, options: { name: "notifications_inbox_at" } },
      { key: { read: 1 }, options: { name: "notifications_read" } },
    ],
  },
  {
    name: "reports",
    description: "Informes generados / programados",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "reports_id_unique" } },
      { key: { kind: 1, at: -1 }, options: { name: "reports_kind_at" } },
    ],
  },
  {
    name: "custom_reports",
    description: "Plantillas de informes personalizados",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "custom_reports_id_unique" } },
    ],
  },
  {
    name: "schedules",
    description: "Programación de envíos / informes",
    indexes: [
      { key: { id: 1 }, options: { unique: true, name: "schedules_id_unique" } },
      { key: { nextAt: 1 }, options: { sparse: true, name: "schedules_next" } },
    ],
  },
  {
    name: "recursos",
    description: "Asignación y progreso de recursos (técnicas / videos; cursos retirados)",
    indexes: [
      { key: { personId: 1 }, options: { unique: true, sparse: true, name: "recursos_person_unique" } },
      { key: { course: 1 }, options: { sparse: true, name: "recursos_course" } },
    ],
  },
  {
    name: "program_settings",
    description: "Singleton de reglas del programa, cuotas y config global",
    indexes: [
      { key: { key: 1 }, options: { unique: true, name: "program_settings_key_unique" } },
    ],
  },
  {
    name: "activity_log",
    description: "Bitácora de actividad de usuarios",
    indexes: [
      { key: { uid: 1, at: -1 }, options: { name: "activity_uid_at" } },
      { key: { at: -1 }, options: { name: "activity_at" } },
    ],
  },
  {
    name: "access_log",
    description: "Registro de acceso a fichas / datos sensibles",
    indexes: [
      { key: { code: 1, at: -1 }, options: { name: "access_code_at" } },
      { key: { at: -1 }, options: { name: "access_at" } },
    ],
  },
  {
    name: "agent_log",
    description: "Historial del agente QUINTIA",
    indexes: [
      { key: { role: 1, at: -1 }, options: { name: "agent_role_at" } },
      { key: { at: -1 }, options: { name: "agent_at" } },
    ],
  },
  {
    name: "ai_log",
    description: "Historial de interacciones con IA / TEJIVA",
    indexes: [
      { key: { pid: 1, at: -1 }, options: { name: "ai_pid_at" } },
      { key: { at: -1 }, options: { name: "ai_at" } },
    ],
  },
];

/** Documento inicial de configuración del programa (colecciones vacías + reglas). */
export function defaultProgramSettings() {
  return {
    key: "main",
    v: 5,
    rules: {
      risk: [
        { k: "Mínimo", min: 0, max: 4, c: "#31C6E6" },
        { k: "Leve", min: 5, max: 9, c: "#e9a319" },
        { k: "Moderado", min: 10, max: 14, c: "#E0A526" },
        { k: "Moderado-severo", min: 15, max: 19, c: "#D9692B" },
        { k: "Severo", min: 20, max: 27, c: "#9C2F25" },
      ],
      dig: {
        q: [
          {
            q: "Teléfono",
            o: [
              { o: "Ninguno", p: 0 },
              { o: "Compartido", p: 1 },
              { o: "Smartphone propio", p: 2 },
            ],
          },
          {
            q: "Conexión en casa",
            o: [
              { o: "Sin señal", p: 0 },
              { o: "Datos limitados", p: 1 },
              { o: "Estable", p: 2 },
            ],
          },
          {
            q: "Uso diario",
            o: [
              { o: "Solo llamadas", p: 0 },
              { o: "WhatsApp y audios", p: 1 },
              { o: "Apps y videollamadas", p: 2 },
            ],
          },
          {
            q: "Lectura y escritura",
            o: [
              { o: "Prefiere voz", p: 0 },
              { o: "Básica", p: 1 },
              { o: "Cómoda", p: 2 },
            ],
          },
          {
            q: "¿Hablaría con una app?",
            o: [
              { o: "No", p: 0 },
              { o: "Tal vez", p: 1 },
              { o: "Sí", p: 2 },
            ],
          },
          {
            q: "Alguien en casa le ayuda con el celular",
            o: [
              { o: "No", p: 0 },
              { o: "Sí", p: 1 },
            ],
          },
        ],
        cuts: [
          { k: "Baja", min: 0, max: 4 },
          { k: "Media", min: 5, max: 8 },
          { k: "Alta", min: 9, max: 11 },
        ],
      },
      auto: { expert: "vereda", clin: "carga", review: "Cada 4 semanas" },
      goals: { daily: 9, weekly: 45 },
      pending: null,
      versions: [
        {
          v: 2,
          by: "Daniel Galvis",
          at: Date.parse("2026-10-08"),
          what: "Matriz v2: sin teléfono ⇒ Baja; uso diario ≤ teléfono; ánimo en app solo con capacidad Alta; cursos con el experto en Baja; PM+ en Moderado y Moderado-severo; revisitas en Leve.",
        },
        {
          v: 1,
          by: "Sistema",
          at: Date.now(),
          what: "Esquema inicial en MongoDB (colecciones vacías).",
        },
      ],
    },
    weekBase: {},
    rejected: {},
    pendingSync: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
