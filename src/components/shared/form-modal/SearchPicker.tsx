"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type SearchPickerOption = {
  value: string;
  label: string;
  /** Texto extra para búsqueda (opcional). */
  searchText?: string;
};

type Props = {
  label: string;
  value: string;
  options: SearchPickerOption[];
  onChange: (value: string) => void;
  hint?: ReactNode;
  fieldClassName?: string;
  /** Placeholder del campo cerrado. */
  placeholder?: string;
  /** Título del modal. */
  modalTitle?: string;
  /** Placeholder del buscador interno. */
  searchPlaceholder?: string;
  /** Permite valor vacío (opción «Seleccione…»). */
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
};

function Magnifier({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle
        cx="8"
        cy="8"
        r="5.25"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12.2 12.2 15.5 15.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Sustituto de <select>: campo con lupa que abre un modal de búsqueda y selección.
 */
export function SearchPicker({
  label,
  value,
  options,
  onChange,
  hint,
  fieldClassName = "",
  placeholder = "Buscar y seleccionar…",
  modalTitle,
  searchPlaceholder = "Buscar…",
  allowEmpty = false,
  emptyLabel = "Seleccione…",
  disabled = false,
}: Props) {
  const titleId = useId();
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [q, setQ] = useState("");

  const allOptions = useMemo(() => {
    const base = options.slice();
    if (allowEmpty && !base.some((o) => o.value === "")) {
      return [{ value: "", label: emptyLabel }, ...base];
    }
    return base;
  }, [options, allowEmpty, emptyLabel]);

  const selected = allOptions.find((o) => o.value === value);
  const display = selected?.label || "";

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allOptions;
    return allOptions.filter((o) => {
      const hay = `${o.label} ${o.value} ${o.searchText || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [allOptions, q]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    setQ("");
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setShown(true));
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    setShown(false);
    window.setTimeout(() => setOpen(false), 200);
  };

  const pick = (v: string) => {
    onChange(v);
    close();
  };

  return (
    <div className={`flex min-w-0 w-full flex-col gap-1.5 ${fieldClassName}`.trim()}>
      <span className="block min-h-[1rem] font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-[#5B6770]">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className="group relative flex h-14 w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-transparent bg-white/90 px-4 text-left shadow-[inset_0_0_0_1px_rgba(15,45,59,0.1)] transition duration-200 hover:shadow-[inset_0_0_0_2px_#31C6E6,0_8px_22px_rgba(49,198,230,0.14)] disabled:cursor-default disabled:opacity-60"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className={`min-w-0 flex-1 truncate font-texto text-[16px] font-medium ${
            display ? "text-[#0F2D3B]" : "text-[#5B6770]/70"
          }`}
        >
          {display || placeholder}
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#0F2D3B] text-[#F7F5EF] transition group-hover:bg-[#31C6E6] group-hover:text-[#0F2D3B]">
          <Magnifier />
        </span>
      </button>
      {hint ? (
        <span className="px-1 text-[12px] font-normal leading-snug text-texto-secundario">
          {hint}
        </span>
      ) : null}

      {portalReady && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-5"
              role="presentation"
            >
              <button
                type="button"
                className={`absolute inset-0 border-0 bg-[#0F2D3B]/55 backdrop-blur-[2px] transition-opacity duration-200 ${
                  shown ? "opacity-100" : "opacity-0"
                }`}
                aria-label="Cerrar"
                onClick={close}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative z-[1] flex w-full max-w-lg max-h-[min(86dvh,640px)] flex-col overflow-hidden rounded-t-[28px] border border-white/20 bg-[#F7F5EF] shadow-[0_32px_80px_rgba(15,45,59,.35)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(.22,1,.36,1)] sm:rounded-[28px] ${
                  shown
                    ? "translate-y-0 opacity-100 sm:scale-100"
                    : "translate-y-6 opacity-0 sm:scale-[0.97]"
                }`}
              >
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{
                    background:
                      "linear-gradient(90deg, #61F0D2 0%, #31C6E6 45%, #6C04C9 100%)",
                  }}
                  aria-hidden
                />
                <header className="shrink-0 border-b border-[#E5E0D5] px-5 py-4 sm:px-6">
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#0F2D3B]/15 sm:hidden" aria-hidden />
                  <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#5B6770]">
                    Seleccionar
                  </p>
                  <h2
                    id={titleId}
                    className="m-0 mt-1 font-titulos text-[22px] font-extrabold tracking-tight text-[#0F2D3B]"
                  >
                    {modalTitle || label}
                  </h2>
                  <label htmlFor={searchId} className="relative mt-3 block">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6770]">
                      <Magnifier />
                    </span>
                    <input
                      id={searchId}
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={searchPlaceholder}
                      autoFocus
                      className="box-border h-12 w-full rounded-2xl border border-transparent bg-white pl-11 pr-4 font-texto text-[16px] text-[#0F2D3B] shadow-[inset_0_0_0_1px_rgba(15,45,59,0.12)] outline-none transition focus:shadow-[inset_0_0_0_2px_#31C6E6,0_8px_20px_rgba(49,198,230,0.16)]"
                    />
                  </label>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-8 text-center font-texto text-[15px] text-[#5B6770]">
                      Sin coincidencias para «{q.trim()}».
                    </p>
                  ) : (
                    <ul className="m-0 list-none p-0">
                      {filtered.map((o) => {
                        const on = o.value === value;
                        return (
                          <li key={`${o.value}::${o.label}`}>
                            <button
                              type="button"
                              onClick={() => pick(o.value)}
                              className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 px-4 py-3.5 text-left font-texto text-[16px] transition ${
                                on
                                  ? "bg-[#0F2D3B] font-semibold text-[#F7F5EF]"
                                  : "bg-transparent text-[#0F2D3B] hover:bg-white"
                              }`}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {o.label}
                              </span>
                              {on ? (
                                <span
                                  className="grid size-6 shrink-0 place-items-center rounded-full bg-[#31C6E6] text-[#0F2D3B]"
                                  aria-hidden
                                >
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path
                                      d="M2.5 6.2 5 8.7 9.5 3.5"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <footer className="shrink-0 border-t border-[#E5E0D5] bg-white/80 px-5 py-3 backdrop-blur-sm sm:px-6">
                  <button
                    type="button"
                    onClick={close}
                    className="h-11 w-full cursor-pointer rounded-2xl border border-[#E5E0D5] bg-white font-texto text-[15px] font-semibold text-[#0F2D3B] transition hover:bg-[#F7F5EF] sm:w-auto sm:px-6"
                  >
                    Cancelar
                  </button>
                </footer>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Alias con API de formulario. */
export function FormSearchSelect(props: Props) {
  return <SearchPicker {...props} />;
}
