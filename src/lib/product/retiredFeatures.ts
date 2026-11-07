/**
 * Funciones retiradas de QUINTIA (no se ofrecen en UI ni en rutas nuevas).
 * Manillas, PM+/grupos de apoyo y cuentos quedan fuera del producto.
 */
export const RETIRED = {
  manillas: true,
  pmplus: true,
  gruposApoyo: true,
  cuentos: true,
  cursos: true,
} as const;

export function isRetiredServiceId(id: string): boolean {
  const k = String(id || "").toLowerCase();
  return (
    k === "bracelet" ||
    k === "manilla" ||
    k === "pmplus" ||
    k === "group" ||
    k === "cuentos" ||
    k === "cursos" ||
    k === "story" ||
    k === "stories"
  );
}
