"use client";

/**
 * Observador = un solo rol.
 * Inicio = saludo TEJIVA (igual que administrador), sin módulos laterales.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentDrawerShell } from "@/components/shared/agent-panel/AgentDrawerShell";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { IconoTejiva } from "@/components/shared/brand/QuintiaIconos";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { ensureSession } from "@/lib/auth/ensureSession";
import { useNaraStore } from "@/providers/nara-provider";
import { ObservadorTablero } from "./ObservadorTablero";

function ObservadorInner() {
  const store = useNaraStore();
  const router = useRouter();
  const u = store.session();
  const [agentOpen, setAgentOpen] = useState(false);
  const [pendingAsk, setPendingAsk] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const sess = await ensureSession(store);
      if (cancelled) return;
      const roleId = (sess as { roleId?: string } | null)?.roleId;
      if (!sess || (roleId !== "observador" && sess.role !== "Observador")) {
        router.replace("/ingreso");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store, router, u]);

  const account = useMemo(() => {
    void tick;
    if (!u) return null;
    const S = store.get();
    return (
      (S.accounts || []).find((a: { id: string }) => a.id === u.id) || null
    );
  }, [store, u, tick]);

  const orgName = String(
    account?.org || (u as { org?: string } | null)?.org || u?.name || "Observador",
  );

  if (!u) {
    return <NaraLoadingScreen />;
  }

  const openAgent = (q = "") => {
    setPendingAsk(q);
    setAgentOpen(true);
  };

  const header = (
    <header className="nara-topbar gap-2 px-3 sm:gap-3 sm:px-5 md:px-6">
      <QuintiaLogo href="/inicio" />

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <button
          type="button"
          onClick={() => openAgent("")}
          aria-label="Abrir TEJIVA, asistente de QUINTIA"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#E5E0D5] bg-[#F1ECF9] px-2.5 font-texto text-sm font-medium text-[#0F2D3B] transition hover:brightness-[0.98] sm:h-11 sm:px-3.5 sm:text-[15px]"
        >
          <IconoTejiva className="block h-7 w-7 sm:-ml-0.5 sm:h-8 sm:w-8" />
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span className="font-semibold">TEJIVA</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
              asistente
            </span>
          </span>
        </button>
        <UserMenu />
      </div>
    </header>
  );

  return (
    <AgentDrawerShell
      data-screen-label="Observador"
      open={agentOpen}
      drawerWidth="480px"
      onClose={() => setAgentOpen(false)}
      style={{
        minWidth: 0,
        fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
        color: "#0F2D3B",
        fontSize: 15,
        background: "#F7F5EF",
      }}
      header={header}
      drawer={
        <AgentPanel
          role="obs"
          mode="drawer"
          open={agentOpen}
          initialAsk={pendingAsk}
          context="home"
          contextLabel={`Sobre: ${orgName}`}
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
      <div className="nara-page flex min-h-0 flex-1 flex-col bg-[#F7F5EF]">
        <div
          className={`nara-home-grid${agentOpen ? " nara-home-grid--teo" : ""}`}
          style={{ paddingTop: "var(--nara-page-pad-y, 20px)" }}
        >
          {agentOpen ? (
            <div className="nara-home-teo-standin">
              <button
                type="button"
                onClick={() => openAgent("")}
                aria-label="TEJIVA está conversando. Mantener asistente abierto"
                className="group flex cursor-pointer flex-col items-center gap-4 border-none bg-transparent p-4"
              >
                <span className="grid size-[200px] place-items-center rounded-[52px] bg-[#E5E0D5] shadow-[0_16px_48px_rgba(39,104,58,0.22)] transition group-hover:scale-[1.03] group-active:scale-[0.98] motion-safe:animate-[nara-float_3.6s_ease-in-out_infinite_alternate] sm:size-[260px] sm:rounded-[64px]">
                  <img
                    src="/quintia/tejiva/tejiva-base.svg"
                    alt=""
                    className="block size-[148px] sm:size-[196px]"
                  />
                </span>
                <span className="font-titulos text-2xl font-extrabold text-[#0F2D3B] sm:text-[28px]">
                  TEJIVA
                </span>
                <span className="max-w-[280px] text-center font-mono text-sm text-[#6B7280]">
                  Aquí estoy, cuando quiera.
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#31C6E6]">
                  asistente de QUINTIA
                </span>
              </button>
            </div>
          ) : (
            <div className="nara-home-main flex flex-col gap-5">
              <ObservadorTablero />
              <div className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-white p-4 sm:p-5">
                <AgentPanel
                  role="obs"
                  mode="home"
                  onOpenDrawer={(q) => openAgent(q)}
                  style={{ flex: 1, minWidth: 0, width: "100%" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentDrawerShell>
  );
}

export function ObservadorScreen() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <ObservadorInner />
    </Suspense>
  );
}
