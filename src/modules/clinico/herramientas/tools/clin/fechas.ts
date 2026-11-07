import clin from "@/lib/nara-services/clin.js";

/** Utilidades de fecha de la agenda (fechas «AAAA-MM-DD», sin zona horaria). */
export const FESTIVOS: Record<string, string> = clin.festivos;
export const HORAS: string[] = clin.horas;
export const CANALES: string[] = clin.canales;

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const iso = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
export const fecha = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const sumarDias = (s: string, n: number) => {
  const x = fecha(s);
  x.setDate(x.getDate() + n);
  return iso(x);
};
export const sumarMeses = (s: string, n: number) => {
  const x = fecha(s);
  const dia = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  const fin = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(dia, fin));
  return iso(x);
};
export const esHabil = (s: string) => ![0, 6].includes(fecha(s).getDay()) && !FESTIVOS[s];
export const larga = (s: string) => {
  const x = fecha(s);
  return `${DIAS[x.getDay()]} ${x.getDate()} de ${MESES[x.getMonth()]}`;
};
export const corta = (s: string) => {
  const x = fecha(s);
  return `${x.getDate()} ${MESES[x.getMonth()].slice(0, 3)} ${x.getFullYear()}`;
};
export const hora12 = (h: string) => {
  const [a, b] = h.split(":").map(Number);
  return `${((a + 11) % 12) + 1}:${String(b).padStart(2, "0")} ${a < 12 ? "a. m." : "p. m."}`;
};
/** Hoy en Colombia (UTC−5, sin horario de verano). */
export const hoyColombia = () => iso(new Date(Date.now() - 5 * 3600_000 + new Date().getTimezoneOffset() * 60_000));
