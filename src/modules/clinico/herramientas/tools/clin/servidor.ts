/**
 * Lógica de servidor de la agenda del psicólogo clínico (la usan los `acciones.ts`).
 * Temporal: cuando pase a nara-api, esto se convierte en los endpoints /api/clin/*.
 */
import type { Db } from "mongodb";
import { getDb } from "@/lib/db/mongodb";
import { loadSessionUser, type SessionUser } from "@/lib/auth/session";
import { roleAllowed } from "@/lib/db/roles";
import { CANALES, esHabil, fecha, hoyColombia, iso, sumarMeses } from "./fechas";
import type { Cita, PacienteAgenda } from "./tipos";

export const COLECCION = "clin_citas";

export async function sesionCon(rol: "clinico" | "paciente"): Promise<SessionUser> {
  const user = await loadSessionUser();
  if (!user) throw new Error("Sin permiso para esta acción.");
  // persona → paciente (alias Quintia); no exigir roleId literal.
  if (roleAllowed(user.roleId, [rol])) return user;
  if (rol === "paciente" && /paciente|persona\s*acompa/i.test(user.role || "")) return user;
  if (rol === "clinico" && /cl[ií]nico/i.test(user.role || "")) return user;
  throw new Error("Sin permiso para esta acción.");
}

/** Riesgo (0–4) y capacidad digital (0–2) desde el código de perfil P01–P15. */
export function riesgoDigital(perfil: string) {
  const n = parseInt(String(perfil).slice(1), 10) - 1;
  return { r: Math.floor(n / 3), d: n % 3 };
}

type Override = { s?: Record<string, string | null>; months?: number };

/**
 * Periodicidad del clínico y meses de la ruta del perfil.
 * Misma regla que `pathList` de `src/lib/store/store.js`: el override de Rutas gana,
 * '' o null apaga el servicio y si falta la clave se usa la ruta por defecto.
 */
export function rutaClin(perfil: string, overrides: Record<string, Override>) {
  const { r } = riesgoDigital(perfil);
  const porDefecto = r <= 2 ? "Mensual" : r === 3 ? "Quincenal" : "Semanal";
  const mesesDefecto = r <= 1 ? 3 : r === 2 ? 6 : 12;
  const ov = overrides[perfil];
  let periodicidad: string | null = porDefecto;
  if (ov && ov.s && typeof ov.s === "object" && Object.prototype.hasOwnProperty.call(ov.s, "clin")) {
    const v = ov.s.clin;
    periodicidad = v === "" || v == null ? null : String(v);
  }
  const months = ov && ov.months != null ? Number(ov.months) : mesesDefecto;
  return { periodicidad, months };
}

async function leerOverrides(db: Db): Promise<Record<string, Override>> {
  const doc = await db.collection("program_settings").findOne({ key: "app_state" });
  return (doc?.pathOverrides as Record<string, Override>) || {};
}

const inicioDe = (p: Record<string, unknown>) => {
  const t = p.evalAt ?? p.createdAt;
  const d = t ? new Date(t as string | number) : new Date();
  return iso(new Date(d.getTime() - 5 * 3600_000 + d.getTimezoneOffset() * 60_000));
};

export function aPaciente(p: Record<string, unknown>, overrides: Record<string, Override>): PacienteAgenda | null {
  const perfil = String(p.profile || "");
  if (!/^P(0[1-9]|1[0-5])$/.test(perfil)) return null;
  const { periodicidad, months } = rutaClin(perfil, overrides);
  if (!periodicidad) return null;
  const { r, d } = riesgoDigital(perfil);
  const inicio = inicioDe(p);
  const mods = Array.isArray(p.modulesEnabled) ? (p.modulesEnabled as string[]) : null;
  return {
    id: String(p.id),
    code: String(p.code || p.id),
    name: String(p.name || "Paciente"),
    profile: perfil,
    riesgo: r,
    status: String(p.status || ""),
    periodicidad,
    months,
    canal: CANALES[d],
    inicio,
    fin: sumarMeses(inicio, months),
    plan: `${periodicidad}|${months}`,
    clinEnModulos: mods ? mods.includes("clin") : true,
  };
}

/** Pacientes del territorio del clínico (todos si el clínico no tiene territorio). */
export async function contextoClinico(user: SessionUser) {
  const db = await getDb();
  const overrides = await leerOverrides(db);
  const filtro = user.terr ? { terr: user.terr } : {};
  const docs = (await db.collection("patients").find(filtro).toArray()) as Record<string, unknown>[];
  const pacientes: PacienteAgenda[] = [];
  const sinClin: { id: string; name: string; profile: string }[] = [];
  for (const doc of docs) {
    const p = aPaciente(doc, overrides);
    if (p) pacientes.push(p);
    else if (/^P\d+$/.test(String(doc.profile || ""))) sinClin.push({ id: String(doc.id), name: String(doc.name || ""), profile: String(doc.profile) });
  }
  pacientes.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return { db, pacientes, sinClin, hoy: hoyColombia() };
}

export function aCita(doc: Record<string, unknown>): Cita {
  return {
    id: String(doc.id),
    patientId: String(doc.patientId),
    fecha: String(doc.fecha),
    hora: String(doc.hora),
    canal: String(doc.canal || ""),
    hecha: doc.hecha === true,
    obs: String(doc.obs || ""),
    rc: typeof doc.rc === "number" ? doc.rc : null,
    rp: typeof doc.rp === "number" ? doc.rp : null,
    plan: String(doc.plan || ""),
  };
}

/** Valida las citas que propone el modelo (o el respaldo) para un paciente. */
export function validarPropuesta(
  p: PacienteAgenda,
  citas: { fecha?: unknown; hora?: unknown }[],
  hoy: string,
  realizadas: string[],
  ocupadas: Set<string>,
  horas: string[],
) {
  const vistas = new Set<string>();
  let fuera = 0;
  const lista = citas
    .map((c) => ({ fecha: String(c.fecha || ""), hora: String(c.hora || "") }))
    .filter((c) => {
      const ok =
        /^\d{4}-\d{2}-\d{2}$/.test(c.fecha) && !Number.isNaN(fecha(c.fecha).getTime()) && horas.includes(c.hora) &&
        c.fecha >= hoy && c.fecha <= p.fin && esHabil(c.fecha) &&
        !realizadas.includes(c.fecha) && !vistas.has(c.fecha) && !ocupadas.has(`${c.fecha} ${c.hora}`);
      if (ok) vistas.add(c.fecha);
      else fuera++;
      return ok;
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { lista, fuera };
}
