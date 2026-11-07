"use client";

import { useId, useState, type ReactNode } from "react";

type Opt = {
  o: string;
  p: string;
  setO: (e: { target: { value: string } }) => void;
};

type Question = {
  n: number;
  q: string;
  setQ: (e: { target: { value: string } }) => void;
  remove?: () => void;
  opts?: Opt[];
  /** Solo pregunta 9 PHQ: interruptor crisis si puntaje > 0. */
  showCrisisToggle?: boolean;
  crisisOn?: boolean;
  toggleCrisis?: () => void;
};

type Props = {
  title: string;
  subtitle?: string;
  maxLabel: string;
  questions: Question[];
  onAddQuestion?: () => void;
  addQuestionLabel: string;
  accent?: "verde" | "naranja" | "lima";
  footer?: ReactNode;
  /** Si true, el bloque arranca abierto. Por defecto cerrado. */
  defaultOpen?: boolean;
  /** Título editable (cuestionarios extra). */
  onTitleChange?: (e: { target: { value: string } }) => void;
  /** Quitar todo el cuestionario (solo extras). */
  onRemoveBlock?: () => void;
};

const accentBar: Record<NonNullable<Props["accent"]>, string> = {
  verde: "bg-[#0F2D3B]",
  naranja: "bg-[#31C6E6]",
  lima: "bg-[#31C6E6]",
};

/**
 * Editor de preguntas para reglas de clasificación (QUINTIA).
 * Cabecera plegable con flecha; cuerpo con preguntas numeradas.
 */
export function RulesQuestionsBlock({
  title,
  subtitle,
  maxLabel,
  questions,
  onAddQuestion,
  addQuestionLabel,
  accent = "verde",
  footer,
  defaultOpen = false,
  onTitleChange,
  onRemoveBlock,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E0D5] bg-[#F7F5EF] shadow-[0_1px_0_rgba(39,104,58,0.06)]">
      <div className="relative flex w-full items-center gap-2 border-b border-[#E5E0D5] bg-white px-4 py-3.5 sm:gap-3 sm:px-6 sm:py-4">
        <div className={`absolute inset-y-0 left-0 w-1 ${accentBar[accent]}`} aria-hidden />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 pl-2 text-left transition hover:opacity-90"
        >
          <div className="min-w-0 flex-1">
            {onTitleChange && open ? (
              <input
                value={title}
                onChange={onTitleChange}
                onClick={(e) => e.stopPropagation()}
                aria-label="Nombre del cuestionario"
                className="w-full rounded-lg border border-[#E5E0D5] bg-[#F7F5EF]/80 px-2.5 py-1.5 font-titulos text-[1.2rem] font-extrabold tracking-tight text-[#0F2D3B] outline-none focus:border-[#0F2D3B] focus:bg-white"
              />
            ) : (
              <h3 className="font-titulos text-[1.35rem] font-extrabold tracking-tight text-[#0F2D3B]">
                {title}
              </h3>
            )}
            {subtitle ? (
              <p className="mt-0.5 font-texto text-sm text-[#6B7280]">{subtitle}</p>
            ) : null}
          </div>
          <span className="hidden shrink-0 rounded-md bg-[#E5E0D5]/55 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#0F2D3B] sm:inline">
            {maxLabel}
          </span>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E0D5] text-[#0F2D3B] transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        {onRemoveBlock ? (
          <button
            type="button"
            onClick={onRemoveBlock}
            className="shrink-0 rounded-lg px-2.5 py-2 font-texto text-sm text-[#8A1C14] transition hover:bg-[#FDE7E4]"
          >
            Quitar
          </button>
        ) : null}
      </div>

      {open ? (
        <div id={panelId} className="flex flex-col gap-3 p-4 sm:p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-[#6B7280] sm:hidden">
            {maxLabel}
          </p>
          {questions.map((dq) => (
            <article
              key={dq.n}
              className="group rounded-xl border border-[#E5E0D5]/80 bg-white p-4 transition-colors hover:border-[#31C6E6]/70"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F2D3B] font-mono text-sm font-medium text-[#F7F5EF]"
                  aria-hidden
                >
                  {dq.n}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={String(dq.q ?? "")}
                      onChange={dq.setQ}
                      aria-label={`Enunciado pregunta ${dq.n}`}
                      className="min-w-0 flex-1 rounded-lg border border-[#E5E0D5] bg-[#F7F5EF]/60 px-3 py-2.5 font-texto text-[15px] text-[#222220] outline-none transition focus:border-[#0F2D3B] focus:bg-white focus:ring-2 focus:ring-[#E5E0D5]"
                    />
                    <button
                      type="button"
                      onClick={() => dq.remove?.()}
                      className="shrink-0 rounded-lg px-3 py-2 font-texto text-sm text-[#8A1C14] transition hover:bg-[#FDE7E4]"
                    >
                      Eliminar
                    </button>
                  </div>

                  {dq.showCrisisToggle ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#31C6E6]/35 bg-[#E7FAF5]/50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-texto text-sm font-medium text-[#0F2D3B]">
                          Activar crisis si el puntaje es mayor que 0
                        </p>
                        
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!dq.crisisOn}
                        aria-label="Activar crisis si puntaje mayor que 0"
                        onClick={() => dq.toggleCrisis?.()}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                          dq.crisisOn ? "bg-[#31C6E6]" : "bg-[#E5E0D5]"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                            dq.crisisOn ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ) : null}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {(dq.opts || []).slice(0, 4).map((o, oi) => (
                      <div
                        key={oi}
                        className="flex items-center gap-2 rounded-lg border border-[#E8E4D8] bg-[#F7F5EF] px-2.5 py-2"
                      >
                        <input
                          value={String(o.o ?? "")}
                          onChange={o.setO}
                          aria-label={`Opción ${oi + 1} de la pregunta ${dq.n}`}
                          className="min-w-0 flex-1 border-0 bg-transparent font-texto text-sm text-[#0F2D3B] outline-none"
                        />
                        <div
                          className="flex shrink-0 items-center gap-1 rounded-md border border-[#E5E0D5] bg-white px-2 py-1"
                          title="Puntaje fijo 0 a 3"
                        >
                          <span className="font-mono text-sm text-[#222220]">{oi}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wide text-[#6B7280]">
                            pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {onAddQuestion ? (
            <button
              type="button"
              onClick={onAddQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#0F2D3B]/40 bg-white py-3 font-texto text-sm font-medium text-[#0F2D3B] transition hover:border-[#0F2D3B] hover:bg-[#E5E0D5]/30"
            >
              {addQuestionLabel}
            </button>
          ) : null}

          {footer ? (
            <div className="mt-1 rounded-xl border border-[#E5E0D5] bg-white p-4">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
