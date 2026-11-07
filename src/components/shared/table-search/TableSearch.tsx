"use client";

import { useId } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Texto accesible / label oculto. */
  label?: string;
};

/**
 * Input de búsqueda para tablas — estilo Nara (pill + icono).
 */
export function TableSearch({
  value,
  onChange,
  placeholder = "Buscar en la tabla…",
  className = "",
  label = "Buscar",
}: Props) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`relative flex min-w-0 max-w-full items-center sm:max-w-sm ${className}`}
    >
      <span className="sr-only">{label}</span>
      <span
        className="pointer-events-none absolute left-3.5 text-texto-secundario"
        aria-hidden
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="box-border h-11 w-full min-w-0 rounded-full border border-linea bg-nara-blanco py-0 pl-10 pr-10 font-texto text-[14px] text-nara-tinta shadow-[0_1px_0_rgba(22,20,19,0.04)] outline-none transition placeholder:text-texto-secundario/70 focus:border-nara-tinta/35"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 grid h-8 w-8 place-items-center rounded-full border-0 bg-transparent text-texto-secundario hover:bg-nara-crema hover:text-nara-tinta"
          aria-label="Limpiar búsqueda"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ) : null}
    </label>
  );
}

/** Convierte un valor arbitrario en texto buscable. */
export function searchableText(value: unknown, depth = 0): string {
  if (value == null || depth > 3) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "function") return "";
  if (Array.isArray(value)) {
    return value.map((x) => searchableText(x, depth + 1)).join(" ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([k]) => !/^(open|pick|go|onClick|set|toggle|fn|ref)/i.test(k))
      .map(([, v]) => searchableText(v, depth + 1))
      .join(" ");
  }
  return "";
}

/** Filtra filas si algún campo contiene el query (sin acentos, case-insensitive). */
export function filterRowsBySearch<T>(rows: T[], query: string): T[] {
  const q = normalize(query);
  if (!q) return rows;
  return rows.filter((row) => normalize(searchableText(row)).includes(q));
}

function normalize(s: string) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
