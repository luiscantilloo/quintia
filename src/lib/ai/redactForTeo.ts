/**
 * Limpieza de texto antes de enviarlo a TEJIVA / n8n (punto 5 · T3/T4).
 * Teléfonos (7+ dígitos con separadores) → [tel]; correos → [correo].
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
/** Secuencias de 7+ dígitos aunque tengan espacios, guiones, + o paréntesis. */
const PHONE_RE = /(?:\+?\d[\d\s().-]{5,}\d)/g;

export function redactTextForTeo(input: string): string {
  return String(input || "")
    .replace(EMAIL_RE, "[correo]")
    .replace(PHONE_RE, (match) => {
      const digits = match.replace(/\D/g, "");
      return digits.length >= 7 ? "[tel]" : match;
    });
}

export function redactForTeoDeep<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === "string") return redactTextForTeo(value) as T;
  if (Array.isArray(value)) return value.map((x) => redactForTeoDeep(x)) as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactForTeoDeep(v);
    }
    return out as T;
  }
  return value;
}
