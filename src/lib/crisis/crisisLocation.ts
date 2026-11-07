/** Compartir ubicación en crisis: máximo 24 h desde el inicio de la alerta. */
export const CRISIS_LOC_SHARE_MS = 24 * 60 * 60 * 1000;

export type CrisisLoc = {
  lat: number;
  lng: number;
  accuracy?: number;
  /** Última actualización GPS. */
  at: number;
  /** Hasta cuándo se comparte (alerta.at + 24h). */
  until: number;
};

export function crisisLocUntil(alertAt: number): number {
  return Number(alertAt || Date.now()) + CRISIS_LOC_SHARE_MS;
}

export function isCrisisLocActive(loc: CrisisLoc | null | undefined, now = Date.now()): boolean {
  if (!loc) return false;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return Number(loc.until || 0) > now;
}

export function formatCrisisLocUntil(until: number, now = Date.now()): string {
  const ms = Math.max(0, until - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 1) return `${h} h ${m} min`;
  if (m >= 1) return `${m} min`;
  return "menos de 1 min";
}
