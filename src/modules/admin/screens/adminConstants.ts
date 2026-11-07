export const TERR: {
  name: string;
  dep: string;
  level: string;
  experts: number;
  cap: number;
  goal: number;
  rural: number;
  ruralG: number;
  br: number;
  insts: number;
  isNew?: boolean;
  sixtyG?: number;
}[] = [];

export const EXPERTS: (string | number)[][] = [];

export const CHECKS: [string, string][] = [
  ["GPS al inicio y al final", "Visita no presencial o fuera del territorio"],
  ["Duración de la entrevista", "Solo informativa; ya no hay mínimo de tiempo"],
  ["Consentimiento firmado", "Personas inventadas"],
  ["Detección de duplicados", "Persona registrada dos veces o teléfono compartido"],
  ["Patrones de respuesta", "Respuestas idénticas entre visitas"],
  ["Borradores de TEJIVA confirmados muy rápido", "El experto no revisa lo que propone TEJIVA"],
  ["Llamadas aleatorias del supervisor (~5 %)", "Visitas que no ocurrieron"],
  ["SMS o WhatsApp a la persona", "«¿Le visitó [experto] hoy?»"],
];

/** @deprecated Usar `src/lib/nara-services/<id>.js` (note). Se mantiene por compat. */
export const NOTES: Record<string, string> = {
  mood: "Check-in «¿Cómo se siente hoy?» en la app · Diario, Semanal o Quincenal",
  clin: "Canal según capacidad digital (persona / teléfono / videollamada)",
  ia: "Botón TEJIVA en la app del paciente",
  frutas: "Atención visual y planificación · cada 2h, cada 8h o diario",
  simon: "Memoria de trabajo y atención · cada 2h, cada 8h o diario",
  duelo: "Flexibilidad y decisiones · cada 2h, cada 8h o diario",
  sudoku: "Lógica y planificación · cada 2h, cada 8h o diario",
  analizador: "Compara el desempeño de los juegos con el rango habitual",
};

export type AdminUiState = {
  view: string;
  agentOpen: boolean;
  terrFilter: string;
  /** Búsqueda en listado de territorios */
  terrQ: string;
  msg: string;
  msgActions: { label: string; go: () => void }[];
  terrForm: boolean;
  tf: {
    dep: string;
    mun: string;
    goal: string;
    level: string;
    rural: string;
    sixty: string;
    mods: { base: boolean; ctx: boolean; videos: boolean };
    insts: { hl: boolean; cu: boolean; cf: boolean };
  };
  tfErr: string;
  expForm: boolean;
  ef: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    terr: string;
    target: string;
    password: string;
  };
  /** Modal Definición metas (diaria / semanal del equipo). */
  goalsForm: boolean;
  gf: { daily: string; weekly: string };
  gfErr: string;
  sel: string;
  drafts: Record<string, { s: Record<string, string>; months: number; inactiveMinutes?: number }>;
  /** Borradores tocados en esta sesión (evita que un draft viejo tape el override aprobado). */
  pathDraftDirty?: Record<string, boolean>;
  scope: string;
  zoom?: number;
  teamTab?: string;
  pathTab?: string;
  /** Territorio activo en el asistente de Rutas (reglas + matriz). */
  pathTerr?: string;
  pfPer?: string;
  pfTerr?: string;
  pfSort?: string;
  pfDir?: number;
  rd?: unknown;
  rulesMsg?: string;
  au?: { expert: string; clin: string; review: string };
  autoMsg?: string;
  simPhq?: string;
  simDig?: string;
  simDano?: string;
  simLoss?: boolean;
  /** Matriz v2: fuerza capacidad digital Baja en el simulador. */
  simNoPhone?: boolean;
  simQ9?: boolean;
  libKind?: string;
  libSel?: string | null;
  libCourse?: string;
  q?: string;
  pf?: Record<string, string>;
  pendingAsk?: string;
  /** Detalle de activos: territorio + manilla | tablet */
  assetTerr?: string;
  assetKind?: "manilla" | "tablet";
  [key: string]: unknown;
};

export const INITIAL_ADMIN_STATE: AdminUiState = {
  view: "home",
  agentOpen: false,
  terrFilter: "",
  terrQ: "",
  msg: "",
  msgActions: [],
  terrForm: false,
  tf: {
    dep: "",
    mun: "",
    goal: "",
    level: "",
    rural: "",
    sixty: "",
    mods: { base: true, ctx: false, videos: false },
    insts: { hl: false, cu: false, cf: false },
  },
  tfErr: "",
  expForm: false,
  ef: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    terr: "",
    target: "",
    password: "",
  },
  goalsForm: false,
  gf: { daily: "", weekly: "" },
  gfErr: "",
  sel: "P08",
  drafts: {},
  pathDraftDirty: {},
  scope: "all",
};
