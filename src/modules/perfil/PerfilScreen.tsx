"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTopbar } from "@/components/shared/admin-nav/AdminTopbar";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { RoleNav } from "@/components/shared/role-nav/RoleNav";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { useNaraStore } from "@/providers/nara-provider";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import {
  DEFAULT_PATIENT_MODULES,
  PATIENT_APP_MODULES,
  type PatientModuleId,
} from "@/lib/db/patientModules";

type Kind = "admin" | "clin" | "expert" | "obs" | "patient";

function kindOf(session: {
  role?: string;
  roleId?: string | null;
  nk?: string | null;
  href?: string;
}): Kind {
  const role = session.role || "";
  if (session.roleId === "admin" || session.nk === "admin" || /Admin/.test(role)) return "admin";
  if (session.roleId === "clinico" || session.nk === "clin" || /Clín/.test(role)) return "clin";
  if (session.roleId === "experto" || /Experto/.test(role)) return "expert";
  if (session.roleId === "observador" || role === "Observador") return "obs";
  if (session.roleId === "paciente" || role === "Paciente") return "patient";
  return "admin";
}

function homeOf(kind: Kind, href?: string) {
  if (href?.startsWith("/")) return href;
  if (kind === "clin") return "/clinico";
  if (kind === "expert") return "/experto";
  if (kind === "obs") return "/observador";
  if (kind === "patient") return "/paciente";
  return "/inicio";
}

function agentRole(kind: Kind, nk: string | null | undefined) {
  if (kind === "admin") return "admin";
  if (kind === "clin") return "clin";
  if (kind === "expert") return nk || "andres";
  return "admin";
}

function initialsOf(name: string) {
  return name
    .replace(/^Dra?\. /, "")
    .split(" ")
    .filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function PerfilTopbar({
  kind,
  home,
  notifKey,
  onOpenAgent,
}: {
  kind: Kind;
  home: string;
  notifKey?: string;
  onOpenAgent: () => void;
}) {
  const router = useRouter();

  if (kind === "admin") {
    return <AdminTopbar active="" onOpenAgent={onOpenAgent} />;
  }

  const clinNav =
    kind === "clin"
      ? [
          {
            key: "home",
            label: "Inicio",
            href: "/clinico",
          },
          {
            key: "approvals",
            label: "Aprobaciones",
            href: "/clinico/aprobaciones",
          },
          {
            key: "patients",
            label: "Mis pacientes",
            href: "/clinico/pacientes",
          },
          {
            key: "crisisHistory",
            label: "Historial de crisis",
            href: "/clinico/crisis/historial",
          },
        ]
      : [];

  return (
    <header className="nara-topbar gap-2 border-linea bg-nara-blanco px-3 sm:gap-4 sm:px-6">
      <div className="flex h-full min-w-0 flex-1 items-stretch gap-2 sm:gap-4">
        <QuintiaLogo href={home} />
        {clinNav.length ? (
          <RoleNav
            items={clinNav.map((n) => ({
              key: n.key,
              label: n.label,
              active: false,
              onClick: () => router.push(n.href),
            }))}
          />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {kind === "expert" ? (
          <button
            type="button"
            onClick={onOpenAgent}
            aria-label="Abrir TEJIVA, asistente de QUINTIA"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-nara-tinta bg-nara-blanco px-2.5 font-texto text-sm font-medium text-nara-tinta sm:h-11 sm:px-3.5 sm:text-[15px]"
          >
            <img
              src="/quintia/tejiva/tejiva-base.svg"
              alt=""
              className="block h-7 w-7 sm:-ml-1.5 sm:h-8 sm:w-8"
            />
            <span className="hidden flex-col items-start leading-none sm:flex">
              <span>TEJIVA</span>
              <span className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                asistente
              </span>
            </span>
          </button>
        ) : null}
        <UserMenu
          notifKey={notifKey}
          compact={kind === "patient"}
        />
      </div>
    </header>
  );
}

export function PerfilScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const session = store.session();
  const [agentOpen, setAgentOpen] = useState(false);

  const sessionId = session?.id ?? "";

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [org, setOrg] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [baseline, setBaseline] = useState({ name: "", contact: "", org: "" });
  const [hydratedId, setHydratedId] = useState("");
  const [enabledMods, setEnabledMods] = useState<PatientModuleId[]>(DEFAULT_PATIENT_MODULES.slice());
  const [visibleMods, setVisibleMods] = useState<PatientModuleId[]>(DEFAULT_PATIENT_MODULES.slice());
  const [modsDirty, setModsDirty] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace("/ingreso");
      return;
    }
    // Solo hidratar al entrar o al cambiar de usuario (session() crea objeto nuevo cada render).
    if (hydratedId === sessionId) return;
    const S = store.get();
    const acc =
      (S.accounts || []).find((a: { id: string }) => a.id === sessionId) || null;
    const sess = store.session();
    const next = {
      name: (acc as { name?: string } | null)?.name || sess?.name || "",
      contact:
        (acc as { contact?: string } | null)?.contact ||
        (sess as { contact?: string } | null)?.contact ||
        "",
      org:
        (acc as { org?: string } | null)?.org ||
        (sess as { org?: string } | null)?.org ||
        "",
    };
    setName(next.name);
    setContact(next.contact);
    setOrg(next.org);
    setBaseline(next);
    const patient =
      (S.patients && (S.patients[sessionId] || Object.values(S.patients).find((p: { accountId?: string; email?: string }) => p.accountId === sessionId || p.email === (acc as { email?: string } | null)?.email))) ||
      null;
    if (patient) {
      const en = (patient.modulesEnabled as PatientModuleId[]) || DEFAULT_PATIENT_MODULES;
      const vis = (patient.modulesVisible as PatientModuleId[]) || en;
      setEnabledMods(en);
      setVisibleMods(vis.filter((id) => en.includes(id)));
    }
    setModsDirty(false);
    setHydratedId(sessionId);
  }, [sessionId, hydratedId, router, store]);

  if (!session) {
    return <NaraLoadingScreen />;
  }

  const kind = kindOf(session);
  const home = homeOf(kind, session.href);
  const role = session.role || "";
  const terr = session.terr || "";
  const initials = initialsOf(name || session.name);
  const dirty =
    name.trim() !== baseline.name.trim() ||
    contact.trim() !== baseline.contact.trim() ||
    org.trim() !== baseline.org.trim();
  const showAgent = kind === "admin" || kind === "expert";
  const aRole = agentRole(kind, session.nk);

  const save = async () => {
    const n = name.trim();
    const c = contact.trim();
    if (!n) {
      setErr("Escriba su nombre.");
      return;
    }
    if (!c) {
      setErr("Escriba un correo o celular de contacto.");
      return;
    }
    try {
      const res = await fetch("/api/accounts/me", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, contact: c, org: org.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        user?: {
          id: string;
          name: string;
          email: string;
          role: string;
          roleId: string;
          terr: string;
          org: string;
          contact: string;
          status: string;
        };
      };
      if (!res.ok || !data.ok || !data.user) {
        setErr(data.error || "No se pudo guardar el perfil.");
        return;
      }
      const u = data.user;
      store.set((s: { accounts: Record<string, unknown>[] }) => {
        const list = s.accounts || [];
        const i = list.findIndex((a: { id?: string }) => a.id === u.id);
        const acct = {
          id: u.id,
          name: u.name,
          email: u.email,
          contact: u.contact,
          role: u.role,
          roleId: u.roleId,
          org: u.org,
          terr: u.terr,
          status: u.status,
        };
        if (i > -1) list[i] = Object.assign({}, list[i], acct);
        else list.push(acct);
        s.accounts = list;
      });
      setBaseline({ name: u.name, contact: u.contact, org: u.org || "" });
      setName(u.name);
      setContact(u.contact);
      setOrg(u.org || "");
      setErr("");
      setMsg("Datos del perfil guardados.");
    } catch {
      setErr("No se pudo conectar con la base de datos.");
    }
  };

  const body = (
    <>
      <NaraMsgAlert msg={msg} onClear={() => setMsg("")} />
      <NaraMsgAlert
        msg={err}
        onClear={() => setErr("")}
        options={{ icon: "warning" }}
      />

      <div className="nara-page flex flex-col gap-5 md:gap-6">
        <PageHead>
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-nara-tinta font-titulos text-xl font-semibold text-white sm:h-16 sm:w-16 sm:text-2xl">
                {initials}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h1 className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold leading-tight text-nara-tinta">
                  Mi perfil
                </h1>
                <p className="text-[14px] text-texto-secundario sm:text-[15px]">
                  {role}
                  {terr ? ` · ${terr}` : ""}
                </p>
              </div>
            </div>
            <Link
              href={home}
              className="inline-flex h-10 items-center justify-center rounded-[12px] border-[1.5px] border-linea bg-nara-blanco px-3.5 text-sm font-medium text-nara-tinta no-underline sm:h-11 sm:px-4 sm:text-[15px]"
            >
              ← Volver
            </Link>
          </div>
        </PageHead>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-5">
          <aside className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco p-4 sm:p-5">
            <span className="font-titulos text-lg font-semibold">Cuenta</span>
            <p className="text-sm leading-relaxed text-texto-secundario">
              Actualice sus datos de contacto. El rol y el ámbito del programa
              los define la administración; no se editan aquí.
            </p>
            <dl className="mt-1 flex flex-col gap-2.5 border-t border-[#E5E0D5] pt-3">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-texto-secundario">Rol</dt>
                <dd className="text-sm font-medium">{role}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-texto-secundario">Ámbito</dt>
                <dd className="text-sm font-medium">{terr || "—"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-texto-secundario">Usuario</dt>
                <dd className="font-mono text-sm font-medium">{session.id}</dd>
              </div>
            </dl>
          </aside>

          <section className="flex flex-col gap-4 rounded-[20px] border border-linea bg-nara-blanco p-4 sm:p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-titulos text-lg font-semibold">
                Datos editables
              </h2>
              <p className="text-sm text-texto-secundario">
                Nombre, correo o celular y organización.
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nombre
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr("");
                }}
                className="box-border h-11 w-full rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none focus:border-nara-tinta"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Correo o celular
              <input
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  setErr("");
                }}
                className="box-border h-11 w-full rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none focus:border-nara-tinta"
                placeholder="correo@ejemplo.co o 310 000 0000"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Organización
              <input
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="box-border h-11 w-full rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none focus:border-nara-tinta"
              />
            </label>

            <div className="flex flex-col gap-2 border-t border-[#E5E0D5] pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={save}
                disabled={!dirty}
                className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta disabled:cursor-not-allowed disabled:opacity-45"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(baseline.name);
                  setContact(baseline.contact);
                  setOrg(baseline.org);
                  setErr("");
                }}
                disabled={!dirty}
                className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta disabled:cursor-not-allowed disabled:opacity-45"
              >
                Descartar
              </button>
              {dirty ? (
                <span className="text-sm text-texto-secundario sm:ml-1">
                  Hay cambios sin guardar
                </span>
              ) : null}
            </div>

            {kind === "patient" ? (
              <div className="mt-2 flex flex-col gap-3 border-t border-[#E5E0D5] pt-4">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-titulos text-lg font-semibold">Qué veo en mi app</h2>
                  <p className="text-sm text-texto-secundario">
                    Solo puede ocultar módulos que el programa ya le habilitó. No desactiva el
                    cuidado; solo lo que aparece en su pantalla.
                  </p>
                </div>
                {PATIENT_APP_MODULES.filter((m) => enabledMods.includes(m.id)).map((m) => {
                  const on = visibleMods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setVisibleMods((prev) => {
                          const next = on
                            ? prev.filter((x) => x !== m.id)
                            : prev.concat([m.id]);
                          return next.length ? next : prev;
                        });
                        setModsDirty(true);
                        setErr("");
                      }}
                      className="grid cursor-pointer grid-cols-[52px_minmax(0,1fr)] items-center gap-2.5 border-t border-[#E5E0D5] py-2 text-left"
                    >
                      <span
                        className="relative h-[26px] w-11 rounded-full"
                        style={{ background: on ? "#3a5570" : "#C4BDB3" }}
                      >
                        <span
                          className="absolute top-[3px] h-5 w-5 rounded-full bg-white"
                          style={{ left: on ? 21 : 3 }}
                        />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className="text-xs text-texto-secundario">{m.desc}</span>
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={!modsDirty}
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/patients/modules", {
                        method: "PATCH",
                        credentials: "same-origin",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          modulesVisible: visibleMods,
                          // solo preferencias del paciente; el admin controla modulesEnabled en la ficha
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.ok) {
                        setErr(data.error || "No se pudieron guardar las preferencias.");
                        return;
                      }
                      store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
                        const pid = data.id as string;
                        if (!s.patients) s.patients = {};
                        s.patients[pid] = {
                          ...(s.patients[pid] || {}),
                          modulesEnabled: data.modulesEnabled,
                          modulesVisible: data.modulesVisible,
                        };
                      });
                      setModsDirty(false);
                      setMsg("Preferencias de módulos guardadas.");
                    } catch {
                      setErr("No se pudo conectar con la base de datos.");
                    }
                  }}
                  className="mt-1 h-11 cursor-pointer rounded-[14px] border-none bg-nara-tinta px-5 font-texto text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Guardar lo que veo
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );

  const topbar = (
    <PerfilTopbar
      kind={kind}
      home={home}
      notifKey={session.nk || undefined}
      onOpenAgent={() => setAgentOpen(true)}
    />
  );

  if (showAgent) {
    return (
      <AgentDrawerShell
        data-screen-label="Perfil"
        open={agentOpen}
        drawerWidth="480px"
        onClose={() => setAgentOpen(false)}
        header={topbar}
        drawer={
          <AgentPanel
            role={aRole}
            mode="drawer"
            open={agentOpen}
            context="users"
            contextLabel="Perfil"
            onClose={() => setAgentOpen(false)}
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          />
        }
      >
        {body}
      </AgentDrawerShell>
    );
  }

  return (
    <div
      data-screen-label="Perfil"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-nara-crema font-texto text-nara-tinta"
    >
      {topbar}
      <main className="nara-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {body}
      </main>
    </div>
  );
}
