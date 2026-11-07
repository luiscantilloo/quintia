import raw from "./colombia.json";

export type ColombiaDepartment = {
  id: number;
  departamento: string;
  ciudades: string[];
};

/** Opción de prueba (QA / demos), disponible en departamento y municipio. */
export const COLOMBIA_TEST_PLACE = "Prueba";

const DEPARTMENTS = raw as ColombiaDepartment[];

/** Departamentos de Colombia + opción Prueba. */
export const COLOMBIA_DEPARTMENTS: string[] = [
  COLOMBIA_TEST_PLACE,
  ...DEPARTMENTS.map((d) => d.departamento).sort((a, b) =>
    a.localeCompare(b, "es"),
  ),
];

const BY_DEP = new Map(
  DEPARTMENTS.map((d) => [
    d.departamento,
    d.ciudades.slice().sort((a, b) => a.localeCompare(b, "es")),
  ]),
);

/** Municipios / ciudades de un departamento (+ Prueba). */
export function municipalitiesOf(department: string): string[] {
  if (department === COLOMBIA_TEST_PLACE) return [COLOMBIA_TEST_PLACE];
  const list = BY_DEP.get(department)?.slice() ?? [];
  if (!list.length) return department ? [COLOMBIA_TEST_PLACE] : [];
  return [COLOMBIA_TEST_PLACE, ...list.filter((m) => m !== COLOMBIA_TEST_PLACE)];
}

/** Todos los municipios (con departamento para búsqueda). */
export function allMunicipalities(): { municipio: string; departamento: string }[] {
  const out: { municipio: string; departamento: string }[] = [];
  for (const d of DEPARTMENTS) {
    for (const m of d.ciudades) {
      out.push({ municipio: m, departamento: d.departamento });
    }
  }
  return out;
}

/**
 * Asegura que «Prueba» aparezca en listas de territorios (usuarios, expertos, filtros).
 * Va al final para no desplazar el territorio por defecto de rutas.
 * La API materializa «Prueba» en BD la primera vez que se asigna.
 */
export function withTestTerritory(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const t = String(n || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  if (!seen.has(COLOMBIA_TEST_PLACE.toLowerCase())) {
    out.push(COLOMBIA_TEST_PLACE);
  }
  return out;
}
