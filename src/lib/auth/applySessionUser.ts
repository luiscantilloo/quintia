import AlientoStore from "@/lib/store/store";

/** Inyecta la cuenta en el store en memoria y marca la sesión activa. */
export function applySessionUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  terr: string;
  org: string;
  contact: string;
  status: string;
  href?: string;
  nk?: string | null;
  patientId?: string;
  orgType?: string;
  modules?: string[];
}) {
  const acct = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleId: user.roleId,
    terr: user.terr,
    org: user.org,
    contact: user.contact,
    status: user.status,
    patientId: user.patientId,
    ...(user.orgType ? { orgType: user.orgType } : {}),
    ...(user.modules ? { modules: user.modules } : {}),
  };
  AlientoStore.set((s: { accounts: Record<string, unknown>[] }) => {
    const list = Array.isArray(s.accounts) ? s.accounts.slice() : [];
    const i = list.findIndex((a) => a.id === user.id);
    if (i >= 0) list[i] = { ...list[i], ...acct };
    else list.push(acct);
    s.accounts = list;
  });
  // H-001: la sesión no depende de que la cuenta siga en `accounts` cuando se recargue la lista filtrada.
  AlientoStore.login(user.id, acct);
}
