"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { BRAND } from "@/lib/brand";
import { hydrateProgramData } from "@/lib/store/hydrateProgram";
import { useNaraStore } from "@/providers/nara-provider";

function canEnterPatientApp(p: {
  profile?: string;
  status?: string;
  signal?: string;
  crisisLock?: boolean;
  inactiveLock?: boolean;
} | null) {
  if (!p) return false;
  const profile = p.profile != null ? String(p.profile) : "";
  if (!/^P\d+$/i.test(profile)) return false;
  const st = String(p.status || p.signal || "");
  // Crisis → roja; Inactivo → amarilla «Volví»; Activo → servicios.
  if (p.crisisLock === true || /^crisis$/i.test(st)) return true;
  if (p.inactiveLock === true || /^inactivo$/i.test(st)) return true;
  return /^activo$/i.test(st);
}

/**
 * Paciente con credenciales pero sin acceso a servicios
 * (sin perfil, por aprobar, o evaluación rechazada).
 */
export function PacientePendienteScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const session = store.session() as {
    id?: string;
    name?: string;
    roleId?: string;
    role?: string;
    patientId?: string;
    email?: string;
  } | null;
  const [kind, setKind] = useState<"espera" | "rechazado" | "aprobar">("espera");

  useEffect(() => {
    const ok =
      !!session &&
      (session.roleId === "paciente" || /Paciente/i.test(session.role || ""));
    if (!ok) router.replace("/ingreso");
  }, [session, router]);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    const resolveLinked = () => {
      const map = (store.get().patients || {}) as Record<
        string,
        {
          id?: string;
          profile?: string;
          plan?: unknown;
          accountId?: string;
          email?: string;
          status?: string;
          signal?: string;
          crisisLock?: boolean;
          inactiveLock?: boolean;
        }
      >;
      return (
        (session.patientId && map[session.patientId]) ||
        map[session.id!] ||
        Object.values(map).find(
          (p) =>
            p?.accountId === session.id ||
            (session.email && p?.email === session.email),
        ) ||
        null
      );
    };

    const refreshKind = (linked: ReturnType<typeof resolveLinked>) => {
      const st = String(linked?.status || linked?.signal || "");
      if (/rechazad/i.test(st)) setKind("rechazado");
      else if (/por\s*aprobar/i.test(st) || linked?.profile) setKind("aprobar");
      else setKind("espera");
    };

    const tryEnter = () => {
      const linked = resolveLinked();
      refreshKind(linked);
      if (!canEnterPatientApp(linked) || cancelled) return;
      if (linked?.plan) {
        router.replace("/paciente/plan");
        return;
      }
      router.replace("/paciente");
    };

    tryEnter();
    const id = setInterval(() => {
      void hydrateProgramData(store, { force: true }).then(() => {
        if (!cancelled) tryEnter();
      });
    }, 4_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [session, store, router]);

  const name = String(session?.name || "Paciente").split(/\s+/)[0];
  const copy =
    kind === "rechazado"
      ? {
          eyebrow: "Evaluación por repetir",
          title: `Hola, ${name}`,
          p1: (
            <>
              Su evaluación fue{" "}
              <span className="font-semibold text-[#0F2D3B]">revisada</span> y el
              experto de campo debe repetir el cuestionario.
            </>
          ),
          p2: "Mientras tanto no hay servicios activos en la app. Cuando vuelva a quedar Activo, entre con el mismo correo y contraseña.",
        }
      : kind === "aprobar"
        ? {
            eyebrow: "Pendiente de aprobación",
            title: `Hola, ${name}`,
            p1: (
              <>
                Su evaluación ya está registrada. Falta la{" "}
                <span className="font-semibold text-[#0F2D3B]">
                  aprobación clínica
                </span>{" "}
                para activar su ruta.
              </>
            ),
            p2: "Los servicios de la app solo aparecen cuando su estado sea Activo.",
          }
        : {
            eyebrow: "Esperando evaluación",
            title: `Hola, ${name}`,
            p1: (
              <>
                Su acceso ya está listo. Falta definir su{" "}
                <span className="font-semibold text-[#0F2D3B]">perfil de ruta</span>{" "}
                con el experto de campo (conversación de bienestar y uso de la app).
              </>
            ),
            p2: "Mientras tanto no puede entrar a la app. Cuando la evaluación quede registrada y aprobada, use el mismo correo y contraseña.",
          };

  return (
    <div
      data-screen-label="Paciente pendiente"
      className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-[#F7F5EF] font-texto text-[#0F2D3B]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 12% 18%, rgba(224,240,232,0.55), transparent 55%), radial-gradient(ellipse 55% 40% at 92% 12%, rgba(218,158,70,0.28), transparent 50%), radial-gradient(ellipse 50% 35% at 78% 88%, rgba(194,114,65,0.16), transparent 55%)",
        }}
      />

      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E5E0D5] bg-[#F7F5EF]/95 px-4 backdrop-blur-sm sm:px-6">
        <QuintiaLogo href={null} size={30} />
        <UserMenu compact />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-8">
        <div className="mb-7 grid size-[7.5rem] place-items-center rounded-[1.75rem] bg-[#E7FAF5] shadow-[0_16px_40px_rgba(43,138,116,0.18)] [animation:plPendIn_.55s_cubic-bezier(.22,1,.36,1)_both] sm:size-36 sm:rounded-[2rem]">
          <img
            src="/quintia/logo/quintia-fuerzas.svg"
            alt=""
            className="size-[4.75rem] sm:size-[5.5rem]"
          />
        </div>

        <p className="mb-2 font-mono text-sm font-medium uppercase tracking-[0.14em] text-[#31C6E6] [animation:plPendIn_.55s_cubic-bezier(.22,1,.36,1)_.08s_both]">
          {copy.eyebrow}
        </p>
        <h1 className="font-titulos text-[clamp(1.85rem,5vw,2.35rem)] font-extrabold leading-tight text-[#0F2D3B] [animation:plPendIn_.55s_cubic-bezier(.22,1,.36,1)_.12s_both]">
          {copy.title}
        </h1>

        <p className="mt-4 max-w-md font-texto text-base leading-relaxed text-[#6B7280] [animation:plPendIn_.55s_cubic-bezier(.22,1,.36,1)_.18s_both]">
          {copy.p1}
        </p>
        <p className="mt-3 max-w-md font-mono text-[14px] leading-relaxed text-[#6B7280] [animation:plPendIn_.55s_cubic-bezier(.22,1,.36,1)_.24s_both]">
          {copy.p2}
        </p>

        <p className="mt-5 font-mono text-[12px] text-[#6B7280] [animation:plPendIn_.55s_cubic-bezier(.22,1,.36,1)_.28s_both]">
          {BRAND.name} · con tecnología {BRAND.techLabel}
        </p>

        <button
          type="button"
          onClick={() => store.logout()}
          className="mt-8 h-12 cursor-pointer rounded-md border-[1.5px] border-[#0F2D3B] bg-white px-8 font-texto text-[15px] font-bold !text-[#0F2D3B] transition hover:bg-[#E5E0D5]/50 active:scale-[0.98] [animation:plPendIn_.55s_cubic-bezier(.22,1,.36,1)_.32s_both]"
        >
          Cerrar sesión
        </button>
      </main>

      <style>{`
@keyframes plPendIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
`}</style>
    </div>
  );
}
