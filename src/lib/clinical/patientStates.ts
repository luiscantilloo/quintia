/**
 * Estados del control de pacientes (fuente de verdad).
 *
 * Flujo clínico:
 *  Sin evaluación → (experto termina) → Por aprobar
 *    → (clínico aprueba) → Activo
 *    → (clínico rechaza) → Rechazado → (experto reevalúa) → Por aprobar
 *
 * Solo en administrador (vista Personas), sobre pacientes en ruta:
 *  · Inactivo — sin actividad en la app (login/clics) más allá del umbral
 *    del perfil (por defecto 1 día); al volver, se muestra de nuevo Activo.
 *  · Terminado blanco — cumplió tiempo de ruta + actividades; falta la
 *    evaluación de cierre del experto de campo.
 *  · Terminado negro — esa evaluación de cierre ya se realizó.
 */
export const PATIENT_STATES = [
  {
    id: "sin_evaluacion",
    label: "Sin evaluación",
    bg: "#E7FAF5",
    fg: "#0F2D3B",
  },
  {
    id: "por_aprobar",
    label: "Por aprobar",
    bg: "#F7E2D2",
    fg: "#7A3A10",
  },
  {
    id: "aprobado",
    label: "Aprobado",
    bg: "#E5E0D5",
    fg: "#0F2D3B",
  },
  {
    id: "rechazado",
    label: "Rechazado",
    bg: "#EFDCDA",
    fg: "#9C2F25",
  },
  {
    id: "activo",
    label: "Activo",
    bg: "#E5E0D5",
    fg: "#0F2D3B",
  },
  {
    id: "inactivo",
    label: "Inactivo",
    bg: "#F7F5EF",
    fg: "#6B7280",
  },
  {
    id: "terminado_blanco",
    label: "Terminado blanco",
    bg: "#F7F5F1",
    fg: "#0F2D3B",
  },
  {
    id: "terminado_negro",
    label: "Terminado negro",
    bg: "#0F2D3B",
    fg: "#F7F5F1",
  },
  {
    id: "crisis",
    label: "Crisis",
    bg: "#6B0000",
    fg: "#FFFFFF",
  },
] as const;

export type PatientStateId = (typeof PATIENT_STATES)[number]["id"];

const BY_ID = Object.fromEntries(PATIENT_STATES.map((s) => [s.id, s])) as Record<
  PatientStateId,
  (typeof PATIENT_STATES)[number]
>;

/** Alias de etiquetas legacy / tipográficas → id canónico. */
const LABEL_ALIASES: Record<string, PatientStateId> = {
  "sin evaluacion": "sin_evaluacion",
  "sin evaluación": "sin_evaluacion",
  "por aprobar": "por_aprobar",
  pendiente: "por_aprobar",
  // Tras aprobar la evaluación el estado operativo es Activo.
  aprobado: "activo",
  aprobada: "activo",
  activa: "activo",
  activo: "activo",
  rechazado: "rechazado",
  rechazada: "rechazado",
  inactiva: "inactivo",
  inactivo: "inactivo",
  "terminado blanco": "terminado_blanco",
  "terminado_blanco": "terminado_blanco",
  "terminado negro": "terminado_negro",
  "terminado_negro": "terminado_negro",
  // «Terminado» solo → blanco (aún falta evaluación de cierre).
  terminado: "terminado_blanco",
  terminada: "terminado_blanco",
  crisis: "crisis",
  "en crisis": "crisis",
  completada: "terminado_blanco",
  "ruta completada": "terminado_blanco",
  "ruta terminada": "terminado_blanco",
  retirada: "inactivo",
  baja: "inactivo",
};

/** Etiqueta canónica para persistir en people.status / patients.status. */
export function patientStateLabel(id: PatientStateId): string {
  return (BY_ID[id] || BY_ID.activo).label;
}

/** Normaliza texto de estado al id canónico. */
export function normalizePatientState(
  raw: unknown,
  opts?: {
    hasProfile?: boolean;
    inCrisis?: boolean;
    inactiveDays?: number | null;
    /** Ms sin actividad (login/clics). Preferido sobre inactiveDays. */
    inactiveMs?: number | null;
    inactiveThresholdMs?: number | null;
    inactiveLock?: boolean;
    pendingEval?: boolean;
  },
): PatientStateId {
  if (opts?.inCrisis) return "crisis";
  if (opts?.inactiveLock) return "inactivo";
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const aliased = s ? LABEL_ALIASES[s] : undefined;
  // «Activa» quedó como valor por defecto de la carga. Sin perfil no hubo
  // evaluación ni aprobación, así que el estado de nacimiento es Sin evaluación.
  if (aliased === "activo" && opts?.hasProfile === false) return "sin_evaluacion";

  // Crisis / terminados / flujo de evaluación: no pasan a Inactivo por tiempo.
  if (
    aliased === "crisis" ||
    aliased === "terminado_blanco" ||
    aliased === "terminado_negro" ||
    aliased === "por_aprobar" ||
    aliased === "rechazado" ||
    aliased === "sin_evaluacion"
  ) {
    return aliased;
  }

  const thresholdMs =
    opts?.inactiveThresholdMs != null
      ? opts.inactiveThresholdMs
      : inactivityThresholdMs();
  const inactiveByTime =
    (opts?.inactiveMs != null && opts.inactiveMs >= thresholdMs) ||
    (opts?.inactiveDays != null && opts.inactiveDays >= INACTIVITY_DAYS);

  // Activo / Aprobado / Inactivo (o sin alias): umbral de inactividad del perfil.
  if (
    inactiveByTime &&
    (aliased === "activo" ||
      aliased === "aprobado" ||
      aliased === "inactivo" ||
      !aliased)
  ) {
    return "inactivo";
  }

  if (aliased) return aliased;
  if (!opts?.hasProfile) return "sin_evaluacion";
  // Perfil ya calculado, pendiente de visto bueno clínico.
  if (opts?.pendingEval) return "por_aprobar";
  return "activo";
}

export function patientStateMeta(id: PatientStateId) {
  return BY_ID[id] || BY_ID.activo;
}

/** 15 perfiles P01–P15 (5 riesgo × 3 digital). */
export function profileCatalog(RISK: { k: string }[], DIG: { k: string }[]) {
  const rows: {
    code: string;
    risk: number;
    dig: number;
    riskLabel: string;
    digLabel: string;
    label: string;
  }[] = [];
  for (let r = 0; r < 5; r++) {
    for (let d = 0; d < 3; d++) {
      const code = "P" + String(r * 3 + d + 1).padStart(2, "0");
      rows.push({
        code,
        risk: r,
        dig: d,
        riskLabel: RISK[r]?.k || "",
        digLabel: DIG[d]?.k || "",
        label:
          code +
          " · " +
          (RISK[r]?.k || "") +
          " × digital " +
          (DIG[d]?.k || "").toLowerCase(),
      });
    }
  }
  return rows;
}

/** Días legacy (producción objetivo). Pruebas usan minutos del perfil. */
export const INACTIVITY_DAYS = 3;

/** Umbral por defecto del perfil: 1 día sin login/actividad. */
export const DEFAULT_INACTIVE_MINUTES = 1440;

export function inactivityThresholdMs(minutes?: number | null): number {
  const m = Number(minutes);
  const mins =
    Number.isFinite(m) && m > 0 ? m : DEFAULT_INACTIVE_MINUTES;
  return Math.round(mins * 60_000);
}

function toMs(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
  const t = new Date(v as string | Date).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Ms de inactividad desde que el paciente está Activo.
 * El reloj empieza en activeAt (aprobación clínica); lastLoginAt solo cuenta
 * si es posterior (actividad en la app). Sin activeAt → no marcar Inactivo
 * por tiempo (evita nacer Inactivo al aprobar con cuenta vieja).
 */
export function inactiveMsFromAccount(
  acc: {
    lastLoginAt?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  } | null | undefined,
  opts?: { activeAt?: unknown } | null,
): number | null {
  const active = toMs(opts?.activeAt);
  if (!(active > 0)) return null;
  const last = toMs(acc?.lastLoginAt);
  const baseline = last > active ? last : active;
  return Math.max(0, Date.now() - baseline);
}

/** Días sin ingreso a la app (cuenta paciente). null = sin reloj de Activo. */
export function inactiveDaysFromAccount(
  acc: {
    lastLoginAt?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  } | null | undefined,
  opts?: { activeAt?: unknown } | null,
): number | null {
  const ms = inactiveMsFromAccount(acc, opts);
  if (ms == null) return null;
  return Math.floor(ms / 86_400_000);
}

export type AdminPersonStateInput = {
  status?: unknown;
  profile?: unknown;
  pendingEval?: boolean;
  week?: unknown;
  weeks?: unknown;
  id?: unknown;
  code?: unknown;
  email?: unknown;
  accountId?: unknown;
  /** Timestamp de la evaluación de cierre del experto. */
  finalEvalAt?: unknown;
  /** Bloqueo local de inactividad hasta que el paciente pulse «Volví». */
  inactiveLock?: boolean;
  /** Cuándo pasó a Activo (arranque del reloj de inactividad). */
  activeAt?: unknown;
};

/** ¿Ruta cumplida en tiempo y actividades? */
export function isRouteFullyDone(
  p: { week?: unknown; weeks?: unknown },
  opts?: { courseDone?: number | null; courseWeeks?: number | null },
): boolean {
  const weeks = Number(p.weeks) || 0;
  const week = Number(p.week) || 0;
  const timeDone = weeks > 0 && week >= weeks;
  const courseWeeks = opts?.courseWeeks != null ? Number(opts.courseWeeks) : null;
  const courseDone = opts?.courseDone != null ? Number(opts.courseDone) : null;
  const activitiesDone =
    courseWeeks != null &&
    courseWeeks > 0 &&
    courseDone != null &&
    courseDone >= courseWeeks;
  return timeDone && activitiesDone;
}

/** ¿Falta la evaluación de cierre? (Terminado blanco). */
export function needsClosingEval(
  p: AdminPersonStateInput,
  opts?: { courseDone?: number | null; courseWeeks?: number | null },
): boolean {
  const raw = String(p.status || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/terminado\s*negro/.test(raw) || raw === "terminado_negro") return false;
  if (p.finalEvalAt != null && Number(p.finalEvalAt) > 0) return false;
  if (/terminado\s*blanco/.test(raw) || raw === "terminado_blanco") return true;
  if (raw === "terminado" || raw === "terminada") return true;
  const hasProfile = !!(p.profile && /^P\d+$/i.test(String(p.profile)));
  return hasProfile && isRouteFullyDone(p, opts);
}

/**
 * Estado mostrado en Administrador → Personas.
 * Inactivo / Terminado blanco / Terminado negro son derivados o persistidos
 * y no pisan Por aprobar / Sin evaluación / Rechazado / Crisis.
 */
export function resolveAdminPersonState(
  p: AdminPersonStateInput,
  opts?: {
    account?: {
      lastLoginAt?: unknown;
      createdAt?: unknown;
      updatedAt?: unknown;
      roleId?: string;
      role?: string;
    } | null;
    /** Minutos del perfil (ruta) para marcar Inactivo. */
    inactiveMinutes?: number | null;
    courseDone?: number | null;
    courseWeeks?: number | null;
    inCrisis?: boolean;
  },
): PatientStateId {
  const hasProfile = !!(p.profile && /^P\d+$/i.test(String(p.profile)));
  const base = normalizePatientState(p.status, {
    hasProfile,
    pendingEval: p.pendingEval === true,
    inCrisis: opts?.inCrisis,
  });

  if (
    base === "crisis" ||
    base === "sin_evaluacion" ||
    base === "por_aprobar" ||
    base === "rechazado"
  ) {
    return base;
  }

  // Cierre de ruta: blanco (falta eval experto) o negro (ya hecha).
  if (base === "terminado_negro") return "terminado_negro";
  if (
    base === "terminado_blanco" ||
    needsClosingEval(p, {
      courseDone: opts?.courseDone,
      courseWeeks: opts?.courseWeeks,
    })
  ) {
    if (p.finalEvalAt != null && Number(p.finalEvalAt) > 0) {
      return "terminado_negro";
    }
    return "terminado_blanco";
  }

  // Inactivo solo en pacientes ya en ruta: sin actividad ≥ umbral, o inactiveLock.
  // El tiempo solo corre desde activeAt (no desde creación de cuenta / login previo).
  if (base === "activo" || base === "aprobado" || base === "inactivo") {
    if (p.inactiveLock === true) return "inactivo";
    const ms = inactiveMsFromAccount(opts?.account, { activeAt: p.activeAt });
    const threshold = inactivityThresholdMs(opts?.inactiveMinutes);
    if (ms != null && ms >= threshold) return "inactivo";
    if (base === "inactivo") return "activo";
    return "activo";
  }

  return base;
}
