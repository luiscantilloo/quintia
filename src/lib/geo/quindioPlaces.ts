/** Centros aproximados de municipios del Eje Cafetero (WGS84). */
export const TERR_CENTERS: Record<string, [number, number]> = {
  Salento: [4.6372, -75.5706],
  Filandia: [4.6736, -75.6586],
  Armenia: [4.5339, -75.6811],
  Calarcá: [4.5294, -75.6406],
  Pereira: [4.8133, -75.6961],
  Manizales: [5.0703, -75.5138],
  Chinchiná: [4.9828, -75.6036],
};

/** Veredas / barrios con coordenadas aproximadas conocidas. */
const PLACE_COORDS: Record<string, [number, number]> = {
  // Salento
  cocora: [4.638, -75.487],
  "valle de cocora": [4.638, -75.487],
  boquia: [4.655, -75.585],
  "la palmera": [4.62, -75.55],
  palestina: [4.61, -75.54],
  "la esperanza": [4.645, -75.56],
  "san juan de carolina": [4.66, -75.52],
  "el roble": [4.625, -75.58],
  "alto del barrio": [4.64, -75.575],
  centro: [4.6372, -75.5706],
  // Filandia
  "el crucero": [4.68, -75.65],
  "la india": [4.69, -75.64],
  barcelona: [4.66, -75.67],
  // Armenia
  "la castellana": [4.545, -75.67],
  "el bosque": [4.52, -75.69],
  "la alcazaba": [4.54, -75.695],
};

function hash(str: string) {
  let x = 3;
  for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0;
  return x;
}

export function normalizePlaceKey(name: string) {
  return name
    .replace(/^(Vereda|Barrio)\s+/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Resuelve lat/lng: catálogo → centro del territorio + jitter estable. */
export function resolvePlaceLatLng(
  placeName: string,
  terrName: string,
  seed = 0,
): [number, number] {
  const key = normalizePlaceKey(placeName);
  if (PLACE_COORDS[key]) {
    const [lat, lng] = PLACE_COORDS[key];
    if (!seed) return [lat, lng];
    const k = hash(placeName + seed);
    return [lat + ((k % 40) - 20) * 0.00012, lng + (((k >>> 8) % 40) - 20) * 0.00012];
  }

  const center = TERR_CENTERS[terrName] || TERR_CENTERS.Salento;
  const k = hash(key + terrName + seed);
  const dLat = ((k % 80) - 40) * 0.00035;
  const dLng = (((k >>> 9) % 80) - 40) * 0.00035;
  return [center[0] + dLat, center[1] + dLng];
}

export function terrCenter(terrName: string): [number, number] {
  return TERR_CENTERS[terrName] || TERR_CENTERS.Salento;
}
