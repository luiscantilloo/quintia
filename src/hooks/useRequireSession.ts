"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";
import { ensureSession } from "@/lib/auth/ensureSession";
import {
  roleAllowed,
  roleIdFromLabel,
  type NaraRoleId,
} from "@/lib/db/roles";

function resolveRoleId(u: { id: string; role?: string; roleId?: string | null }) {
  return u.roleId || roleIdFromLabel(u.role || "") || null;
}

/** Acepta roleIds canónicos (`admin`, `experto`…), alias `gestor`/`persona` y demos. */
function isAllowed(
  u: { id: string; role?: string; roleId?: string | null } | null,
  allowed: string[],
) {
  if (!u) return false;
  if (allowed.includes(u.id)) return true;

  const roleId = resolveRoleId(u);
  if (roleId && roleAllowed(roleId, allowed)) return true;

  // Aliases legacy → roleId
  const aliases: Record<string, NaraRoleId> = {
    paula: "admin",
    admin: "admin",
    andres: "experto",
    mj: "experto",
    experto: "experto",
    gestor: "experto",
    lucia: "clinico",
    clinico: "clinico",
    obs: "observador",
    observador: "observador",
    paciente: "paciente",
    persona: "paciente",
    cuidador: "cuidador",
  };
  return allowed.some((a) => aliases[a] && aliases[a] === roleId);
}

export function useRequireSession(allowedIds: string[]) {
  const store = useNaraStore();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const u = await ensureSession(store);
      if (cancelled) return;
      if (!isAllowed(u, allowedIds)) {
        // H-015: con sesión de otro rol, a su propio panel con aviso; sin sesión, al ingreso.
        const href = (u as { href?: string } | null)?.href;
        router.replace(u && href ? `${href}?acceso=denegado` : "/ingreso");
        return;
      }
      setOk(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [store, router, allowedIds]);

  return ok ? store.session() : null;
}
