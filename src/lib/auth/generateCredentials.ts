/** Dominio fijo de cuentas QUINTIA. */
export const CONSCIENTE_EMAIL_DOMAIN = "quintia.com";
/** Alias explícito de marca. */
export const QUINTIA_EMAIL_DOMAIN = CONSCIENTE_EMAIL_DOMAIN;

function slugPart(raw: string): string {
  return String(raw || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Correo de acceso: nombre.apellido@quintia.com
 * Usa la primera palabra del nombre y la primera del apellido.
 */
export function generateConsienteEmail(firstName: string, lastName?: string): string {
  const first = slugPart(String(firstName || "").split(/\s+/)[0] || "");
  const lastRaw = String(lastName || "").trim();
  const last = slugPart(
    lastRaw
      ? lastRaw.split(/\s+/)[0] || ""
      : String(firstName || "").split(/\s+/)[1] || "",
  );
  if (!first && !last) return "";
  if (!last) return `${first}@${CONSCIENTE_EMAIL_DOMAIN}`;
  if (!first) return `${last}@${CONSCIENTE_EMAIL_DOMAIN}`;
  return `${first}.${last}@${CONSCIENTE_EMAIL_DOMAIN}`;
}

/** Alias de marca. */
export const generateQuintiaEmail = generateConsienteEmail;

/** Contraseña aleatoria (misma lógica que Usuarios). */
export function generateAccessPassword(len = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const n = Math.max(8, len);
  const bytes = new Uint8Array(n);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < n; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}
