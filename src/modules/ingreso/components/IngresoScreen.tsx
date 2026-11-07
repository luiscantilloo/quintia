"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { BRAND } from "@/lib/brand";
import { applySessionUser } from "@/lib/auth/applySessionUser";
import { ensureSession } from "@/lib/auth/ensureSession";
import { passwordPolicyError } from "@/lib/auth/passwordPolicy";
import { apiJson } from "@/lib/api/client";
import { hydrateProgramData } from "@/lib/store/hydrateProgram";
import { useNaraStore } from "@/providers/nara-provider";

type LoginUser = {
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
};

// SPEC-01 mínima: «olvido» solo informa a quién pedir ayuda; «cambiar» crea la clave nueva tras una clave temporal.
type Mode = "login" | "olvido" | "cambiar";

const labelClass =
  "flex flex-col gap-1.5 font-texto text-[15px] font-medium text-[#0F2D3B]";
const primaryBtnClass =
  "inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-md border-0 bg-[#0F2D3B] font-texto text-[18px] font-bold !text-[#F7F5EF] transition hover:bg-[#1a3d4f] disabled:cursor-wait disabled:opacity-70";
const linkBtnClass =
  "cursor-pointer self-center border-0 bg-transparent p-0 font-mono text-[13px] font-medium text-[#0F2D3B] underline underline-offset-4";

export function IngresoScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pendingUser, setPendingUser] = useState<LoginUser | null>(null);
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [taps, setTaps] = useState(0);
  const [panel, setPanel] = useState(false);
  const [done, setDone] = useState(false);
  const [dev, setDev] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDev(store.devMode());
  }, [store]);

  // Si ya hay cookie de sesión (p. ej. Atrás del navegador a /ingreso), no mostrar login: volver a su app.
  useEffect(() => {
    let cancelled = false;
    const bounceIfLoggedIn = async () => {
      const u = await ensureSession(store);
      if (cancelled) return;
      const href = (u as { href?: string } | null)?.href;
      if (u?.id && href) {
        router.replace(href);
        return;
      }
      setCheckingSession(false);
    };
    void bounceIfLoggedIn();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void bounceIfLoggedIn();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [store, router]);

  const goLogin = () => {
    setMode("login");
    setPendingUser(null);
    setNewPass("");
    setNewPass2("");
    setErr("");
  };

  const enter = async () => {
    setErr("");
    setOkMsg("");
    setLoading(true);
    try {
      const { res, data } = await apiJson<{ ok?: boolean; error?: string; user?: LoginUser }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password: pass }),
        },
      );
      if (!res.ok || !data.ok || !data.user) {
        setErr(data.error || "No se pudo ingresar.");
        return;
      }
      if ((data.user as { mustChangePassword?: boolean }).mustChangePassword) {
        setPendingUser(data.user);
        setPass("");
        setMode("cambiar");
        return;
      }
      applySessionUser(data.user);
      await hydrateProgramData(store, { force: true });
      // replace: Atrás no debe volver al login ni parecer un cierre de sesión.
      router.replace(data.user.href || "/inicio");
    } catch {
      setErr("No se pudo conectar. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    setErr("");
    const policyErr = passwordPolicyError({
      password: newPass,
      email: pendingUser?.email || email,
      name: pendingUser?.name || "",
      role: pendingUser?.role || pendingUser?.roleId || "",
    });
    if (policyErr) {
      setErr(policyErr);
      return;
    }
    if (newPass !== newPass2) {
      setErr("Las dos claves no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const { res, data } = await apiJson<{ ok?: boolean; error?: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: newPass }),
      });
      if (!res.ok || !data.ok) {
        setErr(data.error || "No se pudo guardar la clave.");
        return;
      }
      const u = pendingUser;
      goLogin();
      if (u) {
        applySessionUser({ ...u, mustChangePassword: false } as LoginUser);
        await hydrateProgramData(store, { force: true });
        router.replace(u.href || "/inicio");
      }
    } catch {
      setErr("No se pudo conectar. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div
        data-screen-label="Ingresar"
        className="box-border flex min-h-screen items-center justify-center bg-[#F7F5EF] font-texto text-[#6B7280]"
      >
        <p className="font-mono text-sm">Comprobando sesión…</p>
      </div>
    );
  }

  return (
    <div
      data-screen-label="Ingresar"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (tapTimer.current) clearTimeout(tapTimer.current);
        const n = taps + 1;
        if (n >= 5) {
          setTaps(0);
          setPanel((p) => !p);
          setDone(false);
        } else {
          setTaps(n);
          tapTimer.current = setTimeout(() => setTaps(0), 1500);
        }
      }}
      className="relative box-border flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-[#F7F5EF] px-5 py-8 font-texto text-[#0F2D3B]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 15% 10%, rgba(97,240,210,0.28), transparent 55%), radial-gradient(ellipse 55% 40% at 90% 15%, rgba(49,198,230,0.24), transparent 50%), radial-gradient(ellipse 50% 35% at 70% 90%, rgba(108,4,201,0.18), transparent 55%)",
        }}
      />

      <NaraMsgAlert msg={err} onClear={() => setErr("")} />
      <NaraMsgAlert msg={okMsg} onClear={() => setOkMsg("")} />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col gap-7">
        <div className="flex flex-col items-center gap-3">
          <QuintiaLogo href="/landing" withTagline className="justify-center" size={42} />
          <p className="m-0 max-w-sm text-center font-titulos text-[clamp(1.15rem,3.5vw,1.35rem)] font-extrabold leading-snug text-pl-verde-raiz">
            Una marca para las posibilidades de la vida.
          </p>
          <p className="m-0 max-w-sm text-center font-mono text-sm leading-snug text-pl-texto2">
            Ingrese con su correo de {BRAND.name} (@quintia.com).
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-pl-linea bg-white px-6 py-[26px] shadow-[0_12px_40px_rgba(20,47,60,0.08)]">
          {mode === "login" ? (
            <>
              <p className="m-0 font-mono text-sm font-medium uppercase tracking-[0.14em] text-pl-conectar">
                Ingreso
              </p>
              <label className={labelClass}>
                Correo
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErr("");
                  }}
                  autoComplete="username"
                  placeholder={BRAND.emailPlaceholder}
                  className="pl-field"
                />
              </label>

              <label className={labelClass}>
                Contraseña
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => {
                    setPass(e.target.value);
                    setErr("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) void enter();
                  }}
                  autoComplete="current-password"
                  className="pl-field"
                />
              </label>

              <button
                type="button"
                onClick={() => void enter()}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Ingresando…" : "Ingresar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setErr("");
                  setOkMsg("");
                  setMode("olvido");
                }}
                className={linkBtnClass}
              >
                ¿Olvidó su contraseña?
              </button>
            </>
          ) : null}

          {mode === "olvido" ? (
            <>
              <p className="m-0 font-mono text-sm font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
                Recuperar acceso
              </p>
              <p className="m-0 font-texto text-[15px] leading-relaxed text-[#6B7280]">
                Pídale a su experto de campo o al administrador del programa que le restablezca la clave.
                Le darán una clave temporal de 6 dígitos para entrar y crear una nueva.
              </p>
              <button type="button" onClick={goLogin} className={linkBtnClass}>
                Volver a ingresar
              </button>
            </>
          ) : null}

          {mode === "cambiar" ? (
            <>
              <p className="m-0 font-mono text-sm font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
                Nueva clave
              </p>
              <p className="m-0 font-texto text-[15px] leading-relaxed text-[#6B7280]">
                Entró con una clave temporal. Cree su clave nueva para continuar.
              </p>
              <label className={labelClass}>
                Nueva clave
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPass}
                  onChange={(e) => {
                    setNewPass(e.target.value);
                    setErr("");
                  }}
                  className="pl-field"
                />
              </label>
              <label className={labelClass}>
                Repita la nueva clave
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPass2}
                  onChange={(e) => {
                    setNewPass2(e.target.value);
                    setErr("");
                  }}
                  className="pl-field"
                />
              </label>
              <button
                type="button"
                onClick={() => void changePassword()}
                disabled={loading}
                className={primaryBtnClass}
              >
                {loading ? "Guardando…" : "Guardar clave"}
              </button>
            </>
          ) : null}
        </div>

        {panel ? (
          <div className="flex min-w-60 flex-col gap-1.5 self-center rounded-xl border border-[#E5E0D5] bg-white px-3 py-2.5 text-sm">
            <button
              type="button"
              onClick={() => {
                store.reset();
                setDone(true);
              }}
              className="cursor-pointer border-0 bg-transparent px-1 py-2 text-left font-texto text-sm text-[#0F2D3B]"
            >
              Reiniciar datos
            </button>
            <div
              onClick={() => {
                store.setDevMode(!dev);
                setDev(!dev);
              }}
              className="flex cursor-pointer items-center justify-between px-1 py-2"
            >
              <span className="font-texto text-sm text-[#0F2D3B]">Modo desarrollador</span>
              <span
                className={`relative h-6 w-10 rounded-xl ${dev ? "bg-[#0F2D3B]" : "bg-[#E5E0D5]"}`}
              >
                <span
                  className={`absolute top-[3px] h-[18px] w-[18px] rounded-[9px] bg-white ${dev ? "left-[19px]" : "left-[3px]"}`}
                />
              </span>
            </div>
            {done ? (
              <span className="px-1 pb-1 font-mono text-[12px] text-[#0F2D3B]">
                Datos reiniciados
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
