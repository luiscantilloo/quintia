"use client";

import { useEffect, useState } from "react";
import { useNaraStore } from "@/providers/nara-provider";
import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";

type Conversation = {
  id: string;
  patientId?: string;
  patientName?: string;
  fecha: string;
  resumen: string;
  estadoMental: "bueno" | "malo" | "crisis";
  startedAt: number;
  messages?: { role?: string; text?: string; crisis?: boolean }[];
};

function estadoLabel(estado: Conversation["estadoMental"]) {
  if (estado === "crisis") return "Crisis";
  if (estado === "malo") return "Ánimo bajo";
  return "Estable";
}

function estadoTone(estado: Conversation["estadoMental"]) {
  if (estado === "crisis")
    return "bg-[#FDE7E4] text-[#8A1C14] border-[#E8B4B4]";
  if (estado === "malo")
    return "bg-[#E7FAF5] text-[#6B7280] border-[#E0D4A8]";
  return "bg-[#E8F0E4] text-[#3a5570] border-[#E5E0D5]";
}

function teoFace(estado: Conversation["estadoMental"]) {
  if (estado === "crisis") return "/quintia/tejiva/tejiva-base.svg";
  if (estado === "malo") return "/quintia/tejiva/tejiva-piensa.svg";
  return "/quintia/tejiva/tejiva-escucha.svg";
}

async function loadConversations(
  patientId: string,
  patientName: string,
): Promise<Conversation[]> {
  const q = new URLSearchParams();
  if (patientId) q.set("patientId", patientId);
  if (patientName) q.set("patientName", patientName);
  const res = await fetch(`/api/teo/conversations?${q}`, {
    credentials: "same-origin",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    ok?: boolean;
    conversations?: Conversation[];
  };
  if (!data.ok || !Array.isArray(data.conversations)) return [];
  return data.conversations;
}

/** Acompañante con IA (TEJIVA) — casilla + modal; datos solo desde BD. */
export function IaToolCard({ item, patientId }: HerramientaCardProps) {
  const store = useNaraStore();
  const stored = store.PATIENTS?.[patientId] as { name?: string } | undefined;
  const fromState = (store.get()?.patients || {})[patientId] as
    | { name?: string }
    | undefined;
  const patientName = String(stored?.name || fromState?.name || "").trim();
  const [rows, setRows] = useState<Conversation[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId && !patientName) {
      setRows([]);
      return;
    }
    let cancelled = false;
    const load = () => {
      setLoading(true);
      void loadConversations(patientId, patientName).then((list) => {
        if (!cancelled) {
          setRows(list);
          setLoading(false);
        }
      });
    };
    load();
    const timer = window.setInterval(load, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [patientId, patientName]);

  const crisisN = rows.filter((r) => r.estadoMental === "crisis").length;
  const maloN = rows.filter((r) => r.estadoMental === "malo").length;

  return (
    <>
      <ToolCardShell
        onClick={() => setOpen(true)}
        iconId="ia"
        title={item.name}
      >
        <span>{rows.length ? `${rows.length} chats` : "Sin chats"}</span>
      </ToolCardShell>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Acompañante con IA (TEJIVA)"
          onClick={() => {
            setOpen(false);
            setSelected(null);
          }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-linea bg-nara-crema font-texto text-nara-tinta shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="relative overflow-hidden border-b border-linea bg-nara-blanco px-5 pb-4 pt-5">
              <div
                className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-nara-amarillo/30"
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <img
                  src="/quintia/tejiva/tejiva-escucha.svg"
                  alt=""
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-titulos text-[20px] font-semibold leading-tight">
                    Acompañante con IA
                  </p>
                  <p className="m-0 mt-0.5 text-[13px] text-texto-secundario">
                    TEJIVA · {patientName || "Paciente"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSelected(null);
                  }}
                  className="relative shrink-0 rounded-full border border-linea bg-nara-blanco px-3 py-1.5 text-[13px] text-texto-secundario"
                >
                  Cerrar
                </button>
              </div>
            </header>

            {!selected ? (
              <>
                <div className="grid grid-cols-3 gap-2 px-5 py-4">
                  {[
                    {
                      k: "Conversaciones",
                      v: String(rows.length),
                      tone: "bg-nara-blanco",
                    },
                    {
                      k: "Ánimo bajo",
                      v: String(maloN),
                      tone: maloN
                        ? "bg-[#FFF8E6] border-[#E0D4A8]"
                        : "bg-nara-blanco",
                    },
                    {
                      k: "Crisis",
                      v: String(crisisN),
                      tone: crisisN
                        ? "bg-[#FDE7E4] border-[#E8B4B4]"
                        : "bg-nara-blanco",
                    },
                  ].map((s) => (
                    <div
                      key={s.k}
                      className={`rounded-2xl border border-linea px-2.5 py-2.5 text-center ${s.tone}`}
                    >
                      <p className="m-0 text-[11px] leading-tight text-texto-secundario">
                        {s.k}
                      </p>
                      <p className="m-0 mt-0.5 font-titulos text-2xl font-semibold tabular-nums">
                        {s.v}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 pb-5">
                  {loading && !rows.length ? (
                    <p className="m-0 py-8 text-center text-sm text-texto-secundario">
                      Cargando conversaciones…
                    </p>
                  ) : null}
                  {!loading && !rows.length ? (
                    <div className="rounded-[22px] border border-dashed border-linea bg-nara-blanco px-5 py-10 text-center">
                      <img
                        src="/quintia/tejiva/tejiva-base.svg"
                        alt=""
                        className="mx-auto mb-3 h-16 w-16 object-contain"
                      />
                      <p className="m-0 font-titulos text-[17px] font-semibold">
                        Aún no hay chats con TEJIVA
                      </p>
                      <p className="m-0 mt-1.5 text-[13px] leading-snug text-texto-secundario">
                        Cuando {patientName || "la persona"} converse en la app,
                        el resumen y el hilo aparecerán aquí.
                      </p>
                    </div>
                  ) : null}
                  {rows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelected(row)}
                      className="flex w-full items-start gap-3 rounded-[20px] border border-linea bg-nara-blanco px-3.5 py-3 text-left transition hover:border-nara-tinta/25 hover:bg-[#FAF8F5]"
                    >
                      <img
                        src={teoFace(row.estadoMental)}
                        alt=""
                        className="mt-0.5 h-10 w-10 shrink-0 object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <time className="text-[12px] text-texto-secundario">
                            {row.fecha}
                          </time>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${estadoTone(row.estadoMental)}`}
                          >
                            {estadoLabel(row.estadoMental)}
                          </span>
                        </div>
                        <p className="m-0 mt-1 line-clamp-2 text-[14px] leading-snug">
                          {row.resumen}
                        </p>
                        <span className="mt-1.5 inline-block text-[12px] font-medium text-nara-tinta/70">
                          Ver conversación →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-linea bg-nara-blanco px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-full border border-linea bg-nara-crema px-3 py-1 text-[13px]"
                  >
                    ← Volver
                  </button>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${estadoTone(selected.estadoMental)}`}
                  >
                    {estadoLabel(selected.estadoMental)}
                  </span>
                  <span className="ml-auto text-[12px] text-texto-secundario">
                    {selected.fecha}
                  </span>
                </div>
                <p className="m-0 border-b border-linea bg-nara-blanco px-5 py-3 text-[13px] leading-snug text-texto-secundario">
                  {selected.resumen}
                </p>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {(selected.messages || []).length ? (
                    selected.messages!.map((m, i) => {
                      const me = m.role === "paciente";
                      return (
                        <div
                          key={i}
                          className={`flex gap-2 ${me ? "justify-end" : "justify-start"}`}
                        >
                          {!me ? (
                            <img
                              src={
                                m.crisis
                                  ? "/quintia/tejiva/tejiva-base.svg"
                                  : "/quintia/tejiva/tejiva-escucha.svg"
                              }
                              alt=""
                              className="mt-1 h-8 w-8 shrink-0 object-contain"
                            />
                          ) : null}
                          <div
                            className={`max-w-[82%] px-3.5 py-2.5 text-[14px] leading-snug ${
                              me
                                ? "rounded-[18px] rounded-br-md bg-nara-tinta text-nara-blanco"
                                : m.crisis
                                  ? "rounded-[18px] rounded-bl-md border border-[#E8B4B4] bg-[#FDE7E4] text-nara-tinta"
                                  : "rounded-[18px] rounded-bl-md border border-linea bg-nara-blanco text-nara-tinta"
                            }`}
                          >
                            {!me ? (
                              <span className="mb-1 block text-[11px] font-medium text-texto-secundario">
                                TEJIVA
                              </span>
                            ) : null}
                            {m.text}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="m-0 py-6 text-center text-sm text-texto-secundario">
                      No hay mensajes guardados en este chat.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
