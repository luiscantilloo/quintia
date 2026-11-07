import { applySessionUser } from "@/lib/auth/applySessionUser";
import { apiFetch } from "@/lib/api/client";

type Store = {
  session: () => { id?: string; role?: string; roleId?: string | null; href?: string } | null;
};

/**
 * Tras un F5 el store en memoria está vacío hasta hidratar.
 * Si aún no hay sesión, pide /api/auth/me (cookie httpOnly) y la aplica.
 */
export async function ensureSession(store: Store): Promise<NonNullable<
  ReturnType<Store["session"]>
> | null> {
  const current = store.session();
  if (current?.id) return current;
  try {
    const res = await apiFetch("/api/auth/me");
    const data = (await res.json()) as {
      ok?: boolean;
      user?: Parameters<typeof applySessionUser>[0];
    };
    if (res.ok && data.ok && data.user) {
      applySessionUser(data.user);
      return store.session();
    }
  } catch {
    /* sin red / sin cookie */
  }
  return store.session();
}
