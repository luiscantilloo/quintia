import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { hrefForRoleId, NARA_ROLES, resolveNotifKey } from "@/lib/db/roles";
import {
  SESSION_MAX_AGE_SEC,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/sessionToken";

export const SESSION_COOKIE = "nara_sid";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  terr: string;
  org: string;
  contact: string;
  status: string;
  href: string;
  nk: string | null;
  /** Ficha clínica vinculada (rol paciente). */
  patientId?: string;
};

export function attachSessionCookie(res: NextResponse, accountId: string) {
  const token = signSessionToken(accountId, SESSION_MAX_AGE_SEC);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function readSessionAccountId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  return verifySessionToken(raw ? String(raw) : null);
}

export async function loadSessionUser(accountId?: string | null): Promise<SessionUser | null> {
  const id = accountId ?? (await readSessionAccountId());
  if (!id) return null;

  const db = await getDb();
  const account = await db.collection("accounts").findOne({ id, status: "Activo" });
  if (!account) return null;

  const roleId = String(account.roleId || "");
  const roleDoc =
    (await db.collection("roles").findOne({ id: roleId })) ||
    NARA_ROLES.find((r) => r.id === roleId) ||
    null;

  return {
    id: String(account.id),
    name: String(account.name || ""),
    email: String(account.email || ""),
    role: String(account.role || ""),
    roleId,
    terr: String(account.terr || ""),
    org: String(account.org || ""),
    contact: String(account.contact || account.email || ""),
    status: String(account.status || "Activo"),
    href: (roleDoc && "href" in roleDoc && roleDoc.href) || hrefForRoleId(roleId),
    nk: resolveNotifKey(roleId, String(account.id)),
    patientId: account.patientId ? String(account.patientId) : undefined,
  };
}
