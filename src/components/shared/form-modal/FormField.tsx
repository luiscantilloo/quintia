"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

/** Control compartido · misma altura en todos los campos. */
export const formControlClass =
  "box-border h-14 w-full rounded-2xl border border-transparent bg-white/90 px-4 font-texto text-[16px] font-medium text-[#0F2D3B] shadow-[inset_0_0_0_1px_rgba(15,45,59,0.1)] transition duration-200 placeholder:text-[#5B6770]/55 focus:bg-white focus:outline-none focus:shadow-[inset_0_0_0_2px_#31C6E6,0_10px_28px_rgba(49,198,230,0.18)] disabled:cursor-default disabled:opacity-70";

const labelClass =
  "block min-h-[1rem] font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-[#5B6770]";

const shellClass = "flex min-w-0 w-full flex-col gap-1.5";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Contenedor genérico (teléfono, etc.). */
export function FormField({ label, hint, className = "", children }: FieldProps) {
  return (
    <div className={`${shellClass} ${className}`.trim()}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? (
        <span className="text-[12px] font-normal leading-snug text-texto-secundario">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function FormFieldStatic(props: FieldProps) {
  return <FormField {...props} />;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  fieldClassName?: string;
};

export function FormInput({
  label,
  hint,
  fieldClassName = "",
  className = "",
  ...rest
}: InputProps) {
  return (
    <FormField label={label} hint={hint} className={fieldClassName}>
      <input className={`${formControlClass} ${className}`.trim()} {...rest} />
    </FormField>
  );
}

export {
  FormSearchSelect,
  SearchPicker,
  type SearchPickerOption,
} from "./SearchPicker";

/** @deprecated Preferir FormSearchSelect / SearchPicker (modal con lupa). */
export function FormSelect(
  props: SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    hint?: ReactNode;
    fieldClassName?: string;
  },
) {
  const { label, hint, fieldClassName = "", className = "", children, ...rest } =
    props;
  return (
    <FormField label={label} hint={hint} className={fieldClassName}>
      <select className={`${formControlClass} ${className}`.trim()} {...rest}>
        {children}
      </select>
    </FormField>
  );
}

export function FormInputWithAction({
  label,
  hint,
  actionLabel = "Generar",
  onAction,
  fieldClassName = "",
  className = "",
  ...rest
}: InputProps & { actionLabel?: string; onAction?: () => void }) {
  return (
    <FormField label={label} hint={hint} className={fieldClassName}>
      <div className="relative min-w-0 w-full">
        <input
          className={`${formControlClass} pr-[6.25rem] ${className}`.trim()}
          {...rest}
        />
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="absolute right-2 top-1/2 z-[2] h-10 -translate-y-1/2 cursor-pointer rounded-xl bg-[#0F2D3B] px-3.5 font-texto text-[12px] font-bold tracking-wide text-[#F7F5EF] transition hover:bg-[#31C6E6] hover:text-[#0F2D3B] active:scale-[0.97]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </FormField>
  );
}

export function FormSection({
  title,
  step,
  children,
  className = "",
}: {
  title: string;
  step?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative flex w-full min-w-0 flex-col gap-4 ${className}`.trim()}>
      <div className="flex items-center gap-3">
        {step != null ? (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full font-titulos text-[13px] font-extrabold text-[#0F2D3B]"
            style={{
              background:
                "linear-gradient(135deg, #61F0D2 0%, #31C6E6 55%, #8B4AD4 100%)",
            }}
          >
            {step}
          </span>
        ) : null}
        <h3 className="m-0 font-titulos text-[17px] font-extrabold tracking-tight text-[#0F2D3B]">
          {title}
        </h3>
        <span
          className="h-px min-w-0 flex-1"
          style={{
            background:
              "linear-gradient(90deg, rgba(49,198,230,.55), transparent)",
          }}
          aria-hidden
        />
      </div>
      <div className="grid w-full grid-cols-1 items-start gap-x-3 gap-y-3 sm:grid-cols-2 [&>*]:min-w-0 [&>*]:w-full">
        {children}
      </div>
    </section>
  );
}

const ROLE_TONE: Record<string, { bg: string; fg: string; ring: string }> = {
  Administrador: { bg: "#0F2D3B", fg: "#F7F5EF", ring: "#31C6E6" },
  Administradora: { bg: "#0F2D3B", fg: "#F7F5EF", ring: "#31C6E6" },
  "Gestor de campo": { bg: "#E4F7FB", fg: "#0F2D3B", ring: "#31C6E6" },
  Clínica: { bg: "#EFE8FB", fg: "#0F2D3B", ring: "#6C04C9" },
  Observador: { bg: "#E7FAF5", fg: "#0F2D3B", ring: "#61F0D2" },
  "Persona acompañada": { bg: "#F3EBFB", fg: "#0F2D3B", ring: "#8B4AD4" },
  "Cuidadora / familiar": { bg: "#F7F5EF", fg: "#0F2D3B", ring: "#31C6E6" },
};

export function FormRoleChips({
  roles,
  value,
  onChange,
}: {
  roles: string[];
  value: string;
  onChange: (role: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className={labelClass}>Rol</span>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Rol del usuario"
      >
        {roles.map((r) => {
          const on = value === r;
          const tone = ROLE_TONE[r] || {
            bg: "#F7F5EF",
            fg: "#0F2D3B",
            ring: "#31C6E6",
          };
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(r)}
              className={`relative h-11 cursor-pointer rounded-2xl px-4 font-texto text-[14px] font-semibold transition-all duration-200 ${
                on
                  ? "scale-[1.03] shadow-[0_10px_24px_rgba(15,45,59,0.16)]"
                  : "opacity-80 hover:scale-[1.02] hover:opacity-100"
              }`}
              style={{
                background: on ? tone.bg : "#fff",
                color: on ? tone.fg : "#0F2D3B",
                boxShadow: on
                  ? `0 0 0 2px ${tone.ring}, 0 10px 24px rgba(15,45,59,0.14)`
                  : "inset 0 0 0 1px rgba(15,45,59,0.12)",
              }}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
