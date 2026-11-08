// @ts-nocheck
"use client";

import { useMemo, useState, type ChangeEventHandler } from "react";
import Link from "next/link";
import { IconX } from "@/components/shared/icons";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { RoleNav } from "@/components/shared/role-nav/RoleNav";
import {
  TableSearch,
  filterRowsBySearch,
} from "@/components/shared/table-search/TableSearch";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { HerramientasSection } from "@/modules/clinico/herramientas";
import { CrisisBoard } from "@/modules/clinico/components/CrisisBoard";
import { AnalizadorPanel } from "@/modules/clinico/components/AnalizadorPanel";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { IconoTejiva } from "@/components/shared/brand/QuintiaIconos";

type CrisisHistoryEvent = {
  key: string;
  when: string;
  ago: string;
  typeLabel: string;
  typeBg: string;
  typeFg: string;
  by: string;
  byMeta: string;
  source: string;
  what: string;
  detail: string;
};

function CrisisHistoryEventCard({ ev }: { ev: CrisisHistoryEvent }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-linea bg-nara-crema/40 px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: ev.typeBg, color: ev.typeFg }}
        >
          {ev.typeLabel}
        </span>
        <span className="text-[13px] text-texto-secundario">
          {ev.when} · {ev.ago}
        </span>
      </div>
      <p className="m-0 text-[15px] leading-snug text-nara-tinta">{ev.what}</p>
      {ev.detail ? (
        <p className="m-0 text-sm text-texto-secundario">{ev.detail}</p>
      ) : null}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-texto-secundario">
        <span>
          <span className="font-medium text-nara-tinta">Quién:</span> {ev.by}
          {ev.byMeta ? ` · ${ev.byMeta}` : ""}
        </span>
        {ev.source ? (
          <span>
            <span className="font-medium text-nara-tinta">Origen:</span> {ev.source}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ClinicoTopbar({ v }: { v: Record<string, unknown> }) {
  const navItems = (
    (v.nav as {
      key?: string;
      label: string;
      active?: boolean;
      href?: string;
      go?: () => void;
    }[] | undefined) || []
  ).map((n, i) => ({
    key: n.key || String(i) + n.label,
    label: n.label,
    active: !!n.active,
    href: n.href,
    onClick: n.href ? undefined : () => n.go?.(),
  }));

  return (
    <div className="nara-topbar gap-3 px-3 sm:gap-5 sm:px-6 md:px-8">
        <div className="flex h-full min-w-0 flex-1 items-stretch gap-3 sm:gap-6">
          <QuintiaLogo href="/clinico" />
          <RoleNav items={navItems} />
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-3.5 md:gap-4">
          <button
            type="button"
            onClick={() => (v.goAlerts as () => void)?.()}
            className={
              v.hasCrisisPending
                ? "hidden cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-[#B42318] bg-[#B42318] px-3 py-1.5 font-texto text-[13px] font-semibold !text-[#F7F5EF] sm:inline-flex"
                : "hidden max-w-[180px] cursor-pointer items-center gap-2 truncate rounded-full border border-[#E5E0D5] bg-[#F7F5EF] px-3 py-1.5 font-texto text-[13px] font-medium !text-[#6B7280] sm:inline-flex"
            }
          >
            {v.hasCrisisPending ? (
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white" />
            ) : null}
            {v.critText as string}
          </button>
          <button
            type="button"
            onClick={() => (v.openAgent as () => void)?.()}
            aria-label="Abrir TEJIVA, asistente de QUINTIA"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#E5E0D5] bg-[#F1ECF9] px-2.5 font-texto text-sm font-medium text-[#0F2D3B] transition hover:brightness-[0.98] sm:h-11 sm:px-4 sm:text-[15px]"
          >
            <IconoTejiva className="block h-7 w-7 sm:-ml-0.5 sm:h-8 sm:w-8" />
            <span className="hidden flex-col items-start leading-none sm:flex">
              <span className="font-semibold">TEJIVA</span>
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6B7280]">
                asistente
              </span>
            </span>
          </button>
          <UserMenu notifKey="clin" />
          {v.dev ? (
            <span
              style={{
                fontFamily: '"DM Mono", ui-monospace, monospace',
                fontSize: 11,
                color: "#6B7280",
                border: "1px solid #E5E0D5",
                padding: "2px 6px",
                borderRadius: 5,
              }}
            >
              {v.screenCode as string}
            </span>
          ) : null}
        </div>
    </div>
  );
}


type CrisisAlert = Record<string, unknown>;

export function ClinicoBody({ v }: { v: Record<string, unknown> }) {
  const as = (v.as as Record<string, unknown>) || {};
  const f = (v.f as Record<string, unknown>) || {};
  const [crisisHistoryOpen, setCrisisHistoryOpen] = useState(false);
  const [patientsQ, setPatientsQ] = useState("");
  const [crisisHistQ, setCrisisHistQ] = useState("");
  const [crisisQ, setCrisisQ] = useState("");
  const [approvalsQ, setApprovalsQ] = useState("");
  const fileCrisisHistory = (f.crisisHistory as CrisisHistoryEvent[] | undefined) || [];
  const lastCrisisEvent = fileCrisisHistory[0] || null;

  const patientsRows = useMemo(
    () =>
      filterRowsBySearch(
        (v.patients as Record<string, unknown>[] | undefined) || [],
        patientsQ,
      ),
    [v.patients, patientsQ],
  );
  const crisisHistoryRows = useMemo(
    () =>
      filterRowsBySearch(
        (v.crisisHistory as Record<string, unknown>[] | undefined) || [],
        crisisHistQ,
      ),
    [v.crisisHistory, crisisHistQ],
  );
  const approvalsRows = useMemo(
    () =>
      filterRowsBySearch(
        (v.approvals as Record<string, unknown>[] | undefined) || [],
        approvalsQ,
      ),
    [v.approvals, approvalsQ],
  );
  const crisisBoard = v.crisisBoard as
    | {
        toTake?: CrisisAlert[];
        mine?: CrisisAlert[];
        others?: CrisisAlert[];
        info?: CrisisAlert[];
        awaiting?: CrisisAlert[];
        closed?: CrisisAlert[];
      }
    | undefined;
  const crisisToTake = useMemo(
    () => filterRowsBySearch(crisisBoard?.toTake || [], crisisQ),
    [crisisBoard?.toTake, crisisQ],
  );
  const crisisMine = useMemo(
    () => filterRowsBySearch(crisisBoard?.mine || [], crisisQ),
    [crisisBoard?.mine, crisisQ],
  );
  const crisisOthers = useMemo(
    () => filterRowsBySearch(crisisBoard?.others || [], crisisQ),
    [crisisBoard?.others, crisisQ],
  );
  const crisisInfo = useMemo(
    () => filterRowsBySearch(crisisBoard?.info || [], crisisQ),
    [crisisBoard?.info, crisisQ],
  );
  const crisisAwaiting = useMemo(
    () =>
      filterRowsBySearch(
        (crisisBoard?.awaiting as CrisisAlert[] | undefined) ||
          (v.awaiting as CrisisAlert[] | undefined) ||
          [],
        crisisQ,
      ),
    [crisisBoard?.awaiting, v.awaiting, crisisQ],
  );
  const crisisClosed = useMemo(
    () =>
      filterRowsBySearch(
        (crisisBoard?.closed as CrisisAlert[] | undefined) ||
          (v.closed as CrisisAlert[] | undefined) ||
          [],
        crisisQ,
      ),
    [crisisBoard?.closed, v.closed, crisisQ],
  );

  return (
    <div
      data-screen-label="Clínico"
      className="min-w-0 w-full bg-[#F7F5EF] font-texto text-[15px] text-[#0F2D3B]"
    >
      <div className="nara-page">
        <NaraMsgAlert
          msg={v.msg as string | undefined}
          onClear={() => (v.clearMsg as () => void)?.()}
        />
        {v.isHome ? (
          <div className="nara-home-grid">
            <div className="nara-home-main">
              <AgentPanel
                role="clin"
                mode="home"
                onAction={v.agentAction as (a: string, p: unknown) => void}
                onOpenDrawer={v.askFromHome as (q: string) => void}
                style={{ flex: 1, minWidth: 0, width: "100%" }}
              />
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => (v.goAlerts as () => void)?.()}
                className={
                  v.hasCrisisPending
                    ? "flex cursor-pointer flex-col gap-1.5 rounded-2xl border-[1.5px] border-[#B42318] bg-[#B42318] px-[18px] py-[18px] text-left font-texto !text-[#F7F5EF] transition hover:bg-[#9C2F25]"
                    : "flex cursor-pointer flex-col gap-1.5 rounded-2xl border-[1.5px] border-[#E5E0D5] bg-white px-[18px] py-[18px] text-left font-texto !text-[#0F2D3B] transition hover:bg-[#E5E0D5]/30"
                }
              >
                <span className="font-titulos text-base font-extrabold">
                  {v.hasCrisisPending ? "Crisis · atender ahora" : "Cola de crisis"}
                </span>
                <span
                  className="font-mono text-sm font-medium"
                  style={{ color: v.hasCrisisPending ? "#F7F5EF" : (v.critFg as string) }}
                >
                  {v.critText as string}
                </span>
                <span
                  className="font-mono text-[12px]"
                  style={{ color: v.hasCrisisPending ? "rgba(251,250,243,.85)" : "#6B7280" }}
                >
                  {v.openCount as number} en Mis pacientes · estado Crisis
                </span>
              </button>
              <button
                type="button"
                onClick={() => (v.goApprovals as () => void)?.()}
                className="flex cursor-pointer flex-col gap-1.5 rounded-2xl border-[1.5px] border-[#E5E0D5] bg-white px-[18px] py-[18px] text-left font-texto !text-[#0F2D3B] transition hover:bg-[#E5E0D5]/30"
              >
                <span className="font-titulos text-base font-extrabold">Aprobaciones</span>
                <span className="font-mono text-sm font-medium">
                  {(v.approvalsAll as unknown[] | undefined)?.length
                    ? (v.approvalsAll as unknown[]).length + " pendientes"
                    : "Sin pendientes"}
                </span>
                <span className="font-mono text-[12px] text-[#6B7280]">
                  Evaluaciones, rutas y reglas
                </span>
              </button>
              <button
                type="button"
                onClick={() => (v.goAnalizador as () => void)?.()}
                className="flex cursor-pointer flex-col gap-1.5 rounded-2xl border-[1.5px] border-[#E4C98C] bg-[#FFF8EA] px-[18px] py-[18px] text-left font-texto !text-[#0F2D3B] transition hover:bg-[#FAE7BF]/60"
              >
                <span className="font-titulos text-base font-extrabold text-[#6E4705]">
                  Analizador
                </span>
                <span className="font-mono text-sm font-medium text-[#6E4705]">
                  {(v.anCardTxt as string) || "sin cambios por revisar"}
                </span>
                <span className="font-mono text-[12px] text-[#6B7280]">
                  Desempeño frente a su propia historia
                </span>
              </button>
              <button
                type="button"
                onClick={() => (v.goCrisisHistory as () => void)?.()}
                className="flex cursor-pointer flex-col gap-1.5 rounded-2xl border-[1.5px] border-[#E5E0D5] bg-white px-[18px] py-[18px] text-left font-texto !text-[#0F2D3B] transition hover:bg-[#E5E0D5]/30"
              >
                <span className="font-titulos text-base font-extrabold">Historial de crisis</span>
                <span className="font-mono text-sm font-medium">
                  {((v.crisisHistory as unknown[]) || []).length
                    ? ((v.crisisHistory as unknown[]).length) + " eventos"
                    : "Sin eventos aún"}
                </span>
                <span className="font-mono text-[12px] text-[#6B7280]">
                  Creación, toma, respuesta y cierre
                </span>
              </button>
              <div className="flex flex-col gap-2.5 rounded-2xl border border-[#E5E0D5] bg-white px-[18px] py-[18px]">
                <span className="font-titulos text-base font-extrabold text-[#0F2D3B]">
                  Próximas sesiones
                </span>
                {(v.upcoming as { name: string; next: string; open: () => void }[] | undefined)?.map(
                  (u, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => u.open?.()}
                      className="flex cursor-pointer flex-col gap-0.5 border-0 border-t border-[#E5E0D5] bg-transparent pt-2 text-left font-texto !text-[#0F2D3B]"
                    >
                      <span className="font-titulos text-[15px] font-extrabold">{u.name}</span>
                      <span className="font-mono text-[12px] text-[#6B7280]">{u.next}</span>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        ) : null}

        {v.asOpen ? (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4"
            role="presentation"
          >
            <div
              className="absolute inset-0 bg-[rgba(22,20,19,.45)]"
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Asignar recurso"
              className="relative z-[1] flex max-h-[min(92vh,880px)] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[20px] border border-linea bg-nara-blanco shadow-[0_20px_50px_rgba(22,20,19,.3)] sm:rounded-[20px]"
            >
              <header className="flex shrink-0 flex-col gap-3 border-b border-linea px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 font-titulos text-xl font-semibold text-nara-tinta sm:text-[22px]">
                    Asignar recurso · {as.name as string}
                  </h2>
                  <button
                    type="button"
                    onClick={() => (as.close as () => void)?.()}
                    aria-label="Cerrar"
                    className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-nara-tinta"
                  >
                    <IconX size={22} aria-hidden />
                  </button>
                </div>
                <div className="nara-form-grid-4 gap-2.5">
                  <input
                    value={(as.q as string) || ""}
                    onChange={as.setQ as (e: React.ChangeEvent<HTMLInputElement>) => void}
                    placeholder="Buscar por título o tema"
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta outline-none"
                  />
                  <select
                    value={(as.tipo as string) || ""}
                    onChange={as.setTipo as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta outline-none"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="video">Videos</option>
                    <option value="tecnica">Técnicas</option>
                  </select>
                  <select
                    value={(as.tema as string) || ""}
                    onChange={as.setTema as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta outline-none"
                  >
                    <option value="">Todos los temas</option>
                    {(as.temas as string[] | undefined)?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <select
                    value={(as.para as string) || ""}
                    onChange={as.setPara as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    className="h-11 rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-2 font-texto text-[15px] text-nara-tinta outline-none"
                  >
                    <option value="">Para quién</option>
                    <option>Todos</option>
                    <option>Adultos</option>
                    <option>60+</option>
                    <option>Familias</option>
                  </select>
                </div>
              </header>

              <div className="nara-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
                {as.confirming ? (
                  <div className="mb-4 flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-crisis bg-crisis-suave p-4">
                    <span className="font-semibold text-crisis-texto">{as.cTag as string}</span>
                    <span className="leading-relaxed">
                      «{as.cTitle as string}» {as.cWarn as string}
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => (as.confirm as () => void)?.()}
                        className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-[18px] font-texto text-[15px] font-medium text-nara-tinta"
                      >
                        Lo trabajaré en sesión
                      </button>
                      <button
                        type="button"
                        onClick={() => (as.cancel as () => void)?.()}
                        className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
                <NaraMsgAlert
                  msg={as.msg as string}
                  onClear={() => (as.clearMsg as () => void)?.()}
                />
                <div className="flex flex-col">
                  {(
                    as.items as {
                      title: string;
                      meta: string;
                      hasCover: boolean;
                      cover: string;
                      hasTag: boolean;
                      tag: string;
                      tagBg: string;
                      pick: () => void;
                    }[]
                  )?.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-t border-[#E5E0D5] py-2.5"
                    >
                      {it.hasCover ? (
                        <img
                          src={it.cover}
                          alt=""
                          className="h-[52px] w-10 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{it.title}</span>
                          {it.hasTag ? (
                            <span
                              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-nara-tinta"
                              style={{ background: it.tagBg }}
                            >
                              {it.tag}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[13px] text-texto-secundario">{it.meta}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => it.pick?.()}
                        className="h-11 shrink-0 cursor-pointer rounded-[14px] border-[1.5px] border-nara-tinta bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
                      >
                        Asignar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {v.isAlerts ? (
          <CrisisBoard
            crisisTab={String(v.crisisTab || "take")}
            tabs={
              (
                (v.crisisBoard as {
                  tabs?: {
                    id: string;
                    label: string;
                    n: number;
                    active: boolean;
                    pick: () => void;
                    hint: string;
                  }[];
                })?.tabs || []
              )
            }
            lateCount={
              Number(
                (v.crisisBoard as { counts?: { late?: number } })?.counts?.late || 0,
              )
            }
            crisisQ={crisisQ}
            setCrisisQ={setCrisisQ}
            goCrisisHistory={() => (v.goCrisisHistory as () => void)?.()}
            toTake={crisisToTake}
            mine={crisisMine}
            others={crisisOthers}
            info={crisisInfo}
            awaiting={crisisAwaiting}
            closed={crisisClosed}
          />
        ) : null}

        {v.isCrisisHistory ? (
          <div className="flex flex-col gap-4">
            <div className="nara-page-head flex flex-row flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => (v.goAlerts as () => void)?.()}
                  className="cursor-pointer self-start border-0 bg-transparent p-0 font-texto text-[15px] text-nara-tinta"
                >
                  ← Cola de crisis
                </button>
                <span className="font-titulos text-[28px] font-semibold text-nara-tinta">
                  Historial de crisis
                </span>
                <span className="text-[15px] text-texto-secundario">
                  Log completo: creación, quién la generó, toma del caso, reintentos, respuesta y
                  cierre.
                </span>
              </div>
              <span className="text-sm text-texto-secundario">
                {crisisHistoryRows.length}
                {crisisHistQ.trim()
                  ? ` de ${((v.crisisHistory as unknown[]) || []).length}`
                  : ""}{" "}
                eventos
              </span>
            </div>
            <TableSearch
              value={crisisHistQ}
              onChange={setCrisisHistQ}
              placeholder="Buscar por paciente, tipo, quién, lugar…"
              className="sm:max-w-md"
            />
            <div className="flex flex-col gap-3">
              {(
                crisisHistoryRows as {
                  key: string;
                  when: string;
                  ago: string;
                  typeLabel: string;
                  typeBg: string;
                  typeFg: string;
                  name: string;
                  by: string;
                  byMeta: string;
                  source: string;
                  what: string;
                  detail: string;
                  profile: string;
                  place: string;
                  hasFile: boolean;
                  openFile: (() => void) | null;
                }[]
              ).map((ev) => (
                <div
                  key={ev.key}
                  className="flex flex-col gap-2 rounded-[18px] border border-linea bg-nara-blanco px-4 py-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: ev.typeBg, color: ev.typeFg }}
                    >
                      {ev.typeLabel}
                    </span>
                    <span className="text-[13px] text-texto-secundario">
                      {ev.when} · {ev.ago}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-titulos text-lg font-semibold text-nara-tinta">
                      {ev.name}
                    </span>
                    {ev.profile ? (
                      <span className="text-sm text-texto-secundario">{ev.profile}</span>
                    ) : null}
                    {ev.place ? (
                      <span className="text-sm text-texto-secundario">· {ev.place}</span>
                    ) : null}
                  </div>
                  <p className="m-0 text-[15px] leading-snug text-nara-tinta">{ev.what}</p>
                  {ev.detail ? (
                    <p className="m-0 text-sm text-texto-secundario">{ev.detail}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-texto-secundario">
                    <span>
                      <span className="font-medium text-nara-tinta">Quién:</span> {ev.by}
                      {ev.byMeta ? ` · ${ev.byMeta}` : ""}
                    </span>
                    {ev.source ? (
                      <span>
                        <span className="font-medium text-nara-tinta">Origen:</span> {ev.source}
                      </span>
                    ) : null}
                    {ev.hasFile && ev.openFile ? (
                      <button
                        type="button"
                        onClick={() => ev.openFile?.()}
                        className="cursor-pointer border-0 bg-transparent p-0 font-texto text-[13px] font-medium text-nara-tinta underline"
                      >
                        Abrir ficha
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!crisisHistoryRows.length ? (
                <div className="rounded-[14px] border border-dashed border-linea bg-nara-blanco px-8 py-10 text-center text-texto-secundario">
                  {crisisHistQ.trim()
                    ? "Ningún evento coincide con la búsqueda."
                    : "Aún no hay eventos de crisis. Cuando se cree, tome o cierre una alerta, aparecerá aquí."}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {v.isAnalizador ? (
          <AnalizadorPanel
            totales={v.analizadorTotales || []}
            avisos={v.analizadorAvisos || []}
            sinAvisos={!!v.analizadorSinAvisos}
            carga={v.analizadorCarga || []}
            goHome={() => (v.goHome as () => void)?.()}
          />
        ) : null}

        {v.isPatients ? (
          <div className="flex flex-col gap-3.5">
            <div className="nara-page-head flex flex-row flex-wrap items-baseline justify-between gap-3">
              <span className="font-titulos text-[28px] font-semibold text-nara-tinta">
                Mis pacientes
              </span>
              <span className="text-texto-secundario">
                7 estados · perfiles P01–P15 · crisis visibles en rojo · analizador
                frente a su propia historia
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(
                  v.stateFilters as
                    | { id: string; label: string; active: boolean; pick: () => void }[]
                    | undefined
                )?.map((sf) => (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={() => sf.pick?.()}
                    className={
                      sf.active
                        ? "h-9 cursor-pointer rounded-full border-none bg-nara-tinta px-3.5 font-texto text-sm font-medium text-white"
                        : "h-9 cursor-pointer rounded-full border-[1.5px] border-linea bg-nara-blanco px-3.5 font-texto text-sm font-medium text-nara-tinta"
                    }
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
              <TableSearch
                value={patientsQ}
                onChange={setPatientsQ}
                placeholder="Buscar paciente, lugar, perfil, estado…"
              />
            </div>
            <div className="overflow-hidden rounded-[20px] border border-linea bg-nara-blanco">
              <div className="nara-scroll-x">
              <div style={{ minWidth: 1020 }}>
              <div
                className="grid items-center gap-0 border-b border-[#E5E0D5] bg-[#F7F5EF] text-sm font-medium text-[#6B7280]"
                style={{
                  gridTemplateColumns:
                    "96px minmax(0,1.5fr) minmax(0,1.2fr) 90px 120px minmax(0,1fr) 100px minmax(0,1fr)",
                }}
              >
                <span className="px-3 py-3 text-center">Crisis</span>
                <span className="py-3 pr-3.5">Paciente</span>
                <span className="py-3 pr-3.5">Lugar</span>
                <span className="py-3 pr-3.5">Perfil</span>
                <span className="py-3 pr-3.5">Estado</span>
                <span className="py-3 pr-3.5">Próxima sesión</span>
                <span className="py-3 pr-3.5">Adherencia</span>
                <span className="py-3 pr-5">Última acción</span>
              </div>
              {patientsRows.map((p, i) => (
                <div
                  key={i}
                  className={
                    p.inCrisis
                      ? "grid items-stretch gap-0 border-t border-[#4A0000] bg-[#6B0000] text-white hover:bg-[#5A0000]"
                      : "grid items-stretch gap-0 border-t border-linea hover:bg-[#FAF8F5]"
                  }
                  style={{
                    gridTemplateColumns:
                      "96px minmax(0,1.5fr) minmax(0,1.2fr) 90px 120px minmax(0,1fr) 100px minmax(0,1fr)",
                  }}
                >
                  <div className="min-h-[72px]">
                    {p.inCrisis ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          (p.openCrisis as (() => void) | undefined)?.();
                        }}
                        className="flex h-full w-full cursor-pointer items-center justify-center border-none bg-[#4A0000] px-2 font-texto text-xs font-semibold uppercase tracking-wide text-white"
                        aria-label={"Atender crisis de " + String(p.name || "")}
                      >
                        Crisis
                      </button>
                    ) : (
                      <div className="h-full w-full bg-transparent" aria-hidden />
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => (p.open as () => void)?.()}
                    onKeyDown={(e) => e.key === "Enter" && (p.open as () => void)?.()}
                    className="flex cursor-pointer flex-col justify-center gap-1 py-3.5 pr-3.5"
                  >
                    <span className="font-medium">{p.name as string}</span>
                    <span
                      className={
                        p.inCrisis
                          ? "text-[13px] text-white/75"
                          : "text-[13px] text-texto-secundario"
                      }
                    >
                      {p.age as number} años
                    </span>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => (p.open as () => void)?.()}
                    onKeyDown={(e) => e.key === "Enter" && (p.open as () => void)?.()}
                    className="flex cursor-pointer items-center py-3.5 pr-3.5"
                  >
                    {p.place as string}
                  </span>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => (p.open as () => void)?.()}
                    onKeyDown={(e) => e.key === "Enter" && (p.open as () => void)?.()}
                    className="flex cursor-pointer items-center gap-1.5 py-3.5 pr-3.5"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        background: p.inCrisis ? "#FFFFFF" : (p.rc as string),
                      }}
                    />
                    <span className="font-medium">{p.profile as string}</span>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => (p.open as () => void)?.()}
                    onKeyDown={(e) => e.key === "Enter" && (p.open as () => void)?.()}
                    className="flex cursor-pointer items-center py-3.5 pr-3.5"
                  >
                    <span
                      className="w-fit rounded-md px-2 py-1 text-xs font-medium"
                      style={
                        p.inCrisis
                          ? { background: "#4A0000", color: "#FFFFFF" }
                          : {
                              background: p.stateBg as string,
                              color: p.stateFg as string,
                            }
                      }
                    >
                      {p.stateLabel as string}
                    </span>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => (p.open as () => void)?.()}
                    onKeyDown={(e) => e.key === "Enter" && (p.open as () => void)?.()}
                    className="flex cursor-pointer items-center py-3.5 pr-3.5"
                  >
                    {p.next as string}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => (p.open as () => void)?.()}
                    onKeyDown={(e) => e.key === "Enter" && (p.open as () => void)?.()}
                    className="flex cursor-pointer items-center py-3.5 pr-3.5"
                  >
                    {p.adh as string}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (p.signalIsPending) {
                        (p.openApprovals as (() => void) | undefined)?.();
                        return;
                      }
                      if (p.signalIsCrisis) {
                        (p.openCrisis as (() => void) | undefined)?.();
                        return;
                      }
                      (p.open as () => void)?.();
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      if (p.signalIsPending) {
                        (p.openApprovals as (() => void) | undefined)?.();
                        return;
                      }
                      if (p.signalIsCrisis) {
                        (p.openCrisis as (() => void) | undefined)?.();
                        return;
                      }
                      (p.open as () => void)?.();
                    }}
                    className="flex cursor-pointer items-center py-3.5 pr-5 font-medium underline-offset-2 hover:underline"
                    style={{
                      color: p.inCrisis ? "#FFFFFF" : (p.sigFg as string),
                    }}
                  >
                    {p.signal as string}
                  </span>
                </div>
              ))}
              {!patientsRows.length ? (
                <p className="m-0 border-t border-linea px-5 py-8 text-center text-sm text-texto-secundario">
                  {patientsQ.trim()
                    ? "Ningún paciente coincide con la búsqueda."
                    : "No hay pacientes en este filtro."}
                </p>
              ) : null}
              </div>
              </div>
            </div>
          </div>
        ) : null}

        {v.isApprovals ? (
          <div className="flex max-w-[880px] flex-col gap-6">
            <button
              type="button"
              onClick={() => (v.goHome as () => void)?.()}
              className="w-fit cursor-pointer border-none bg-transparent p-0 font-texto text-[15px] font-medium text-nara-tinta"
            >
              ← Volver a Inicio
            </button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="font-titulos text-[clamp(26px,4vw,32px)] font-semibold tracking-tight text-nara-tinta">
                  Aprobaciones
                </span>
                <span className="max-w-[36rem] text-[15px] leading-snug text-texto-secundario">
                  Evaluaciones de campo, rutas y reglas. Al rechazar una evaluación se restaura el perfil anterior.
                </span>
              </div>
              <img
                src="/quintia/tejiva/tejiva-escucha.svg"
                alt=""
                className="hidden h-14 w-auto shrink-0 sm:block"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(
                  v.apprFilters as
                    | { id: string; label: string; n: number; active: boolean; pick: () => void }[]
                    | undefined
                )?.map((ft) => (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => ft.pick?.()}
                    className={
                      ft.active
                        ? "h-9 cursor-pointer rounded-full border-none bg-nara-tinta px-3.5 font-texto text-sm font-medium text-white"
                        : "h-9 cursor-pointer rounded-full border-[1.5px] border-linea bg-nara-blanco px-3.5 font-texto text-sm font-medium text-nara-tinta"
                    }
                  >
                    {ft.label}
                    {ft.n ? ` · ${ft.n}` : ""}
                  </button>
                ))}
              </div>
              <TableSearch
                value={approvalsQ}
                onChange={setApprovalsQ}
                placeholder="Buscar aprobación, paciente, perfil…"
              />
            </div>
            {v.msg ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-linea bg-exito-suave px-4 py-3 font-texto text-[15px] text-nara-tinta">
                <span>{v.msg as string}</span>
                <button
                  type="button"
                  onClick={() => (v.clearMsg as () => void)?.()}
                  className="cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-nara-tinta underline"
                >
                  Cerrar
                </button>
              </div>
            ) : null}
            {(
              approvalsRows as {
                kind?: string;
                code?: string;
                pid?: string;
                title: string;
                meta: string;
                months?: number;
                riskLabel?: string;
                digLabel?: string;
                riskColor?: string;
                kept?: { name: string; freq: string }[];
                changed?: { name: string; freq: string; from: string }[];
                added?: { name: string; freq: string }[];
                removed?: { name: string; freq: string }[];
                lines: string[];
                approve: () => void;
                reject: () => void;
              }[]
            ).map((ap, i) => (
              <article
                key={(ap.pid || ap.code || ap.title) + String(i)}
                className="overflow-hidden rounded-[24px] border border-linea bg-nara-blanco shadow-[0_10px_30px_rgba(22,20,19,0.04)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linea bg-[linear-gradient(135deg,#FFF9E3_0%,#F7F5EF_55%,#FFFFFF_100%)] px-5 py-4 sm:px-7">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-nara-amarillo px-2.5 py-1 font-texto text-xs font-semibold text-nara-tinta">
                        Pendiente
                      </span>
                      <span className="rounded-full border border-linea bg-nara-blanco px-2.5 py-1 font-texto text-xs text-texto-secundario">
                        {ap.kind === "rules"
                          ? "Reglas"
                          : ap.kind === "eval"
                            ? "Evaluación"
                            : "Ruta de cuidado"}
                      </span>
                    </div>
                    <h2 className="font-titulos text-xl font-semibold text-nara-tinta sm:text-[22px]">
                      {ap.title}
                    </h2>
                    <span className="text-sm text-texto-secundario">{ap.meta}</span>
                  </div>
                  {ap.kind === "path" ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className="rounded-full px-3 py-1 font-texto text-xs font-semibold text-nara-blanco"
                        style={{ background: ap.riskColor || "#0F2D3B" }}
                      >
                        {ap.riskLabel}
                      </span>
                      <span className="text-xs text-texto-secundario">Digital {ap.digLabel}</span>
                      <span className="font-texto text-sm font-medium text-nara-tinta">
                        {ap.months} meses
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-5 px-5 py-5 sm:px-7 sm:py-6">
                  {ap.kind === "path" ? (
                    <>
                      {ap.added?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-estado-al-dia">
                            Se agrega
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.added.map((x) => (
                              <div
                                key={"a-" + x.name}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-exito-suave px-3.5 py-3"
                              >
                                <span className="text-[15px] font-medium text-nara-tinta">{x.name}</span>
                                <span className="shrink-0 text-sm text-texto-secundario">{x.freq}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                      {ap.changed?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-estado-bajo-meta">
                            Cambia
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.changed.map((x) => (
                              <div
                                key={"c-" + x.name}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#E7FAF5] px-3.5 py-3"
                              >
                                <span className="text-[15px] font-medium text-nara-tinta">{x.name}</span>
                                <span className="text-sm text-texto-secundario">
                                  {x.from} → <span className="font-medium text-nara-tinta">{x.freq}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                      {ap.removed?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-crisis-texto">
                            Se quita
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.removed.map((x) => (
                              <div
                                key={"r-" + x.name}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-crisis-suave px-3.5 py-3"
                              >
                                <span className="text-[15px] font-medium text-nara-tinta line-through decoration-crisis-texto/40">
                                  {x.name}
                                </span>
                                <span className="shrink-0 text-sm text-texto-secundario">{x.freq}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                      {ap.kept?.length ? (
                        <section className="flex flex-col gap-2.5">
                          <span className="font-texto text-xs font-semibold uppercase tracking-wide text-texto-secundario">
                            Se mantiene
                          </span>
                          <div className="flex flex-col gap-2">
                            {ap.kept.map((x) => (
                              <div
                                key={"k-" + x.name}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-linea bg-superficie-2 px-3.5 py-3"
                              >
                                <span className="text-[15px] text-nara-tinta">{x.name}</span>
                                <span className="shrink-0 text-sm text-texto-secundario">{x.freq}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                      {ap.lines.map((l, j) => (
                        <li
                          key={j}
                          className="flex gap-2.5 rounded-2xl border border-linea bg-superficie-2 px-3.5 py-3 text-[15px] leading-snug text-nara-tinta"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-nara-amarillo" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 border-t border-linea bg-superficie-2/60 px-5 py-4 sm:px-7">
                  <button
                    type="button"
                    onClick={() => ap.approve?.()}
                    className="h-12 min-w-[140px] cursor-pointer rounded-2xl border-none bg-nara-amarillo px-5 font-texto text-[15px] font-semibold text-nara-tinta transition hover:brightness-95"
                  >
                    {ap.kind === "eval" ? "Aceptar evaluación" : "Aprobar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => ap.reject?.()}
                    className="h-12 cursor-pointer rounded-2xl border-[1.5px] border-nara-tinta bg-nara-blanco px-5 font-texto text-[15px] font-medium text-nara-tinta transition hover:bg-nara-crema"
                  >
                    {ap.kind === "eval" ? "Rechazar · restaurar anterior" : "Devolver sin aprobar"}
                  </button>
                </div>
              </article>
            ))}
            {!approvalsRows.length ? (
              <div className="flex flex-col items-start gap-3 rounded-[24px] border border-linea bg-nara-blanco px-6 py-8">
                <img src="/quintia/tejiva/tejiva-base.svg" alt="" className="h-12 w-auto" />
                <span className="font-titulos text-lg font-semibold text-nara-tinta">
                  {approvalsQ.trim()
                    ? "Ninguna aprobación coincide"
                    : "No hay pendientes en este filtro"}
                </span>
                <span className="text-[15px] text-texto-secundario">
                  {approvalsQ.trim()
                    ? "Pruebe con otro término o limpie la búsqueda."
                    : "Aquí llegan evaluaciones de campo, cambios de ruta y reglas enviados por administración."}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {v.isFile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <button
              type="button"
              onClick={() => (v.fileBack as () => void)?.()}
              style={{
                alignSelf: "flex-start",
                fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                fontSize: 15,
                fontWeight: 500,
                border: "none",
                background: "none",
                color: "#0F2D3B",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {v.fileBackLabel as string}
            </button>

            <div
              style={{
                background: "#fff",
                border: f.inCrisis ? "1.5px solid #B42318" : "1px solid #E5E0D5",
                borderRadius: 20,
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                    fontWeight: 600,
                    fontSize: 28,
                  }}
                >
                  {f.name as string}
                </span>
                <span style={{ color: "#6B7280" }}>
                  {f.age as number} años · {f.place as string}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span
                  className="rounded-lg px-3 py-1.5 text-sm font-medium"
                  style={{ background: f.stateBg as string, color: f.stateFg as string }}
                >
                  {f.stateLabel as string}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #E5E0D5",
                  }}
                >
                  {f.profile as string}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: f.rbg as string,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: f.rc as string,
                    }}
                  />
                  Riesgo {f.risk as string}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: f.dbg as string,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: f.dc as string,
                    }}
                  />
                  Digital {f.dig as string}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: f.consBg as string,
                    color: f.consFg as string,
                  }}
                >
                  {f.consText as string}
                </span>
              </div>
            </div>
            {/* Historial de crisis: solo el último; el resto en modal */}
            <div className="flex flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-titulos text-xl font-semibold text-nara-tinta">
                    Historial de crisis
                  </span>
                  <span className="text-[15px] text-texto-secundario">
                    Último evento · {f.name as string}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span
                    className={
                      (f.crisisCount as number) > 0
                        ? "text-sm font-semibold text-[#8A1C14]"
                        : "text-sm font-medium text-texto-secundario"
                    }
                  >
                    {(f.crisisCountLabel as string) || "Sin crisis registradas"}
                  </span>
                  <span className="text-[13px] text-texto-secundario">
                    {(f.crisisLastAgo as string) || "Sin episodios previos"}
                    {f.crisisLastWhen ? ` · ${f.crisisLastWhen as string}` : ""}
                  </span>
                </div>
              </div>
              {f.inCrisis ? (
                <button
                  type="button"
                  onClick={() => (f.goCrisis as () => void)?.()}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#B42318] bg-[#B42318] px-4 py-3.5 text-left font-texto text-white"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold tracking-wide">CRISIS ACTIVA</span>
                    <span className="text-[13px] text-white/90">
                      {(f.crisisAlert as { what?: string } | undefined)?.what ||
                        "Hay una alerta de crisis abierta para esta persona."}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium">
                    Ir a crisis
                  </span>
                </button>
              ) : null}
              {lastCrisisEvent ? (
                <button
                  type="button"
                  onClick={() => setCrisisHistoryOpen(true)}
                  className="flex w-full cursor-pointer flex-col gap-1.5 rounded-[14px] border border-linea bg-nara-crema/40 px-3.5 py-3 text-left transition hover:border-nara-tinta/30 hover:bg-nara-crema/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        background: lastCrisisEvent.typeBg,
                        color: lastCrisisEvent.typeFg,
                      }}
                    >
                      {lastCrisisEvent.typeLabel}
                    </span>
                    <span className="text-[13px] text-texto-secundario">
                      {lastCrisisEvent.when} · {lastCrisisEvent.ago}
                    </span>
                  </div>
                  <p className="m-0 text-[15px] leading-snug text-nara-tinta">
                    {lastCrisisEvent.what}
                  </p>
                  {lastCrisisEvent.detail ? (
                    <p className="m-0 text-sm text-texto-secundario">
                      {lastCrisisEvent.detail}
                    </p>
                  ) : null}
                  <span className="pt-0.5 text-sm font-medium text-nara-tinta underline underline-offset-2">
                    {fileCrisisHistory.length > 1
                      ? `Ver historial completo · ${fileCrisisHistory.length} eventos`
                      : "Ver detalle"}
                  </span>
                </button>
              ) : (
                <div className="rounded-[12px] border border-dashed border-linea px-5 py-6 text-center text-sm text-texto-secundario">
                  Esta persona aún no tiene eventos de crisis registrados.
                </div>
              )}
            </div>

            {crisisHistoryOpen ? (
              <div
                className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4"
                role="presentation"
              >
                <button
                  type="button"
                  className="absolute inset-0 cursor-pointer border-0 bg-[rgba(22,20,19,.45)] p-0"
                  aria-label="Cerrar historial"
                  onClick={() => setCrisisHistoryOpen(false)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Historial de crisis"
                  className="relative z-[1] flex max-h-[min(92vh,880px)] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[20px] border border-linea bg-nara-blanco shadow-[0_20px_50px_rgba(22,20,19,.3)] sm:rounded-[20px]"
                >
                  <header className="flex shrink-0 items-start justify-between gap-3 border-b border-linea px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="font-titulos text-xl font-semibold text-nara-tinta sm:text-[22px]">
                        Historial de crisis
                      </h2>
                      <span className="text-[15px] text-texto-secundario">
                        {f.name as string}
                        {fileCrisisHistory.length
                          ? ` · ${fileCrisisHistory.length} eventos`
                          : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCrisisHistoryOpen(false)}
                      aria-label="Cerrar"
                      className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-nara-tinta"
                    >
                      <IconX size={22} aria-hidden />
                    </button>
                  </header>
                  <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4 sm:px-6">
                    {fileCrisisHistory.map((ev) => (
                      <CrisisHistoryEventCard key={ev.key} ev={ev} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {(() => {
              const phqKpi = (
                f.kpis as
                  | { label: string; val: string; sub: string; subFg: string }[]
                  | undefined
              )?.[0];
              return (
                <div className="flex w-full flex-col gap-2.5 rounded-2xl border border-linea bg-nara-blanco px-3.5 py-3 sm:px-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-titulos text-sm font-semibold text-nara-tinta">
                        PHQ-9 en el tiempo
                      </span>
                      <span className="text-[12px] text-texto-secundario">
                        Más bajo es mejor
                      </span>
                    </div>
                    {phqKpi ? (
                      <div className="flex shrink-0 items-baseline gap-2 rounded-xl border border-linea bg-nara-crema/50 px-2.5 py-1.5">
                        <span className="font-titulos text-lg font-semibold leading-none text-nara-tinta">
                          {phqKpi.val}
                        </span>
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: phqKpi.subFg }}
                        >
                          {phqKpi.sub}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <svg
                    viewBox="-120 0 730 230"
                    className="block h-[184px] w-full sm:h-[200px]"
                    preserveAspectRatio="none"
                  >
                    {(f.bands as { k: string; bg: string; y: number; h: number; ty: number }[] | undefined)?.map(
                      (b, i) => (
                        <g key={i}>
                          <rect x={40} y={b.y} width={550} height={b.h} fill={b.bg} />
                          <text
                            x={32}
                            y={(b.y + b.h / 2)}
                            textAnchor="end"
                            dominantBaseline="central"
                            fontSize={10}
                            fill="#6B7280"
                            fontFamily='var(--font-texto), "Space Grotesk", system-ui, sans-serif'
                          >
                            {b.k}
                          </text>
                        </g>
                      ),
                    )}
                    <polyline
                      points={f.phqLine as string}
                      fill="none"
                      stroke="#0F2D3B"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    {(f.phqPts as { x: number; y: number; ly: number; v: number; d: string }[] | undefined)?.map(
                      (pt, i) => (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={5}
                            fill="#fff"
                            stroke="#0F2D3B"
                            strokeWidth="2.5"
                          />
                          <text
                            x={pt.x}
                            y={pt.ly}
                            textAnchor="middle"
                            fontSize={13}
                            fontWeight={500}
                            fill="#0F2D3B"
                            fontFamily='var(--font-texto), "Space Grotesk", system-ui, sans-serif'
                          >
                            {pt.v}
                          </text>
                          <text
                            x={pt.x}
                            y={226}
                            textAnchor="middle"
                            fontSize={11}
                            fill="#6B7280"
                            fontFamily='var(--font-texto), "Space Grotesk", system-ui, sans-serif'
                          >
                            {pt.d}
                          </text>
                        </g>
                      ),
                    )}
                  </svg>
                </div>
              );
            })()}

            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E0D5",
                borderRadius: 20,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 16 }}>Ruta asignada</span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                  gap: "8px 18px",
                }}
              >
                {(v.fRoute as { name: string; freq: string }[] | undefined)?.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      borderTop: "1px solid #E5E0D5",
                      paddingTop: 6,
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</span>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{r.freq}</span>
                  </div>
                ))}
              </div>
            </div>

            <HerramientasSection
              items={
                (v.fHerramientas as
                  | { id: string; name: string; freq?: string; channel?: string }[]
                  | undefined) || []
              }
              patientId={String(f.id || "")}
            />

            {/* C-04: nota clínica y ajuste de ruta; quedan en la línea de tiempo con quién y cuándo. */}
            <div
              className="flex w-full flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco px-5 py-[18px]"
              data-testid="clinico-nota-ruta"
            >
              <label className="flex flex-col gap-1.5 font-texto text-base font-medium text-nara-tinta">
                Nota clínica
                <textarea
                  value={(v.noteText as string) || ""}
                  onChange={v.setNote as ChangeEventHandler<HTMLTextAreaElement>}
                  rows={3}
                  placeholder="Escriba la nota de la sesión"
                  className="w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco p-3 font-texto text-[15px] font-normal text-nara-tinta outline-none"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => (v.addNote as () => void)?.()}
                  className="h-11 cursor-pointer rounded-[12px] border-none bg-nara-amarillo px-4 font-texto text-[15px] font-medium text-nara-tinta"
                >
                  Guardar nota
                </button>
              </div>
              <span className="font-texto text-base font-medium text-nara-tinta">Ajustar la ruta</span>
              <div className="flex flex-wrap gap-2">
                {((v.adjust as { label: string; go: () => void }[] | undefined) || []).map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.go}
                    className="h-11 cursor-pointer rounded-[12px] border-[1.5px] border-linea bg-nara-blanco px-4 font-texto text-[15px] font-medium text-nara-tinta"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 rounded-[20px] border border-linea bg-nara-blanco px-5 py-[18px]">
              <span className="mb-1.5 font-texto text-base font-medium text-nara-tinta">
                Línea de tiempo
              </span>
              {(f.timeline as { d: string; t: string; x: string }[] | undefined)?.map((t, i) => (
                <div
                  key={i}
                  className="nara-label-row gap-3.5 border-t border-[#E5E0D5] py-2.5"
                >
                  <span className="text-texto-secundario">{t.d}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-nara-tinta">{t.t}</span>
                    <span className="text-nara-tinta">{t.x}</span>
                  </div>
                </div>
              ))}
              {!((f.timeline as unknown[] | undefined)?.length) ? (
                <span className="py-4 text-sm text-texto-secundario">
                  Sin eventos en la línea de tiempo.
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
