"use server";
/**
 * Acciones del paciente (Server Actions). Temporal: luego serán endpoints de nara-api
 *   misCitas      → GET   /api/clin/citas        (rol paciente: solo las suyas)
 *   calificarCita → PATCH /api/clin/citas/:id    (rol paciente: solo `rp`)
 *   solicitarCita → POST  /api/clin/solicitudes   (SPEC-07, caso P-05)
 */
import { getDb } from "@/lib/db/mongodb";
import { hoyColombia } from "@/modules/clinico/herramientas/tools/clin/fechas";
import { COLECCION, aCita, aPaciente, sesionCon } from "@/modules/clinico/herramientas/tools/clin/servidor";
import type { Cita, Respuesta } from "@/modules/clinico/herramientas/tools/clin/tipos";

export type Solicitud = { id: string; franja: "mañana" | "tarde"; estado: "solicitada" | "programada"; at: number };
export type MisCitas = { activo: boolean; perfil: string; clinico: string; hoy: string; citas: Cita[]; solicitud: Solicitud | null };
const SOLICITUDES = "clin_solicitudes";

async function miFicha() {
  const user = await sesionCon("paciente");
  const db = await getDb();
  const ficha =
    (user.patientId && (await db.collection("patients").findOne({ id: user.patientId }))) ||
    (await db.collection("patients").findOne({ accountId: user.id })) ||
    (await db.collection("patients").findOne({ id: user.id }));
  if (!ficha) throw new Error("No encontramos su ficha.");
  return { db, ficha: ficha as Record<string, unknown> };
}

export async function misCitas(): Promise<Respuesta<MisCitas>> {
  try {
    const { db, ficha } = await miFicha();
    const ajustes = await db.collection("program_settings").findOne({ key: "app_state" });
    const p = aPaciente(ficha, (ajustes?.pathOverrides as Record<string, never>) || {});
    const docs = p ? await db.collection(COLECCION).find({ patientId: p.id }).sort({ fecha: 1, hora: 1 }).toArray() : [];
    return {
      ok: true,
      data: {
        activo: !!p,
        perfil: String(ficha.profile || ""),
        clinico: String(ficha.clin || "su psicóloga"),
        hoy: hoyColombia(),
        citas: docs.map((d) => aCita(d as Record<string, unknown>)),
        solicitud: p ? await solicitudAbierta(db, String(ficha.id)) : null,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function calificarCita(id: string, valor: number | null): Promise<Respuesta<Cita>> {
  try {
    const { db, ficha } = await miFicha();
    const doc = await db.collection(COLECCION).findOne({ id: String(id), patientId: String(ficha.id) });
    if (!doc) throw new Error("Esa cita no es suya.");
    if (doc.hecha !== true) throw new Error("Podrá calificarla cuando su psicóloga la marque como realizada.");
    const v = valor == null ? null : Math.round(Number(valor));
    if (v != null && (v < 1 || v > 5)) throw new Error("La calificación va de 1 a 5.");
    await db.collection(COLECCION).updateOne({ id: doc.id }, { $set: { rp: v, updatedAt: new Date() } });
    return { ok: true, data: aCita({ ...doc, rp: v }) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

async function solicitudAbierta(db: Awaited<ReturnType<typeof getDb>>, patientId: string): Promise<Solicitud | null> {
  const d = await db.collection(SOLICITUDES).findOne({ patientId, estado: "solicitada" });
  return d ? { id: String(d.id), franja: d.franja as Solicitud["franja"], estado: "solicitada", at: Number(d.at) } : null;
}

/** SPEC-07: el paciente pide una cita (una abierta a la vez). El pid sale de la sesión, nunca del cliente. */
export async function solicitarCita(franja: string): Promise<Respuesta<Solicitud>> {
  try {
    const { db, ficha } = await miFicha();
    const f = franja === "tarde" ? "tarde" : "mañana";
    const abierta = await solicitudAbierta(db, String(ficha.id));
    if (abierta) throw new Error("Ya tiene una solicitud. Su psicóloga le responderá pronto.");
    const s: Solicitud = { id: `sol-${String(ficha.id)}-${Date.now()}`, franja: f, estado: "solicitada", at: Date.now() };
    await db.collection(SOLICITUDES).insertOne({
      ...s,
      patientId: String(ficha.id),
      code: String(ficha.code || ""),
      terr: String(ficha.terr || ""),
      origen: "paciente",
      createdAt: new Date(),
    });
    return { ok: true, data: s };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
