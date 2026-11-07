"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";
import { FormModal } from "@/components/shared/form-modal/FormModal";
import {
  FormFieldStatic,
  FormInput,
  FormInputWithAction,
  FormSearchSelect,
  FormSection,
  type SearchPickerOption,
} from "@/components/shared/form-modal/FormField";
import { PhoneInput } from "@/components/shared/phone-input/PhoneInput";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import {
  TableSearch,
  filterRowsBySearch,
} from "@/components/shared/table-search/TableSearch";
import { VisitsMap } from "@/components/shared/visits-map/VisitsMap";
import {
  COLOMBIA_DEPARTMENTS,
  municipalitiesOf,
} from "@/lib/geo/colombia";
import { PathRoutesPanel } from "@/modules/admin/rutas/PathRoutesPanel";
import { ix } from "./inlineStyle";

function pickVal(
  set: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) => void,
  value: string,
) {
  set(value);
}

function strOpts(list: string[] | undefined): SearchPickerOption[] {
  return (list || []).map((o) => ({ value: o, label: o }));
}

const LEVEL_OPTS = [
  "Municipio completo",
  "Veredas seleccionadas",
  "Barrios seleccionados",
];

function ToggleChip({
  label,
  on,
  locked,
  onToggle,
}: {
  label: string;
  on: boolean;
  locked?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => !locked && onToggle()}
      aria-pressed={on}
      className={`flex min-h-[52px] w-full cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 text-left font-texto text-[14px] leading-snug transition ${
        on
          ? "border-[#31C6E6]/55 bg-[#E4F7FB] text-[#0F2D3B] shadow-[0_8px_20px_rgba(49,198,230,0.12)]"
          : "border-[#E5E0D5] bg-white/80 text-[#0F2D3B] hover:border-[#0F2D3B]/25"
      } ${locked ? "cursor-default opacity-90" : ""}`}
    >
      <span
        className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border-2 text-[11px] font-bold ${
          on
            ? "border-[#0F2D3B] bg-[#0F2D3B] text-[#F7F5EF]"
            : "border-[#5B6770] bg-transparent text-transparent"
        }`}
        aria-hidden
      >
        {on ? "✓" : ""}
      </span>
      <span className="min-w-0 flex-1 font-medium">{label}</span>
    </button>
  );
}

/** H-009: fecha real de hoy en Colombia, p. ej. «viernes 9 oct». */
function hoyLargo(): string {
  return new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  }).replace(/\.$/, "").replace(",", "");
}

export function AdminMainContent({ v }: { v: Record<string, any> }) {
  const [expertsQ, setExpertsQ] = useState("");
  const [pfQ, setPfQ] = useState("");
  const [brQ, setBrQ] = useState("");
  const [tabQ, setTabQ] = useState("");

  const depOpts = useMemo(() => strOpts(COLOMBIA_DEPARTMENTS), []);
  const munOpts = useMemo(() => {
    const dep = String(v.tf?.dep ?? "");
    const list = dep ? municipalitiesOf(dep) : [];
    return list.map((m) => ({
      value: m,
      label: m,
      searchText: `${m} ${dep}`,
    }));
  }, [v.tf?.dep]);

  const expertsRows = useMemo(
    () => filterRowsBySearch(v.experts || [], expertsQ),
    [v.experts, expertsQ],
  );
  const pfRows = useMemo(
    () => filterRowsBySearch(v.pfRows || [], pfQ),
    [v.pfRows, pfQ],
  );
  const brRows = useMemo(
    () => filterRowsBySearch(v.brRows || [], brQ),
    [v.brRows, brQ],
  );
  const tabRows = useMemo(
    () => filterRowsBySearch(v.tabRows || [], tabQ),
    [v.tabRows, tabQ],
  );

  return (
    <>
          <NaraMsgAlert
            msg={v.msg}
            actions={v.msgActions}
            onClear={() => v.clearMsg?.()}
          />
          <NaraMsgAlert
            msg={v.tfErr}
            onClear={() => v.clearTfErr?.()}
          />
          <NaraMsgAlert
            msg={v.rulesFlash}
            onClear={() => v.clearRulesFlash?.()}
          />
          <NaraMsgAlert
            msg={v.autoMsg}
            onClear={() => v.clearAutoMsg?.()}
          />

          {v.vHome && (
            <div
              className={`nara-home-grid${v.agentOpen ? " nara-home-grid--teo" : ""}`}
              style={{ paddingTop: "var(--nara-page-pad-y, 20px)" }}
            >
              {v.agentOpen ? (
                <div className="nara-home-teo-standin">
                  <button
                    type="button"
                    onClick={() => v.openAgent?.()}
                    aria-label="TEJIVA está conversando. Mantener asistente abierto"
                    className="group flex cursor-pointer flex-col items-center gap-4 border-none bg-transparent p-4"
                  >
                    <span className="grid size-[200px] place-items-center rounded-[52px] bg-pl-menta shadow-[0_16px_48px_rgba(39,104,58,0.22)] transition group-hover:scale-[1.03] group-active:scale-[0.98] motion-safe:animate-[nara-float_3.6s_ease-in-out_infinite_alternate] sm:size-[260px] sm:rounded-[64px]">
                      <img
                        src="/quintia/tejiva/tejiva-base.svg"
                        alt=""
                        className="block size-[148px] sm:size-[196px]"
                      />
                    </span>
                    <span className="font-titulos text-2xl font-extrabold text-pl-verde-raiz sm:text-[28px]">
                      TEJIVA
                    </span>
                    <span className="max-w-[280px] text-center font-mono text-base text-pl-texto2">
                      Aquí estoy, cuando quiera.
                    </span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="nara-home-main">
                    <AgentPanel
                      role="admin"
                      mode="home"
                      onAction={v.agentAction}
                      onOpenDrawer={v.askFromHome}
                      style={{ flex: 1, minWidth: 0, width: "100%" }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
                    <Link
                      href="/informe?t=admin-weekly&back=/inicio"
                      className="flex flex-col gap-1.5 rounded-[18px] bg-pl-verde-raiz px-5 py-5 text-pl-hueso transition hover:bg-pl-verde-vivo"
                    >
                      <span className="font-mono text-[12px] text-pl-menta" data-real-date>
                        Generado el {hoyLargo()}
                      </span>
                      <span className="font-titulos text-[22px] font-extrabold leading-tight">
                        Operaciones de la semana
                      </span>
                      <span className="text-[14px] leading-[1.45] text-pl-menta">
                        Captación frente al ritmo, territorios en riesgo, control de calidad y
                        tres acciones.
                      </span>
                      <span className="mt-1.5 font-medium text-pl-lima">Abrir one-pager →</span>
                    </Link>
                    {v.homeLinks?.map((l: { id?: string; label: string; sub: string; go: () => void }) => (
                      <button
                        key={l.id || l.label}
                        type="button"
                        onClick={() => l.go()}
                        className="flex cursor-pointer flex-col gap-1 rounded-[18px] border border-pl-menta bg-pl-hueso px-4 py-3.5 text-left text-pl-verde-raiz whitespace-normal transition hover:border-pl-verde-vivo hover:bg-pl-menta/40"
                      >
                        <span className="font-medium">{l.label}</span>
                        <span className="text-[13px] text-pl-texto2">{l.sub}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {v.hasFilter && (<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ fontWeight: '500', padding: '6px 12px', borderRadius: '8px', background: '#E5E0D5', color: '#0F2D3B' }}>Filtro: {v.terrFilter}</span><button onClick={() => v.clearFilter()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '14px', border: 'none', background: 'none', color: '#0F2D3B', cursor: 'pointer' }}>Quitar filtro</button></div>)}
          {v.vTerr && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}><span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: '800', fontSize: 'clamp(22px,4vw,28px)' }}>Territorios</span><span style={{ color: '#6B7280' }}>Meta fase 1: 8.700 personas · {v.totalEvaluadas ?? v.totalCap} evaluadas · {v.totalCap} en captación</span></div><button onClick={() => v.toggleTerrForm()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#31C6E6', color: '#F7F5EF', cursor: 'pointer', whiteSpace: 'nowrap' }}>{v.terrFormBtn}</button></div>
              </PageHead>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500, fontSize: 16, marginRight: 'auto' }}>{v.terrCountLabel}</span>
                <TableSearch
                  value={String(v.terrQ ?? "")}
                  onChange={(q) => v.setTerrQ?.(q)}
                  placeholder="Buscar por cualquier campo…"
                />
              </div>
              <FormModal
                open={!!v.terrForm}
                onClose={() => (v.closeTerrForm || v.toggleTerrForm)()}
                title="Crear territorio"
                description="Defina meta, cuotas y contenido local del municipio."
                size="lg"
                footer={(
                  <>
                    <button type="button" onClick={() => v.saveTerr()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#31C6E6', color: '#F7F5EF', cursor: 'pointer' }}>Guardar territorio</button>
                    <button type="button" onClick={() => (v.closeTerrForm || v.toggleTerrForm)()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 18px', borderRadius: '14px', border: '1.5px solid #E3DFCF', background: '#fff', color: '#0F2D3B', cursor: 'pointer' }}>Cancelar</button>
                  </>
                )}
              >
                <div className="flex w-full flex-col gap-6">
                  {v.tfErr ? (
                    <p className="m-0 rounded-2xl border border-[#F2C4C0] bg-[#FDF2F1] px-4 py-3 font-texto text-[14px] text-[#8B2E2A]">
                      {String(v.tfErr)}
                    </p>
                  ) : null}

                  <FormSection title="Ubicación" step={1}>
                    <FormSearchSelect
                      label="Departamento"
                      value={String(v.tf.dep ?? "")}
                      options={depOpts}
                      onChange={(val) => pickVal(v.tfSet.dep, val)}
                      modalTitle="Elegir departamento"
                      searchPlaceholder="Buscar departamento…"
                      placeholder="Buscar departamento…"
                      allowEmpty
                      emptyLabel="Seleccione…"
                    />
                    <FormSearchSelect
                      label="Municipio"
                      value={String(v.tf.mun ?? "")}
                      options={munOpts}
                      onChange={(val) => pickVal(v.tfSet.mun, val)}
                      modalTitle="Elegir municipio"
                      searchPlaceholder="Buscar municipio o ciudad…"
                      placeholder={
                        v.tf?.dep
                          ? "Buscar municipio…"
                          : "Primero elija departamento"
                      }
                      allowEmpty
                      emptyLabel="Seleccione…"
                      disabled={!v.tf?.dep}
                    />
                    <FormInput
                      label="Meta de captación"
                      value={String(v.tf.goal ?? "")}
                      onChange={v.tfSet.goal}
                      inputMode="numeric"
                      placeholder="Ej.: 800"
                    />
                    <FormSearchSelect
                      label="Nivel"
                      value={String(v.tf.level ?? "")}
                      options={strOpts(LEVEL_OPTS)}
                      onChange={(val) => pickVal(v.tfSet.level, val)}
                      modalTitle="Elegir nivel"
                      searchPlaceholder="Buscar nivel…"
                      placeholder="Seleccione nivel…"
                    />
                  </FormSection>

                  <FormSection title="Cuotas" step={2}>
                    <FormInput
                      label="Participación rural mínima (%)"
                      value={String(v.tf.rural ?? "")}
                      onChange={v.tfSet.rural}
                      inputMode="numeric"
                      placeholder="Ej.: 60"
                    />
                    <FormInput
                      label="Participación 60+ mínima (%)"
                      value={String(v.tf.sixty ?? "")}
                      onChange={v.tfSet.sixty}
                      inputMode="numeric"
                      placeholder="Ej.: 25"
                    />
                  </FormSection>

                  <FormSection title="Contenido local" step={3} className="[&>div:last-child]:sm:grid-cols-1">
                    <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {(v.modules || []).map((m: { label: string; on?: boolean; mark?: string; toggle: () => void }) => {
                        const locked = /base/i.test(m.label);
                        const on = locked || !!m.mark;
                        return (
                          <ToggleChip
                            key={m.label}
                            label={m.label}
                            on={on}
                            locked={locked}
                            onToggle={() => m.toggle()}
                          />
                        );
                      })}
                    </div>
                  </FormSection>

                  <FormSection title="Instituciones de remisión" step={4} className="[&>div:last-child]:sm:grid-cols-1">
                    <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {(v.tinsts || []).map((m: { label: string; mark?: string; toggle: () => void }) => (
                        <ToggleChip
                          key={m.label}
                          label={m.label}
                          on={!!m.mark}
                          onToggle={() => m.toggle()}
                        />
                      ))}
                    </div>
                  </FormSection>
                </div>
              </FormModal>
              <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', overflow: 'hidden' }}>
                <div className="nara-scroll-x">
                <div style={{ minWidth: 1100 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.3fr) 80px minmax(0,1.6fr) minmax(0,1.2fr) 100px minmax(0,1.2fr)', gap: '12px', padding: '12px 20px', background: '#F7F5EF', color: '#6B7280', fontSize: '14px', fontWeight: '500' }}><span>Territorio</span><span>Departamento</span><span>Nivel</span><span>Expertos</span><span>Captación</span><span>Rural (real / meta)</span><span>Instituciones</span><span>Estado</span></div>
                {v.terrs?.map((t) => (
                  <div key={t.name || t.id} onClick={() => t.open()} style={ix`display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1.3fr) 80px minmax(0,1.6fr) minmax(0,1.2fr) 100px minmax(0,1.2fr);gap:12px;padding:13px 20px;border-top:1px solid #E5E0D5;align-items:center;background:${t.rowBg};cursor:pointer`} >
                    <span style={{ fontWeight: '500' }}>{t.name}</span><span>{t.dep}</span><span>{t.level}</span><span>{t.experts}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}><span>{t.capText}</span><div style={{ height: '6px', borderRadius: '3px', background: '#E5E0D5' }}><div style={ix`height:100%;width:${t.pct};border-radius:3px;background:#0F2D3B`}></div></div></div>
                    <span>{t.rural}</span><span>{t.insts}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}><span style={ix`flex:none;width:10px;height:10px;border-radius:50%;background:${t.sc}`}></span>{t.status}</span>
                  </div>
                ))}
                </div>
                </div>
              </div>
            </div>
          )}
      
          {v.vTeam && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}><span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: '800', fontSize: 'clamp(22px,4vw,28px)' }}>Equipos de campo</span><span style={{ color: '#6B7280' }}>Metas por volumen y por mezcla (rural, 60+). Solo cuentan las visitas validadas.</span></div><button onClick={() => v.toggleExpForm()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#31C6E6', color: '#F7F5EF', cursor: 'pointer', whiteSpace: 'nowrap' }}>{v.expFormBtn}</button></div>
              <div className="nara-tabs-scroll items-center gap-2">
                {v.teamTabs?.map((tt) => (
                  <button key={tt.label} onClick={() => tt.go()} style={ix`font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;font-size:15px;font-weight:500;height:44px;padding:0 16px;border:none;background:none;border-bottom:3px solid ${tt.bd};color:${tt.fg};cursor:pointer;margin-bottom:-1px;white-space:nowrap;flex:none`}>{tt.label}</button>
                ))}
                <button
                  type="button"
                  onClick={() => v.openGoalsForm?.()}
                  className="mb-0.5 ml-1 h-9 shrink-0 cursor-pointer rounded-[10px] border-[1.5px] border-nara-tinta bg-nara-blanco px-3 font-texto text-sm font-medium text-nara-tinta"
                >
                  Definición metas
                </button>
              </div>
              </PageHead>
              <FormModal
                open={!!v.goalsForm}
                onClose={() => (v.closeGoalsForm || (() => {}))()}
                title="Definición metas"
                description="Aplica a todo el equipo de campo. Solo cuentan las visitas validadas."
                size="sm"
                footer={(
                  <>
                    <button type="button" onClick={() => v.saveGoals?.()} className="h-[46px] cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta">Guardar metas</button>
                    <button type="button" onClick={() => (v.closeGoalsForm || (() => {}))()} className="h-[46px] cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-[18px] font-texto text-[15px] font-medium text-nara-tinta">Cancelar</button>
                  </>
                )}
              >
                <div className="flex flex-col gap-4">
                  {v.gfErr ? (
                    <p className="m-0 text-[15px] text-[#B42318]">{v.gfErr}</p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex min-w-0 flex-col gap-1.5 font-medium">
                      <span className="leading-5">Meta diaria</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(v.gf?.daily ?? "")}
                        onChange={v.gfSet?.daily}
                        className="h-11 w-full rounded-[9px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-[15px] text-nara-tinta"
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1.5 font-medium">
                      <span className="leading-5">Meta semanal</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(v.gf?.weekly ?? "")}
                        readOnly
                        aria-readonly="true"
                        title="Se calcula sola: meta diaria × 5"
                        className="h-11 w-full cursor-default rounded-[9px] border-[1.5px] border-linea bg-nara-crema px-3 font-texto text-[15px] text-nara-tinta"
                      />
                    </label>
                  </div>
                  <p className="m-0 text-[15px] text-texto-secundario">
                    La meta semanal se calcula sola (diaria × 5). Puede ser 0. Al guardar, se actualizan Hoy y Semana de todos los expertos.
                  </p>
                </div>
              </FormModal>
              {v.teamTab1 && (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormModal
                open={!!v.expForm}
                onClose={() => (v.closeExpForm || (() => {}))()}
                title="Crear experto"
                description="Correo y contraseña para Ingreso · celular de contacto. La tablet se asigna en Activos."
                size="md"
                footer={(
                  <>
                    <button type="button" onClick={() => v.saveExp()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 20px', borderRadius: '14px', border: 'none', background: '#31C6E6', color: '#F7F5EF', cursor: 'pointer' }}>Crear experto y enviar acceso</button>
                    <button type="button" onClick={() => (v.closeExpForm || (() => {}))()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', fontWeight: '500', height: '46px', padding: '0 18px', borderRadius: '14px', border: '1.5px solid #E3DFCF', background: '#fff', color: '#0F2D3B', cursor: 'pointer' }}>Cancelar</button>
                  </>
                )}
              >
                <div className="flex w-full flex-col gap-6">
                  <FormSection title="Persona" step={1}>
                    <FormInput
                      label="Nombre"
                      value={String(v.ef.firstName ?? "")}
                      onChange={v.efSet.firstName}
                      placeholder="Nombre"
                    />
                    <FormInput
                      label="Apellido"
                      value={String(v.ef.lastName ?? "")}
                      onChange={v.efSet.lastName}
                      placeholder="Apellidos"
                    />
                    <FormFieldStatic label="Celular">
                      <PhoneInput
                        value={String(v.ef.phone ?? "")}
                        onChange={v.efSet.phone}
                        placeholder="3xx xxx xxxx"
                      />
                    </FormFieldStatic>
                    <FormInput
                      label="Meta diaria de visitas"
                      value={String(v.ef.target ?? "")}
                      onChange={v.efSet.target}
                      inputMode="numeric"
                      placeholder="Ej.: 9"
                    />
                    {v.terrNames?.length ? (
                      <FormSearchSelect
                        label="Territorio (uno solo)"
                        value={String(v.ef?.terr ?? "")}
                        options={strOpts(v.terrNames as string[])}
                        onChange={(val) => pickVal(v.efSet.terr, val)}
                        modalTitle="Elegir territorio"
                        searchPlaceholder="Buscar territorio…"
                        placeholder="Buscar territorio…"
                        allowEmpty
                        emptyLabel="Seleccione…"
                      />
                    ) : (
                      <p className="m-0 font-texto text-[14px] text-texto-secundario sm:col-span-2">
                        Cree un territorio antes de asignar expertos.
                      </p>
                    )}
                  </FormSection>

                  <FormSection title="Acceso" step={2}>
                    <FormInputWithAction
                      label="Correo de ingreso"
                      type="email"
                      value={String(v.ef.email ?? "")}
                      onChange={v.efSet.email}
                      placeholder="nombre.apellido@quintia.com"
                      onAction={() => v.genExpEmail?.()}
                      fieldClassName="sm:col-span-2"
                      hint="Este correo y la contraseña son el acceso a Ingreso."
                    />
                    <FormInputWithAction
                      label="Contraseña"
                      type="text"
                      value={String(v.ef.password ?? "")}
                      onChange={v.efSet.password}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      onAction={() => v.genExpPassword?.()}
                      fieldClassName="sm:col-span-2"
                      hint="No debe contener el correo ni el nombre."
                    />
                  </FormSection>

                  <p className="m-0 font-texto text-[14px] text-texto-secundario">
                    Debe completar la capacitación antes de su primera visita.
                  </p>
                </div>
              </FormModal>
              <TableSearch
                value={expertsQ}
                onChange={setExpertsQ}
                placeholder="Buscar experto, territorio, estado…"
              />
              <div className="nara-split-panel">
                <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', overflow: 'hidden' }}>
                  <div className="nara-scroll-x">
                  <div style={{ minWidth: 720 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr) 100px 110px 80px minmax(0,1.2fr)', gap: '12px', padding: '12px 18px', background: '#F7F5EF', color: '#6B7280', fontSize: '14px', fontWeight: '500' }}><span>Experto</span><span>Territorio</span><span>Hoy</span><span>Semana</span><span>Alertas</span><span>Estado</span></div>
                  {expertsRows.map((e: any) => (
                    <div key={e.id || `${e.name}-${e.terr}`} onClick={() => e.open()} style={ix`display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) 100px 110px 80px minmax(0,1.2fr);gap:12px;padding:12px 18px;border-top:1px solid #E5E0D5;align-items:center;background:${e.rowBg};cursor:pointer`} ><span style={{ fontWeight: '500' }}>{e.name}</span><span>{e.terr}</span><span>{e.today}</span><span>{e.week}</span><span>{e.flags}</span><span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', lineHeight: '1.3' }}><span style={ix`flex:none;width:10px;height:10px;border-radius:50%;background:${e.sc}`}></span>{e.status}</span></div>
                  ))}
                  {!expertsRows.length ? (
                    <p style={{ margin: 0, padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                      {expertsQ.trim() ? 'Ningún experto coincide con la búsqueda.' : 'No hay expertos.'}
                    </p>
                  ) : null}
                  </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontWeight: '600', fontSize: '20px' }}>Visitas marcadas</span><span style={{ color: '#6B7280' }}>{v.flagCount}</span></div>
                    {v.flags?.map((f) => (
                      <div key={f.id || f.person} style={{ border: '1px solid #E3DFCF', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span style={{ fontWeight: '500' }}>{f.expertName} · {f.territory}</span><span style={{ color: '#6B7280' }}>{f.when}</span></div>
                        <span>Visita a {f.person}</span>
                        {f.reasons?.map((r, ri) => (<span key={ri} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ fontSize: '12px', fontWeight: '500', padding: '2px 7px', borderRadius: '5px', background: '#F7E2D2', color: '#7A3A10' }}>Revisar</span>{r}</span>))}
                        {f.pending && (<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}><button onClick={() => f.approve()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', height: '42px', padding: '0 16px', borderRadius: '10px', border: '1.5px solid #0F2D3B', background: '#fff', color: '#0F2D3B', cursor: 'pointer' }}>Aprobar</button><button onClick={() => f.reject()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '15px', fontWeight: '500', height: '42px', padding: '0 16px', borderRadius: '10px', border: 'none', background: '#0F2D3B', color: '#fff', cursor: 'pointer' }}>Rechazar</button></div>)}
                        {f.done && (<span style={{ fontWeight: '500' }}>{f.doneText}</span>)}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontWeight: '500', fontSize: '16px' }}>Chequeos automáticos</span>
                    {v.checks?.map((c) => (<div key={c.k} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '12px', padding: '7px 0', borderTop: '1px solid #E5E0D5', fontSize: '14px' }}><span style={{ fontWeight: '500' }}>{c.k}</span><span style={{ color: '#6B7280' }}>{c.v}</span></div>))}
                  </div>
                </div>
              </div>
              </div>)}
              {v.teamTab2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}><label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#6B7280' }}>Territorio<select value={String(v.pfTerr ?? "")} onChange={v.setPfTerr} style={{ height: '40px', borderRadius: '9px', border: '1.5px solid #E3DFCF', padding: '0 10px', fontSize: '14px', background: '#fff', color: '#0F2D3B', minWidth: '180px' }}><option value="">Todos</option>{v.terrNames?.map((n: string) => (<option key={n} value={n}>{n}</option>))}</select></label><div style={{ display: 'flex', border: '1.5px solid #0F2D3B', borderRadius: '10px', overflow: 'hidden' }}>{v.pfPeriods?.map((p) => (<button key={p.label} onClick={() => p.go()} style={ix`font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;font-size:14px;font-weight:500;height:37px;padding:0 14px;border:none;background:${p.bg};color:${p.fg};cursor:pointer`}>{p.label}</button>))}</div><TableSearch value={pfQ} onChange={setPfQ} placeholder="Buscar en rendimiento…" /><span style={{ marginLeft: 'auto', fontSize: '14px', color: '#6B7280' }}>Toque un encabezado para ordenar · toque una fila para abrir la ficha</span></div>
                  <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', overflow: 'hidden' }}>
                    <div className="nara-scroll-x">
                    <div style={{ minWidth: 980 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) repeat(6,minmax(0,.8fr)) minmax(0,1.2fr) minmax(0,.9fr)', gap: '10px', padding: '10px 18px', background: '#F7F5EF' }}>{v.pfCols?.map((c) => (<button key={c.label} onClick={() => c.go()} style={ix`font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;text-align:left;border:none;background:none;padding:0;font-size:13px;font-weight:500;color:${c.fg};cursor:pointer;white-space:normal;line-height:1.3`}>{c.label}{c.arrow}</button>))}</div>
                    {pfRows.map((r: any) => (<div key={r.name} onClick={() => r.open()} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) repeat(6,minmax(0,.8fr)) minmax(0,1.2fr) minmax(0,.9fr)', gap: '10px', padding: '11px 18px', borderTop: '1px solid #E5E0D5', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }} ><div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}><span style={{ fontWeight: '500' }}>{r.name}</span><span style={{ fontSize: '12px', color: '#6B7280' }}>{r.terr}</span></div><span>{r.vpd}</span><span style={ix`font-weight:${r.durFw};color:${r.durFg};background:${r.durBg};border-radius:6px;padding:2px 6px;justify-self:start`}>{r.dur}</span><span style={ix`color:${r.gpsFg};font-weight:${r.gpsFw}`}>{r.gps}</span><span style={ix`color:${r.verFg};font-weight:${r.verFw}`}>{r.ver}</span><span>{r.rej}</span><span style={ix`color:${r.gapFg};font-weight:${r.gapFw}`}>{r.gap}</span><span style={{ lineHeight: '1.35' }}>{r.mix}</span><span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '500' }}><span style={ix`flex:none;width:9px;height:9px;border-radius:50%;background:${r.sc}`}></span>{r.status}</span></div>))}
                    {!pfRows.length ? (
                      <p style={{ margin: 0, padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                        {pfQ.trim() ? 'Ninguna fila coincide con la búsqueda.' : 'Sin datos de rendimiento.'}
                      </p>
                    ) : null}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) repeat(6,minmax(0,.8fr)) minmax(0,1.2fr) minmax(0,.9fr)', gap: '10px', padding: '12px 18px', borderTop: '2px solid #0F2D3B', alignItems: 'center', fontSize: '14px', background: '#F7F5EF', fontWeight: '500' }}><span>Promedio del programa</span><span>{v.pfAvg.vpd}</span><span>{v.pfAvg.dur}</span><span>{v.pfAvg.gps}</span><span>{v.pfAvg.ver}</span><span>{v.pfAvg.rej}</span><span>{v.pfAvg.gap}</span><span>{v.pfAvg.mix}</span><span></span></div>
                    </div>
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}><div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontWeight: '500', fontSize: '17px' }}>Mapa de visitas del día · {v.mapTerr}</span><span style={{ fontSize: '13px', color: '#6B7280' }}>OpenStreetMap · ubicaciones aproximadas de veredas y visitas</span></div><div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', fontSize: '13px' }}>{v.mapLegend?.map((l: { name: string; c: string }) => (<span key={l.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={ix`width:12px;height:12px;border-radius:50%;background:${l.c}`}></span>{l.name}</span>))}<span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#31C6E6', opacity: 0.7 }}></span>Vereda / barrio</span><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#B42318', boxShadow: '0 0 0 3px #FDE7E4' }}></span>Alerta de GPS</span></div></div>
                    <VisitsMap
                      center={v.mapCenter || [4.6372, -75.5706]}
                      markers={v.mapMarkers || []}
                      emptyLabel={v.mapEmpty ? `Todavía no hay visitas cerradas hoy en ${v.mapTerr}.` : undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
      
          {v.vPaths && <PathRoutesPanel v={v} />}

          {v.vPeople && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: '800', fontSize: 'clamp(22px,4vw,28px)' }}>Personas</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '500', padding: '6px 12px', borderRadius: '8px', background: '#fff', border: '1px solid #E3DFCF', whiteSpace: 'nowrap' }}>Datos de identidad ocultos</span>
                </div>
              </div>
              </PageHead>
              <div className="nara-kpi-grid">{v.pk?.map((k) => (<div key={k.label} style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}><span style={{ color: '#6B7280' }}>{k.label}</span><span style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontWeight: '600', fontSize: '32px', lineHeight: '1.1' }}>{k.val}</span><span style={{ fontSize: '14px', color: '#6B7280' }}>{k.sub}</span></div>))}</div>
              <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #E5E0D5' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontWeight: '500', fontSize: '16px', marginRight: 'auto' }}>{v.rosterCount}</span><TableSearch value={String(v.q ?? "")} onChange={(q) => v.setQ?.(q)} placeholder="Buscar por cualquier campo…" /><button onClick={() => v.exportRoster()} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '14px', fontWeight: '500', height: '40px', padding: '0 14px', borderRadius: '9px', border: '1.5px solid #0F2D3B', background: '#fff', color: '#0F2D3B', cursor: 'pointer', whiteSpace: 'nowrap' }}>Exportar (Excel)</button></div>
                  <div className="nara-form-grid-3" style={{ display: 'grid' }}>{v.pFilters?.map((f) => (<label key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#6B7280' }}>{f.label}<select value={String(f.val ?? "")} onChange={f.set} style={ix`height:38px;border-radius:8px;border:1.5px solid ${f.bd};padding:0 8px;font-size:14px;background:#fff;color:#0F2D3B`}>{f.opts?.map((o, i) => (<option key={`${f.label}-${String(o.v ?? o.l)}-${i}`} value={String(o.v ?? "")}>{o.l}</option>))}</select></label>))}</div>
                  {v.hasPF && (<button onClick={() => v.clearPF()} style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '13px', border: 'none', background: 'none', color: '#0F2D3B', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}>Quitar filtros</button>)}
                </div>
                <div className="nara-scroll-x">
                <div style={{ minWidth: 960 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px minmax(0,1fr) minmax(0,1fr) 60px 70px minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr)', gap: '12px', padding: '10px 20px', background: '#F7F5EF', color: '#6B7280', fontSize: '13px', fontWeight: '500' }}><span>Código</span><span>Territorio</span><span>Vereda o barrio</span><span>Edad</span><span>Perfil</span><span>Avance en la ruta</span><span>Experto</span><span>Estado</span></div>
                <div style={{ maxHeight: '460px', overflow: 'auto' }}>
                  {v.roster?.map((p) => (
                    <div
                      key={p.code}
                      onClick={() => p.open()}
                      className={
                        p.inCrisis
                          ? 'grid cursor-pointer items-center gap-3 border-t border-[#4A0000] bg-[#6B0000] px-5 py-2.5 text-sm text-white hover:bg-[#5A0000]'
                          : 'grid cursor-pointer items-center gap-3 border-t border-[#E5E0D5] px-5 py-2.5 text-sm text-[#0F2D3B] hover:bg-[#FAF8F5]'
                      }
                      style={{
                        gridTemplateColumns:
                          '100px minmax(0,1fr) minmax(0,1fr) 60px 70px minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr)',
                      }}
                    >
                      <span className="font-mono text-[13px]">{p.code}</span>
                      <span>{p.terr}</span>
                      <span>{p.place}</span>
                      <span>{p.age}</span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-sm"
                          style={{ background: p.inCrisis ? '#FFFFFF' : p.rc }}
                        />
                        {p.profile}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className={
                            p.inCrisis
                              ? 'h-1.5 flex-1 rounded-sm bg-white/25'
                              : 'h-1.5 flex-1 rounded-sm bg-[#E5E0D5]'
                          }
                        >
                          <div
                            className="h-full rounded-sm"
                            style={{
                              width: p.pct,
                              background: p.inCrisis ? '#FFFFFF' : '#0F2D3B',
                            }}
                          />
                        </div>
                        <span
                          className={
                            p.inCrisis
                              ? 'whitespace-nowrap text-xs text-white/75'
                              : 'whitespace-nowrap text-xs text-[#6B7280]'
                          }
                        >
                          {p.prog}
                        </span>
                      </div>
                      <span>{p.expert}</span>
                      <span
                        className={p.inCrisis ? 'font-semibold' : undefined}
                        style={p.inCrisis ? undefined : { fontWeight: p.fw }}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                  {v.noRoster && (<span style={{ display: 'block', padding: '20px', color: '#6B7280' }}>Ninguna persona coincide con el filtro.</span>)}
                </div>
                </div>
                </div>
              </div>
              <div className="nara-split-panel" style={{ display: 'grid' }}>
                <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                  <span style={{ fontWeight: '500', fontSize: '16px' }}>Personas por perfil</span>
                  <div className="nara-scroll-x">
                  <div style={{ display: 'grid', gridTemplateColumns: '130px repeat(3,minmax(0,1fr))', gap: '6px', minWidth: 420 }}>
                    <span></span><span style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>Digital baja</span><span style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>Media</span><span style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>Alta</span>
                    {v.heat?.map((row, rowIdx) => (
                      <span key={rowIdx} style={{ display: 'contents' } as React.CSSProperties}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280' }}><span style={ix`width:9px;height:9px;border-radius:2px;background:${row.c}`}></span>{row.k}</span>
                        {row.cells?.map((c, ci) => (<div key={ci} style={ix`height:56px;border-radius:9px;background:${c.bg};color:${c.fg};display:flex;flex-direction:column;align-items:center;justify-content:center`}><span style={{ fontWeight: '600', fontSize: '17px' }}>{c.v}</span><span style={{ fontSize: '12px' }}>{c.code}</span></div>))}
                      </span>
                    ))}
                  </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                  <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontWeight: '500', fontSize: '16px' }}>Avance en la ruta</span>
                    {v.funnel?.map((f) => (<div key={f.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px,140px) minmax(0,1fr) 52px', gap: '10px', alignItems: 'center' }}><span style={{ fontSize: '13px', lineHeight: 1.3 }}>{f.label}</span><div style={{ height: '22px', background: '#F7F5EF', borderRadius: '5px', minWidth: 0 }}><div style={ix`height:100%;width:${f.w};background:#0F2D3B;border-radius:5px`}></div></div><span style={{ textAlign: 'right', fontWeight: '500' }}>{f.v}</span></div>))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontWeight: '500', fontSize: '16px' }}>Abandono por nivel digital</span>
                    {v.dropout?.map((f) => (<div key={f.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(72px,90px) minmax(0,1fr) 44px', gap: '10px', alignItems: 'center' }}><span>{f.label}</span><div style={{ height: '22px', background: '#F7F5EF', borderRadius: '5px', minWidth: 0 }}><div style={ix`height:100%;width:${f.w};background:${f.c};border-radius:5px`}></div></div><span style={{ textAlign: 'right', fontWeight: '500' }}>{f.v}</span></div>))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {v.vAssets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PageHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: '800', fontSize: 'clamp(22px,4vw,28px)' }}>Activos</span><span style={{ color: '#6B7280' }}>Tablets de campo</span></div>
              </PageHead>
              <div style={{ background: '#fff', border: '1px solid #E3DFCF', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontWeight: '500', fontSize: '16px' }}>Tablets de campo</span>
                  <TableSearch value={tabQ} onChange={setTabQ} placeholder="Buscar territorio o sync…" />
                </div>
                <div className="nara-scroll-x">
                <div style={{ minWidth: 780 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) repeat(4,minmax(0,1fr)) minmax(0,1fr)', gap: '12px', padding: '10px 20px', background: '#F7F5EF', color: '#6B7280', fontSize: '14px', fontWeight: '500' }}><span>Territorio</span><span>Tablets</span><span>Sin sincronizar +24 h</span><span>En reparación</span><span>Última sincronización</span><span></span></div>
                {tabRows.map((b: any) => (<div key={b.name} onClick={() => b.open()} style={ix`display:grid;grid-template-columns:minmax(0,1.2fr) repeat(4,minmax(0,1fr)) minmax(0,1fr);gap:12px;padding:12px 20px;border-top:1px solid #E5E0D5;align-items:center;cursor:${b.cur};background:${b.active ? '#E7FAF5' : '#fff'}`} ><span style={{ fontWeight: '500' }}>{b.name}</span><span>{b.n}</span><span style={ix`font-weight:${b.fw}`}>{b.ns}</span><span>{b.r}</span><span>{b.last}</span>{b.canAssign && (<button type="button" onClick={(e) => b.assign(e)} style={{ fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '14px', fontWeight: '500', height: '36px', padding: '0 12px', borderRadius: '14px', border: 'none', background: '#31C6E6', color: '#F7F5EF', cursor: 'pointer' }}>{b.assignLabel}</button>)}</div>))}
                {!tabRows.length ? (
                  <p style={{ margin: 0, padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                    {tabQ.trim() ? 'Ninguna fila coincide con la búsqueda.' : 'No hay tablets registradas.'}
                  </p>
                ) : null}
                </div>
                </div>
              </div>

              <FormModal
                open={!!v.assetDetail}
                onClose={() => v.assetDetail?.close?.()}
                title={String(v.assetDetail?.title || "Detalle")}
                description="Resumen y unidades registradas en el territorio."
                size="lg"
                footer={(
                  <>
                    <button
                      type="button"
                      onClick={() => v.assetDetail?.openTerr?.()}
                      className="h-11 cursor-pointer rounded-[14px] border-none bg-nara-amarillo px-5 font-texto text-[15px] font-medium text-nara-tinta"
                    >
                      Ver territorio
                    </button>
                    <button
                      type="button"
                      onClick={() => v.assetDetail?.close?.()}
                      className="h-11 cursor-pointer rounded-[14px] border-[1.5px] border-linea bg-nara-blanco px-[18px] font-texto text-[15px] font-medium text-nara-tinta"
                    >
                      Cerrar
                    </button>
                  </>
                )}
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {v.assetDetail?.summary?.map((s: { label: string; val: string | number }) => (
                      <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-linea bg-nara-crema/50 px-3.5 py-3">
                        <span className="text-[13px] text-texto-secundario">{s.label}</span>
                        <span className="font-titulos text-2xl font-semibold">{s.val}</span>
                      </div>
                    ))}
                  </div>
                  {v.assetDetail?.items?.length ? (
                    <div className="overflow-hidden rounded-2xl border border-linea">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-2 bg-[#F7F5EF] px-3.5 py-2.5 text-[13px] font-medium text-texto-secundario sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                        <span>Código</span>
                        <span>Asignado a</span>
                        <span>Estado</span>
                        <span className="hidden sm:inline">Sync / batería</span>
                      </div>
                      {v.assetDetail.items.map((it: { code: string; who: string; state: string; sync: string; bat: string }) => (
                        <div key={it.code} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-2 border-t border-linea px-3.5 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                          <span className="font-medium">{it.code}</span>
                          <span className="min-w-0 truncate">{it.who}</span>
                          <span>{it.state}</span>
                          <span className="hidden text-texto-secundario sm:inline">{it.sync}{it.bat !== "—" ? ` · ${it.bat}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed text-texto-secundario">{v.assetDetail?.empty}</p>
                  )}
                </div>
              </FormModal>
            </div>
          )}
        
    </>
  );
}
