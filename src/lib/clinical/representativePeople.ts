/**
 * Datos de prueba / depuración operativa:
 * como máximo 15 personas representativas (una por perfil P01–P15),
 * en lugar de procesar toda la cohorte histórica.
 */

export const REPRESENTATIVE_PROFILE_CODES = Array.from(
  { length: 15 },
  (_, i) => "P" + String(i + 1).padStart(2, "0"),
);

export type PersonLike = {
  id?: string;
  code?: string;
  name?: string;
  profile?: string | null;
  terr?: string;
  place?: string;
  age?: number;
  status?: string;
  expert?: string;
  week?: number;
  weeks?: number;
  [key: string]: unknown;
};

function profileKey(p: PersonLike): string | null {
  const s = p?.profile != null ? String(p.profile) : "";
  if (!/^P\d+$/i.test(s)) return null;
  const n = parseInt(s.slice(1), 10);
  if (!Number.isFinite(n) || n < 1 || n > 15) return null;
  return "P" + String(n).padStart(2, "0");
}

/**
 * Devuelve como máximo 15 personas: la primera encontrada por cada código P01–P15.
 * Orden estable por código de perfil.
 */
export function pickRepresentativePeople<T extends PersonLike>(people: T[]): T[] {
  const byCode = new Map<string, T>();
  for (const p of people || []) {
    const code = profileKey(p);
    if (!code || byCode.has(code)) continue;
    byCode.set(code, p);
    if (byCode.size >= 15) break;
  }
  return REPRESENTATIVE_PROFILE_CODES.map((c) => byCode.get(c)).filter(Boolean) as T[];
}

/** True si la persona entra en el set de depuración (perfil P01–P15 y es la elegida). */
export function isRepresentativePerson(
  person: PersonLike,
  sample: PersonLike[],
): boolean {
  const id = String(person.id || person.code || "");
  return sample.some((s) => String(s.id || s.code || "") === id);
}
