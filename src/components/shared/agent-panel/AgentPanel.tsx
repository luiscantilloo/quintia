"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  createElement,
} from "react";
import { IconX } from "@/components/shared/icons";
import { useNaraStore } from "@/providers/nara-provider";
import {
  TEJIVA_DISCLOSURE_ES,
  TEJIVA_HANDOFF_LABEL,
  TEJIVA_HANDOFF_REPLY_ES,
  BRAND,
  tejivaAsset,
} from "@/lib/brand";
import { TeoRichText } from "./TeoRichText";
import { pickTeoSuggestions } from "./teoSuggestions";

type Props = {
  role?: string;
  mode?: "home" | "drawer";
  /** true cuando el drawer de TEJIVA está abierto — rota sugerencias al abrir */
  open?: boolean;
  /** @deprecated Las sugerencias ya no dependen del contexto de pantalla */
  context?: string;
  contextLabel?: string;
  initialAsk?: string;
  onAction?: (action: string, payload: unknown) => void;
  onOpenDrawer?: (q: string) => void;
  onClose?: () => void;
  style?: CSSProperties;
};

type ConvItem = Record<string, unknown> & { id: string; q: string };

export function AgentPanel({
  role = "admin",
  mode = "home",
  open = true,
  contextLabel = "",
  initialAsk = "",
  onAction,
  onOpenDrawer,
  onClose,
  style,
}: Props) {
  const store = useNaraStore();
  const [conv, setConv] = useState<ConvItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [suggestQs, setSuggestQs] = useState<string[]>(() => pickTeoSuggestions(role));
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAskedRef = useRef("");
  const wasOpenRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartRef = useRef<any>(null);

  useEffect(() => {
    if (mode === "home") {
      setSuggestQs(pickTeoSuggestions(role));
      return;
    }
    if (mode !== "drawer") return;
    if (open && !wasOpenRef.current) {
      setSuggestQs(pickTeoSuggestions(role));
    }
    if (!open) lastAskedRef.current = "";
    wasOpenRef.current = open;
  }, [open, mode, role]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await import("@/lib/agent/agent.js");
      await import("@/lib/agent/agent-chart.js");
      if (cancelled || typeof window === "undefined") return;
      const mk = (window as unknown as { makeAlientoChart?: (r: typeof React) => unknown }).makeAlientoChart;
      if (mk) ChartRef.current = mk(React);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "drawer") return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [mode, onClose]);

  useEffect(() => {
    if (mode !== "drawer" || !open || !initialAsk || !ready) return;
    if (lastAskedRef.current === initialAsk) return;
    lastAskedRef.current = initialAsk;
    void ask(initialAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAsk, mode, ready, open]);

  useEffect(() => {
    if (mode === "drawer" && scrollRef.current) scrollRef.current.scrollTop = 1e6;
  }, [conv.length, mode, loading]);

  const ask = async (text: string) => {
    if (!text.trim() || loading) return;
    if (mode !== "drawer" && onOpenDrawer) {
      setInput("");
      onOpenDrawer(text);
      return;
    }
    const id = "q" + Date.now();
    setInput("");
    setConv((s) => [...s, { id, q: text }]);
    setLoading(true);
    let a: ConvItem;
    try {
      const res = await fetch("/api/teo/ask", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, role }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        text?: string;
        error?: string;
        message?: string;
        model?: string;
        provider?: string;
      };
      if (data.ok && data.text) {
        a = {
          id,
          q: text,
          text: data.text,
          basis: "Según los datos actuales del programa QUINTIA",
          method: "TEJIVA resume e interpreta lo registrado en el programa, en lenguaje claro.",
          none: false,
        };
      } else {
        a = {
          id,
          q: text,
          err: true,
          text:
            data.text ||
            data.error ||
            data.message ||
            "TEJIVA no respondió. Compruebe que nucleo-api (gateway :4200 y ai :4204) esté en marcha.",
        };
      }
    } catch {
      a = {
        id,
        q: text,
        err: true,
        text: "No pude contactar a TEJIVA. Revise la conexión con nucleo-api e intente de nuevo.",
      };
    }
    setConv((s) => s.map((x) => (x.id === id ? a : x)));
    setLoading(false);
  };

  if (!ready || !ChartRef.current) {
    return <div style={{ ...style, minHeight: 120 }} />;
  }

  const G = (window as unknown as { AlientoAgent: typeof import("@/lib/agent/agent.js") extends infer T ? T : never }).AlientoAgent;
  const S = store.get();
  const roleKey = role.split(":")[0];
  const roleAlias: Record<string, string> = {
    obs: "obs",
    observador: "obs",
    clinico: "clin",
    clin: "clin",
    experto: "expert",
    expert: "expert",
  };
  const R =
    (G?.ROLE &&
      (G.ROLE[(roleAlias[roleKey] || roleKey) as keyof typeof G.ROLE] ||
        G.ROLE.admin)) ||
    {
      name: "TEJIVA · Asistente de datos",
      greet: "",
      sub: "Pregunte sobre lo que ve en pantalla.",
    };
  const chips = suggestQs.map((q) => ({ q, go: () => void ask(q) }));
  const pins = (S.pins[role] || []) as string[];
  const mk = (spec: unknown, key: string) => createElement(ChartRef.current, { spec, key });

  const convUi = conv.map((a) => ({ a, id: a.id }));

  const pinList =
    mode === "home"
      ? pins
          .map((qid) => {
            const a = G.runById(role, qid);
            if (!a) return null;
            return {
              q: a.q,
              text: a.text || (a.lines || [])[0],
              basis: a.basis,
              chart: a.charts?.[0] ? mk(a.charts[a.charts.length - 1], "pin" + qid) : null,
              unpin: () =>
                store.set((s: { pins: Record<string, string[]> }) => {
                  s.pins[role] = s.pins[role].filter((x) => x !== qid);
                }),
            };
          })
          .filter(Boolean)
      : [];

  let brief: {
    text: string;
    dots: { bg: string }[];
    dotsLabel: string;
    revisits: unknown[];
    crisis: unknown[];
    basis: string;
  } | null = null;
  if (role.indexOf("expert") === 0 && mode === "home") {
    const ex = role.split(":")[1];
    const b = G.briefing(ex!, S);
    const ok = b.dots.filter((d: { ok: boolean }) => d.ok).length;
    brief = {
      text: b.text,
      dots: b.dots.map((d: { ok: boolean }) => ({ bg: d.ok ? "#0F2D3B" : "#fff" })),
      dotsLabel: ok + " de " + b.dots.length + " hechas",
      revisits: b.revisits,
      crisis: b.crisis,
      basis: ex === "andres" ? "Con los datos de la última sincronización · hoy 7:05" : "Datos al momento",
    };
  }

  const sessionUser = store.session() as { name?: string } | null;
  const greetName = (() => {
    const full = String(sessionUser?.name || "").trim();
    if (!full) return "";
    // Conserva título profesional + primer nombre (p. ej. "Dra. Lucía"); si no, el primer nombre del login.
    const withTitle = full.match(/^(Dra?\.)\s+(\S+)/i);
    if (withTitle) return `${withTitle[1]} ${withTitle[2]}`;
    return full.split(/\s+/)[0] || "";
  })();
  const greetHour = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  })();
  const greetLine = greetName ? `${greetHour}, ${greetName}.` : `${greetHour}.`;
  const bg = mode === "drawer" ? "#d5e6e4" : "transparent";
  const pad = mode === "drawer" ? "16px 18px" : "0";

  return (
    <div
      className="font-texto text-pl-verde-raiz"
      style={{
        fontSize: 15,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: bg,
        ...style,
      }}
    >
      {mode === "drawer" ? (
        <div
          className="box-border flex h-16 shrink-0 items-center justify-between border-b border-linea bg-nara-blanco px-5"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <img src={tejivaAsset("escucha")} alt="" style={{ width: 34, height: 34, display: "block", flex: "none" }} />
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span className="font-titulos text-base font-extrabold leading-tight">{R.name || BRAND.agentName}</span>
              <span className="font-mono text-[12px] leading-tight text-[#6B7280]">
                {contextLabel || BRAND.agentRole}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Cerrar"
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-linea bg-nara-blanco text-nara-tinta"
          >
            <IconX size={22} aria-hidden />
          </button>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: pad,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {mode === "home" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid size-12 place-items-center rounded-2xl bg-pl-menta">
                <img src={tejivaAsset("base")} alt="" className="block h-9 w-9" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-medium uppercase tracking-[0.12em] text-pl-comunidad">
                  {R.name || BRAND.agentName}
                </span>
                <span className="font-mono text-[11px] text-pl-texto2">{BRAND.agentRole}</span>
              </div>
            </div>
            <h1 className="font-titulos text-[clamp(22px,4vw,30px)] font-extrabold leading-[1.2] text-pl-verde-raiz">
              {greetLine}
            </h1>
            <p className="max-w-[760px] text-pretty text-base text-pl-texto2">{R.sub}</p>
            <p className="max-w-[760px] text-pretty font-mono text-[13px] leading-snug text-pl-texto2">
              {TEJIVA_DISCLOSURE_ES}
            </p>
          </div>
        ) : null}

        {mode === "drawer" && conv.length === 0 && !loading ? (
          <div className="rounded-2xl border border-linea bg-nara-blanco px-4 py-3">
            <p className="m-0 font-mono text-[13px] leading-snug text-pl-texto2">{TEJIVA_DISCLOSURE_ES}</p>
          </div>
        ) : null}

        {brief ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E3DFCF",
              borderRadius: 20,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1.5 }}>{brief.text}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {brief.dots.map((d, i) => (
                <span
                  key={i}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: d.bg,
                    border: "2px solid #0F2D3B",
                    boxSizing: "border-box",
                  }}
                />
              ))}
              <span style={{ fontSize: 14, color: "#6B7280", marginLeft: 6 }}>{brief.dotsLabel}</span>
            </div>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{brief.basis}</span>
          </div>
        ) : null}

        {mode === "home" || mode === "drawer" ? (
          <div className="flex w-full min-w-0 flex-col gap-2">
            {mode === "drawer" && contextLabel ? (
              <span className="text-[13px] font-medium text-[#6B7280]">{contextLabel}</span>
            ) : null}
            <div className="flex w-full min-w-0 flex-wrap gap-2">
              {chips.map((c, i) => (
                <button
                  key={`${c.q}-${i}`}
                  type="button"
                  onClick={c.go}
                  className={
                    mode === "home"
                      ? "max-w-full cursor-pointer rounded-md border-[1.5px] border-pl-verde-raiz bg-pl-menta px-3.5 py-2.5 text-left font-mono text-[13px] font-medium leading-snug !text-pl-verde-raiz transition hover:bg-pl-conectar hover:!text-pl-hueso"
                      : "max-w-full cursor-pointer rounded-md border-[1.5px] border-pl-linea bg-white px-3.5 py-2.5 text-left font-mono text-[13px] font-medium leading-snug !text-pl-verde-raiz transition hover:bg-pl-menta"
                  }
                >
                  {c.q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {convUi.map(({ a, id }) => (
          <div key={id} className="flex flex-col gap-2.5">
            <div className="max-w-[80%] self-end rounded-[14px_4px_14px_14px] bg-pl-menta px-3.5 py-2.5 text-[15px]">
              {a.q as string}
            </div>
            {a.text || a.err || a.lines || a.aiNote || a.understood ? (
              <div className="flex items-start gap-2.5">
                <img
                  src={tejivaAsset("responde")}
                  alt="TEJIVA"
                  className="mt-0.5 h-8 w-8 shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-[4px_20px_20px_20px] border border-linea bg-nara-blanco px-[18px] py-4">
                  {a.understood ? (
                    <span className="font-mono text-[12px] text-[#6B7280]">{a.understood as string}</span>
                  ) : null}
                  {a.text ? <TeoRichText text={String(a.text)} /> : null}
                  {((a.lines as string[]) || []).map((l, i) => (
                    <span key={i} className="flex gap-2 text-[15px] leading-[1.45]">
                      <span className="text-nara-tinta">•</span>
                      {l}
                    </span>
                  ))}
                  {a.aiNote ? (
                    <div className="rounded-[10px] border-[1.5px] border-dashed border-pl-conectar bg-pl-menta px-3 py-2.5 text-[15px] leading-[1.45]">
                      {a.aiNote as string}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="flex items-start gap-2.5" aria-live="polite" aria-label="TEJIVA está pensando">
            <img
              src={tejivaAsset("piensa")}
              alt=""
              className="mt-0.5 h-8 w-8 shrink-0"
            />
            <div className="flex items-center gap-2.5 rounded-[4px_20px_20px_20px] border border-linea bg-nara-blanco px-4 py-3">
              <span className="font-mono text-[13px] text-[#6B7280]">Pensando</span>
              <span className="flex items-center gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nara-tinta [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nara-tinta [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nara-tinta [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        ) : null}

        {pinList.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-titulos), Montserrat, system-ui, sans-serif', fontWeight: 800, fontSize: 20 }}>
              Respuestas fijadas
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 12 }}>
              {pinList.map((p, i) =>
                p ? (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid #E3DFCF",
                      borderRadius: 20,
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontWeight: 500 }}>{p.q}</span>
                      <button type="button" onClick={p.unpin} style={moreBtnStyle}>
                        Quitar
                      </button>
                    </div>
                    <span style={{ fontSize: 14, lineHeight: 1.45 }}>{p.text}</span>
                    {p.chart}
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{p.basis} · se actualiza con los datos</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ) : null}
      </div>

      {mode === "drawer" || mode === "home" ? (
        <div
          className={`flex shrink-0 flex-col gap-2 p-3 sm:px-4 sm:py-3 ${
            mode === "drawer" ? "border-t border-linea bg-nara-blanco" : "border-t border-linea/80 pt-4"
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") void ask(input);
              }}
              placeholder={role === "inst" ? "Pregunte sobre sus casos remitidos" : "Escriba su pregunta"}
              className="h-[46px] w-full min-w-0 flex-1 rounded-[10px] border-[1.5px] border-pl-linea bg-white px-3.5 font-texto text-[15px] text-pl-verde-raiz"
            />
            <button
              type="button"
              onClick={() => void ask(input)}
              className="h-12 w-full shrink-0 cursor-pointer rounded-md border-0 bg-pl-conectar px-5 font-texto text-[15px] font-bold !text-pl-hueso transition hover:bg-[#1f6361] sm:w-auto"
            >
              Preguntar
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              const id = "handoff-" + Date.now();
              setConv((s) => [
                ...s,
                {
                  id,
                  q: TEJIVA_HANDOFF_LABEL,
                  text: TEJIVA_HANDOFF_REPLY_ES,
                  lines: [TEJIVA_HANDOFF_REPLY_ES],
                } as ConvItem,
              ]);
              onAction?.("hablar-con-alguien", { role });
            }}
            className="self-start border-0 bg-transparent p-0 font-mono text-[13px] font-medium text-pl-conectar underline underline-offset-2"
          >
            {TEJIVA_HANDOFF_LABEL}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const moreBtnStyle: CSSProperties = {
  fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
  fontSize: 14,
  padding: "9px 12px",
  border: "none",
  background: "none",
  color: "#0F2D3B",
  cursor: "pointer",
  textDecoration: "underline",
};
