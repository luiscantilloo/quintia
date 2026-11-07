"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormModal } from "@/components/shared/form-modal/FormModal";
import {
  FormFieldStatic,
  FormInput,
  FormInputWithAction,
  FormSearchSelect,
  FormSection,
  type SearchPickerOption,
} from "@/components/shared/form-modal/FormField";
import { NaraMsgAlert } from "@/components/shared/nara-alert/NaraMsgAlert";
import { PageHead } from "@/components/shared/page-head/PageHead";
import { PhoneInput } from "@/components/shared/phone-input/PhoneInput";
import { TableSearch } from "@/components/shared/table-search/TableSearch";
import { ix } from "../inlineStyle";
import type { ChangeEvent } from "react";

const btnPrimary =
  "cursor-pointer border-none bg-[#31C6E6] !text-[#0F2D3B] shadow-[0_12px_28px_rgba(49,198,230,.35)] hover:brightness-[1.04] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]";
const btnGhost =
  "cursor-pointer border border-[#E5E0D5] bg-white/90 text-nara-tinta hover:border-[#0F2D3B]/30 hover:bg-white hover:-translate-y-0.5 active:translate-y-0";

function pickVal(
  set: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
  value: string,
) {
  set({ target: { value } } as ChangeEvent<HTMLSelectElement>);
}

function strOpts(list: string[] | undefined): SearchPickerOption[] {
  return (list || []).map((o) => ({ value: o, label: o }));
}

function UsuariosPager({ v }: { v: Record<string, any> }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-texto-secundario">{v.pageLabel}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!v.canPrev}
          onClick={() => v.prevPage?.()}
          className="h-9 cursor-pointer rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-sm text-nara-tinta disabled:cursor-default disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="min-w-[4.5rem] text-center text-sm font-medium text-nara-tinta">
          {v.page + 1} / {v.totalPages}
        </span>
        <button
          type="button"
          disabled={!v.canNext}
          onClick={() => v.nextPage?.()}
          className="h-9 cursor-pointer rounded-[10px] border-[1.5px] border-linea bg-nara-blanco px-3 font-texto text-sm text-nara-tinta disabled:cursor-default disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export function AdminUsuariosContent({ v }: { v: Record<string, any> }) {
  return (
    <>
      <PageHead>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-titulos text-[clamp(22px,4vw,28px)] font-semibold text-nara-tinta">
            Usuarios y permisos
          </span>
          <span className="text-[15px] text-texto-secundario">
            Quién entra a QUINTIA, con qué rol y qué puede ver
          </span>
        </div>
        <button
          type="button"
          onClick={() => v.newUser()}
          className="h-11 w-full cursor-pointer rounded-xl border-none bg-[#31C6E6] px-5 font-texto text-[15px] font-semibold text-[#0F2D3B] shadow-[0_8px_20px_rgba(49,198,230,.25)] sm:w-auto sm:self-start"
        >
          + Crear usuario
        </button>
      </PageHead>

      <NaraMsgAlert msg={v.msg} onClear={() => v.clearMsg?.()} />
      <NaraMsgAlert msg={v.err} onClear={() => v.clearErr?.()} />

      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex min-w-0 flex-wrap gap-2">
          {v.roleChips?.map((c: any) => (
            <button
              key={c.key}
              type="button"
              onClick={() => c.go()}
              className="h-9 shrink-0 cursor-pointer rounded-full border-[1.5px] px-3 font-texto text-[13px] text-nara-tinta sm:text-sm"
              style={{ borderColor: c.bd, background: c.bg }}
            >
              {c.label} · {c.n}
            </button>
          ))}
        </div>
        <TableSearch
          value={String(v.q ?? "")}
          onChange={v.setQ}
          placeholder="Buscar por cualquier campo…"
        />
      </div>

      <p className="text-sm text-texto-secundario md:hidden">
        Toque un usuario para editarlo, o cree uno nuevo.
      </p>

      {/* Móvil: tarjetas */}
      <div className="flex flex-col gap-2 md:hidden">
        {v.users?.map((u: any) => (
          <button
            key={u.key}
            type="button"
            onClick={() => u.pick()}
            className="flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl border border-linea px-4 py-3.5 text-left"
            style={{ background: u.bg || "#fff" }}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-nara-tinta">
                  {u.role === "Observador" ? u.org || u.name : u.name}
                </span>
                {u.role === "Observador" && u.mods ? (
                  <span className="truncate text-xs text-texto-secundario">{u.mods}</span>
                ) : (
                  <span className="truncate text-xs text-texto-secundario">{u.contact}</span>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-nara-tinta">
                <span
                  className="size-2 rounded-full"
                  style={{ background: u.sc }}
                />
                {u.status}
              </span>
            </div>
            {u.role !== "Observador" ? (
              <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                <span className="text-nara-tinta">{u.role}</span>
                {u.mods ? (
                  <span className="text-xs text-texto-secundario">{u.mods}</span>
                ) : null}
              </div>
            ) : null}
            {u.role !== "Observador" ? (
              <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-sm text-texto-secundario">
                <span className="min-w-0 break-words">{u.org}</span>
                {u.terr ? <span className="min-w-0 break-words">{u.terr}</span> : null}
              </div>
            ) : null}
          </button>
        ))}
        {v.noUsers ? (
          <div className="rounded-2xl border border-linea bg-nara-blanco px-5 py-5 text-[15px] text-texto-secundario">
            Ningún usuario coincide con la búsqueda.
          </div>
        ) : null}
        {!v.noUsers ? <UsuariosPager v={v} /> : null}
      </div>

      {/* Desktop: tabla + tip */}
      <div className="nara-split-panel hidden md:grid">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="nara-scroll-x overflow-hidden rounded-[20px] border border-linea bg-nara-blanco">
            <div style={{ minWidth: 720 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,.9fr) 100px",
                  gap: 12,
                  padding: "10px 20px",
                  background: "#F7F5EF",
                  color: "#6B7280",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <span>Nombre</span>
                <span>Rol</span>
                <span>Organización</span>
                <span>Territorio</span>
                <span>Estado</span>
              </div>
              {v.users?.map((u: any) => (
                <div
                  key={u.key}
                  onClick={() => u.pick()}
                  style={ix`display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,.9fr) 100px;gap:12px;padding:11px 20px;border-top:1px solid #E5E0D5;align-items:center;font-size:14px;cursor:pointer;background:${u.bg}`}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>
                      {u.role === "Observador" ? u.org || u.name : u.name}
                    </span>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>
                      {u.role === "Observador" ? u.mods || u.contact : u.contact}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span>{u.role}</span>
                    {u.role !== "Observador" && u.mods ? (
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{u.mods}</span>
                    ) : null}
                  </div>
                  <span style={{ minWidth: 0 }}>{u.role === "Observador" ? u.terr : u.org}</span>
                  <span style={{ minWidth: 0 }}>{u.terr}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 500 }}>
                    <span style={ix`width:8px;height:8px;border-radius:50%;background:${u.sc}`} />
                    {u.status}
                  </span>
                </div>
              ))}
              {v.noUsers ? (
                <span style={{ display: "block", padding: 20, color: "#6B7280" }}>
                  Ningún usuario coincide con la búsqueda.
                </span>
              ) : null}
            </div>
          </div>
          {!v.noUsers ? <UsuariosPager v={v} /> : null}
        </div>

        <div className="sticky top-5 flex flex-col gap-3.5 rounded-[20px] border border-linea bg-nara-blanco px-[22px] py-5">
          <span className="leading-relaxed text-texto-secundario">
            Toque un usuario para editarlo en el formulario, o cree uno nuevo.
          </span>
        </div>
      </div>

      <FormModal
        open={!!v.hasForm}
        onClose={() => v.closeForm()}
        title={String(v.formTitle || "Usuario")}
        description={String(
          v.formDesc || "Quién entra a QUINTIA, con qué rol y qué puede ver.",
        )}
        size={(v.formSize as "sm" | "md" | "lg") || "md"}
        footer={(
          <>
            <button type="button" onClick={() => v.save()} className={btnPrimary}>
              {v.saveLabel}
            </button>
            {v.canReset ? (
              <button type="button" onClick={() => v.resetPassword()} className={btnGhost}>
                Restablecer clave
              </button>
            ) : null}
            {v.isEdit ? (
              <button type="button" onClick={() => v.toggleStatus()} className={btnGhost}>
                {v.statusLabel}
              </button>
            ) : null}
            <button type="button" onClick={() => v.closeForm()} className={btnGhost}>
              Cancelar
            </button>
          </>
        )}
      >
        <div className="q-form-stagger flex flex-col gap-6">
          {v.tempMsg ? (
            <div
              role="status"
              className="rounded-2xl border border-[#31C6E6]/40 bg-[#E4F7FB] px-4 py-3.5 font-texto text-[15px] font-semibold text-[#0F2D3B] shadow-[0_8px_24px_rgba(49,198,230,.15)]"
            >
              {String(v.tempMsg)}
            </div>
          ) : null}

          <FormSearchSelect
            label="Rol"
            value={String(v.f.role ?? "")}
            options={strOpts(v.roles as string[] | undefined)}
            onChange={(val) => pickVal(v.fSet.role, val)}
            modalTitle="Elegir rol"
            searchPlaceholder="Buscar rol…"
            placeholder="Buscar rol…"
          />

          {v.isManualPatient ? (
            <>
              <FormSection title="Identidad" step={1}>
                <FormInput
                  label="Nombre"
                  value={v.f.firstName ?? ""}
                  onChange={v.fSet.firstName}
                  placeholder="Nombre"
                />
                <FormInput
                  label="Apellido"
                  value={v.f.lastName ?? ""}
                  onChange={v.fSet.lastName}
                  placeholder="Apellidos"
                />
                <FormInput
                  label="Fecha de nacimiento"
                  type="date"
                  value={v.f.birthDate ?? ""}
                  onChange={v.fSet.birthDate}
                  hint="Mínimo 60 años"
                />
                <FormInput
                  label="Edad"
                  value={v.f.age ?? ""}
                  readOnly
                  placeholder="Se calcula sola"
                  className="cursor-default bg-[#F0ECE6]"
                />
                <FormSearchSelect
                  label="Género"
                  value={v.f.genero ?? ""}
                  options={strOpts(v.generoOpts as string[] | undefined)}
                  onChange={(val) => pickVal(v.fSet.genero, val)}
                  modalTitle="Elegir género"
                  searchPlaceholder="Buscar género…"
                  allowEmpty
                  emptyLabel="Seleccione…"
                />
                <FormSearchSelect
                  label="Estado civil"
                  value={v.f.estadoCivil ?? ""}
                  options={strOpts(v.civilOpts as string[] | undefined)}
                  onChange={(val) => pickVal(v.fSet.estadoCivil, val)}
                  modalTitle="Elegir estado civil"
                  searchPlaceholder="Buscar…"
                  allowEmpty
                  emptyLabel="Seleccione…"
                />
              </FormSection>

              <FormSection title="Contacto" step={2}>
                <FormFieldStatic
                  label="Teléfono"
                  className="sm:col-span-2"
                >
                  <PhoneInput
                    value={v.f.phone ?? ""}
                    onChange={v.fSet.phone}
                    placeholder="3xx xxx xxxx"
                  />
                </FormFieldStatic>
              </FormSection>

              <FormSection title="Ubicación" step={3}>
                <FormSearchSelect
                  label="Territorio"
                  value={v.f.terr ?? ""}
                  options={strOpts(v.terrOpts as string[] | undefined)}
                  onChange={(val) => pickVal(v.fSet.terr, val)}
                  modalTitle="Elegir territorio"
                  searchPlaceholder="Buscar territorio…"
                  allowEmpty
                  emptyLabel="Seleccione…"
                />
                <FormInput
                  label="Vereda o barrio"
                  value={v.f.place ?? ""}
                  onChange={v.fSet.place}
                  placeholder="Ej.: Vereda Cocora"
                />
                <FormSearchSelect
                  label="Estrato"
                  value={v.f.estrato ?? ""}
                  options={strOpts(v.estratoOpts as string[] | undefined)}
                  onChange={(val) => pickVal(v.fSet.estrato, val)}
                  modalTitle="Elegir estrato"
                  searchPlaceholder="Buscar estrato…"
                  allowEmpty
                  emptyLabel="Seleccione…"
                />
              </FormSection>
            </>
          ) : null}

          {v.isPaciente && v.isEdit ? (
            <FormSection title="Persona" step={1}>
              <FormInput
                label="Nombre"
                value={v.f.firstName ?? ""}
                onChange={v.fSet.firstName}
                placeholder="Nombre"
              />
              <FormInput
                label="Apellido"
                value={v.f.lastName ?? ""}
                onChange={v.fSet.lastName}
                placeholder="Apellidos"
              />
            </FormSection>
          ) : null}

          {!v.isPaciente ? (
            <FormSection title="Cuenta" step={1}>
              <FormInput
                label="Nombre"
                value={v.f.firstName ?? ""}
                onChange={v.fSet.firstName}
                placeholder="Nombre"
              />
              <FormInput
                label="Apellido"
                value={v.f.lastName ?? ""}
                onChange={v.fSet.lastName}
                placeholder="Apellidos"
              />
            </FormSection>
          ) : null}

          <FormSection
            title="Acceso"
            step={v.isManualPatient ? 4 : 2}
          >
            <FormInputWithAction
              label="Correo de ingreso"
              type="email"
              value={v.f.contact ?? ""}
              onChange={v.fSet.contact}
              placeholder="nombre.apellido@quintia.com"
              onAction={() => v.genEmail?.()}
              fieldClassName="sm:col-span-2"
              hint="Este correo y la contraseña son el acceso a Ingreso. No es un dato de contacto."
            />
            <FormInputWithAction
              label="Contraseña"
              type="text"
              value={v.f.password ?? ""}
              onChange={v.fSet.password}
              placeholder={
                v.isEdit
                  ? "Dejar vacío para no cambiarla"
                  : v.passwordHint || "Mínimo 8 caracteres"
              }
              autoComplete="new-password"
              onAction={() => v.genPassword?.()}
              fieldClassName="sm:col-span-2"
              hint={
                v.isEdit
                  ? "Solo complete si quiere cambiar la contraseña. No use el correo ni el nombre dentro de la clave."
                  : "No debe contener el correo ni el nombre; Admin/Clínico: mínimo 12."
              }
            />
          </FormSection>

          {v.isPaciente ? (
            <FormSection title="Cuidador">
              {v.hasLinkedCaregiver ? (
                <p className="m-0 font-texto text-[15px] text-nara-tinta sm:col-span-2">
                  Ya tiene cuidador vinculado
                  {v.f.caregiverFirstName ||
                  v.f.caregiverLastName ||
                  v.f.caregiverEmail
                    ? `: ${[
                        [v.f.caregiverFirstName, v.f.caregiverLastName]
                          .filter(Boolean)
                          .join(" "),
                        v.f.caregiverEmail,
                      ]
                        .filter(Boolean)
                        .join(" · ")}`
                    : "."}
                </p>
              ) : (
                <>
                  <FormSearchSelect
                    label="¿Tiene cuidador?"
                    value={v.f.tieneCuidador ?? ""}
                    options={[
                      { value: "no", label: "No" },
                      { value: "si", label: "Sí" },
                    ]}
                    onChange={(val) => pickVal(v.fSet.tieneCuidador, val)}
                    modalTitle="¿Tiene cuidador?"
                    searchPlaceholder="Buscar…"
                    allowEmpty
                    emptyLabel="Seleccione…"
                    fieldClassName="sm:col-span-2"
                  />
                  {v.showCaregiverForm ? (
                    <>
                      <FormInput
                        label="Nombre"
                        value={v.f.caregiverFirstName ?? ""}
                        onChange={v.fSet.caregiverFirstName}
                        placeholder="Nombre"
                      />
                      <FormInput
                        label="Apellido"
                        value={v.f.caregiverLastName ?? ""}
                        onChange={v.fSet.caregiverLastName}
                        placeholder="Apellidos"
                      />
                      <FormInput
                        label="Fecha de nacimiento"
                        type="date"
                        value={v.f.caregiverBirthDate ?? ""}
                        onChange={v.fSet.caregiverBirthDate}
                      />
                      <FormInput
                        label="Edad"
                        value={v.f.caregiverAge ?? ""}
                        readOnly
                        placeholder="Se calcula sola"
                        className="cursor-default bg-[#F0ECE6]"
                      />
                      <FormSearchSelect
                        label="Género"
                        value={v.f.caregiverGenero ?? ""}
                        options={strOpts(v.generoOpts as string[] | undefined)}
                        onChange={(val) => pickVal(v.fSet.caregiverGenero, val)}
                        modalTitle="Elegir género"
                        allowEmpty
                        emptyLabel="Seleccione…"
                      />
                      <FormSearchSelect
                        label="Estado civil"
                        value={v.f.caregiverEstadoCivil ?? ""}
                        options={strOpts(v.civilOpts as string[] | undefined)}
                        onChange={(val) =>
                          pickVal(v.fSet.caregiverEstadoCivil, val)
                        }
                        modalTitle="Elegir estado civil"
                        allowEmpty
                        emptyLabel="Seleccione…"
                      />
                      <FormFieldStatic label="Teléfono">
                        <PhoneInput
                          value={v.f.caregiverPhone ?? ""}
                          onChange={v.fSet.caregiverPhone}
                          placeholder="3xx xxx xxxx"
                        />
                      </FormFieldStatic>
                      <FormInputWithAction
                        label="Correo"
                        type="email"
                        value={v.f.caregiverEmail ?? ""}
                        onChange={v.fSet.caregiverEmail}
                        placeholder="nombre.apellido@quintia.com"
                        onAction={() => v.genCaregiverEmail?.()}
                      />
                      <FormInput
                        label="Vereda o barrio"
                        value={v.f.caregiverPlace ?? ""}
                        onChange={v.fSet.caregiverPlace}
                        placeholder="Ej.: Vereda Cocora"
                      />
                      <FormSearchSelect
                        label="Estrato"
                        value={v.f.caregiverEstrato ?? ""}
                        options={strOpts(v.estratoOpts as string[] | undefined)}
                        onChange={(val) =>
                          pickVal(v.fSet.caregiverEstrato, val)
                        }
                        modalTitle="Elegir estrato"
                        allowEmpty
                        emptyLabel="Seleccione…"
                      />
                      <FormInputWithAction
                        label="Contraseña de acceso"
                        type="text"
                        value={v.f.caregiverPassword ?? ""}
                        onChange={v.fSet.caregiverPassword}
                        placeholder="Mínimo 8 caracteres"
                        onAction={() => v.genCaregiverPassword?.()}
                        fieldClassName="sm:col-span-2"
                      />
                    </>
                  ) : null}
                </>
              )}
            </FormSection>
          ) : null}

          {!v.isPaciente ? (
            <FormSearchSelect
              label="Territorio"
              value={v.f.terr ?? ""}
              options={strOpts(v.terrOpts as string[] | undefined)}
              onChange={(val) => pickVal(v.fSet.terr, val)}
              modalTitle="Elegir territorio"
              searchPlaceholder="Buscar territorio…"
              placeholder="Buscar territorio…"
            />
          ) : null}

          {v.isObs ? (
            <FormSection title="Observador">
              <FormInput
                label="Organización"
                value={v.f.org ?? ""}
                onChange={v.fSet.org}
                placeholder="Nombre de la organización"
                fieldClassName="sm:col-span-2"
                hint="Observador es un solo rol. Por ahora la app muestra topbar y TEJIVA; las vistas se armarán después."
              />
            </FormSection>
          ) : null}

          {v.isEdit ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-[#E5E0D5]/80 bg-white/70 p-4 sm:p-5">
              <span className="font-titulos text-[15px] font-extrabold text-nara-tinta">
                Registro de actividad
              </span>
              {v.activity?.map((a: any) => (
                <div
                  key={a.key}
                  className="grid grid-cols-[110px_minmax(0,1fr)] gap-2.5 border-t border-[#E5E0D5] py-2 text-sm first:border-t-0 first:pt-0"
                >
                  <span className="font-mono text-[12px] text-texto-secundario">
                    {a.when}
                  </span>
                  <span className="font-texto text-nara-tinta">{a.text}</span>
                </div>
              ))}
              {v.noActivity ? (
                <span className="text-sm text-texto-secundario">
                  Sin actividad registrada.
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </FormModal>
    </>
  );
}
