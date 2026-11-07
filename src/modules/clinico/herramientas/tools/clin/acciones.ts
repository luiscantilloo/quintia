"use server";
/**
 * Acciones del clínico (Server Actions). Temporal: luego serán los endpoints de nara-api
 *   listarAgenda      → GET   /api/clin/citas
 *   organizarPaciente → POST  /api/clin/organizar   (no guarda, devuelve propuesta)
 *   aceptarPropuesta  → PUT   /api/clin/citas
 *   actualizarCita    → PATCH /api/clin/citas/:id
 * La API key de OpenAI se lee aquí, en el servidor; nunca llega al navegador.
 */
import { randomUUID } from "node:crypto";
import { COLECCION, aCita, contextoClinico, sesionCon, validarPropuesta } from "./servidor";
import { FESTIVOS, HORAS, corta, esHabil, hora12, sumarDias, sumarMeses } from "./fechas";
import type { Agenda, Cita, CitaPropuesta, PacienteAgenda, Respuesta, ResultadoOrganizar } from "./tipos";

const MODELOS = () =>
  [...new Set([process.env.OPENAI_MODEL || "gpt-6-luna", ...(process.env.OPENAI_FALLBACK_MODELS || "gpt-4o-mini,gpt-4o").split(",").map((m) => m.trim()).filter(Boolean)])];

const falla = (e: unknown): { ok: false; error: string } => ({ ok: false, error: e instanceof Error ? e.message : "Error inesperado." });

async function citasDe(db: Awaited<ReturnType<typeof contextoClinico>>["db"], ids: string[]) {
  const docs = await db.collection(COLECCION).find({ patientId: { $in: ids } }).sort({ fecha: 1, hora: 1 }).toArray();
  return docs.map((d) => aCita(d as Record<string, unknown>));
}

/** Citas ya realizadas o que ya pasaron sin cerrar: nunca se reemplazan. */
const fija = (c: Cita, hoy: string) => c.hecha || c.fecha < hoy;

export async function listarAgenda(): Promise<Respuesta<Agenda>> {
  try {
    const user = await sesionCon("clinico");
    const { db, pacientes, sinClin, hoy } = await contextoClinico(user);
    const citas = await citasDe(db, pacientes.map((p) => p.id));
    const solicitudes = (
      await db.collection("clin_solicitudes").find({ patientId: { $in: pacientes.map((p) => p.id) }, estado: "solicitada" }).sort({ at: 1 }).toArray()
    ).map((d) => ({ id: String(d.id), patientId: String(d.patientId), code: String(d.code || ""), franja: String(d.franja), at: Number(d.at) }));
    return {
      ok: true,
      data: { clinico: user.name, hoy, terr: user.terr, pacientes, sinClin, citas, solicitudes, modelo: MODELOS()[0], iaReal: !!process.env.OPENAI_API_KEY },
    };
  } catch (e) {
    return falla(e);
  }
}

/* ---------- Organizar con IA ---------- */
const SISTEMA = `Eres el asistente de agenda del programa QUINTIA (salud mental, Colombia).
Organizas las citas de un paciente con su psicóloga clínica.
Responde SOLO con un objeto JSON con esta forma exacta:
{"citas":[{"fecha":"AAAA-MM-DD","hora":"HH:MM"}],"notas":["..."]}
Reglas obligatorias:
- La primera cita es 7 días después de fechaInicio; las siguientes siguen la periodicidad (Semanal = cada 7 días, Quincenal = cada 14 días, Mensual = mismo día de cada mes).
- Ninguna cita después de fechaFin. Ninguna cita antes de "hoy" ni en una fecha de citasRealizadas.
- Solo de lunes a viernes. Nunca en una fecha de la lista festivos: pásala al siguiente día hábil.
- Horas posibles: las de horasDisponibles. Usa la misma hora para el paciente siempre que se pueda.
- No cruces con agendaOcupada ("AAAA-MM-DD HH:MM"): si la hora está ocupada, usa otra hora libre ese día.
- En "notas" explica en español, en frases cortas, cada ajuste que hiciste (festivos, cruces). Máximo 5 notas.`;

function entradaIA(p: PacienteAgenda, hoy: string, realizadas: string[], ocupadas: string[], clinico: string) {
  return {
    paciente: p.code, perfil: p.profile, clinico, fechaInicio: p.inicio, fechaFin: p.fin, periodicidad: p.periodicidad,
    canal: p.canal, hoy, citasRealizadas: realizadas, agendaOcupada: ocupadas, horasDisponibles: HORAS,
    festivos: Object.keys(FESTIVOS).filter((f) => f >= p.inicio && f <= p.fin),
    reglas: ["Primera cita 7 días después del inicio", "Solo lunes a viernes", "Sin festivos de Colombia", "Sin cruces en la agenda del clínico", "Misma hora para el paciente cuando se pueda"],
  };
}

async function llamarModelo(modelo: string, entrada: object) {
  const nuevo = /gpt-6|o1|o3|o4|luna/i.test(modelo);
  const body: Record<string, unknown> = {
    model: modelo,
    messages: [{ role: "system", content: SISTEMA }, { role: "user", content: JSON.stringify(entrada) }],
    response_format: { type: "json_object" },
  };
  // gpt-6-luna gasta parte del cupo en razonamiento; una ruta de 12 meses semanal son ~52 citas.
  if (nuevo) body.max_completion_tokens = 12000;
  else Object.assign(body, { max_tokens: 4000, temperature: 0.2 });
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(120_000),
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${r.status}`);
  const texto = String(data?.choices?.[0]?.message?.content || "").replace(/^```(?:json)?|```$/g, "").trim();
  const json = JSON.parse(texto);
  if (!Array.isArray(json.citas)) throw new Error('La respuesta no trae la lista "citas".');
  return { citas: json.citas as CitaPropuesta[], notas: Array.isArray(json.notas) ? (json.notas as unknown[]).map(String) : [] };
}

/** Respaldo sin modelo: misma lógica del mockup (periodicidad, festivos al día hábil siguiente, sin cruces). */
function organizarSinModelo(p: PacienteAgenda, hoy: string, realizadas: string[], ocupadas: Set<string>) {
  const notas: string[] = [];
  const base = HORAS[[...p.code].reduce((a, c) => a + c.charCodeAt(0), 0) % HORAS.length];
  const paso = (f: string, i: number) =>
    p.periodicidad === "Semanal" ? sumarDias(f, 7 * i) : p.periodicidad === "Quincenal" ? sumarDias(f, 14 * i) : sumarMeses(f, i);
  const primera = sumarDias(p.inicio, 7);
  const citas: CitaPropuesta[] = [];
  for (let i = 0; i < 400; i++) {
    let f = paso(primera, i);
    if (f > p.fin) break;
    while (!esHabil(f)) {
      if (FESTIVOS[f] && f >= hoy) notas.push(`${corta(f)} es festivo (${FESTIVOS[f]}): pasó al día hábil siguiente.`);
      f = sumarDias(f, 1);
    }
    if (f < hoy || realizadas.includes(f)) continue;
    let h = base;
    if (ocupadas.has(`${f} ${h}`)) {
      h = HORAS.find((x) => !ocupadas.has(`${f} ${x}`)) || base;
      notas.push(`${corta(f)} a las ${hora12(base)} ya estaba ocupado en la agenda: quedó a las ${hora12(h)}.`);
    }
    citas.push({ fecha: f, hora: h });
  }
  return { citas, notas };
}

/**
 * Propone las citas de UN paciente. El cliente lo llama paciente por paciente
 * (así muestra el avance) pasando en `ocupExtra` lo que ya ocuparon los anteriores.
 */
export async function organizarPaciente(pid: string, ocupExtra: string[]): Promise<Respuesta<ResultadoOrganizar>> {
  try {
    const user = await sesionCon("clinico");
    const { db, pacientes, hoy } = await contextoClinico(user);
    const p = pacientes.find((x) => x.id === pid);
    if (!p) throw new Error("Ese paciente no está en su agenda.");
    const todas = await citasDe(db, pacientes.map((x) => x.id));
    const realizadas = todas.filter((c) => c.patientId === pid && fija(c, hoy)).map((c) => c.fecha);
    const ocupadasL = todas
      .filter((c) => c.patientId !== pid && fija(c, hoy) && c.fecha >= hoy)
      .map((c) => `${c.fecha} ${c.hora}`)
      .concat((ocupExtra || []).map(String));
    const ocupadas = new Set(ocupadasL);

    const t0 = Date.now();
    let modelo = "";
    let bruto: { citas: CitaPropuesta[]; notas: string[] } | null = null;
    let aviso = "";
    if (process.env.OPENAI_API_KEY) {
      const entrada = entradaIA(p, hoy, realizadas, ocupadasL, user.name);
      for (const m of MODELOS()) {
        try {
          bruto = await llamarModelo(m, entrada);
          modelo = m;
          break;
        } catch (e) {
          aviso = e instanceof Error ? e.message : String(e);
          if (/api key/i.test(aviso)) break;
        }
      }
    } else aviso = "falta OPENAI_API_KEY en el servidor";

    const real = !!bruto;
    if (!bruto) {
      bruto = organizarSinModelo(p, hoy, realizadas, ocupadas);
      modelo = "sin modelo";
      bruto.notas.unshift(`No se pudo usar la IA (${aviso}); se organizó con las reglas fijas.`);
    }
    const { lista, fuera } = validarPropuesta(p, bruto.citas, hoy, realizadas, ocupadas, HORAS);
    const notas = bruto.notas.slice(0, 5);
    if (fuera) notas.unshift(`Se descartaron ${fuera} ${fuera === 1 ? "cita" : "citas"} que no cumplían las reglas (fin de semana, festivo, cruce, fuera de la ruta o repetida).`);
    return { ok: true, data: { citas: lista, notas, modelo, ms: Date.now() - t0, real } };
  } catch (e) {
    return falla(e);
  }
}

/** Guarda la propuesta: reemplaza las citas futuras abiertas y conserva las realizadas y las por cerrar. */
export async function aceptarPropuesta(porPid: Record<string, CitaPropuesta[]>): Promise<Respuesta<{ guardadas: number }>> {
  try {
    const user = await sesionCon("clinico");
    const { db, pacientes, hoy } = await contextoClinico(user);
    const todas = await citasDe(db, pacientes.map((x) => x.id));
    const ocupadas = new Set(todas.filter((c) => fija(c, hoy) && !(c.patientId in porPid)).map((c) => `${c.fecha} ${c.hora}`));
    const ahora = new Date();
    let guardadas = 0;
    for (const [pid, propuesta] of Object.entries(porPid || {})) {
      const p = pacientes.find((x) => x.id === pid);
      if (!p) throw new Error("La propuesta incluye un paciente que no está en su agenda.");
      const propias = todas.filter((c) => c.patientId === pid);
      const realizadas = propias.filter((c) => fija(c, hoy)).map((c) => c.fecha);
      const { lista } = validarPropuesta(p, propuesta || [], hoy, realizadas, ocupadas, HORAS);
      const viejas = propias.filter((c) => !fija(c, hoy));
      const nuevas = lista.map((c) => {
        const v = viejas.find((x) => x.fecha === c.fecha);
        ocupadas.add(`${c.fecha} ${c.hora}`);
        return {
          id: `clin-${randomUUID()}`, patientId: pid, clinicianId: user.id, fecha: c.fecha, hora: c.hora, canal: p.canal,
          hecha: false, obs: v?.obs || "", rc: null, rp: null, plan: p.plan, origen: "ia", createdAt: ahora, updatedAt: ahora,
        };
      });
      await db.collection(COLECCION).deleteMany({ patientId: pid, hecha: { $ne: true }, fecha: { $gte: hoy } });
      if (nuevas.length) await db.collection(COLECCION).insertMany(nuevas);
      // SPEC-07: al programar citas, la solicitud abierta del paciente queda atendida.
      if (nuevas.length) await db.collection("clin_solicitudes").updateMany({ patientId: pid, estado: "solicitada" }, { $set: { estado: "programada", updatedAt: ahora } });
      guardadas += nuevas.length;
    }
    return { ok: true, data: { guardadas } };
  } catch (e) {
    return falla(e);
  }
}

export type CambioCita = { accion: "realizada" | "deshacer" } | { obs: string } | { rc: number | null };

export async function actualizarCita(id: string, cambio: CambioCita): Promise<Respuesta<Cita>> {
  try {
    const user = await sesionCon("clinico");
    const { db, pacientes, hoy } = await contextoClinico(user);
    const doc = await db.collection(COLECCION).findOne({ id: String(id) });
    if (!doc || !pacientes.some((p) => p.id === doc.patientId)) throw new Error("La cita no existe en su agenda.");
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if ("accion" in cambio) {
      if (doc.fecha > hoy) throw new Error("La cita se cierra desde su fecha.");
      if (cambio.accion === "realizada") Object.assign(set, { hecha: true, cerradaPor: user.id, cerradaEl: new Date() });
      else Object.assign(set, { hecha: false, rp: null }); // «Deshacer» borra la calificación del paciente
    } else if ("obs" in cambio) {
      set.obs = String(cambio.obs || "").slice(0, 4000);
    } else if ("rc" in cambio) {
      if (doc.fecha > hoy) throw new Error("La cita se califica desde su fecha.");
      const v = cambio.rc == null ? null : Math.round(Number(cambio.rc));
      if (v != null && (v < 1 || v > 5)) throw new Error("La calificación va de 1 a 5.");
      set.rc = v;
    }
    await db.collection(COLECCION).updateOne({ id: doc.id }, { $set: set });
    const nuevo = await db.collection(COLECCION).findOne({ id: doc.id });
    return { ok: true, data: aCita(nuevo as Record<string, unknown>) };
  } catch (e) {
    return falla(e);
  }
}
