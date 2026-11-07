/** Tipos de la agenda del psicólogo clínico (compartidos por cliente y servidor). */
export type Cita = {
  id: string;
  patientId: string;
  fecha: string; // AAAA-MM-DD
  hora: string; // HH:MM
  canal: string;
  hecha: boolean; // la marcó el clínico como realizada
  obs: string;
  rc: number | null; // calificación del clínico
  rp: number | null; // calificación del paciente
  plan: string; // «periodicidad|meses» con el que se creó
  borr?: boolean; // solo en el cliente: cita de una propuesta sin aceptar
};

export type PacienteAgenda = {
  id: string;
  code: string;
  name: string;
  profile: string;
  riesgo: number;
  status: string;
  periodicidad: string;
  months: number;
  canal: string;
  inicio: string;
  fin: string;
  plan: string;
  /** «clin» en sus servicios activos (dato por revisar si es false). */
  clinEnModulos: boolean;
};

export type Agenda = {
  clinico: string;
  hoy: string;
  terr: string;
  pacientes: PacienteAgenda[];
  sinClin: { id: string; name: string; profile: string }[];
  citas: Cita[];
  /** SPEC-07: citas que pidieron los pacientes y aún no se programan. */
  solicitudes: { id: string; patientId: string; code: string; franja: string; at: number }[];
  modelo: string;
  iaReal: boolean;
};

export type CitaPropuesta = { fecha: string; hora: string };

export type ResultadoOrganizar = {
  citas: CitaPropuesta[];
  notas: string[];
  modelo: string;
  ms: number;
  real: boolean;
};

export type Respuesta<T> = { ok: true; data: T } | { ok: false; error: string };
