import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SEC = 60 * 60 * 12; // 12 h · alineado con nucleo-api

function currentProgramId() {
  return (
    String(
      process.env.PROGRAM_ID ||
        process.env.NEXT_PUBLIC_PROGRAM_ID ||
        "quintia",
    ).trim() || "quintia"
  );
}

function secret() {
  const program = currentProgramId();
  const byProgram =
    program === "nara"
      ? process.env.NARA_AUTH_SECRET
      : program === "parienta" || program === "plateado"
        ? process.env.PARIENTA_AUTH_SECRET || process.env.PLATEADO_AUTH_SECRET
        : program === "quintia" || program === "consiente"
          ? process.env.QUINTIA_AUTH_SECRET ||
            process.env.CONSCIENTE_AUTH_SECRET
          : undefined;
  const s =
    process.env.AUTH_SECRET ||
    byProgram ||
    process.env.QUINTIA_AUTH_SECRET ||
    process.env.CONSCIENTE_AUTH_SECRET ||
    process.env.NARA_AUTH_SECRET ||
    process.env.PARIENTA_AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Falta AUTH_SECRET (o QUINTIA_AUTH_SECRET) en el entorno.");
    }
    // Dev: valor estable; debe coincidir con nucleo-api si no hay secreto en .env
    return "nara-dev-auth-secret-change-me";
  }
  return s;
}

function allowLegacyTokens() {
  if (process.env.AUTH_ALLOW_LEGACY_TOKENS === "1") return true;
  if (process.env.AUTH_ALLOW_LEGACY_TOKENS === "0") return false;
  return process.env.NODE_ENV !== "production";
}

/** Token firmado alineado con nucleo-api: accountId.exp.programId.sig (legado: 3 partes). */
export function signSessionToken(accountId: string, maxAgeSec = MAX_AGE_SEC) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const prog = currentProgramId();
  const payload = `${accountId}.${exp}.${prog}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): string | null {
  return parseSessionToken(token)?.accountId ?? null;
}

export function parseSessionToken(
  token: string | null | undefined,
): { accountId: string; programId: string; exp: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 && parts.length !== 4) return null;

  let accountId: string;
  let expStr: string;
  let programId: string;
  let sig: string;

  if (parts.length === 3) {
    if (!allowLegacyTokens()) return null;
    [accountId, expStr, sig] = parts as [string, string, string];
    programId = currentProgramId();
  } else {
    [accountId, expStr, programId, sig] = parts as [string, string, string, string];
  }

  if (!accountId || !expStr || !sig || !programId) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

  const payload =
    parts.length === 3
      ? `${accountId}.${expStr}`
      : `${accountId}.${expStr}.${programId}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const expectedProgram = currentProgramId();
  // Alias legado consiente ↔ quintia
  const sameProgram =
    programId === expectedProgram ||
    (programId === "consiente" && expectedProgram === "quintia") ||
    (programId === "quintia" && expectedProgram === "consiente");
  if (!sameProgram) return null;

  return { accountId, programId, exp };
}

export function sessionTokenLooksSigned(token: string | null | undefined) {
  if (!token) return false;
  const n = token.split(".").length;
  return n === 3 || n === 4;
}

export { MAX_AGE_SEC as SESSION_MAX_AGE_SEC };
