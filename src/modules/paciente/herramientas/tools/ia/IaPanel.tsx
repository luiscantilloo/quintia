"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import AlientoAI from "@/lib/ai/ai";
import { redactTextForTeo } from "@/lib/ai/redactForTeo";
import { logIntegration } from "@/lib/observability/integration-log";
import { BreathExercise } from "@/modules/paciente/app/BreathExercise";
import { tejivaAsset } from "@/lib/brand";
import { useNaraStore } from "@/providers/nara-provider";

type Turn = { role: "paciente" | "teo"; text: string; crisis?: boolean };

type ChatVm = {
  patientId?: string;
  patientName?: string;
  firstName?: string;
  chatMsgs: {
    ai?: boolean;
    me?: boolean;
    crisis?: boolean;
    breath?: boolean;
    text?: string;
    avatar?: string;
  }[];
  dianaLines: { label: string; tel: string; sub: string; bg: string; fg: string }[];
  onBreathDone: () => void;
  typing: boolean;
  quick: { label: string; go: () => void }[];
  paused: boolean;
  notPaused: boolean;
  input: string;
  setInput: (value: string) => void;
  sendDiana: () => void;
  resetTeoChat?: () => void;
};

function btnFont(): CSSProperties {
  return { fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif' };
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mentionsBreath(text: string) {
  return /respir/i.test(text);
}

/** Misma lectura que el webhook de TEJIVA: respuesta, text, output o message. */
function readN8nRespuesta(raw: string) {
  try {
    const data = JSON.parse(raw) as Record<string, unknown> | Array<Record<string, unknown>>;
    const obj = Array.isArray(data) ? data[0] : data;
    return String(obj?.respuesta || obj?.text || obj?.output || obj?.message || "").trim();
  } catch {
    return raw.trim();
  }
}

function turnsFromChat(msgs: ChatVm["chatMsgs"]): Turn[] {
  const turns: Turn[] = [];
  for (const m of msgs) {
    const text = String(m.text || "").trim();
    if (!text) continue;
    if (m.me) turns.push({ role: "paciente", text });
    else if (m.ai || m.crisis) turns.push({ role: "teo", text, ...(m.crisis ? { crisis: true } : {}) });
  }
  return turns;
}

/** TEJIVA (IA) — el chat que antes vivía en DianaChat. */
export function IaPanel({ vm }: { vm: ChatVm }) {
  const store = useNaraStore();
  const [conversationId, setConversationId] = useState(newId);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [thread, setThread] = useState<Turn[] | null>(null);
  const [sending, setSending] = useState(false);
  const [localPaused, setLocalPaused] = useState(false);

  function patientContext() {
    const id = String(vm.patientId || "");
    const row = (store.PATIENTS?.[id] ||
      store.emptyPatient?.(id, vm.firstName || "Paciente", 0) ||
      {}) as {
      name?: string;
      place?: string;
      profile?: string;
      age?: string | number;
      phone?: string;
    };
    const name = String(row.name || vm.patientName || vm.firstName || "Paciente");
    return {
      id,
      name,
      fname: name.split(/\s+/)[0] || "Paciente",
      place: String(row.place || "Quindío").split(",")[0],
      profile: row.profile || "P01",
      age: row.age || "",
      phone: row.phone || "",
    };
  }

  async function saveConversation(messages: Turn[], close = false) {
    if (!messages.some((m) => m.role === "paciente")) return;
    const ctx = patientContext();
    const flujo = messages.some(
      (m) => m.role === "teo" && mentionsBreath(m.text),
    );
    // Solo BD (colección Mongo `conversacion`). Sin localStorage.
    try {
      await fetch("/api/teo/conversations", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: conversationId,
          patientId: ctx.id,
          patientName: ctx.name,
          startedAt,
          close,
          flujoRespiracion: flujo,
          messages,
        }),
      });
    } catch {
      /* reintento en el próximo mensaje */
    }
  }

  async function askN8n(text: string, prior: Turn[]) {
    const ctx = patientContext();
    // Punto 5 · T4: el navegador no llama a n8n ni envía nombre/edad/lugar ni secretos.
    // Solo código de perfil + textos limpios vía /api/teo/chat (la API añade x-nara-secret a n8n).
    const history = redactTextForTeo(
      prior
        .slice(-8)
        .map((m) => `${m.role === "teo" ? "TEJIVA" : "Paciente"}: ${m.text}`)
        .join("\n"),
    );
    const message = redactTextForTeo(text.trim());
    const payload = {
      message,
      chatInput: message,
      history,
      profile: ctx.profile || "P01",
    };

    try {
      const started = Date.now();
      const res = await fetch("/api/teo/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      const reply = readN8nRespuesta(raw);
      if (res.ok && reply && !/^\{/.test(reply)) {
        logIntegration({
          service: "n8n",
          ok: true,
          ms: Date.now() - started,
          status: res.status,
          op: "teo.chat",
        });
        return reply;
      }
      if (res.ok) {
        const data = JSON.parse(raw) as { ok?: boolean; text?: string };
        if (data.ok && data.text?.trim()) {
          logIntegration({
            service: "n8n",
            ok: true,
            ms: Date.now() - started,
            status: res.status,
            op: "teo.chat",
          });
          return data.text.trim();
        }
      }
      logIntegration({
        service: "n8n",
        ok: false,
        ms: Date.now() - started,
        status: res.status,
        detail: res.ok ? "empty" : "http_error",
        op: "teo.chat",
      });
    } catch {
      logIntegration({
        service: "n8n",
        ok: false,
        ms: 0,
        detail: "network",
        op: "teo.chat",
      });
      /* n8n / gateway no disponible */
    }

    try {
      const out = await AlientoAI.complete(
        `Eres TEJIVA, acompañante con IA de QUINTIA, un programa de acompañamiento para personas mayores en Colombia. Hablas con una persona del programa (perfil ${ctx.profile || "P01"}). Trátala de usted, con calidez, frases cortas y palabras sencillas, sin jerga clínica. No das diagnósticos ni reemplazas a su psicóloga. Puedes ofrecer la respiración 4-6, anotar un tema para la sesión o recomendar un video. Voz de TEJIVA: escucha primero, valida y ofrece una sola cosa concreta. Una sola pregunta por mensaje. Nunca diagnostiques, recetes, hables de medicamentos ni contradigas a la psicóloga. Nunca minimices («no es para tanto»), culpes («debería»), prometas («se va a sentir mejor») ni finjas ser humano o sentir emociones. Sin chistes; en temas de miedo, sueño o respiración, frases lentas y sin signos de exclamación. Si detectas cualquier señal de riesgo suicida o peligro inmediato, responde solo con la palabra CRISIS. Responde en máximo 3 frases.\n\n${history}\nPaciente: ${message}\nTEJIVA:`,
      );
      const reply = String(out || "").trim();
      if (reply) return reply;
    } catch {
      /* respuesta local */
    }
    return AlientoAI.companion(text, false) || "Gracias por escribir. ¿Quiere contarme un poco más de cómo se ha sentido?";
  }

  async function send() {
    const text = vm.input.trim();
    if (!text || sending || vm.paused || localPaused) return;
    vm.setInput("");
    setSending(true);
    const base = thread ?? turnsFromChat(vm.chatMsgs);
    const withPatient: Turn[] = [...base, { role: "paciente", text }];
    setThread(withPatient);
    const ctx = patientContext();
    const crisisHit = store.crisisCheck?.(text);
    let teoText = "";
    let crisis = false;
    if (crisisHit) {
      crisis = true;
      teoText = AlientoAI.crisisText(ctx.fname);
      store.addAlert?.({
        id: "a-" + ctx.id,
        sev: "crisis",
        pid: ctx.id,
        name: ctx.name,
        age: ctx.age,
        place: ctx.place,
        profile: ctx.profile,
        what: `Escribió a TEJIVA: «${text}». TEJIVA pausó la conversación y levantó la alerta.`,
        term: crisisHit,
        source: "Conversación con TEJIVA (IA)",
        phone: ctx.phone,
      });
    } else {
      const reply = await askN8n(text, base);
      crisis = /^\s*CRISIS/.test(reply);
      teoText = crisis ? AlientoAI.crisisText(ctx.fname) : reply;
      if (!crisis) store.logAi?.(ctx.id, "Chat con TEJIVA", teoText);
    }
    if (crisis) setLocalPaused(true);
    const full: Turn[] = [...withPatient, { role: "teo", text: teoText, ...(crisis ? { crisis: true } : {}) }];
    setThread(full);
    setSending(false);
    await saveConversation(full);
  }

  async function startNew() {
    const current = thread ?? turnsFromChat(vm.chatMsgs);
    if (current.some((m) => m.role === "paciente")) await saveConversation(current, true);
    setConversationId(newId());
    setStartedAt(Date.now());
    setThread(null);
    setLocalPaused(false);
    vm.setInput("");
    vm.resetTeoChat?.();
  }

  const shown = (thread ?? vm.chatMsgs.map((m) => ({ ...m }))).map((m) => {
    if ("role" in m) {
      const turn = m as Turn;
      return {
        ai: turn.role === "teo" && !turn.crisis,
        me: turn.role === "paciente",
        crisis: !!turn.crisis,
        breath: false,
        text: turn.text,
        avatar: tejivaAsset(
          turn.crisis || mentionsBreath(turn.text) ? "base" : "escucha",
        ),
      };
    }
    return m;
  });
  const breathOn = (thread || []).some((m) => m.role === "teo" && mentionsBreath(m.text));

  const canSend = !!vm.input.trim() && !sending && !vm.paused && !localPaused;

  return (
    <div className="flex min-h-full flex-col font-texto [animation:naraTab_.22s_ease-out]">
      <div className="sticky top-0 z-20 flex items-center justify-end bg-nara-crema/95 px-3.5 py-2 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => void startNew()}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-linea bg-nara-blanco px-3 font-texto text-[13px] font-medium text-nara-tinta shadow-sm transition hover:border-nara-tinta/30 active:scale-[0.98]"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        {shown.map((m, i) => (
          <div key={i}>
            {m.ai ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "90%", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <img src={m.avatar} alt="" style={{ flex: "none", width: 36, height: 36, display: "block", marginTop: 18 }} />
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", display: "flex", gap: 6, alignItems: "center" }}>
                    TEJIVA <span style={{ fontSize: 11, fontWeight: 500, border: "1px solid #6B7280", borderRadius: 4, padding: "0 4px" }}>IA</span>
                  </span>
                  <div style={{ background: "#fff", border: "1px solid #E5E0D5", borderRadius: "4px 18px 18px 18px", padding: "11px 14px", lineHeight: 1.45 }}>{m.text}</div>
                </div>
              </div>
            ) : null}
            {m.me ? (
              <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "#0F2D3B", color: "#fff", borderRadius: "18px 4px 18px 18px", padding: "11px 14px", lineHeight: 1.45, marginLeft: "auto" }}>{m.text}</div>
            ) : null}
            {m.crisis ? (
              <div style={{ alignSelf: "stretch", background: "#FDE7E4", border: "1.5px solid #B42318", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "#8A1C14" }}>
                  <img src={tejivaAsset("base")} alt="" style={{ width: 36, height: 36, display: "block" }} />
                  TEJIVA · IA · mensaje de cuidado
                </span>
                <span style={{ lineHeight: 1.45 }}>{m.text}</span>
                {vm.dianaLines.map((cl) => (
                  <a key={cl.label} href={cl.tel} style={{ minHeight: 52, padding: "4px 14px", boxSizing: "border-box", borderRadius: 26, border: "2px solid #B42318", background: cl.bg, color: cl.fg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 16, textAlign: "center", textDecoration: "none" }}>
                    <span>{cl.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 400 }}>{cl.sub}</span>
                  </a>
                ))}
              </div>
            ) : null}
            {m.breath ? (
              <div style={{ alignSelf: "stretch", background: "#fff", border: "1px solid #E5E0D5", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <BreathExercise onDone={vm.onBreathDone} />
              </div>
            ) : null}
          </div>
        ))}
        {breathOn ? (
          <div style={{ alignSelf: "stretch", background: "#fff", border: "1px solid #E5E0D5", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <BreathExercise />
          </div>
        ) : null}
        {sending || vm.typing ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6B7280" }}>
            <img src={tejivaAsset("piensa")} alt="" style={{ width: 32, height: 32, display: "block" }} />
            TEJIVA está escribiendo…
          </span>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          {vm.quick.map((q) => (
            <button key={q.label} type="button" onClick={q.go} style={{ ...btnFont(), fontSize: 16, minHeight: 48, padding: "0 16px", borderRadius: 22, border: "1.5px solid #0F2D3B", background: "#fff", color: "#0F2D3B", cursor: "pointer" }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      {vm.paused || localPaused ? (
        <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #E5E0D5", padding: 14, textAlign: "center", fontWeight: 500, fontSize: 16 }}>
          Conversación en pausa · el equipo la llamará
        </div>
      ) : null}
      {vm.notPaused && !localPaused ? (
        <div className="sticky bottom-0 border-t border-[#E5E0D5] bg-[#F7F5EF] px-3 py-2.5">
          <div className="pl-composer font-texto">
            <input
              value={vm.input}
              onChange={(e) => vm.setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send()}
              placeholder="Escríbale a TEJIVA"
              aria-label="Escríbale a TEJIVA"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
              aria-label="Enviar"
              className={`pl-composer__send ${canSend ? "pl-composer__send--on" : "pl-composer__send--off"}`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M3.4 20.4 21 12 3.4 3.6 3 10.1l12.1 1.9L3 13.9l.4 6.5z" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
