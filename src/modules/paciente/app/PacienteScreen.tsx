"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import {
  ClinPanel,
  IaPanel,
  JuegosPanel,
  MoodPanel,
  PacienteHerramientasNav,
  PacienteHomeTools,
} from "@/modules/paciente/herramientas";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { BRAND, tejivaAsset } from "@/lib/brand";
import { BreathExercise } from "./BreathExercise";
import { naraAsset } from "./naraAsset";
import { usePacienteScreen } from "./usePacienteScreen";

const globalCss = `
@keyframes naraTab{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes naraDrop{from{opacity:0;transform:translateY(-120%)}to{opacity:1;transform:none}}
@keyframes naraMoodIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes naraMoodPop{0%{transform:scale(.94)}60%{transform:scale(1.05)}100%{transform:scale(1.03)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

export function PacienteScreen() {
  const vm = usePacienteScreen();

  if (!vm.ready) {
    return <NaraLoadingScreen />;
  }

  if (vm.needsAppConsent) {
    return <ConsentimientoApp onAccept={vm.acceptAppConsent} />;
  }

  return (
    <>
      <style>{globalCss}</style>
      <div
        style={{
          minHeight: "100vh",
          fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
          color: "#0F2D3B",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#F7F5EF",
        }}
      >
        <div
          data-screen-label="Paciente"
          style={{
            position: "relative",
            flex: "none",
            width: vm.devW,
            height: vm.devH,
            zoom: vm.devZoom,
            borderRadius: vm.devR,
            border: vm.devBd,
            boxShadow: vm.devSh,
            background: "#0F2D3B",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              background: "#F7F5EF",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              borderRadius: vm.scrR,
            }}
          >
            {vm.framed ? (
              <div
                aria-hidden
                style={{
                  flex: "none",
                  height: 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 28px 0 34px",
                  fontSize: 15,
                  fontWeight: 600,
                  background: vm.sbBg,
                  color: vm.sbFg,
                  position: "relative",
                  zIndex: 56,
                }}
              >
                <span>{vm.clock}</span>
                <span
                  style={{
                    position: "absolute",
                    top: 11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 118,
                    height: 32,
                    borderRadius: 18,
                    background: "#0F2D3B",
                  }}
                />
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
                    <rect x="0" y="8" width="3" height="4" rx="1" />
                    <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                    <rect x="10" y="3" width="3" height="9" rx="1" />
                    <rect x="15" y="0" width="3" height="12" rx="1" />
                  </svg>
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M1 4.2a10 10 0 0 1 14 0" />
                    <path d="M3.6 7a6.3 6.3 0 0 1 8.8 0" />
                    <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
                  </svg>
                  <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
                    <rect x="0.75" y="0.75" width="22.5" height="11.5" rx="3.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                    <rect x="2.5" y="2.5" width="16" height="8" rx="2" fill="currentColor" />
                    <rect x="24.5" y="4.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
                  </svg>
                </span>
              </div>
            ) : null}

            {vm.splash ? <NaraLoadingScreen /> : null}

            {vm.framed ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 134,
                  height: 5,
                  borderRadius: 3,
                  background: vm.gestC,
                  zIndex: 58,
                  pointerEvents: "none",
                }}
              />
            ) : null}

            {vm.dev ? (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 60,
                  fontFamily: '"DM Mono", ui-monospace, monospace',
                  fontSize: 11,
                  color: "#6B7280",
                  background: "#fff",
                  border: "1px solid #E5E0D5",
                  padding: "2px 6px",
                  borderRadius: 5,
                }}
              >
                {vm.screenCode}
              </span>
            ) : null}

            {vm.hasBanner ? (
              <div
                role="presentation"
                onClick={vm.openBanner}
                style={{
                  position: "absolute",
                  top: vm.bannerTop,
                  left: 10,
                  right: 10,
                  zIndex: 57,
                  animation: "naraDrop .35s ease-out",
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 10px 30px rgba(22,20,19,.25)",
                  padding: "12px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                }}
              >
                <img src={tejivaAsset("base")} alt="" style={{ flex: "none", width: 36, height: 36, display: "block" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{BRAND.agentName}</span>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>ahora</span>
                  </div>
                  <span style={{ fontSize: 15, lineHeight: 1.4 }}>{vm.bannerText}</span>
                </div>
                <button
                  type="button"
                  onClick={vm.dismissBanner}
                  aria-label="Cerrar"
                  style={{
                    flex: "none",
                    width: 32,
                    height: 32,
                    border: "none",
                    background: "none",
                    fontSize: 18,
                    color: "#6B7280",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ) : null}

            {vm.isDiana ? <DianaApp vm={vm} /> : null}
            {vm.isRosalba ? <RosalbaWA vm={vm} /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

type Vm = ReturnType<typeof usePacienteScreen>;

function btnFont(): CSSProperties {
  return { fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif' };
}

function DianaApp({ vm }: { vm: Vm }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#F7F5EF] font-texto text-[#0F2D3B]">
      <header className="box-border flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-[#E5E0D5] bg-[#F7F5EF] px-3 sm:px-4">
        <button
          type="button"
          onClick={() => (vm.goHome as (() => void) | undefined)?.()}
          aria-label="Ir al inicio"
          className="flex cursor-pointer items-center border-0 bg-transparent p-0"
        >
          <QuintiaLogo href={null} size={24} className="gap-1.5" />
        </button>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {!vm.helpOpen && !vm.crisisAlertSent && !vm.inactiveOpen ? (
            <button
              type="button"
              onClick={vm.openHelp}
              aria-label="Emergencia"
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[#B42318] px-3 font-texto text-[13px] font-semibold whitespace-nowrap !text-[#F7F5EF] transition hover:bg-[#9C2F25] sm:h-12 sm:px-3.5 sm:text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3.5" />
                <path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
              </svg>
              Emergencia
            </button>
          ) : null}
          {!vm.helpOpen && !vm.crisisAlertSent && !vm.inactiveOpen ? (
            <UserMenu compact />
          ) : null}
        </div>
      </header>

      <div ref={vm.bodyRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", fontSize: 17 }}>
        {vm.tabHome ? (
          <div className="flex flex-col gap-4 px-4 pb-6 pt-[18px] font-texto [animation:naraTab_.22s_ease-out]">
            <div className="flex items-start gap-3.5">
              <img
                src={tejivaAsset("base")}
                alt=""
                className="block size-14 shrink-0"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="m-0 font-mono text-[15px] font-medium tracking-[0.14em] text-[#6C04C9]">
                  {BRAND.agentName}
                </p>
                <h1 className="m-0 font-titulos text-[30px] font-bold leading-tight text-[#0F2D3B]">
                  {vm.greet}, {vm.firstName || "Paciente"}
                </h1>
                <span className="text-[20px] text-[#4D5D66]">Inicio</span>
              </div>
            </div>
            <PacienteHomeTools
              items={
                (vm.herramientaNav as
                  | {
                      id: "mood" | "clin" | "ia" | "juegos";
                      name: string;
                      navLabel: string;
                      on: boolean;
                      go: () => void;
                      disabled?: boolean;
                    }[]
                  | undefined) || []
              }
            />
          </div>
        ) : null}

        {vm.tabMood && vm.mods?.mood ? (
          <div className="px-[18px] pb-[22px] pt-1.5 [animation:naraTab_.22s_ease-out]">
            <MoodPanel patientId={String(vm.patientId || "")} />
          </div>
        ) : null}

        {vm.tabChat && vm.mods?.ia ? <DianaChat vm={vm} /> : null}
        {vm.tabRes ? <DianaResumen vm={vm} /> : null}
        {vm.tabRoute ? <DianaRoute vm={vm} /> : null}
        {vm.tabClin && vm.mods?.clin ? (
          <ClinPanel patientId={String(vm.patientId || "")} />
        ) : null}
        {vm.tabJuegos && vm.mods?.juegos ? (
          <div className="px-[18px] pb-[22px] pt-1.5 [animation:naraTab_.22s_ease-out]">
            <JuegosPanel
              patientId={String(vm.patientId || "")}
              activeIds={(
                [
                  vm.mods.frutas && "frutas",
                  vm.mods.simon && "simon",
                  vm.mods.duelo && "duelo",
                  vm.mods.sudoku && "sudoku",
                ] as const
              ).filter(Boolean) as ("frutas" | "simon" | "duelo" | "sudoku")[]}
              onGoHome={() => (vm.goHome as (() => void) | undefined)?.()}
            />
          </div>
        ) : null}
      </div>

      {(vm.herramientaNavCount || vm.tabCount || 0) > 0 &&
      !vm.helpOpen &&
      !vm.inactiveOpen ? (
        <PacienteHerramientasNav
          items={
            (vm.herramientaNav as
              | {
                  id: "mood" | "clin" | "ia" | "juegos";
                  name: string;
                  navLabel: string;
                  on: boolean;
                  go: () => void;
                  disabled?: boolean;
                }[]
              | undefined) || []
          }
        />
      ) : null}

      {vm.plOpen && vm.plView && !vm.helpOpen && !vm.inactiveOpen ? (
        <PlayerOverlay vm={vm} />
      ) : null}
      {vm.helpOpen ? <CrisisLockScreen vm={vm} /> : null}
      {!vm.helpOpen && vm.inactiveOpen ? <InactiveLockScreen vm={vm} /> : null}
    </div>
  );
}

function DianaChat({ vm }: { vm: Vm }) {
  return <IaPanel vm={vm} />;
}

function DianaResumen({ vm }: { vm: Vm }) {
  return (
    <div style={{ animation: "naraTab .22s ease-out", padding: "6px 18px 22px", display: "flex", flexDirection: "column", gap: 14, fontSize: 19 }}>
      <button type="button" onClick={vm.closeResumen} style={{ alignSelf: "flex-start", ...btnFont(), fontSize: 16, border: "none", background: "none", color: "#0F2D3B", cursor: "pointer", padding: 0, minHeight: 48 }}>
        ← Inicio
      </button>
      <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 28, lineHeight: 1.2 }}>Mi resumen</span>
      <span style={{ fontSize: 15, color: "#6B7280" }}>Semana del 23 al 29 de septiembre</span>
      {vm.res.blocks.map((b) => (
        <div key={b.t} style={{ background: "#fff", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 6, borderLeft: "6px solid #0F2D3B" }}>
          <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 18 }}>{b.t}</span>
          <span style={{ lineHeight: 1.5 }}>{b.x}</span>
        </div>
      ))}
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Días que practicó la respiración</span>
        <div style={{ display: "flex", gap: 8 }}>
          {vm.res.dots.map((d) => (
            <div key={d.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #0F2D3B", background: d.bg, boxSizing: "border-box" }} />
              <span style={{ fontSize: 13, color: "#6B7280" }}>{d.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 18 }}>Para su sesión del {vm.sesionDia}</span>
        <span style={{ fontSize: 16, lineHeight: 1.45 }}>Temas que podría querer hablar, según lo que nos contó. Quite o agregue los que quiera.</span>
        {vm.topics.map((t) => (
          <div key={t.label} role="button" tabIndex={0} onClick={t.toggle} style={{ display: "flex", gap: 12, alignItems: "center", minHeight: 48, cursor: "pointer" }}>
            <span style={{ flex: "none", width: 28, height: 28, borderRadius: 7, border: "2px solid #0F2D3B", background: t.bg, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>{t.mark}</span>
            <span style={{ fontSize: 17, lineHeight: 1.35 }}>{t.label}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <input value={vm.topicInput} onChange={(e) => vm.setTopicInput(e.target.value)} placeholder="Agregar un tema" style={{ flex: 1, height: 48, borderRadius: 12, border: "1.5px solid #E5E0D5", padding: "0 12px", fontSize: 17, fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif' }} />
          <button type="button" onClick={vm.addTopic} style={{ ...btnFont(), fontSize: 16, fontWeight: 500, height: 48, padding: "0 14px", borderRadius: 14, border: "none", background: "#31C6E6", color: "#F7F5EF", cursor: "pointer" }}>
            Agregar
          </button>
        </div>
      </div>
      <Link href="/informe?t=resumen-diana&back=/paciente" style={{ fontSize: 16, minHeight: 48, display: "flex", alignItems: "center", color: "#0F2D3B", textDecoration: "none" }}>
        Ver como página para imprimir →
      </Link>
    </div>
  );
}

function DianaRoute({ vm }: { vm: Vm }) {
  return (
    <div style={{ animation: "naraTab .22s ease-out", padding: "6px 18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 28 }}>Mi ruta</span>
      {vm.lib.tabs.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 21 }}>
          Videos y técnicas asignados
        </span>
        {vm.lib.tabs.length > 1 ? (
        <div role="tablist" style={{ display: "grid", gridTemplateColumns: `repeat(${vm.lib.tabs.length}, 1fr)`, gap: 6, background: "#E5E0D5", borderRadius: 14, padding: 4 }}>
          {vm.lib.tabs.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={t.on} onClick={() => vm.setLibTab(t.key)} style={{ ...btnFont(), fontSize: 15, fontWeight: t.fw, minHeight: 44, border: "none", borderRadius: 11, background: t.bg, color: "#0F2D3B", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
        ) : null}
        {vm.lib.isList ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vm.lib.items.map((v) => (
              <button key={v.id} type="button" onClick={() => vm.playItem(v.id)} style={{ ...btnFont(), border: "none", background: "#fff", borderRadius: 16, padding: 10, display: "flex", gap: 12, alignItems: "center", textAlign: "left", cursor: "pointer", color: "#0F2D3B", minHeight: 64, whiteSpace: "normal" }}>
                <span style={{ flex: "none", width: 64, height: 52, borderRadius: 12, background: v.bg, display: "grid", placeItems: "center" }}>
                  <img src={v.char} alt="" style={{ height: 36, width: "auto", display: "block" }} />
                </span>
                <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 600, lineHeight: 1.25 }}>{v.title}</span>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{v.meta}</span>
                </span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{v.cta}</span>
              </button>
            ))}
          </div>
        ) : null}
        {vm.lib.empty ? <span style={{ color: "#6B7280" }}>Aún no hay videos ni técnicas asignados.</span> : null}
      </div>
      ) : null}
      {vm.route.length ? (
      <div style={{ background: "#fff", border: "1px solid #E5E0D5", borderRadius: 20, padding: "6px 16px" }}>
        {vm.route.map((r) => (
          <div key={r.name} style={{ padding: "12px 0", borderBottom: "1px solid #E5E0D5", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{r.name}</span>
              <span style={{ fontWeight: 500 }}>{r.val}</span>
            </div>
            {r.hasBar ? (
              <div style={{ height: 8, borderRadius: 4, background: "#E5E0D5" }}>
                <div style={{ width: r.pct, height: "100%", borderRadius: 4, background: "#0F2D3B" }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      ) : null}
      {vm.hasRouteChanges ? (
        <div style={{ background: "#fff", border: "1px solid #E5E0D5", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontWeight: 500 }}>Cambios en su ruta</span>
          {vm.routeChanges.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, borderTop: "1px solid #E5E0D5", paddingTop: 8 }}>
              <span style={{ fontSize: 14, color: "#6B7280" }}>{c.d}</span>
              <span style={{ lineHeight: 1.45 }}>{c.x}</span>
            </div>
          ))}
        </div>
      ) : null}
      <span style={{ fontSize: 15, color: "#6B7280" }}>Su psicóloga revisa su ruta cada mes.</span>
    </div>
  );
}

function PlayerOverlay({ vm }: { vm: Vm }) {
  const pl = vm.plView!;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 66, background: "rgba(22,20,19,.45)", display: "flex", alignItems: "flex-end" }}>
      <div role="dialog" aria-label={pl.title} style={{ background: "#fff", width: "100%", borderRadius: "24px 24px 0 0", padding: "20px 18px 34px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ height: 150, borderRadius: 18, background: pl.bg, display: "grid", placeItems: "center" }}>
          <img src={pl.char} alt="" style={{ height: 96, width: "auto", display: "block" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 21, lineHeight: 1.25 }}>{pl.title}</span>
          <span style={{ fontSize: 14, color: "#6B7280" }}>{pl.meta}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 8, borderRadius: 4, background: "#E5E0D5" }}>
            <div style={{ width: pl.w, height: "100%", borderRadius: 4, background: "#0F2D3B" }} />
          </div>
          <span style={{ fontSize: 13, color: "#6B7280" }}>{pl.time}</span>
        </div>
        {pl.done ? <span style={{ fontWeight: 500 }}>{pl.doneText}</span> : null}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={vm.plClose} style={{ ...btnFont(), fontSize: 15, fontWeight: 500, minHeight: 48, padding: "0 14px", borderRadius: 14, border: "1.5px solid #0F2D3B", background: "#fff", color: "#0F2D3B", cursor: "pointer", flex: 1 }}>
            Cerrar
          </button>
          <button type="button" onClick={vm.plToggle} style={{ ...btnFont(), fontSize: 16, fontWeight: 600, minHeight: 48, padding: "0 18px", borderRadius: 14, border: "none", background: "#31C6E6", color: "#F7F5EF", cursor: "pointer", flex: 1 }}>
            {pl.label}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pantalla amarilla: inactividad · botón redondo «Volví» (mismo lenguaje que «ayuda»). */
function InactiveLockScreen({ vm }: { vm: Vm }) {
  return (
    <div
      role="alertdialog"
      aria-label="Inactividad"
      aria-modal="true"
      className="absolute inset-0 z-[115] flex flex-col items-center justify-center bg-nara-amarillo px-8"
    >
      <button
        type="button"
        disabled={!!vm.confirmBackBusy}
        onClick={() => (vm.confirmBack as () => void)?.()}
        className={[
          "flex h-[min(72vw,280px)] w-[min(72vw,280px)] max-h-[42vh] max-w-[42vh] flex-col items-center justify-center gap-3 rounded-full border-[6px] border-nara-tinta bg-nara-blanco font-titulos font-bold uppercase tracking-[0.12em] text-nara-tinta shadow-[0_0_0_10px_rgba(22,20,19,0.12),0_0_0_22px_rgba(22,20,19,0.06)]",
          vm.confirmBackBusy
            ? "cursor-wait opacity-70"
            : "cursor-pointer active:scale-[0.97]",
        ].join(" ")}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
        <span className="text-[clamp(2rem,9vw,3.25rem)] leading-none">
          {vm.confirmBackBusy ? "..." : "Volví"}
        </span>
      </button>
    </div>
  );
}

/** Pantalla roja sangre: «ayuda» → espera → «estoy bien» solo tras atención clínica. */
function CrisisLockScreen({ vm }: { vm: Vm }) {
  const sent = !!vm.crisisAlertSent;
  const attended = !!vm.crisisAttended;
  const locShare = String(vm.locShare || "idle");
  const locMsg =
    locShare === "sharing"
      ? "Ubicación compartida con el equipo (hasta 24 h)."
      : locShare === "asking"
        ? "El teléfono pedirá permiso para usar su ubicación."
        : locShare === "denied"
          ? "Sin permiso de ubicación. Puede activarlo en ajustes del teléfono."
          : locShare === "unavailable"
            ? "Este dispositivo no puede compartir ubicación."
            : "Al pedir ayuda, compartirá su ubicación en tiempo real con el equipo clínico.";

  return (
    <div
      role="alertdialog"
      aria-label={
        !sent ? "Confirmar ayuda" : attended ? "Confirmar que está bien" : "Crisis activa"
      }
      aria-modal="true"
      className="absolute inset-0 z-[120] flex flex-col items-center justify-center gap-6 bg-[#6B0000] px-8"
    >
      {!sent ? (
        <>
          <button
            type="button"
            onClick={vm.askCall}
            className="flex h-[min(72vw,280px)] w-[min(72vw,280px)] max-h-[42vh] max-w-[42vh] cursor-pointer flex-col items-center justify-center gap-3 rounded-full border-[6px] border-white bg-white font-titulos font-bold uppercase tracking-[0.12em] text-[#6B0000] shadow-[0_0_0_10px_rgba(255,255,255,0.22),0_0_0_22px_rgba(255,255,255,0.1)] active:scale-[0.97]"
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3.5" />
              <path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
            </svg>
            <span className="text-[clamp(2rem,9vw,3.25rem)] leading-none">ayuda</span>
          </button>
          <p className="m-0 max-w-[18rem] text-center font-texto text-[15px] font-medium leading-snug text-white">
            {locMsg}
          </p>
          <p className="m-0 max-w-[18rem] text-center font-texto text-[13px] leading-snug text-white/80">
            Necesitamos acceso a su ubicación (iPhone o Android) para que el clínico
            pueda verla en el mapa mientras dura la crisis.
          </p>
          <button
            type="button"
            onClick={() => (vm.closeHelp as (() => void) | undefined)?.()}
            className="min-h-12 w-full max-w-[18rem] cursor-pointer rounded-full border-2 border-white/80 bg-transparent px-6 py-3 font-texto text-[15px] font-semibold text-white active:scale-[0.98]"
          >
            Cancelar
          </button>
        </>
      ) : (
        <>
          <p className="m-0 max-w-[20rem] text-center font-titulos text-[clamp(1.35rem,5.5vw,1.85rem)] font-semibold leading-snug text-white">
            {attended
              ? "El equipo ya te atendió. Cuando te sientas bien, confírmalo."
              : "Ya avisamos al equipo. Nos pondremos en contacto contigo."}
          </p>
          <p className="m-0 max-w-[18rem] text-center font-texto text-[14px] font-medium leading-snug text-white">
            {locMsg}
          </p>
          {attended ? (
            <button
              type="button"
              disabled={!!vm.confirmWellBusy}
              onClick={() => (vm.confirmWell as () => void)?.()}
              className={[
                "min-h-16 w-full max-w-[20rem] rounded-full border-0 px-8 py-4 font-titulos text-[clamp(1.25rem,5vw,1.65rem)] font-bold tracking-wide text-[#6B0000]",
                vm.confirmWellBusy
                  ? "cursor-wait bg-white/70"
                  : "cursor-pointer bg-white active:scale-[0.98]",
              ].join(" ")}
            >
              {vm.confirmWellBusy ? "guardando..." : "estoy bien"}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function RosalbaWA({ vm }: { vm: Vm }) {
  return (
    <>
      <div style={{ flex: "none", background: "#0F2D3B", color: "#fff", padding: "6px 10px 8px 4px", display: "flex", alignItems: "center", gap: 6 }}>
        <button type="button" aria-label="Atrás" style={{ flex: "none", width: 40, height: 48, border: "none", background: "none", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <img src={naraAsset("marca/whatsapp-perfil-640.png")} alt="" style={{ flex: "none", width: 42, height: 42, borderRadius: "50%", display: "block" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            QUINTIA <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", color: "#0F2D3B", fontSize: 11, display: "grid", placeItems: "center", fontWeight: 700 }}>✓</span>
          </span>
          <span style={{ fontSize: 13, opacity: 0.9 }}>en línea</span>
        </div>
        <UserMenu compact />
      </div>
      <div style={{ flex: "none", background: "#fff", borderBottom: "1px solid #E5E0D5", padding: "6px 14px", fontSize: 13, color: "#6B7280", textAlign: "center" }}>
        Celular de Paola (hija) · para doña Rosalba
      </div>
      <div ref={vm.waRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", background: "#EDE8E0", padding: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 17 }}>
        {vm.waMapped.map((m, i) => (
          <div key={i}>
            {m.sys ? (
              <span style={{ alignSelf: "center", background: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 13, color: "#6B7280", display: "block", textAlign: "center", margin: "0 auto" }}>{m.text}</span>
            ) : null}
            {m.inText ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "84%", background: "#fff", borderRadius: "4px 14px 14px 14px", padding: "9px 12px", lineHeight: 1.4 }}>
                {m.text}
                <span style={{ display: "block", textAlign: "right", fontSize: 12, color: "#6B7280", marginTop: 2 }}>{m.time}</span>
              </div>
            ) : null}
            {m.isAudio ? (
              <div style={{ alignSelf: m.align as "flex-start" | "flex-end", maxWidth: "86%", width: 280, background: m.bg, borderRadius: 14, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {m.hasTitle ? <span style={{ fontSize: 15, fontWeight: 500 }}>{m.title}</span> : null}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button type="button" onClick={m.play} aria-label="Reproducir audio" style={{ flex: "none", width: 48, height: 48, borderRadius: "50%", border: "none", background: "#31C6E6", color: "#F7F5EF", fontSize: 16, cursor: "pointer" }}>
                    {m.icon}
                  </button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, height: 30 }}>
                    {m.bars.map((b, j) => (
                      <span key={j} style={{ flex: 1, borderRadius: 2, height: b.h, background: b.c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{m.dur}</span>
                </div>
                {m.hasCaption ? <span style={{ fontSize: 15, lineHeight: 1.4 }}>{m.caption}</span> : null}
                {m.hasTranscript ? (
                  <div style={{ borderTop: "1px solid #E5E0D5", paddingTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Transcripción automática</span>
                    <span style={{ fontSize: 15, lineHeight: 1.4 }}>«{m.transcript}»</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            {m.isCard ? (
              <div style={{ alignSelf: "flex-start", width: "84%", background: "#fff", borderRadius: "4px 14px 14px 14px", padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ background: "#F7F5EF", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10, borderTop: "6px solid #0F2D3B" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0F2D3B" }}>
                    <QuintiaLogo href={null} size={28} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>Mi resumen · doña Rosalba</span>
                  {m.lines.map((l) => (
                    <div key={l.t} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#0F2D3B" }}>{l.t}</span>
                      <span style={{ fontSize: 16, lineHeight: 1.4 }}>{l.x}</span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "#6B7280", textAlign: "right", padding: "0 6px 2px" }}>Imagen · {m.time}</span>
              </div>
            ) : null}
            {m.isAsk ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "84%", background: "#fff", borderRadius: "4px 14px 14px 14px", padding: "9px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ lineHeight: 1.4 }}>{m.text}</span>
                {m.open ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {m.opts.map((o) => (
                      <button key={o.label} type="button" onClick={o.go} style={{ ...btnFont(), fontSize: 16, minHeight: 48, borderRadius: 10, border: "1.5px solid #0F2D3B", background: "#fff", color: "#0F2D3B", fontWeight: 500, cursor: "pointer" }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <span style={{ display: "block", textAlign: "right", fontSize: 12, color: "#6B7280" }}>{m.time}</span>
              </div>
            ) : null}
            {m.meText ? (
              <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#E7FAF5", borderRadius: "14px 4px 14px 14px", padding: "9px 12px", lineHeight: 1.4 }}>
                <span>{m.text}</span>
                <span style={{ display: "block", textAlign: "right", fontSize: 12, color: "#6B7280", marginTop: 2 }}>{m.time} ✓✓</span>
              </div>
            ) : null}
            {m.crisis ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "90%", background: "#FDE7E4", border: "1.5px solid #B42318", borderRadius: "4px 14px 14px 14px", padding: "10px 12px", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: 8 }}>
                <span>{m.text}</span>
                {vm.rosaLines.map((cl) => (
                  <a key={cl.label} href={cl.tel} style={{ minHeight: 48, padding: "4px 14px", boxSizing: "border-box", borderRadius: 24, border: "2px solid #B42318", background: cl.bg, color: cl.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 16, textAlign: "center", textDecoration: "none" }}>
                    <span>{cl.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 400 }}>{cl.sub}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-start" }}>
          {vm.waQuick.map((q) => (
            <button key={q.label} type="button" onClick={q.go} style={{ ...btnFont(), fontSize: 16, minHeight: 48, minWidth: 44, padding: "0 16px", borderRadius: 10, border: "none", background: "#fff", color: "#0F2D3B", fontWeight: 500, cursor: "pointer", boxShadow: "0 1px 0 #CFC8BE" }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: "none", background: "#EDE8E0", padding: "8px 10px 18px", display: "flex", gap: 8 }}>
        <input
          value={vm.waInput}
          onChange={(e) => vm.setWaInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && vm.waSendText()}
          placeholder="Mensaje · escriba AYUDA si la necesita"
          style={{ flex: 1, height: 48, borderRadius: 24, border: "none", padding: "0 16px", fontSize: 16, background: "#fff", fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif' }}
        />
        {vm.waEmpty ? (
          <button type="button" aria-label="Grabar audio" style={{ flex: "none", width: 48, height: 48, borderRadius: "50%", border: "none", background: "#31C6E6", color: "#F7F5EF", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v3" />
            </svg>
          </button>
        ) : null}
        {vm.waHasText ? (
          <button type="button" onClick={() => vm.waSendText()} aria-label="Enviar" style={{ flex: "none", width: 48, height: 48, borderRadius: "50%", border: "none", background: "#31C6E6", color: "#F7F5EF", fontSize: 18, cursor: "pointer" }}>
            ➤
          </button>
        ) : null}
      </div>
    </>
  );
}

/**
 * P-01 (TRL 2026-10-10): consentimiento del primer ingreso a la app. El consentimiento de la evaluación
 * lo firmó con el experto en la visita; aquí acepta el uso de la app antes de que se registre nada desde ella.
 */
function ConsentimientoApp({ onAccept }: { onAccept: () => void }) {
  const puntos = [
    "La app guarda lo que usted registre: su estado de ánimo, sus conversaciones con TEJIVA y sus pedidos de ayuda.",
    "Su psicólogo clínico y el experto de su territorio pueden ver esa información para acompañarle.",
    "Si juega en la app, su desempeño puede alimentar un analizador que solo ve su psicólogo clínico (no se comparte fuera del equipo).",
    "TEJIVA es un asistente con inteligencia artificial: no reemplaza a su psicólogo ni da diagnósticos.",
    "Si usted reporta una crisis, el equipo clínico le contactará.",
    "Puede retirar su consentimiento cuando quiera: dígaselo a su experto de campo o a su psicólogo.",
  ];
  return (
    <div
      data-testid="paciente-consentimiento"
      className="relative flex min-h-dvh flex-col overflow-hidden bg-[#F7F5EF] font-texto text-[#0F2D3B]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 12% 18%, rgba(224,240,232,0.55), transparent 55%), radial-gradient(ellipse 55% 40% at 92% 12%, rgba(218,158,70,0.28), transparent 50%), radial-gradient(ellipse 50% 35% at 78% 88%, rgba(194,114,65,0.16), transparent 55%)",
        }}
      />

      <header className="relative z-10 flex h-16 shrink-0 items-center border-b border-[#E5E0D5] bg-[#F7F5EF]/95 px-4 backdrop-blur-sm sm:px-6">
        <QuintiaLogo href={null} size={30} />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <section className="flex w-full max-w-[520px] flex-col gap-5 rounded-2xl border border-[#E5E0D5] bg-white p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#E5E0D5]">
              <img src={tejivaAsset("base")} alt="" className="block h-10 w-10" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm font-medium uppercase tracking-[0.12em] text-[#31C6E6]">
                {BRAND.agentName}
              </span>
              <span className="font-mono text-[11px] text-[#6B7280]">{BRAND.agentRole}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
              Consentimiento
            </p>
            <h1 className="m-0 font-titulos text-[clamp(1.5rem,4vw,1.85rem)] font-extrabold leading-tight text-[#0F2D3B]">
              Antes de empezar
            </h1>
            <p className="m-0 font-texto text-base leading-relaxed text-[#6B7280]">
              Lea estos puntos. Si está de acuerdo, toque «Acepto y continúo».
            </p>
          </div>

          <ul className="m-0 flex list-none flex-col gap-0 border-t border-[#E5E0D5] p-0">
            {puntos.map((t) => (
              <li
                key={t}
                className="border-b border-[#E5E0D5] py-3 font-texto text-[15px] leading-snug text-[#0F2D3B]"
              >
                {t}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onAccept}
            className="h-12 cursor-pointer rounded-md border-0 bg-[#31C6E6] px-5 font-texto text-[15px] font-bold !text-[#F7F5EF] transition hover:bg-[#1FA8C4] active:scale-[0.98]"
          >
            Acepto y continúo
          </button>
          <p className="m-0 font-mono text-[13px] leading-snug text-[#6B7280]">
            Si no está de acuerdo, cierre la app y hable con su experto de campo.
          </p>
        </section>
      </main>
    </div>
  );
}
