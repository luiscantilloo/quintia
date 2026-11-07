/**
 * Política de claves (punto 5 · tarea 2).
 * El formulario de /usuarios y el cambio de clave deben rechazar antes de llamar a la API.
 */

const SHARED_PRIVILEGED_PASSWORDS = ["naraprueba#2026", "adminnara2026"];

function norm(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function identityFragments(email: string, name: string): string[] {
  const out: string[] = [];
  const em = norm(email);
  if (em) {
    out.push(em);
    const local = em.split("@")[0] || "";
    if (local.length >= 3) out.push(local);
  }
  const nm = norm(name);
  if (nm) {
    out.push(nm);
    for (const part of nm.split(/\s+/).filter((p) => p.length >= 3)) {
      out.push(part);
    }
  }
  return [...new Set(out.filter(Boolean))];
}

function isPrivilegedRole(role: string) {
  const r = norm(role);
  return (
    r === "administrador" ||
    r === "administradora" ||
    r === "admin" ||
    r === "clinico" ||
    r === "clínico" ||
    r === "clinica" ||
    r === "experto de campo" ||
    r === "gestor de campo" ||
    r === "gestor" ||
    r === "experto"
  );
}

function needsLongPassword(role: string) {
  const r = norm(role);
  return (
    r === "administrador" ||
    r === "administradora" ||
    r === "admin" ||
    r === "clinico" ||
    r === "clínico" ||
    r === "clinica"
  );
}

export type PasswordPolicyInput = {
  password: string;
  email?: string;
  name?: string;
  role?: string;
};

/** Devuelve mensaje de error o null si la clave es aceptable. */
export function passwordPolicyError(input: PasswordPolicyInput): string | null {
  const password = String(input.password || "");
  if (!password) return null;

  const role = String(input.role || "");
  const minLen = needsLongPassword(role) ? 12 : 8;
  if (password.length < minLen) {
    return needsLongPassword(role)
      ? "La contraseña de Administrador o Clínico debe tener al menos 12 caracteres."
      : "La contraseña debe tener al menos 8 caracteres.";
  }

  const passN = norm(password);
  for (const frag of identityFragments(String(input.email || ""), String(input.name || ""))) {
    if (frag && passN.includes(frag)) {
      return "La contraseña no puede contener el correo, la parte antes de @ ni el nombre de la cuenta.";
    }
  }

  if (isPrivilegedRole(role) && SHARED_PRIVILEGED_PASSWORDS.includes(passN)) {
    return "Esa clave es compartida entre cuentas de prueba. Use una distinta para cada rol privilegiado.";
  }

  return null;
}

export function minPasswordLengthForRole(role: string): number {
  return needsLongPassword(role) ? 12 : 8;
}
