"use client";

/**
 * Estado de ánimo (app paciente).
 * Escala 1–5 · una respuesta por periodo (mañana/tarde, semana o mes).
 */
import {
  MOOD_LABELS,
  MOOD_TINTS,
  moodWindowStatusFor,
  saveMoodCheckin,
} from "@/lib/nara-services/mood.js";
import { useNaraStore } from "@/providers/nara-provider";
import { useState } from "react";

export function MoodPanel({ patientId }: { patientId: string }) {
  const store = useNaraStore();
  const [, setBump] = useState(0);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  const status = moodWindowStatusFor(store, patientId);
  const freqInfo = status.freqInfo;
  const showPicker = status.needs && !saving;

  const onPick = (i: number) => {
    if (!status.needs || saving) return;
    setPicked(i);
    setSaving(true);
    saveMoodCheckin(store, patientId, i, {});
    setBump((n) => n + 1);
    void import("@/lib/store/hydrateProgram").then((m) => {
      if (typeof m.pauseLiveHydrate === "function") m.pauseLiveHydrate(8_000);
    });
  };

  return (
    <div className="relative flex flex-col gap-5 overflow-hidden font-texto text-[#0F2D3B]">
      <style>{`
        @keyframes moodIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes moodPop {
          0% { transform: scale(0.96); }
          60% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="moodIn"], [class*="moodPop"] { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 75% 45% at 8% 0%, rgba(228,247,251,0.95), transparent 55%), radial-gradient(ellipse 55% 40% at 100% 30%, rgba(231,250,245,0.7), transparent 50%)",
        }}
      />

      <header className="[animation:moodIn_.45s_cubic-bezier(.22,1,.36,1)_both]">
        <p className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-[#31C6E6]">
          Su ánimo
        </p>
        <h2 className="m-0 mt-1.5 font-titulos text-[clamp(26px,6vw,32px)] font-extrabold tracking-tight">
          ¿Cómo se siente hoy?
        </h2>
        <p className="m-0 mt-1.5 font-texto text-[15px] leading-relaxed text-[#5B6770]">
          {showPicker
            ? `Toque una opción · ${freqInfo.label}`
            : status.nextHint || `Frecuencia: ${freqInfo.label}`}
        </p>
      </header>

      {showPicker ? (
        <div
          role="radiogroup"
          aria-label="Estado de ánimo del 1 al 5"
          className="flex flex-col gap-2.5 [animation:moodIn_.5s_cubic-bezier(.22,1,.36,1)_.06s_both]"
        >
          {MOOD_LABELS.map((label, i) => {
            const tint = MOOD_TINTS[i];
            const n = i + 1;
            const hot = picked === i;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={hot}
                aria-label={`${n}: ${label}`}
                disabled={saving}
                onClick={() => onPick(i)}
                className={[
                  "group flex min-h-[64px] w-full cursor-pointer items-center gap-3.5 rounded-[20px] border-2 px-3.5 py-3 text-left transition disabled:cursor-wait disabled:opacity-70",
                  hot
                    ? "shadow-[0_14px_32px_-16px_rgba(15,45,59,0.35)] [animation:moodPop_.35s_ease-out]"
                    : "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_rgba(15,45,59,0.3)] active:translate-y-0",
                ].join(" ")}
                style={{
                  borderColor: tint.bd,
                  background: hot ? tint.bgOn : tint.bg,
                  animationDelay: `${0.04 + i * 0.04}s`,
                }}
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl font-titulos text-[22px] font-extrabold text-[#F7F5EF] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]"
                  style={{ background: tint.solid }}
                >
                  {n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-titulos text-[18px] font-bold leading-tight tracking-tight">
                    {label}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#5B6770]/80">
                    {n === 1
                      ? "Muy bajo"
                      : n === 5
                        ? "Muy alto"
                        : `Nivel ${n}`}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-current/20 text-[#0F2D3B]/45 transition group-hover:bg-white/60"
                >
                  →
                </span>
              </button>
            );
          })}
        </div>
      ) : status.last ? (
        <section
          className="relative overflow-hidden rounded-[28px] bg-[#0F2D3B] px-5 py-6 text-[#F7F5EF] shadow-[0_24px_48px_-28px_rgba(15,45,59,0.5)] [animation:moodIn_.5s_cubic-bezier(.22,1,.36,1)_both]"
          aria-live="polite"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#31C6E6]/25 blur-2xl"
          />
          <p className="relative m-0 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#61F0D2]">
            Registrado
          </p>
          <p className="relative m-0 mt-3 font-titulos text-[clamp(28px,7vw,36px)] font-extrabold leading-none tracking-tight">
            {status.last.label}
          </p>
          <p className="relative m-0 mt-2 font-texto text-[16px] text-[#F7F5EF]/75">
            {status.last.value} de 5 · {status.last.when}
          </p>
          {status.nextHint ? (
            <p className="relative m-0 mt-5 rounded-2xl bg-[#61F0D2]/12 px-4 py-3 font-texto text-[14px] leading-relaxed text-[#F7F5EF]/85 ring-1 ring-[#61F0D2]/25">
              {status.nextHint}
            </p>
          ) : null}
        </section>
      ) : (
        <p className="m-0 rounded-2xl border border-dashed border-[#E5E0D5] bg-white/70 px-4 py-6 text-center font-texto text-[15px] text-[#5B6770]">
          Listo para su primer registro.
        </p>
      )}

      <p className="m-0 text-center font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#5B6770]/70">
        1 muy mal · 5 muy bien
      </p>
    </div>
  );
}
