import { NextResponse } from "next/server";
import { loadSessionUser, type SessionUser } from "@/lib/auth/session";
import { roleAllowed, type NaraRoleId } from "@/lib/db/roles";

type Ok = { user: SessionUser; error?: undefined };
type Fail = { user?: undefined; error: NextResponse };

export async function requireUser(roles?: readonly NaraRoleId[]): Promise<Ok | Fail> {
  const user = await loadSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 }),
    };
  }
  if (roles && roles.length > 0 && !roleAllowed(user.roleId, roles)) {
    return {
      error: NextResponse.json({ ok: false, error: "Sin permiso para esta acción." }, { status: 403 }),
    };
  }
  return { user };
}
