"use client";

import AlientoAI from "@/lib/ai/ai";
import { redactTextForTeo } from "@/lib/ai/redactForTeo";
import {
  DEFAULT_INACTIVE_MINUTES,
  inactivityThresholdMs,
} from "@/lib/clinical/patientStates";
import { flushPersist, flushPersistWhenReady } from "@/lib/store/persist";
import { pauseLiveHydrate } from "@/lib/store/hydrateProgram";
import { LIVE_PACIENTE, useLiveProgramSync } from "@/lib/store/liveSync";
import { putAppStateOrQueue } from "@/lib/offline/sync-queue";
import { apiFetch } from "@/lib/api/client";
import {
  crisisLocUntil,
  type CrisisLoc,
} from "@/lib/crisis/crisisLocation";
import { useRouteLoading } from "@/components/shared/nara-loading/RouteLoadingProvider";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  pacientePathForTab,
  pacienteTabForPath,
  type PacienteTab,
} from "@/modules/paciente/routes";
import { DEFAULT_PATIENT_MODULES } from "@/lib/db/patientModules";
import {
  PACIENTE_HERRAMIENTAS,
  activePacienteHerramientas,
  isPacienteHerramientaDisabled,
} from "@/modules/paciente/herramientas";
import { naraAsset } from "./naraAsset";

/** Respaldo local del consentimiento de la app (P-01): sobrevive logout aunque el PUT tarde. */
const APP_CONSENT_LS = "consiente:app-consent:";

function readAppConsentBackup(keys: string[]): number | null {
  if (typeof window === "undefined") return null;
  try {
    for (const k of keys) {
      if (!k) continue;
      const raw = window.localStorage.getItem(APP_CONSENT_LS + k);
      const at = Number(raw || 0);
      if (Number.isFinite(at) && at > 0) return at;
    }
  } catch {
    /* private mode */
  }
  return null;
}

function writeAppConsentBackup(keys: string[], at: number) {
  if (typeof window === "undefined" || !(at > 0)) return;
  try {
    for (const k of keys) {
      if (!k) continue;
      window.localStorage.setItem(APP_CONSENT_LS + k, String(at));
    }
  } catch {
    /* private mode */
  }
}

type Tab = PacienteTab | "tech" | "revisit";
type ChatMsg = { t: "ai" | "me" | "crisis" | "breath"; text?: string };
type WaRaw = Record<string, unknown>;

type PlState = { id: string; prog: number; playing: boolean; done: boolean };

const MOODS = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"];
/** Colores suaves por nivel (1=muy mal … 5=muy bien) */
const MOOD_TINTS = [
  { bd: "#E8A0A0", bg: "#FCE8E8", bgOn: "#F5C4C4" },
  { bd: "#E0B080", bg: "#FCF0E4", bgOn: "#F5D9B8" },
  { bd: "#C4BDB3", bg: "#F5F2EC", bgOn: "#31C6E6" },
  { bd: "#7eb8da", bg: "#e8f1f8", bgOn: "#E5E0D5" },
  { bd: "#D4B820", bg: "#FFF8D6", bgOn: "#31C6E6" },
] as const;

type MoodFace = "calma" | "curiosidad" | "energia" | "duda";
type MoodStep = "idle" | "ack" | "why" | "care" | "breath" | "done";
type MoodBubble = { who: "teo" | "me"; text: string };

const MOOD_WHY_LOW = [
  "El miedo o las réplicas",
  "No pude dormir",
  "Me siento sola o triste",
  "Duele el cuerpo o la cabeza",
  "Prefiero no decir",
];
const MOOD_WHY_MID = [
  "Ando cansada",
  "Hay preocupación en casa",
  "Un día normal, sin más",
  "Prefiero no decir",
];
const MOOD_WHY_HIGH = [
  "Dormí un poco mejor",
  "Me ayudó hablar con alguien",
  "Hoy el cuerpo está más calmo",
  "Solo quería marcarlo",
];

function moodAck(level: number, fname: string): { text: string; face: MoodFace; whyPrompt: string; whys: string[] } {
  const name = fname || "usted";
  if (level <= 0) {
    return {
      text: `${name}, gracias por decirlo con sinceridad. Estar muy mal no es un fallo: es una señal de que necesita cuidado. No tiene que cargar con esto sola.`,
      face: "calma",
      whyPrompt: "Si quiere, digame qué le pesa más ahora. Una sola cosa basta.",
      whys: MOOD_WHY_LOW,
    };
  }
  if (level === 1) {
    return {
      text: `Gracias por marcarlo, ${name}. Un día «mal» también cuenta. El cuerpo a veces se queda en alerta después de un susto o una noche difícil.`,
      face: "calma",
      whyPrompt: "¿Qué le está costando más hoy?",
      whys: MOOD_WHY_LOW,
    };
  }
  if (level === 2) {
    return {
      text: `Quedó registrado: regular. Un día así también merece una mirada amable, ${name}.`,
      face: "curiosidad",
      whyPrompt: "¿Qué describe mejor cómo va el día?",
      whys: MOOD_WHY_MID,
    };
  }
  if (level === 3) {
    return {
      text: `Qué bien que hoy esté bien, ${name}. Eso también es parte del camino.`,
      face: "energia",
      whyPrompt: "Si quiere, cuénteme qué le está ayudando.",
      whys: MOOD_WHY_HIGH,
    };
  }
  return {
    text: `Hoy se siente muy bien. Me alegra registrarlo con usted, ${name}.`,
    face: "energia",
    whyPrompt: "¿Qué le está funcionando hoy?",
    whys: MOOD_WHY_HIGH,
  };
}

function moodCareReply(level: number, why: string): { text: string; face: MoodFace } {
  if (/Prefiero no decir|Solo quería/i.test(why)) {
    return {
      text: "Está bien no decir más. Ya quedó en su seguimiento. Si quiere, podemos hacer una respiración corta de 2 minutos para bajar un poco la carga.",
      face: "calma",
    };
  }
  if (/miedo|réplica/i.test(why)) {
    return {
      text: "Después de un sismo el miedo puede volver con una réplica pequeña. No quiere decir que esté retrocediendo. Una respiración lenta ayuda al cuerpo a bajar la alerta.",
      face: "calma",
    };
  }
  if (/dormir|cansad/i.test(why)) {
    return {
      text: "Dormir mal cansa el ánimo y el cuerpo. Una pausa de respiración ahora no arregla la noche, pero puede dar un respiro pequeño.",
      face: "curiosidad",
    };
  }
  if (/sola|triste/i.test(why)) {
    return {
      text: "Sentirse sola o triste pesa. No tiene que resolverlo todo hoy. Si la angustia es muy fuerte, use Ayuda arriba. Si prefiere, respiramos juntas un momento.",
      face: "calma",
    };
  }
  if (/Duele|cuerpo|cabeza/i.test(why)) {
    return {
      text: "Cuando el cuerpo duele, el ánimo también se apaga. Vamos despacio: una respiración corta puede aflojar un poco la tensión.",
      face: "calma",
    };
  }
  if (/preocup|casa/i.test(why)) {
    return {
      text: "La casa y lo de todos los días pesan. Está bien nombrarlo. ¿Probamos una respiración de 2 minutos para no cargar todo a la vez?",
      face: "duda",
    };
  }
  if (/normal|sin más/i.test(why)) {
    return {
      text: "Un día normal también cuenta. Si quiere cuidar ese equilibrio, una respiración corta puede ayudar.",
      face: "curiosidad",
    };
  }
  if (/Dormí|hablar|calmo|funcionando/i.test(why)) {
    return {
      text: "Gracias por compartirlo. Vale la pena notar lo que ayuda. Si quiere, cerramos con una respiración suave para cuidar ese buen momento.",
      face: level >= 3 ? "energia" : "curiosidad",
    };
  }
  if (level <= 1) {
    return {
      text: "Gracias por contármelo. Estoy con usted en esto. Podemos respirar un momento, o si lo necesita ya, use el botón Ayuda.",
      face: "calma",
    };
  }
  return {
    text: "Gracias por contármelo. ¿Quiere una respiración corta o dejamos el check-in hasta aquí?",
    face: "curiosidad",
  };
}

function moodChatSeed(level: number, fname: string, why?: string) {
  const ack = moodAck(level, fname);
  const care = why ? moodCareReply(level, why).text : ack.text;
  return {
    chat: why
      ? `Registró «${MOODS[level]}» y me contó: ${why}. ${care}`
      : ack.text + " " + ack.whyPrompt,
    chatChips:
      level <= 1
        ? ["Sí, respiremos", "Quiero escribirle", "Ahora no"]
        : ["Sí, respiremos", "Contarle un poco más", "Por ahora está bien"],
    face: ack.face,
  };
}

const WA_BAR_H = [40, 70, 55, 90, 60, 35, 80, 65, 45, 95, 70, 50, 30, 75, 85, 55, 40, 65, 90, 50, 35, 60];
const CL = [
  ["contacto", "Contacto por teléfono o WhatsApp"],
  ["remision", "Compartir mi caso con una institución si me remiten"],
  ["investigacion", "Uso anónimo para investigación"],
  [
    "analizador",
    "Que mi desempeño en juegos alimente el analizador (solo mi clínico lo ve)",
  ],
] as const;

const fmt = (x: number) =>
  `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function hm() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Lee crisisAttendedAt aunque venga como string / Long. */
function readAttendedAt(v: unknown): number | null {
  if (v == null || v === false) return null;
  if (typeof v === "object" && v && "$numberLong" in (v as object)) {
    const n = Number((v as { $numberLong: string }).$numberLong);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Ficha canónica: por id, accountId o sesión (evita perder «estoy bien»). */
function resolvePatientRow(
  store: { get: () => any; PATIENTS: Record<string, any>; session: () => any },
  localId: string,
) {
  const S = store.get();
  const map = { ...(S.patients || {}), ...(store.PATIENTS || {}) } as Record<
    string,
    Record<string, unknown>
  >;
  const sess = store.session() as {
    id?: string;
    patientId?: string;
    email?: string;
  } | null;
  const hit =
    map[localId] ||
    (sess?.patientId && map[sess.patientId]) ||
    Object.values(map).find(
      (p) =>
        p &&
        (p.id === localId ||
          p.accountId === localId ||
          p.accountId === sess?.id ||
          (sess?.email && p.email === sess.email)),
    ) ||
    null;
  return {
    P: (hit || {}) as Record<string, unknown>,
    id: String(hit?.id || sess?.patientId || localId || ""),
    accountId: String(hit?.accountId || sess?.id || ""),
  };
}

function crisisWasAttended(
  S: {
    alerts?: Array<{ sev?: string; pid?: string; status?: string; id?: string }>;
    closedToday?: Array<{
      sev?: string;
      pid?: string;
      id?: string;
      outcome?: string;
      status?: string;
      patientConfirmedAt?: number | null;
    }>;
  },
  ids: string[],
  P: Record<string, unknown>,
) {
  const idSet = new Set(ids.filter(Boolean).map(String));
  const matchesPid = (pid?: string, id?: string) =>
    (pid && idSet.has(String(pid))) ||
    ids.some(
      (x) =>
        String(id || "").startsWith("a-" + x + "-crisis-btn") ||
        String(id || "").startsWith("a-" + x + "-crisis-cuid"),
    );

  // Fuente de verdad: clínico ya gestionó → awaiting «estoy bien».
  // Va ANTES que stillOpen: una alerta local stale no debe tapar el botón.
  const awaiting = (S.closedToday || []).some(
    (c) =>
      c.sev === "crisis" &&
      !c.patientConfirmedAt &&
      c.status === "awaiting_patient" &&
      !!c.outcome &&
      c.outcome !== "Vista" &&
      (matchesPid(c.pid, c.id) || (c.pid && idSet.has(String(c.pid)))),
  );
  if (awaiting) return true;

  // Si aún hay crisis activa en cola (por tomar / en atención), el clínico no ha cerrado.
  const stillOpen = (S.alerts || []).some(
    (a) =>
      a.sev === "crisis" &&
      matchesPid(a.pid, a.id) &&
      (a.status === "new" ||
        a.status === "mine" ||
        a.status === "retry" ||
        a.status === "other"),
  );
  if (stillOpen) return false;

  // Respaldo: flag en ficha solo si no hay cola abierta.
  return !!readAttendedAt(P.crisisAttendedAt);
}

const WELL_LS_PREFIX = "nara:well-confirmed:";

function rememberWellConfirmed(pid: string) {
  if (typeof window === "undefined" || !pid) return;
  try {
    window.sessionStorage.setItem(
      WELL_LS_PREFIX + pid,
      String(Date.now() + 24 * 60 * 60 * 1000),
    );
  } catch {
    /* private mode */
  }
}

function readWellConfirmed(ids: string[]): string | null {
  if (typeof window === "undefined") return null;
  const now = Date.now();
  for (const id of ids) {
    if (!id) continue;
    try {
      const raw = window.sessionStorage.getItem(WELL_LS_PREFIX + id);
      if (!raw) continue;
      const until = Number(raw);
      if (Number.isFinite(until) && now < until) return id;
      window.sessionStorage.removeItem(WELL_LS_PREFIX + id);
    } catch {
      /* ignore */
    }
  }
  return null;
}

function clearWellConfirmed(ids: string[]) {
  if (typeof window === "undefined") return;
  for (const id of ids) {
    if (!id) continue;
    try {
      window.sessionStorage.removeItem(WELL_LS_PREFIX + id);
    } catch {
      /* ignore */
    }
  }
}

function isWellConfirmedLocal(
  ids: string[],
  ref: { pid: string; until: number } | null,
) {
  if (ref && Date.now() < ref.until && ids.some((x) => x === ref.pid)) {
    return true;
  }
  return !!readWellConfirmed(ids);
}

export function usePacienteScreen() {
  const store = useNaraStore();
  useNaraLive();
  const router = useRouter();
  const pathname = usePathname();
  const { start: startRouteLoading } = useRouteLoading();
  const S = store.get();
  const C = store.C;
  const R = store.REC;

  const [ready, setReady] = useState(false);
  const [who, setWho] = useState("p-rosa-elena");
  const [tab, setTabRaw] = useState<Tab>(() =>
    pacienteTabForPath(pathname || "/paciente"),
  );
  const pendingTabPathRef = useRef<string | null>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const setTab = useCallback(
    (next: Tab | ((t: Tab) => Tab)) => {
      const prev = tabRef.current;
      const value = typeof next === "function" ? next(prev) : next;
      const path = pacientePathForTab(value);
      if (path !== pathname) {
        // Loading primero; luego cambia la pestaña (no al revés).
        startRouteLoading();
        pendingTabPathRef.current = path;
      }
      if (value !== prev) setTabRaw(value);
    },
    [pathname, startRouteLoading],
  );

  useEffect(() => {
    const path = pendingTabPathRef.current;
    if (!path) return;
    pendingTabPathRef.current = null;
    if (path !== pathname) router.push(path);
  }, [tab, pathname, router]);

  useEffect(() => {
    // No pisar pendiente/plan (lifecycle fuera de tabs).
    if (
      pathname?.startsWith("/paciente/pendiente") ||
      pathname?.startsWith("/paciente/plan")
    ) {
      return;
    }
    const fromUrl = pacienteTabForPath(pathname || "/paciente");
    setTabRaw((prev) => (prev === fromUrl ? prev : fromUrl));
  }, [pathname]);

  // SYN: vaciar cola de partidas offline al recuperar señal.
  useEffect(() => {
    const flush = () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      void import("@/lib/nara-services/analizador").then((m) => {
        const n = m.flushPartidasPendientes(store);
        if (n > 0) void flushPersist(store);
      });
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [store]);
  const [topics, setTopics] = useState<[string, boolean][]>([
    ["El miedo con las réplicas pequeñas", true],
    ["Preocupación por la casa", true],
    ["Cómo está durmiendo", true],
  ]);
  const [topicInput, setTopicInput] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [moodStep, setMoodStep] = useState<MoodStep>("idle");
  const [moodThread, setMoodThread] = useState<MoodBubble[]>([]);
  const [moodChoices, setMoodChoices] = useState<string[]>([]);
  const [moodFace, setMoodFace] = useState<MoodFace>("curiosidad");
  const [moodPulse, setMoodPulse] = useState(false);
  const [moodWhy, setMoodWhy] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [stage, setStage] = useState("open");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [helpSent, setHelpSent] = useState(false);
  // Poll frecuente: crisis del cuidador / clínico debe pintar la roja sin esperar 15s.
  useLiveProgramSync({
    parts: LIVE_PACIENTE,
    intervalMs: help || helpSent ? 3_000 : 5_000,
  });
  /** idle | asking | sharing | denied | unavailable */
  const [locShare, setLocShare] = useState<
    "idle" | "asking" | "sharing" | "denied" | "unavailable"
  >("idle");
  const pendingLocRef = useRef<CrisisLoc | null>(null);
  const locWatchRef = useRef<number | null>(null);
  const lastLocFlushRef = useRef(0);
  const [consentMsg, setConsentMsg] = useState("");
  /** Evita que el poll vuelva a mostrar «Antes de empezar» tras aceptar en esta sesión. */
  const [appConsentAccepted, setAppConsentAccepted] = useState(false);
  const [wa, setWa] = useState<WaRaw[]>([]);
  const [waQuick, setWaQuick] = useState<string[]>([]);
  const [waStage, setWaStage] = useState("none");
  const [waInput, setWaInput] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [prog, setProg] = useState<Record<string, number>>({});
  const [splash, setSplash] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [pl, setPl] = useState<PlState | null>(null);
  const [libTab, setLibTab] = useState("videos");
  const [libQ, setLibQ] = useState("");
  const [libTema, setLibTema] = useState("");
  const [waAsked, setWaAsked] = useState<Record<string, string>>({});
  const [framed, setFramed] = useState(false);
  const [devZoom, setDevZoom] = useState(1);

  const bodyRef = useRef<HTMLDivElement>(null);
  const waRef = useRef<HTMLDivElement>(null);
  const inboxNRef = useRef(0);
  const waReadyRef = useRef(false);
  const plRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wpRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerKeyRef = useRef<string | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appInitedRef = useRef(false);
  const pidRef = useRef(who);
  /** Cuenta con la que se resolvió `who` (H-001). */
  const cuentaRef = useRef("");
  /** Evita spam de «estoy bien» y reabrir la pantalla roja por sync obsoleto. */
  const confirmWellBusyRef = useRef(false);
  const wellConfirmedRef = useRef<{ pid: string; until: number } | null>(null);
  const [confirmWellBusy, setConfirmWellBusy] = useState(false);
  /** Pantalla amarilla de inactividad (bloqueo hasta «Volví»). */
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [confirmBackBusy, setConfirmBackBusy] = useState(false);
  const confirmBackBusyRef = useRef(false);
  const backConfirmedRef = useRef<{ pid: string; until: number } | null>(null);
  const lastActivityRef = useRef(Date.now());
  const enteringInactiveRef = useRef(false);

  const isRosalba = who === "rosalba";
  const isDiana = !isRosalba; // UI app TEJIVA (Diana o Rosa); Rosalba = WhatsApp
  const pid = who;
  pidRef.current = pid;
  const sessionNow = store.session() as {
    id?: string;
    name?: string;
    email?: string;
    roleId?: string;
  } | null;
  const patientsMap = (store.get().patients || store.PATIENTS || {}) as Record<
    string,
    Record<string, unknown>
  >;
  const resolvedPatient =
    patientsMap[pid] ||
    Object.values(patientsMap).find(
      (p) =>
        p &&
        (p.accountId === pid ||
          p.accountId === sessionNow?.id ||
          (sessionNow?.email && p.email === sessionNow.email) ||
          p.id === pid),
    ) ||
    null;
  const DP =
    resolvedPatient ||
    store.PATIENTS[pid] ||
    store.emptyPatient(pid, sessionNow?.name || "Paciente", 0);
  const firstName = String(DP.name || "Paciente").split(/\s+/)[0] || "Paciente";
  // El consentimiento se guarda con patientId de sesión (la API solo acepta esa clave).
  const consKey = String(
    (sessionNow as { patientId?: string } | null)?.patientId ||
      DP.id ||
      pid,
  );
  const consentAliasKeys = Array.from(
    new Set(
      [
        consKey,
        pid,
        sessionNow?.id,
        (sessionNow as { patientId?: string } | null)?.patientId,
        DP.id,
        DP.accountId,
      ]
        .filter(Boolean)
        .map(String),
    ),
  );
  const cons =
    consentAliasKeys
      .map((k) => (S.consents && S.consents[k]) || null)
      .find((c) => c && typeof c === "object") || {};

  const recP = useCallback(() => {
    const st = store.get();
    const id = pidRef.current;
    return st.recursos?.people?.[id] ?? null;
  }, [store]);

  const teoSay = useCallback(
    (text: string) => {
      store.logAi(pidRef.current, "Chat con TEJIVA", text);
      setMsgs((m) => m.concat([{ t: "ai", text }]));
    },
    [store],
  );

  const me = useCallback((text: string) => {
    setMsgs((m) => m.concat([{ t: "me", text }]));
    setQuick([]);
  }, []);

  const ai = useCallback(
    (text: string, q?: string[], extra?: ChatMsg[]) => {
      store.logAi(pidRef.current, "Chat con TEJIVA", text);
      setTyping(true);
      setQuick([]);
      setTimeout(() => {
        setTyping(false);
        setMsgs((m) => m.concat([{ t: "ai", text }], extra || []));
        if (q) setQuick(q);
      }, 800);
    },
    [store],
  );

  // H-001 (SPEC-001): el servidor escala la crisis (alerta, crisisLog y estado Crisis con el patientId de la
  // sesión). La pantalla promete la llamada solo cuando el servidor lo confirma; si no, muestra las líneas de
  // emergencia, reintenta y deja la alerta local como respaldo.
  const crisisDiana = useCallback(
    async (term: string, said: string, delServidor?: { escalada?: boolean; text?: string }) => {
      const id = pidRef.current;
      const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
      const fname = String(P.name || "Paciente").split(/\s+/)[0];
      setTyping(false);
      setPaused(true);
      setQuick([]);
      let r = delServidor;
      for (let i = 0; !r?.escalada && i < 3; i++) {
        if (i) await new Promise((ok) => setTimeout(ok, 4000));
        try {
          const res = await fetch("/api/teo/chat", {
            method: "POST",
            credentials: "same-origin",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              message: said || term,
              profile: P.profile || "P01",
            }),
          });
          const data = (await res.json()) as { crisis?: boolean; escalada?: boolean; text?: string };
          if (res.ok && data.crisis) r = data;
        } catch {
          /* sin conexión: se reintenta */
        }
      }
      const lineas = `${fname}, gracias por contármelo. Lo que siente es importante. Si está en peligro ahora, llame al 123. Si necesita hablar con alguien, marque la Línea 192, opción 4.`;
      setMsgs((m) => m.concat([{ t: "crisis", text: r?.escalada ? r.text || AlientoAI.crisisText(fname) : lineas }]));
      store.set((s) => {
        s.diana = s.diana || { crisis: false };
        if (id === "diana") s.diana.crisis = true;
      });
      if (r?.escalada) return;
      store.addAlert({
        id: "a-" + id,
        sev: "crisis",
        pid: id,
        name: P.name,
        age: P.age,
        place: (P.place || "").split(",")[0] || P.place,
        profile: P.profile || "P05",
        what:
          (said ? `Escribió a TEJIVA: «${said}». ` : "TEJIVA detectó riesgo en la conversación. ") +
          "TEJIVA le dio la línea 123, pausó la conversación y levantó la alerta.",
        term: term || "clasificador IA",
        source: "Conversación con TEJIVA (IA)",
        phone: P.phone || "",
      });
    },
    [store],
  );

  const initDiana = useCallback(() => {
    const st = store.get();
    const id = pidRef.current;
    const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
    const fname = String(P.name || "Paciente").split(/\s+/)[0];
    if (id === "diana" && st.diana?.crisis) {
      setMsgs([
        { t: "ai", text: `${saludo()}, ${fname}. Anoche durmió 6,4 horas, mejor que la semana pasada. ¿Cómo se siente hoy?` },
        { t: "crisis", text: AlientoAI.crisisText(fname) },
      ]);
      setPaused(true);
      setQuick([]);
      return;
    }
    // Chat limpio: solo el saludo por defecto de TEJIVA (sin chips de demo).
    const sleepHint = Array.isArray(P.sleep) && P.sleep.length
      ? `Ha dormido cerca de ${Number(P.sleep[P.sleep.length - 1]).toFixed(1).replace(".", ",")} horas.`
      : "Vamos con cómo se siente hoy.";
    setMsgs([
      {
        t: "ai",
        text: `${saludo()}, ${fname}. ${sleepHint} ¿Cómo se siente hoy?`,
      },
    ]);
    setQuick([]);
    setStage("free");
  }, [store]);

  const initWA = useCallback(() => {
    const st = store.get();
    waReadyRef.current = true;
    inboxNRef.current = (st.rosalbaWA.inbox || []).length;
    if (!st.rosalbaSummary) {
      setWa([{ k: "sys", text: "Todavía no hay mensajes. TEJIVA le escribe después de la visita del experto de campo." }]);
      setWaQuick([]);
      setWaStage("none");
      return;
    }
    const T = st.rosalbaWA.welcomeAt || "8:01";
    const lines = [
      { t: "Cómo le ha ido", x: "Hoy empezó su acompañamiento con TEJIVA. Gracias por recibir a Andrés en su casa." },
      { t: "Lo que está funcionando", x: "Ya manda audios por WhatsApp. Así nos puede contar cómo está." },
      { t: "Su próximo paso", x: "La Dra. Lucía Marín la llama el viernes 2 de octubre en la mañana." },
      {
        t: "Lo que sigue en su ruta",
        x: (() => {
          const L = store.pathList(2, 1, null, store.ctxFor("rosalba")).map((x: { id: string }) => x.id);
          const out: string[] = [];
          if (L.includes("social")) out.push("la conectamos con las ayudas para reparar su casa");
          return out.length ? `${out.join("; ").replace(/^./, (c) => c.toUpperCase())}.` : "";
        })(),
      },
      { t: "Para usted", x: "Dormir mal después del sismo es muy común. La respiración de la noche puede ayudarle." },
    ];
    const IB = st.rosalbaWA.inbox || [];
    const cut = IB.findIndex((x: WaRaw) => x.k === "sys" && /después/.test(String(x.text)));
    const today = cut > -1 ? IB.slice(0, cut) : IB;
    const welcome = today.filter((x: WaRaw) => x.k === "in" && !x.slug).slice(0, 1);
    const rest = today.filter((x: WaRaw) => welcome.indexOf(x) < 0);
    const waList: WaRaw[] = [{ k: "sys", text: "Hoy" }].concat(
      welcome,
      [
        { k: "in", text: "Le mandamos su resumen de bienvenida, en imagen y en audio.", time: T },
        { k: "card", lines, time: T },
        { k: "audio", id: "rs1", dur: "1:04", secs: 64, caption: "Nota de voz: su resumen leído en voz alta.", time: T },
      ],
      rest,
      [
        {
          k: "audio",
          id: "a1",
          dur: "0:32",
          secs: 32,
          caption: "¿Cómo durmió anoche? Me puede responder con un botón o con un audio.",
          time: T,
        },
      ],
    );
    if (st.rosalbaWA.crisis) {
      waList.push({ k: "crisis", text: AlientoAI.crisisText("Doña Rosalba") });
      setWa(waList);
      setWaQuick([]);
      setWaStage("done");
      return;
    }
    setWa(waList);
    setWaQuick(["Bien", "Regular", "Mal", "Mandar audio"]);
    setWaStage("sleep");
  }, [store]);

  useEffect(() => {
    let cancelled = false;
    const su = store.session() as {
      id?: string;
      role?: string;
      roleId?: string;
      href?: string;
      email?: string;
      name?: string;
      patientId?: string;
    } | null;
    const isPaciente =
      !!su && (su.roleId === "paciente" || /Paciente/i.test(su.role || ""));
    if (!su) {
      router.replace("/ingreso");
      return;
    }
    if (!isPaciente) {
      // H-010 (T-05): con sesión de otro rol vuelve a su panel sin cerrar la sesión.
      router.replace(su.href ? `${su.href}?acceso=denegado` : "/ingreso");
      return;
    }

    async function boot() {
      // Traer ficha (módulos del admin) — fuente de verdad en Mongo
      try {
        const res = await fetch("/api/patients/me", { credentials: "same-origin" });
        const data = (await res.json()) as {
          ok?: boolean;
          patient?: Record<string, unknown> & { id: string; plan?: unknown };
        };
        if (!cancelled && res.ok && data.ok && data.patient?.id) {
          const profile = data.patient.profile != null ? String(data.patient.profile) : "";
          const st = String(
            data.patient.status || data.patient.signal || "",
          );
          // Crisis (roja) e Inactivo (amarilla «Volví») entran a /paciente; servicios solo Activo.
          const crisisOk =
            data.patient.crisisLock === true || /^crisis$/i.test(st);
          const inactiveOk =
            data.patient.inactiveLock === true || /^inactivo$/i.test(st);
          const canEnterApp =
            /^P\d+$/i.test(profile) &&
            (/^activo$/i.test(st) || crisisOk || inactiveOk);
          if (!canEnterApp) {
            router.replace("/paciente/pendiente");
            return;
          }
          store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
            s.patients = s.patients || {};
            s.patients[data.patient!.id] = {
              ...(s.patients[data.patient!.id] || {}),
              ...data.patient!,
            };
          });
        } else if (!cancelled) {
          router.replace("/paciente/pendiente");
          return;
        }
      } catch {
        if (!cancelled) {
          router.replace("/paciente/pendiente");
          return;
        }
      }
      if (cancelled) return;

      const map = (store.get().patients || {}) as Record<
        string,
        { id?: string; accountId?: string; email?: string; plan?: unknown }
      >;
      const linked =
        (su!.patientId && map[su!.patientId]) ||
        map[su!.id!] ||
        Object.values(map).find(
          (p) => p?.accountId === su!.id || (su!.email && p?.email === su!.email),
        ) ||
        null;
      const patientId = String(linked?.id || su!.patientId || su!.id);
      if (su!.href === "/paciente/plan" || linked?.plan || store.PATIENTS?.[patientId]?.plan) {
        router.replace("/paciente/plan");
        return;
      }
      setWho(patientId);
      pidRef.current = patientId;
      cuentaRef.current = String(su!.id || "");
      if (!appInitedRef.current) {
        appInitedRef.current = true;
        if (patientId === "rosalba" || su!.id === "rosalba") initWA();
        else initDiana();
      }
      setReady(true);
    }

    void boot();
    const spl = setTimeout(() => setSplash(false), 1500);
    const clk = setInterval(() => setNow(Date.now()), 20000);
    const onR = () => {
      setFramed(window.innerWidth > 600);
      setDevZoom(window.innerWidth > 600 ? Math.min(1, (window.innerHeight - 32) / 868) : 1);
    };
    onR();
    window.addEventListener("resize", onR);
    return () => {
      cancelled = true;
      clearTimeout(spl);
      clearInterval(clk);
      window.removeEventListener("resize", onR);
      if (plRef.current) clearInterval(plRef.current);
      if (wpRef.current) clearInterval(wpRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [initDiana, initWA, router, store]);

  useEffect(() => {
    return store.subscribe(() => {
      const st = store.get();
      setPaused((p) => {
        if (p && !st.diana.crisis) {
          setMsgs((m) =>
            m.concat([
              {
                t: "ai",
                text: "Hola de nuevo, Diana. La Dra. Lucía Marín revisó su mensaje y reabrió nuestra conversación. Aquí estoy cuando quiera.",
              },
            ]),
          );
          return false;
        }
        return p;
      });
      const inbox = st.rosalbaWA.inbox || [];
      if (inbox.length && inboxNRef.current !== inbox.length) {
        const add = inbox.slice(inboxNRef.current);
        inboxNRef.current = inbox.length;
        if (waReadyRef.current) setWa((w) => w.concat(add));
      }
      // H-001: `who` es el id de la ficha (patientId), no el de la cuenta. Solo se cambia si entró otra cuenta.
      const su = store.session();
      if (su?.id && cuentaRef.current && su.id !== cuentaRef.current) {
        cuentaRef.current = String(su.id);
        const otro = String(su.patientId || su.id);
        pidRef.current = otro;
        setWho(otro);
      }
    });
  }, [store]);

  useEffect(() => {
    const bn = (S.dianaInbox || []).find((m: { seen?: boolean }) => !m.seen) || null;
    const bk = bn ? String((bn as { id?: string; text?: string }).id || (bn as { text?: string }).text) : null;
    if (bk !== bannerKeyRef.current) {
      bannerKeyRef.current = bk;
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      if (bk) {
        bannerTimerRef.current = setTimeout(() => {
          store.set((s) => {
            const m = (s.dianaInbox || []).find((x: { seen?: boolean }) => !x.seen);
            if (m) m.seen = true;
          });
        }, 5000);
      }
    }
  }, [S.dianaInbox, store]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = tab === "chat" ? 1e6 : bodyRef.current.scrollTop;
  }, [msgs.length, tab]);

  useEffect(() => {
    if (waRef.current) waRef.current.scrollTop = 1e6;
  }, [wa.length]);

  const runPlayer = useCallback(() => {
    if (plRef.current) clearInterval(plRef.current);
    plRef.current = setInterval(() => {
      setPl((pl) => {
        if (!pl || !pl.playing) {
          if (plRef.current) clearInterval(plRef.current);
          return pl;
        }
        const it = R.item(pl.id);
        const np = Math.min(1, pl.prog + (0.25 / (it.min * 60)) * 30);
        if (np >= 1) {
          if (plRef.current) clearInterval(plRef.current);
          if (it.kind === "tecnica") {
            store.set((s) => {
              const pr = s.recursos?.people?.[pidRef.current];
              if (pr) {
                pr.tech[pl.id] = (pr.tech[pl.id] || 0) + 1;
                pr.tech4w[pl.id] = (pr.tech4w[pl.id] || 0) + 1;
              }
            });
          }
          return { ...pl, prog: 1, playing: false, done: true };
        }
        return { ...pl, prog: np };
      });
    }, 250);
  }, [R, store]);

  const playItem = useCallback(
    (id: string) => {
      if (!R.item(id)) return;
      if (plRef.current) clearInterval(plRef.current);
      setPl({ id, prog: 0, playing: true, done: false });
      setTimeout(runPlayer, 30);
    },
    [R, runPlayer],
  );

  const startBreath = useCallback(() => {
    setQuick([]);
    setStage("breath");
    setMsgs((m) => m.concat([{ t: "breath" }]));
  }, []);

  const onBreathDone = useCallback(() => {
    setStage("rate");
    ai("¿Cómo está ahora, del 1 al 10?", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  }, [ai]);

  const moduleOn = useCallback(
    (id: string) => {
      const p = (store.get().patients || {})[pidRef.current] as { modulesEnabled?: string[] } | undefined;
      const en = p?.modulesEnabled;
      if (Array.isArray(en)) return en.includes(id);
      return id === "ia" || id === "mood";
    },
    [store],
  );

  const resetMoodFlow = useCallback(() => {
    setMood(null);
    setMoodStep("idle");
    setMoodThread([]);
    setMoodChoices([]);
    setMoodWhy(null);
    setMoodFace("curiosidad");
  }, []);

  const pushMoodTeo = useCallback((text: string, face?: MoodFace, choices?: string[]) => {
    setMoodThread((t) => t.concat([{ who: "teo", text }]));
    if (face) setMoodFace(face);
    setMoodChoices(choices || []);
  }, []);

  const pickMood = useCallback(
    (i: number) => {
      if (paused) return;
      setMood(i);
      setMoodWhy(null);
      setMoodPulse(true);
      setTimeout(() => setMoodPulse(false), 450);
      const id = pidRef.current;
      const label = MOODS[i];
      const fname = firstName;
      const ack = moodAck(i, fname);
      setMoodStep("why");
      setMoodFace(ack.face);
      setMoodThread([
        { who: "me", text: `Hoy me siento: ${label}` },
        { who: "teo", text: ack.text },
        { who: "teo", text: ack.whyPrompt },
      ]);
      setMoodChoices(ack.whys);
      // Persistencia unificada en mood.js (evita duplicar timeline + aiLog).
      void import("@/lib/nara-services/mood.js").then((m) => {
        if (typeof m.saveMoodCheckin === "function") {
          m.saveMoodCheckin(store, id, i, {});
        }
      });
    },
    [firstName, paused, store],
  );

  const answerMoodWhy = useCallback(
    (why: string) => {
      if (mood === null) return;
      setMoodWhy(why);
      setMoodThread((t) => t.concat([{ who: "me", text: why }]));
      const care = moodCareReply(mood, why);
      setMoodStep("care");
      setMoodFace(care.face);
      const choices = [
        "Respirar 2 minutos",
        ...(moduleOn("ia") ? ["Seguir hablando con TEJIVA"] : []),
        ...(mood <= 1 ? ["Necesito ayuda ahora"] : []),
        "Cerrar por hoy",
      ];
      setTimeout(() => {
        pushMoodTeo(care.text, care.face, choices);
      }, 280);
      store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
        const p = s.patients?.[pidRef.current];
        if (p) p.lastMoodWhy = why;
      });
      store.logAi(pidRef.current, "Check-in de ánimo", `Motivo: ${why}`);
    },
    [moduleOn, mood, pushMoodTeo, store],
  );

  const continueMoodWithTeo = useCallback(
    (level: number, mode: "talk" | "breath" | "done" = "talk") => {
      const label = MOODS[level];
      const seed = moodChatSeed(level, firstName, moodWhy || undefined);
      if (!moduleOn("ia")) {
        if (mode === "breath") {
          setMoodStep("breath");
          setMoodChoices([]);
          pushMoodTeo("Vamos despacio. Siga el círculo: inspire 4, suelte 6.", "calma");
          return;
        }
        setMoodStep("done");
        pushMoodTeo("Listo. Su check-in quedó en el seguimiento de hoy. Aquí estaré en el próximo.", "calma", []);
        return;
      }
      setTab("chat");
      if (mode === "breath") {
        me(
          moodWhy
            ? `Hoy me siento: ${label}. Me pesa: ${moodWhy}. Quiero respirar.`
            : `Hoy me siento: ${label}. Quiero respirar un momento.`,
        );
        startBreath();
        return;
      }
      if (mode === "done") {
        me(`Hoy me siento: ${label}. Por ahora cierro el check-in.`);
        setStage("free");
        ai("Listo. Quedó en su seguimiento. Aquí estoy cuando quiera hablar.");
        return;
      }
      me(
        moodWhy
          ? `Hoy me siento: ${label} (${level + 1} de 5). Me pesa: ${moodWhy}.`
          : `Hoy me siento: ${label} (${level + 1} de 5).`,
      );
      setStage("mood");
      ai(seed.chat, seed.chatChips);
    },
    [ai, firstName, me, moduleOn, moodWhy, pushMoodTeo, startBreath],
  );

  const onMoodCareChoice = useCallback(
    (label: string) => {
      if (mood === null) return;
      if (/Cerrar/i.test(label) && moodStep === "done") {
        setMoodChoices([]);
        return;
      }
      setMoodThread((t) => t.concat([{ who: "me", text: label }]));
      if (/ayuda/i.test(label)) {
        setHelp(true);
        setMoodStep("care");
        pushMoodTeo(
          "Abrí Ayuda para usted. Si está en peligro o con ideas de hacerse daño, use esas líneas ahora. Si no, podemos respirar un momento.",
          "calma",
          ["Respirar 2 minutos", "Cerrar por hoy"],
        );
        return;
      }
      if (/Respirar/i.test(label)) {
        if (moduleOn("ia")) return continueMoodWithTeo(mood, "breath");
        setMoodStep("breath");
        setMoodChoices([]);
        pushMoodTeo("Vamos despacio. Siga el círculo conmigo.", "calma");
        return;
      }
      if (/Seguir hablando|TEJIVA/i.test(label)) {
        return continueMoodWithTeo(mood, "talk");
      }
      setMoodStep("done");
      setMoodChoices([]);
      pushMoodTeo(
        mood <= 1
          ? "Quedó registrado. Si el malestar crece, use Ayuda cuando lo necesite. Cuídese."
          : "Gracias por el check-in de hoy. Quedó en su seguimiento.",
        mood <= 1 ? "calma" : "energia",
      );
    },
    [continueMoodWithTeo, moduleOn, mood, moodStep, pushMoodTeo],
  );

  const onMoodBreathDone = useCallback(() => {
    setMoodStep("done");
    const next = moduleOn("ia")
      ? ["Seguir hablando con TEJIVA", "Cerrar por hoy"]
      : ["Cerrar por hoy"];
    pushMoodTeo(
      "Bien. Tres ciclos ya cuentan. Su ánimo quedó registrado. Si quiere, mañana volvemos a mirarlo.",
      "energia",
      next,
    );
  }, [moduleOn, pushMoodTeo]);

  const quickDiana = useCallback(
    (label: string) => {
      me(label);
      if (stage === "mood") {
        if (/respir/i.test(label)) return startBreath();
        if (/ahora no|por ahora|está bien/i.test(label)) {
          setStage("free");
          return ai("Está bien. Aquí estoy cuando lo necesite. Su check-in ya quedó registrado.");
        }
        setStage("free");
        return ai(
          "La escucho. Cuénteme con sus palabras qué le está pasando, o use el teclado cuando quiera. Una sola cosa a la vez está bien.",
        );
      }
      if (stage === "open") {
        if (label === "Con algo de miedo") {
          setStage("fear");
          me("Ayer hubo una réplica pequeña en el trabajo y me volvió el miedo.");
          return ai(
            "Es muy comprensible. Después de un sismo el cuerpo se queda alerta, y una réplica pequeña puede traer todo el miedo de vuelta. No quiere decir que esté retrocediendo. ¿Hacemos juntas una respiración de 2 minutos?",
            ["Sí, respiremos", "Ahora no"],
          );
        }
        setStage("fear");
        return ai(
          label === "Bien"
            ? "Gracias por contarme. ¿Quiere hacer la respiración de hoy para cuidar ese buen momento?"
            : "Gracias por contarme. Cuando hay cansancio, una pausa corta ayuda. ¿Hacemos una respiración de 2 minutos?",
          ["Sí, respiremos", "Ahora no"],
        );
      }
      if (stage === "fear") {
        if (label === "Sí, respiremos") return startBreath();
        setStage("free");
        return ai("Está bien. Aquí estoy cuando lo necesite. Si quiere, le recomiendo el video «El miedo después del sismo» · 4 min.");
      }
      if (stage === "rate") {
        setStage("note");
        return ai(
          "Gracias. ¿Quiere que anote «miedo con las réplicas en el trabajo» para su próxima sesión con la Dra. Lucía Marín?",
          ["Sí, anótelo", "No, gracias"],
        );
      }
      if (stage === "note") {
        setStage("free");
        return ai(
          label === "Sí, anótelo"
            ? "Listo, quedó anotado para el miércoles 7 de octubre. También le puede servir el video «El miedo después del sismo» · 4 min."
            : "Está bien. Le dejo el video «El miedo después del sismo» · 4 min, por si le sirve.",
        );
      }
    },
    [ai, me, stage, startBreath],
  );

  const sendDiana = useCallback(async () => {
    const text = input.trim();
    if (!text || paused) return;
    me(text);
    setInput("");
    setTyping(true);
    const hit = store.crisisCheck(text);
    if (hit) return setTimeout(() => crisisDiana(hit, text), 500);
    const id = pidRef.current;
    const P = store.PATIENTS[id] || store.emptyPatient(id, firstName, 0);
    const fname = String(P.name || firstName || "Paciente").split(/\s+/)[0];
    const place = String(P.place || "Quindío").split(",")[0];
    // Punto 5 · T4: no enviar nombre/edad/lugar al chat; limpiar textos.
    const hist = redactTextForTeo(
      msgs
        .filter((m) => m.t === "ai" || m.t === "me")
        .slice(-8)
        .map((m) => `${m.t === "ai" ? "TEJIVA: " : "Paciente: "}${m.text}`)
        .join("\n"),
    );
    const cleanText = redactTextForTeo(text);

    let reply = "";
    try {
      const res = await fetch("/api/teo/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanText,
          chatInput: cleanText,
          history: hist,
          profile: P.profile || "P01",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; text?: string; fallback?: boolean; crisis?: boolean; escalada?: boolean };
      if (res.ok && data.crisis) return crisisDiana("clasificador IA", text, data);
      if (res.ok && data.ok && data.text && data.text.trim()) {
        reply = data.text.trim();
      }
    } catch {
      /* Gemini no disponible → motor local */
    }

    if (!reply) {
      try {
        const out = await AlientoAI.complete(
          `Eres TEJIVA, acompañante con IA de QUINTIA, un programa de acompañamiento para personas mayores en Colombia. Hablas con una persona del programa (perfil ${P.profile || "P01"}). Trátala de usted, con calidez, frases cortas y palabras sencillas, sin jerga clínica. No das diagnósticos ni reemplazas a su psicóloga. Puedes ofrecer la respiración 4-6, anotar un tema para la sesión o recomendar un video. Voz de TEJIVA: escucha primero, valida y ofrece una sola cosa concreta. Una sola pregunta por mensaje. Nunca diagnostiques, recetes, hables de medicamentos ni contradigas a la psicóloga. Nunca minimices («no es para tanto»), culpes («debería»), prometas («se va a sentir mejor») ni finjas ser humano o sentir emociones. Sin chistes; en temas de miedo, sueño o respiración, frases lentas y sin signos de exclamación. Si detectas cualquier señal de riesgo suicida o peligro inmediato, responde solo con la palabra CRISIS. Responde en máximo 3 frases.\n\n${hist}\nPaciente: ${cleanText}\nTEJIVA:`,
        );
        reply = String(out || "").trim();
      } catch {
        reply = AlientoAI.companion(text, false);
      }
    }

    if (/^\s*CRISIS/.test(reply)) return crisisDiana("clasificador IA", text);
    if (!reply) {
      reply = "Gracias por escribir. ¿Quiere contarme un poco más de cómo se ha sentido?";
    }
    store.logAi(pidRef.current, "Chat con TEJIVA", reply);
    setTyping(false);
    setMsgs((m) => m.concat([{ t: "ai", text: reply }]));
  }, [crisisDiana, firstName, input, me, msgs, paused, store]);

  const chipAnswer = useCallback(
    (label: string) => {
      const id = pidRef.current;
      const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
      const phq = Array.isArray(P.phq) ? P.phq : [];
      const sleep = Array.isArray(P.sleep) ? P.sleep : [];
      const practice = Array.isArray(P.practice) ? P.practice : [];
      const cur = phq.length ? phq[phq.length - 1] : null;
      const wk = sleep.length ? sleep.slice(-7).reduce((a: number, b: number) => a + b, 0) / Math.min(7, sleep.length) : null;
      const daysN = practice.reduce((a: number, b: number) => a + b, 0);
      const T: Record<string, string> = {
        "¿Cómo voy?":
          [
            wk != null
              ? `Esta semana durmió cerca de ${Math.round(wk)} horas por noche, en promedio.`
              : null,
            daysN
              ? `La respiración la practicó ${daysN} ${daysN === 1 ? "día" : "días"}: un buen hábito.`
              : null,
            phq.length && cur != null
              ? "Su seguimiento de ánimo va registrándose paso a paso."
              : "Cuando haga check-ins o reciba visita, aquí verá cómo va.",
          ]
            .filter(Boolean)
            .join(" ") || "Cuando haga check-ins o reciba visita, aquí verá cómo va.",
        "¿Qué hablé la última vez con la doctora?":
          P.lastSession?.d
            ? `El ${String(P.lastSession.d).toLowerCase()} hablaron de ${P.lastSession.topic || "su avance"}.`
            : "Aún no hay notas de una sesión anterior en su expediente.",
        "¿Qué me toca esta semana?":
          P.next
            ? `Su próximo paso registrado es: ${P.next}.`
            : "Todavía no hay tareas ni cita programada en su expediente.",
      };
      if (paused) return;
      me(label);
      ai(T[label]);
    },
    [ai, me, paused, store],
  );

  const waMe = useCallback((item: WaRaw) => {
    setWa((w) => w.concat([{ ...item, time: hm() }]));
    setWaQuick([]);
  }, []);

  const waPush = useCallback((items: WaRaw[], quick?: string[], stage?: string) => {
    items.forEach((i) => {
      if (i.k === "in" || i.k === "crisis") store.logAi("rosalba", "WhatsApp", String(i.text));
    });
    setWaQuick([]);
    setTimeout(() => {
      setWa((w) => w.concat(items));
      if (quick) setWaQuick(quick);
      if (stage) setWaStage(stage);
    }, 700);
  }, [store]);

  const waTech = useCallback(
    (intro: string) =>
      [
        { k: "in", text: intro, time: hm() },
        { k: "audio", id: "t1", title: "Respiración para dormir", dur: "3:10", secs: 190, time: hm() },
      ] as WaRaw[],
    [],
  );

  const waReminder = useCallback(
    () =>
      [
        {
          k: "in",
          text: "La Dra. Lucía Marín la llama el viernes 2 de octubre en la mañana. Responda 1 si le queda bien o 2 para otro día.",
          time: hm(),
        },
      ] as WaRaw[],
    [],
  );

  const waAnswer = useCallback(
    (label: string) => {
      if (waStage === "summary") {
        if (label === "Mandar audio") {
          waMe({
            k: "audio",
            me: true,
            id: "v2",
            dur: "0:14",
            secs: 14,
            transcript: "Gracias, mija. Ya me aprendí lo de respirar despacio. El viernes espero la llamada.",
          });
          return waPush(
            [
              {
                k: "in",
                text: "Gracias por contarme, doña Rosalba. El viernes la llama la Dra. Lucía Marín. Que pase buen día.",
                time: hm(),
              },
            ],
            [],
            "done",
          );
        }
        waMe({ k: "me", text: label });
        return waPush([{ k: "in", text: "Con mucho gusto, doña Rosalba. Aquí estamos con usted.", time: hm() }], [], "done");
      }
      if (waStage === "sleep") {
        if (label === "Mandar audio") {
          waMe({
            k: "audio",
            me: true,
            id: "v1",
            dur: "0:18",
            secs: 18,
            transcript: "Dormí regular, me desperté otra vez a las tres pensando en el temblor.",
          });
          return waPush(
            waTech(
              "Gracias por su audio, doña Rosalba. Despertarse con ese miedo es muy común después de un sismo. Le mando una técnica para esta noche; escúchela ya acostada.",
            ).concat(waReminder()),
            ["1", "2"],
            "remind",
          );
        }
        waMe({ k: "me", text: label });
        if (label === "Mal") {
          return waPush(
            [
              {
                k: "in",
                text: "Siento que haya pasado mala noche, doña Rosalba. ¿Quiere que su psicóloga la llame antes del viernes 2 de octubre?",
                time: hm(),
              },
            ],
            ["Sí", "No, gracias"],
            "earlier",
          );
        }
        return waPush(
          waTech(
            label === "Bien"
              ? "Gracias, doña Rosalba. Para seguir durmiendo bien, le mando una técnica corta."
              : "Gracias por contarme, doña Rosalba. Le mando una técnica para esta noche; escúchela ya acostada.",
          ).concat(waReminder()),
          ["1", "2"],
          "remind",
        );
      }
      if (waStage === "earlier") {
        waMe({ k: "me", text: label });
        if (label === "Sí") {
          store.addAlert({
            id: "a-rosalba-wa",
            sev: "revisar",
            pid: "rosalba",
            name: "Rosalba Giraldo",
            age: 67,
            place: "Vereda La Esperanza, Salento",
            profile: "P08",
            what: "Respondió «Mal» sobre su sueño y pidió que su psicóloga la llame antes del viernes 2 de octubre.",
            source: "WhatsApp · check-in de sueño",
          });
        }
        return waPush(
          waTech(
            label === "Sí"
              ? "Listo. Le avisamos a la Dra. Lucía Marín para que la llame antes. Mientras tanto, le dejo esta técnica para dormir."
              : "Está bien. Le dejo esta técnica para dormir, por si le sirve esta noche.",
          ).concat(waReminder()),
          ["1", "2"],
          "remind",
        );
      }
      if (waStage === "remind") {
        waMe({ k: "me", text: label });
        return waPush(
          [
            {
              k: "in",
              text:
                label === "1"
                  ? "Perfecto, quedó confirmada la llamada del viernes en la mañana."
                  : "Listo, le vamos a proponer otro día. Le llegará un mensaje a este celular.",
              time: hm(),
            },
            {
              k: "in",
              text: "Si en algún momento necesita ayuda, escriba AYUDA y el equipo la llama.",
              time: hm(),
            },
          ],
          [],
          "done",
        );
      }
    },
    [store, waMe, waPush, waReminder, waStage, waTech],
  );

  const waSendText = useCallback(async () => {
    const text = waInput.trim();
    if (!text) return;
    waMe({ k: "me", text });
    setWaInput("");
    const hitW = store.crisisCheck(text);
    if (hitW) {
      store.set((s) => {
        s.rosalbaWA.crisis = true;
      });
      store.addAlert({
        id: "a-rosalba-ayuda",
        sev: "crisis",
        pid: "rosalba",
        name: "Rosalba Giraldo",
        age: 67,
        place: "Vereda La Esperanza, Salento",
        profile: "P08",
        what: `Escribió «${text}» por WhatsApp.`,
        term: hitW,
        source: "WhatsApp · celular de Paola (hija)",
        phone: "311 839 2205",
        expert: "andres",
      });
      return waPush([{ k: "crisis", text: AlientoAI.crisisText("Doña Rosalba") }], [], "done");
    }
    let reply = "Gracias, doña Rosalba. Le paso su mensaje al equipo.";
    try {
      const out = await AlientoAI.complete(
        `Eres TEJIVA, el acompañante por WhatsApp de QUINTIA, un programa de acompañamiento para personas mayores en Colombia. Le escribes a doña Rosalba, 67 años, de la Vereda La Esperanza (Salento), al celular de su hija Paola. Trátala de "doña Rosalba" y de usted. Frases muy cortas y palabras sencillas; ella prefiere audios. No reemplazas a su psicóloga (Dra. Lucía Marín). Voz de TEJIVA: escucha primero, valida y ofrece una sola cosa concreta. Una sola pregunta por mensaje. Nunca diagnostiques, recetes, hables de medicamentos ni contradigas a la psicóloga. Nunca minimices («no es para tanto»), culpes («debería»), prometas («se va a sentir mejor») ni finjas ser humano o sentir emociones. Sin chistes; en temas de miedo, sueño o respiración, frases lentas y sin signos de exclamación. Si detectas riesgo suicida o peligro, responde solo CRISIS. Máximo 2 frases.\nDoña Rosalba: ${text}\nTEJIVA:`,
      );
      if (/^\s*CRISIS/.test(out)) {
        setWaInput("AYUDA");
        return waSendText();
      }
      reply = out.trim();
    } catch {
      /* local */
    }
    waPush([{ k: "in", text: reply, time: "8:20" }]);
  }, [store, waInput, waMe, waPush]);

  const waPlay = useCallback((id: string, secs: number) => {
    if (wpRef.current) clearInterval(wpRef.current);
    if (playing === id) {
      setPlaying(null);
      return;
    }
    setPlaying(id);
    setProg((p) => ({ ...p, [id]: 0 }));
    const step = 100 / Math.min(secs, 12) / 4;
    wpRef.current = setInterval(() => {
      setProg((p) => {
        const v = (p[id] || 0) + step;
        if (v >= 100) {
          if (wpRef.current) clearInterval(wpRef.current);
          setPlaying(null);
          return { ...p, [id]: 100 };
        }
        return { ...p, [id]: v };
      });
    }, 250);
  }, [playing]);

  const waAsk = useCallback(
    (m: WaRaw, label: string) => {
      setWaAsked((a) => ({ ...a, [String(m.id)]: label }));
      waMe({ k: "me", text: label });
      store.set((s) => {
        const r = s.recursos?.people?.rosalba;
        if (r) {
          r.answers.push({
            slug: "el-pais-de-los-suenos",
            q: String(m.text),
            a: label,
            at: Date.now(),
            shared: true,
          });
          if (label !== "No lo escuché") r.read["el-pais-de-los-suenos"] = true;
        }
      });
      waPush([
        {
          k: "in",
          time: "9:02",
          text:
            label === "No lo escuché"
              ? "Está bien, doña Rosalba. El audio queda aquí para cuando tenga un rato."
              : label === "Sí"
                ? "Gracias por contarme, doña Rosalba. ¿Qué parte le gustó más?"
                : "Gracias por decirme, doña Rosalba. Andrés le puede contar más en la próxima visita.",
        },
      ]);
    },
    [store, waMe, waPush],
  );

  const clock = useMemo(() => {
    const d = new Date(now);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, [now]);

  const greet = useMemo(() => {
    const h = new Date(now).getHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  }, [now]);

  const sleepSeries = Array.isArray(DP.sleep) ? DP.sleep : [];
  const practiceSeries = Array.isArray(DP.practice) ? DP.practice : [];
  const wkS = sleepSeries.length ? sleepSeries.slice(-7).reduce((a: number, b: number) => a + b, 0) / Math.min(7, sleepSeries.length) : 0;
  const days = practiceSeries.reduce((a: number, b: number) => a + b, 0);
  const res = useMemo(
    () => ({
      week: sleepSeries.length
        ? `Esta semana durmió en promedio casi ${Math.round(wkS)} horas por noche.`
        : "Aún no hay datos de sueño registrados.",
      blocks: [
        {
          t: "Cómo le ha ido esta semana",
          x: sleepSeries.length
            ? `Esta semana durmió en promedio casi ${Math.round(wkS)} horas por noche.`
            : "Cuando haya check-ins, aquí verá su progreso.",
        },
        {
          t: "Lo que está funcionando",
          x: days
            ? `La respiración 4-6 la ha usado ${days} días. ¡Eso cuenta!`
            : "Todavía no hay prácticas registradas esta semana.",
        },
        {
          t: "Su próximo paso",
          x: DP.next || "Su equipo clínico le avisará la próxima sesión.",
        },
        {
          t: "Un mensaje para usted",
          x: "Cada paso cuenta. Cuando tenga datos nuevos, este resumen se actualizará solo.",
        },
      ],
      dots: (practiceSeries.length ? practiceSeries : [0, 0, 0, 0, 0, 0, 0]).map((v: number, i: number) => ({
        bg: v ? C.verde : "#fff",
        l: ["mié", "jue", "vie", "sáb", "dom", "lun", "mar"][i],
      })),
    }),
    [C.verde, DP.next, days, practiceSeries, sleepSeries.length, wkS],
  );

  const pr = recP();
  const EB = { calma: "#A9D4FF", curiosidad: "#E7FAF5", energia: "#FFC0E0" } as const;

  const libModFlags = useMemo(() => {
    const en = (DP as { modulesEnabled?: string[] }).modulesEnabled;
    const vis = (DP as { modulesVisible?: string[] }).modulesVisible;
    const hasEn = Array.isArray(en);
    const ok = (id: string) => {
      if (!hasEn) return true;
      if (!en!.includes(id)) return false;
      if (Array.isArray(vis) && vis.length) return vis.includes(id);
      return true;
    };
    return { videos: ok("videos"), tech: ok("tech") };
  }, [DP]);

  const lib = useMemo(() => {
    const assigned: Array<{
      kind: "video" | "tecnica";
      id: string;
      title: string;
      meta: string;
      emo: keyof typeof EB;
    }> = [];
    const asg = (store.get().recursos?.assigned || []).filter(
      (x: { pid?: string; kind?: string; id?: string }) =>
        x.pid === pid &&
        (x.kind === "video" || x.kind === "tecnica") &&
        ((x.kind === "video" && libModFlags.videos) ||
          (x.kind === "tecnica" && libModFlags.tech)),
    );
    for (const x of asg) {
      const it = R.item(String(x.id));
      if (!it) continue;
      assigned.push({
        kind: x.kind === "video" ? "video" : "tecnica",
        id: String(x.id),
        title: it.title,
        meta:
          x.kind === "video"
            ? `Video · ${it.min} min`
            : `Técnica · ${it.min} min`,
        emo: (it.emo as keyof typeof EB) || "calma",
      });
    }
    const q = libQ.toLowerCase();
    const filtered = assigned.filter(
      (x) => !q || x.title.toLowerCase().includes(q) || x.meta.toLowerCase().includes(q),
    );
    const tab = libTab;
    const byTab =
      tab === "videos"
        ? filtered.filter((x) => x.kind === "video")
        : filtered.filter((x) => x.kind === "tecnica");
    const tabs = (
      [
        libModFlags.videos ? (["videos", "Videos"] as const) : null,
        libModFlags.tech ? (["tecnicas", "Técnicas"] as const) : null,
      ] as Array<readonly [string, string] | null>
    ).filter(Boolean) as Array<readonly [string, string]>;

    return {
      tabs: tabs.map(([k, label]) => ({
        label,
        on: tab === k,
        bg: tab === k ? "#fff" : "transparent",
        fw: tab === k ? 600 : 500,
        key: k,
      })),
      temas: [] as string[],
      isList: true,
      empty: !byTab.length,
      assignedOnly: true,
      items: byTab.map((v) => ({
        title: v.title,
        meta: v.meta,
        bg: EB[v.emo],
        char: naraAsset(`marca/teo/teo-${v.emo}.svg`),
        cta: v.kind === "video" ? "Ver" : "Escuchar",
        id: v.id,
      })),
    };
  }, [EB, R, libModFlags, libQ, libTab, pid, store]);

  const plView = useMemo(() => {
    if (!pl) return null;
    const it = R.item(pl.id);
    const cnt = pr ? pr.tech[pl.id] || 0 : 0;
    return {
      title: it.title,
      meta: `${it.kind === "video" ? "Video" : "Técnica guiada"} · ${it.min} min · ${it.tema}`,
      bg: EB[it.emo as keyof typeof EB],
      char: naraAsset(`marca/teo/teo-${it.emo}.svg`),
      w: `${pl.prog * 100}%`,
      time: `${fmt(pl.prog * it.min * 60)} / ${fmt(it.min * 60)}`,
      done: pl.done,
      doneText:
        it.kind === "tecnica"
          ? `Quedó registrada. Esta semana la hizo ${cnt}${cnt === 1 ? " vez." : " veces."}`
          : "Video terminado.",
      label: pl.done ? "Otra vez" : pl.playing ? "Pausar" : "Reproducir",
    };
  }, [EB, R, pl, pr]);

  const dianaLines = store.crisisLines("Armenia").map((l: { tel: string; label: string; sub: string; main?: boolean }) => ({
    tel: l.tel,
    label: l.label,
    sub: l.sub,
    bg: l.main ? "#B42318" : "#fff",
    fg: l.main ? "#fff" : "#8A1C14",
  }));

  const rosaLines = store.crisisLines("Salento").map((l: { tel: string; label: string; sub: string; main?: boolean }) => ({
    tel: l.tel,
    label: l.label,
    sub: l.sub,
    bg: l.main ? "#B42318" : "#fff",
    fg: l.main ? "#fff" : "#8A1C14",
  }));

  const unreadBanner = (S.dianaInbox || []).find((m: { seen?: boolean }) => !m.seen) as
    | { text?: string; tab?: Tab }
    | undefined;

  const screenCode = isDiana
    ? (
        {
          resumen: "PatientWeeklySummary",
          home: "PatientHome",
          chat: "TeoChat",
          route: "PatientPath",
          hist: "PatientHistory",
          clin: "PatientClin",
          tech: "PatientTech",
          revisit: "PatientRevisit",
        } as Record<string, string>
      )[tab === "resumen" ? "resumen" : tab] || "PatientHome"
    : "WhatsAppChannel";

  const routeChanges = (S.pathAdjust[pid] || [])
    .map((x: string) => ({
      d: "Hoy · Dra. Lucía Marín",
      x:
        ({
          "Subir a sesiones semanales": "Sus sesiones con la psicóloga ahora son cada semana.",
          "Bajar intensidad": "Su ruta ahora tiene un ritmo más tranquilo, a su medida.",
          "Agregar revisita del experto": "Su experta de campo la va a visitar de nuevo en casa.",
        } as Record<string, string>)[x.split(".")[0]] || x,
    }))
    .concat(
      S.referrals
        .filter((x: { pid: string }) => x.pid === pid)
        .map((x: { date: string; status: string }) => ({
          d: x.date,
          x: `Su psicóloga la remitió a otra institución para que la atiendan allí. Estado: ${x.status.toLowerCase()}.`,
        })),
    );

  const { r: pathR, d: pathD } = store.parseCode(DP.profile || "P05");
  const patientTerr = String((DP as { terr?: string }).terr || "");
  const pathCtx = {
    ...(store.ctxFor(pid) || {}),
    terr: patientTerr || undefined,
  };
  if (patientTerr && typeof store.applyRules === "function") {
    store.applyRules(store.get(), patientTerr);
  }
  const pathServices = store.pathList(pathR, pathD, null, pathCtx);
  const pathById = Object.fromEntries(
    pathServices.map((s: { id: string; freq: string; channel: string; name: string }) => [s.id, s]),
  ) as Record<string, { id: string; freq: string; channel: string; name: string }>;
  // Servicios solo con estado Activo. Crisis → roja; Inactivo → amarilla «Volví».
  const patientStatus = String(
    (DP as { status?: string }).status ||
      (DP as { signal?: string }).signal ||
      "",
  );
  const inactiveLocked =
    (DP as { inactiveLock?: boolean }).inactiveLock === true ||
    /^inactivo$/i.test(patientStatus) ||
    inactiveOpen;
  const servicesUnlocked =
    /^activo$/i.test(patientStatus) && !inactiveLocked && !inactiveOpen;
  // Fuente de verdad: ruta aprobada (pathOverrides).
  // modulesEnabled viejo no debe quitar lo que la ruta ya tiene ON (p. ej. TEJIVA).
  const PATH_RETIRADO = new Set(["tech", "revisit", "cursos"]);
  const pathIdOk = (id: string) => !!id && !PATH_RETIRADO.has(id);
  const pathAppIds = (
    typeof store.appModuleIdsFromPath === "function"
      ? (store.appModuleIdsFromPath(pathR, pathD, null, pathCtx) as string[])
      : pathServices.map((s: { id: string }) => s.id)
  ).filter(pathIdOk);
  const profileCode = String(DP.profile || "P05");
  const pathOv =
    (typeof store.resolvePathOverride === "function"
      ? store.resolvePathOverride(store.get(), profileCode, patientTerr || null)
      : null) ||
    (store.get().pathOverrides && store.get().pathOverrides[profileCode]);
  const hasPathOverride = !!(
    pathOv &&
    pathOv.s &&
    typeof pathOv.s === "object"
  );
  const patientEnRaw = (DP as { modulesEnabled?: string[] | null }).modulesEnabled;
  // [] es válido (= ninguna herramienta): no confundir con «sin configurar».
  const patientEnabled = Array.isArray(patientEnRaw)
    ? patientEnRaw.map(String).filter(pathIdOk)
    : null;
  const enabledList: string[] = !servicesUnlocked
    ? []
    : hasPathOverride
      ? pathAppIds.slice()
      : pathAppIds.length
        ? pathAppIds.slice()
        : patientEnabled != null
          ? patientEnabled.slice()
          : DEFAULT_PATIENT_MODULES.filter(pathIdOk);
  // modulesVisible [] = legado «Por aprobar» (experto); no debe tapar la ruta en Activo.
  // Snapshot viejo (sin servicios nuevos, p. ej. juegos) tampoco debe ocultar lo ON en la ruta.
  const rawVisible = (DP as { modulesVisible?: string[] }).modulesVisible;
  const effectiveVisible =
    Array.isArray(rawVisible) && rawVisible.length > 0
      ? Array.from(
          new Set([
            ...rawVisible.map(String).filter(pathIdOk),
            ...enabledList,
          ]),
        )
      : enabledList;
  const on = (id: string) =>
    pathIdOk(id) &&
    enabledList.includes(id) &&
    effectiveVisible.includes(id);
  const mods = {
    mood: on("mood"), // ¿Cómo se siente hoy?
    clin: on("clin"),
    ia: on("ia"), // Acompañamiento con TEJIVA (chat)
    // Hub «Juegos»: cualquier juego individual (o legacy `juegos`)
    juegos:
      on("juegos") ||
      on("frutas") ||
      on("simon") ||
      on("duelo") ||
      on("sudoku"),
    frutas: on("frutas"),
    simon: on("simon"),
    duelo: on("duelo"),
    sudoku: on("sudoku"),
    analizador: on("analizador"),
    wa: on("wa"),
    call: on("call"),
    bracelet: false, // manillas retiradas de QUINTIA
    videos: on("videos"),
    tech: false,
    cursos: false, // cursos/cuentos retirados
    group: false, // grupos de apoyo retirados
    pmplus: false, // PM+ retirado
    social: on("social"),
    revisit: false,
    hist: false,
  };
  const showRouteTab = !!(
    mods.videos ||
    mods.tech ||
    mods.wa ||
    mods.call ||
    mods.group ||
    mods.revisit ||
    mods.social ||
    mods.clin
  );
  const hasHomeContent = !!(
    mods.mood ||
    mods.ia ||
    mods.juegos ||
    mods.wa ||
    mods.call ||
    mods.videos ||
    mods.tech ||
    mods.group ||
    mods.revisit ||
    mods.social ||
    mods.clin ||
    mods.bracelet
  );
  const showHomeTab = hasHomeContent || (!mods.ia && !showRouteTab);
  const hasAnyModule = hasHomeContent || mods.ia || showRouteTab;

  // Si no está Activo, crisis ni inactivo (p. ej. rechazo), salir a pendiente.
  useEffect(() => {
    if (!ready || !isDiana) return;
    const st = patientStatus;
    const inCrisis =
      (DP as { crisisLock?: boolean }).crisisLock === true ||
      /^crisis$/i.test(st);
    const inInactive =
      (DP as { inactiveLock?: boolean }).inactiveLock === true ||
      /^inactivo$/i.test(st) ||
      inactiveOpen;
    if (servicesUnlocked || inCrisis || inInactive) return;
    router.replace("/paciente/pendiente");
  }, [ready, isDiana, servicesUnlocked, patientStatus, DP, router, inactiveOpen]);

  const activeHerramientas = activePacienteHerramientas(mods).filter(
    (h) => !isPacienteHerramientaDisabled(h.id),
  );
  const activeHerramientaIds = activeHerramientas.map((h) => h.id);
  const firstHerramientaTab = (): Tab => {
    const id = activeHerramientaIds[0];
    if (id === "mood") return "mood";
    if (id === "ia") return "chat";
    if (id === "clin") return "clin";
    if (id === "juegos") return "juegos";
    return "home";
  };

  useEffect(() => {
    // El inicio (hub) siempre es válido.
    if (tab === "home") return;
    if (!hasAnyModule || !activeHerramientaIds.length) {
      setTab("home");
      return;
    }
    if (tab === "hist") {
      setTab(firstHerramientaTab());
      return;
    }
    if (tab === "chat" && !mods.ia) setTab("home");
    if (tab === "mood" && !mods.mood) setTab("home");
    if (tab === "clin" && !mods.clin) setTab("home");
    if (tab === "juegos" && !mods.juegos) setTab("home");
    if (tab === "route" && !showRouteTab) setTab("home");
    // tech / revisit: si la ruta las apagó, fuera; si siguen ON pero aún «próximamente», también.
    if (tab === "tech" && (!mods.tech || isPacienteHerramientaDisabled("tech")))
      setTab("home");
    if (
      tab === "revisit" &&
      (!mods.revisit || isPacienteHerramientaDisabled("revisit"))
    )
      setTab("home");
  }, [
    tab,
    mods.ia,
    mods.mood,
    mods.clin,
    mods.juegos,
    mods.tech,
    mods.revisit,
    showRouteTab,
    hasAnyModule,
    activeHerramientaIds.join(","),
  ]);

  // Crisis: pantalla roja hasta «estoy bien».
  // Cuidador o propio: si hay crisis activa en servidor/cola, siempre roja (ya avisada).
  useEffect(() => {
    const localId = pidRef.current;
    const { P, id, accountId } = resolvePatientRow(store, localId);
    const ids = [id, accountId, localId].filter(Boolean) as string[];
    const matchesCrisisAlert = (a: {
      id?: string;
      pid?: string;
      sev?: string;
      status?: string;
    }) =>
      a.sev === "crisis" &&
      a.status !== "closed" &&
      a.status !== "awaiting_patient" &&
      ids.some(
        (x) =>
          a.pid === x ||
          String(a.id || "").startsWith("a-" + x + "-crisis-btn") ||
          String(a.id || "").startsWith("a-" + x + "-crisis-cuid"),
      );
    const openCrisis = (S.alerts || []).some(matchesCrisisAlert);
    const locked =
      P.crisisLock === true ||
      openCrisis ||
      (pid === "diana" && !!(S.diana as { crisis?: boolean } | undefined)?.crisis) ||
      /^crisis$/i.test(String(P.status || P.signal || ""));

    // Nueva crisis (propia o del cuidador) gana sobre un «estoy bien» local viejo.
    if (locked) {
      if (isWellConfirmedLocal(ids, wellConfirmedRef.current)) {
        wellConfirmedRef.current = null;
        clearWellConfirmed(ids);
      }
      if (!help || !helpSent) {
        setHelp(true);
        setHelpSent(true);
      }
      return;
    }

    // Tras «estoy bien»: no reabrir sola por sync obsoleto (status aún Crisis).
    if (isWellConfirmedLocal(ids, wellConfirmedRef.current)) {
      if (!(help && !helpSent)) {
        if (help || helpSent) {
          setHelp(false);
          setHelpSent(false);
        }
        return;
      }
    }

    // Solo liberar si ya había alerta enviada y el remoto/local ya no está en crisis.
    if (helpSent && !locked) {
      setHelp(false);
      setHelpSent(false);
    }
  }, [S.alerts, S.closedToday, S.diana, S.patients, help, helpSent, pid, store]);

  // Crisis: GPS solo con pantalla roja visible (pide permiso ahí, no antes).
  useEffect(() => {
    const wantShare = help || helpSent;
    const stopWatch = () => {
      if (locWatchRef.current != null && typeof navigator !== "undefined") {
        try {
          navigator.geolocation.clearWatch(locWatchRef.current);
        } catch {
          /* ignore */
        }
        locWatchRef.current = null;
      }
    };
    if (!wantShare) {
      stopWatch();
      if (locShare !== "idle") setLocShare("idle");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocShare("unavailable");
      return;
    }

    const writeLoc = (coords: GeolocationCoordinates) => {
      const now = Date.now();
      const localId = pidRef.current;
      const { id, accountId } = resolvePatientRow(store, localId);
      const ids = [id, accountId, localId].filter(Boolean) as string[];
      let saved: CrisisLoc | null = null;
      store.set((s: {
        alerts?: Array<Record<string, unknown> & { loc?: CrisisLoc }>;
      }) => {
        const alert = (s.alerts || []).find(
          (a) =>
            a.sev === "crisis" &&
            a.status !== "closed" &&
            ids.some(
              (x) =>
                a.pid === x ||
                String(a.id || "").startsWith("a-" + x + "-crisis-btn"),
            ),
        );
        if (!alert) {
          // Aún no hay alerta: guardar pendiente para askCall.
          const pending: CrisisLoc = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            at: now,
            until: crisisLocUntil(now),
          };
          pendingLocRef.current = pending;
          return;
        }
        const until =
          Number(alert.loc?.until) || crisisLocUntil(Number(alert.at) || now);
        if (now > until) return;
        const next: CrisisLoc = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          at: now,
          until,
        };
        alert.loc = next;
        pendingLocRef.current = next;
        saved = next;
      });
      if (saved && now - lastLocFlushRef.current > 10_000) {
        lastLocFlushRef.current = now;
        void flushPersist(store);
      }
      setLocShare("sharing");
    };

    // Esperar a pintar la pantalla roja antes del diálogo nativo de permiso.
    let cancelled = false;
    const startId = window.setTimeout(() => {
      if (cancelled) return;
      setLocShare((prev) => (prev === "sharing" ? prev : "asking"));
      navigator.geolocation.getCurrentPosition(
        (pos) => writeLoc(pos.coords),
        (err) => {
          setLocShare(err.code === 1 ? "denied" : "unavailable");
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
      );

      if (locWatchRef.current == null) {
        locWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => writeLoc(pos.coords),
          (err) => {
            if (err.code === 1) setLocShare("denied");
          },
          {
            enableHighAccuracy: true,
            timeout: 20_000,
            maximumAge: 8_000,
          },
        );
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      stopWatch();
    };
    // locShare omitido a propósito: no reiniciar el watch al cambiar el estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [help, helpSent, store]);

  // GPS del cuidador (crisisPromptLoc) → semilla / refuerzo de la alerta si es más reciente.
  useEffect(() => {
    if (!(help || helpSent)) return;
    const localId = pidRef.current;
    const { P, id, accountId } = resolvePatientRow(store, localId);
    const cuidLoc = P.crisisPromptLoc as CrisisLoc | null | undefined;
    if (
      !cuidLoc ||
      !Number.isFinite(Number(cuidLoc.lat)) ||
      !Number.isFinite(Number(cuidLoc.lng))
    ) {
      return;
    }
    const now = Date.now();
    const next: CrisisLoc = {
      lat: Number(cuidLoc.lat),
      lng: Number(cuidLoc.lng),
      accuracy: cuidLoc.accuracy,
      at: Number(cuidLoc.at) || now,
      until: Number(cuidLoc.until) || crisisLocUntil(now),
    };
    const prevPending = pendingLocRef.current;
    if (!prevPending || Number(next.at) >= Number(prevPending.at || 0)) {
      pendingLocRef.current = next;
    }
    const ids = [id, accountId, localId].filter(Boolean) as string[];
    let saved = false;
    store.set((s: {
      alerts?: Array<Record<string, unknown> & { loc?: CrisisLoc }>;
    }) => {
      const alert = (s.alerts || []).find(
        (a) =>
          a.sev === "crisis" &&
          a.status !== "closed" &&
          ids.some(
            (x) =>
              a.pid === x ||
              String(a.id || "").startsWith("a-" + x + "-crisis-btn"),
          ),
      );
      if (!alert) return;
      const until =
        Number(alert.loc?.until) || crisisLocUntil(Number(alert.at) || now);
      if (now > until) return;
      const curAt = Number(alert.loc?.at || 0);
      if (curAt > Number(next.at)) return;
      alert.loc = { ...next, until };
      saved = true;
    });
    if (saved && now - lastLocFlushRef.current > 10_000) {
      lastLocFlushRef.current = now;
      void flushPersist(store);
    }
  }, [S.patients, help, helpSent, store]);

  const inactiveMinutesForProfile = useCallback(
    (profile: string) => {
      if (!/^P\d+$/i.test(profile)) return DEFAULT_INACTIVE_MINUTES;
      try {
        const { r, d } = store.parseCode(profile);
        const path =
          (store.get().pathOverrides && store.get().pathOverrides[profile]) ||
          store.defaultPath(r, d);
        const m = Number(path?.inactiveMinutes);
        return Number.isFinite(m) && m > 0 ? m : DEFAULT_INACTIVE_MINUTES;
      } catch {
        return DEFAULT_INACTIVE_MINUTES;
      }
    },
    [store],
  );

  const enterInactive = useCallback(() => {
    if (enteringInactiveRef.current || confirmBackBusyRef.current) return;
    const localId = pidRef.current;
    const { P, id, accountId } = resolvePatientRow(store, localId);
    const canon = String(id || localId || "");
    if (!canon) return;
    const back = backConfirmedRef.current;
    if (
      back &&
      Date.now() < back.until &&
      [canon, localId, accountId].some((x) => x === back.pid)
    ) {
      return;
    }
    if (P.crisisLock === true || /^crisis$/i.test(String(P.status || ""))) return;
    enteringInactiveRef.current = true;
    setInactiveOpen(true);
    const displayName = String(P.name || "Paciente");
    pauseLiveHydrate(8_000);
    store.set((s: any) => {
      s.patients = s.patients || {};
      const row = s.patients[canon] || { id: canon, name: displayName };
      row.status = "Inactivo";
      row.signal = "Inactivo";
      row.inactiveLock = true;
      s.patients[canon] = row;
      if (localId !== canon && s.patients[localId]) {
        s.patients[localId].status = "Inactivo";
        s.patients[localId].inactiveLock = true;
      }
      const pe = (s.people || []).find(
        (p: { id?: string; accountId?: string }) =>
          p.id === canon || p.accountId === localId || p.accountId === accountId,
      );
      if (pe) {
        pe.status = "Inactivo";
        pe.inactiveLock = true;
      }
    });
    void (async () => {
      try {
        await Promise.all([
          fetch("/api/people", {
            credentials: "same-origin",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: canon,
              name: displayName,
              status: "Inactivo",
              inactiveLock: true,
            }),
          }),
          fetch("/api/patients", {
            credentials: "same-origin",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: canon,
              name: displayName,
              status: "Inactivo",
              signal: "Inactivo",
              inactiveLock: true,
            }),
          }),
        ]);
      } catch {
        /* sync más adelante */
      }
      await flushPersistWhenReady(store);
      enteringInactiveRef.current = false;
    })();
  }, [store]);

  // Actividad local + umbral del perfil → pantalla amarilla (sin alertas a clínico/experto).
  useEffect(() => {
    if (!ready || !isDiana) return;
    const bump = () => {
      if (inactiveOpen || help) return;
      lastActivityRef.current = Date.now();
    };
    document.addEventListener("pointerdown", bump, { passive: true });
    document.addEventListener("keydown", bump);
    const tick = setInterval(() => {
      const localId = pidRef.current;
      const { P, id, accountId } = resolvePatientRow(store, localId);
      const canon = String(id || localId || "");
      const back = backConfirmedRef.current;
      if (
        back &&
        Date.now() < back.until &&
        [canon, localId, accountId].some((x) => x === back.pid)
      ) {
        if (inactiveOpen) setInactiveOpen(false);
        return;
      }
      if (P.crisisLock === true || /^crisis$/i.test(String(P.status || P.signal || ""))) {
        return;
      }
      if (P.inactiveLock === true || /^inactivo$/i.test(String(P.status || P.signal || ""))) {
        if (!inactiveOpen) setInactiveOpen(true);
        return;
      }
      const st = String(P.status || P.signal || "");
      if (!/^activo$/i.test(st) && !/^aprobado$/i.test(st)) return;
      // El reloj solo corre desde activeAt (aprobación); no desde login previo.
      const activeAt = Number((P as { activeAt?: unknown }).activeAt);
      if (!(Number.isFinite(activeAt) && activeAt > 0)) return;
      if (lastActivityRef.current < activeAt) lastActivityRef.current = activeAt;
      const mins = inactiveMinutesForProfile(String(P.profile || ""));
      if (Date.now() - lastActivityRef.current < inactivityThresholdMs(mins)) return;
      enterInactive();
    }, 4_000);
    return () => {
      clearInterval(tick);
      document.removeEventListener("pointerdown", bump);
      document.removeEventListener("keydown", bump);
    };
  }, [
    ready,
    isDiana,
    inactiveOpen,
    help,
    store,
    enterInactive,
    inactiveMinutesForProfile,
    S.patients,
  ]);

  const svc = (id: string, freqFallback = "Según su ruta", channelFallback = "") => ({
    freq: pathById[id]?.freq || freqFallback,
    channel: pathById[id]?.channel || channelFallback,
  });

  const waCard = mods.wa
    ? {
        freq: svc("wa", "Semanal").freq,
        channel: svc("wa", "Semanal", "Audio primero").channel || "Audio primero",
        title: "Check-in por WhatsApp",
        body: `Le escribimos ${String(svc("wa", "semanal").freq).toLowerCase()} por WhatsApp (${svc("wa", "Semanal", "audio primero").channel || "audio primero"}). Puede responder con un audio corto de cómo se siente.`,
        tip: "Cuando llegue el mensaje, respóndalo desde WhatsApp. Aquí solo ve el recordatorio.",
      }
    : null;

  const callCard = mods.call
    ? {
        freq: svc("call", "Mensual").freq,
        title: "Llamada de seguimiento",
        when: DP.next || `Llamada ${String(svc("call", "mensual").freq).toLowerCase()}`,
        phone: DP.phone || "—",
        clin: DP.clin || "Su equipo clínico",
        body: `Según su ruta: llamada ${String(svc("call", "mensual").freq).toLowerCase()}. Conteste desde su número registrado.`,
      }
    : null;

  const revisitCard = mods.revisit
    ? {
        title: "Revisita del experto",
        freq: svc("revisit", "Mensual").freq,
        expert: DP.expert || "Su experta de campo",
        place: (DP.place || "").split(",")[0] || "su vereda",
        body: `${DP.expert || "Su experta de campo"} la visitará en casa (${svc("revisit", "Mensual", "Visita en casa").channel || "visita en casa"}). Frecuencia: ${String(svc("revisit", "mensual").freq).toLowerCase()}.`,
        tip: "Prepare un lugar tranquilo. Si no puede atender, avise con tiempo.",
      }
    : null;

  const groupCard = mods.group
    ? {
        title: "Grupo de apoyo en la vereda",
        freq: svc("group", "Quincenal").freq,
        channel: svc("group", "Quincenal", "En la vereda · con facilitador").channel || "En la vereda · con facilitador",
        body: `Encuentro ${String(svc("group", "quincenal").freq).toLowerCase()} en ${svc("group", "Quincenal", "la vereda, con facilitador").channel || "la vereda, con facilitador"}.`,
        tip: "No tiene que hablar si no quiere. Ir ya cuenta como cuidar su salud.",
      }
    : null;

  const socialCard = mods.social
    ? {
        title: "Ayudas sociales",
        channel: svc("social", "Según el caso", "Según el caso").channel || "Según el caso",
        body: `Su ruta incluye vinculación a ayudas: ${svc("social", "Según el caso", "según su situación").channel || "según su situación"}.`,
        tip: "Su experta de campo le ayuda con los trámites. Aquí solo ve el estado de ese apoyo.",
        status: "En trámite con el equipo de campo",
      }
    : null;

  const openVideosLib = () => {
    setLibTab("videos");
    setTab("route");
  };

  // Mi ruta: solo servicios/módulos activos para este paciente.
  const routeRows: [string, string | number, number | null][] = [];
  if (mods.clin) {
    routeRows.push(["Sesiones con su psicóloga", DP.lastSession ? 1 : 0, null]);
  }
  if (mods.ia) {
    routeRows.push([
      "Conversaciones con TEJIVA",
      (S.aiLog || []).filter((l: { pid?: string }) => l.pid === pid).length || 0,
      null,
    ]);
  }
  if (mods.wa) {
    routeRows.push(["Check-ins por WhatsApp", "Según la ruta", null]);
  }
  pathServices
    .filter((x: { id: string }) => {
      if (["mood", "clin", "bracelet", "pmplus", "ia", "wa"].includes(x.id)) return false;
      return on(x.id);
    })
    .forEach((x: { id: string; name: string; freq: string; channel: string }) => {
      routeRows.push([
        x.id === "social" ? `Ayudas sociales · ${(x.channel || "").toLowerCase()}` : x.name,
        x.id === "social" ? "Según el caso" : x.freq,
        null,
      ]);
    });
  const route = routeRows.map(([name, a, b]) => ({
    name: name as string,
    val: b ? `${a} de ${b}` : String(a),
    hasBar: !!b,
    pct: b ? `${Math.round((Number(a) / Number(b)) * 100)}%` : "0%",
  }));

  const phqHist = Array.isArray(DP.phq) ? DP.phq : [];
  const phqDates = Array.isArray(DP.phqDates) ? DP.phqDates : [];
  const hist = (phqHist.length
    ? phqHist.map((v: number, i: number) => [v, phqDates[i] || "Medición"])
    : [[7, "Hoy"]]
  ).map(([v, d]) => ({ v, d, h: `${Math.round((Number(v) / 27) * 100)}%` }));

  const waMapped = wa.map((m) => {
    const id = String(m.id || "");
    const p = prog[id] || 0;
    return {
      raw: m,
      sys: m.k === "sys",
      inText: m.k === "in",
      meText: m.k === "me",
      crisis: m.k === "crisis",
      isAudio: m.k === "audio",
      isCard: m.k === "card",
      isStory: m.k === "story",
      isAsk: m.k === "ask",
      text: m.text as string | undefined,
      time: m.time as string | undefined,
      cover: m.slug ? naraAsset(R.cover(String(m.slug))) : "",
      open: m.k === "ask" && !waAsked[String(m.id)],
      opts: ((m.opts as string[]) || []).map((label) => ({ label, go: () => waAsk(m, label) })),
      lines: (m.lines as { t: string; x: string }[]) || [],
      align: m.me ? "flex-end" : "flex-start",
      bg: m.me ? "#E7FAF5" : "#fff",
      hasTitle: !!m.title,
      title: m.title as string | undefined,
      dur: m.dur as string | undefined,
      hasCaption: !!m.caption,
      caption: m.caption as string | undefined,
      hasTranscript: !!m.transcript,
      transcript: m.transcript as string | undefined,
      icon: playing === id ? "❚❚" : "▶",
      play: () => waPlay(id, Number(m.secs) || 12),
      bars: WA_BAR_H.map((h, i) => ({
        h: `${h}%`,
        c: (i / WA_BAR_H.length) * 100 < p ? "#0F2D3B" : "#B3ACA2",
      })),
    };
  });

  const chatMsgs = msgs.map((m) => ({
    ai: m.t === "ai",
    me: m.t === "me",
    crisis: m.t === "crisis",
    breath: m.t === "breath",
    text: m.text,
    avatar: naraAsset(
      `marca/personajes/teo-${
        paused
          ? "calma"
          : /(eso cuenta|lo logró|completó|mejoró|avance|terminó la semana)/i.test(m.text || "")
            ? "energia"
            : /respir|dorm|sueño|técnica|calma|despacio|aire/i.test(m.text || "")
              ? "calma"
              : "curiosidad"
      }.svg`,
    ),
  }));

  // P-01 (TRL 2026-10-10): en el primer ingreso a la app la persona acepta el consentimiento de uso de la
  // app antes de que se registre nada desde ella. Queda en consents[patientId].appAt, appVersion y
  // analizador:true (el mismo «Acepto» activa que los juegos alimenten el analizador).
  const backupAppAt = readAppConsentBackup(consentAliasKeys);
  const hasAppConsent =
    appConsentAccepted ||
    !!backupAppAt ||
    consentAliasKeys.some((k) => {
      const c = S.consents && S.consents[k];
      return !!(c && (c as { appAt?: unknown }).appAt);
    });
  const needsAppConsent = ready && isDiana && !hasAppConsent;

  // Si el respaldo local tiene appAt y Mongo aún no, reinyectar y persistir (p. ej. logout antes del PUT).
  const syncedBackupRef = useRef("");
  useEffect(() => {
    if (!ready || !isDiana || !backupAppAt) return;
    const canonical = String(consKey || "").trim();
    if (!canonical) return;
    const stamp = `${canonical}:${backupAppAt}`;
    if (syncedBackupRef.current === stamp) return;
    const storeConsents = (store.get().consents || {}) as Record<
      string,
      { appAt?: unknown }
    >;
    const already = [canonical, ...consentAliasKeys].some(
      (k) => !!(storeConsents[k] && storeConsents[k].appAt),
    );
    if (already) {
      syncedBackupRef.current = stamp;
      return;
    }
    syncedBackupRef.current = stamp;
    store.set((s: { consents?: Record<string, Record<string, unknown>> }) => {
      s.consents = s.consents || {};
      const entry = {
        ...(s.consents[canonical] || {}),
        appAt: backupAppAt,
        appVersion: "app-v1",
      };
      [canonical, ...consentAliasKeys].forEach((k) => {
        if (!k) return;
        s.consents![k] = { ...(s.consents![k] || {}), ...entry };
      });
    });
    pauseLiveHydrate(3_000);
    void putAppStateOrQueue(
      {
        consents: {
          [canonical]: {
            ...((store.get().consents || {})[canonical] || {}),
            appAt: backupAppAt,
            appVersion: "app-v1",
          },
        },
      },
      `consents-app:${canonical}`,
    );
    // consentAliasKeys se recalcula cada render; solo dependemos de ids estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isDiana, backupAppAt, consKey, store]);

  const acceptAppConsent = () => {
    setAppConsentAccepted(true);
    const at = Date.now();
    const canonical = String(
      (sessionNow as { patientId?: string } | null)?.patientId ||
        consKey ||
        pidRef.current ||
        "",
    ).trim();
    if (!canonical) return;
    const keys = Array.from(new Set([...consentAliasKeys, canonical].filter(Boolean).map(String)));
    writeAppConsentBackup(keys, at);
    store.set((s: { consents?: Record<string, Record<string, unknown>> }) => {
      s.consents = s.consents || {};
      const entry = {
        ...(s.consents[canonical] || {}),
        appAt: at,
        appVersion: "app-v1",
        analizador: true,
      };
      // Escribir en patientId (API) y aliases locales para no perder el check al leer.
      keys.forEach((k) => {
        s.consents![k] = { ...(s.consents![k] || {}), ...entry };
      });
    });
    pauseLiveHydrate(3_000);
    const payload = {
      consents: {
        [canonical]: {
          ...((store.get().consents || {})[canonical] || {}),
          appAt: at,
          appVersion: "app-v1",
          analizador: true,
        },
      },
    };
    // PUT dedicado (como la visita del experto): no depende de que flushPersist envíe todo el mapa.
    void putAppStateOrQueue(payload, `consents-app:${canonical}`).then((r) => {
      if (r === "error") void flushPersistWhenReady(store);
    });
  };

  return {
    ready,
    needsAppConsent,
    acceptAppConsent,
    isDiana,
    isRosalba: !isDiana,
    framed,
    dev: store.devMode(),
    devW: framed ? "390px" : "100%",
    devH: framed ? "844px" : "100dvh",
    devZoom,
    devR: framed ? "56px" : "0",
    devBd: framed ? "12px solid #0F2D3B" : "none",
    devSh: framed ? "0 30px 60px rgba(22,20,19,.25), 0 0 0 2px #3A3633" : "none",
    scrR: framed ? "44px" : "0",
    sbBg: isDiana ? "#F7F5EF" : "#0F2D3B",
    sbFg: isDiana ? "#0F2D3B" : "#fff",
    gestC: "#0F2D3B",
    clock,
    splash: isDiana && splash,
    screenCode,
    hasBanner: isDiana && !!unreadBanner,
    bannerText: unreadBanner?.text || "",
    bannerTop: framed ? "54px" : "10px",
    dismissBanner: (e: React.MouseEvent) => {
      e.stopPropagation();
      store.set((s) => {
        const m = (s.dianaInbox || []).find((x: { seen?: boolean }) => !x.seen);
        if (m) m.seen = true;
      });
    },
    openBanner: () => {
      const m = unreadBanner;
      store.set((s) => {
        const x = (s.dianaInbox || []).find((y: { seen?: boolean }) => !y.seen);
        if (x) x.seen = true;
      });
      if (m?.tab) setTab(m.tab);
    },
    bodyRef,
    waRef,
    tab,
    setTab,
    tabHome: tab === "home",
    tabMood: tab === "mood",
    tabChat: tab === "chat",
    tabRoute: tab === "route",
    tabClin: tab === "clin",
    tabJuegos: tab === "juegos",
    tabTech: tab === "tech",
    tabRevisit: tab === "revisit",
    tabRes: tab === "resumen",
    /** Solo herramientas ON en la ruta; las apagadas no se listan (tampoco tech/revisit). */
    herramientaNav: PACIENTE_HERRAMIENTAS.filter(
      (h) => !!mods[h.id] && !isPacienteHerramientaDisabled(h.id),
    ).map((h) => {
      const selected =
        (h.id === "mood" && tab === "mood") ||
        (h.id === "ia" && tab === "chat") ||
        (h.id === "clin" && tab === "clin") ||
        (h.id === "juegos" && tab === "juegos") ||
        (h.id === "tech" && tab === "tech") ||
        (h.id === "revisit" && tab === "revisit");
      const go = () => {
        if (h.id === "mood") setTab("mood");
        else if (h.id === "ia") setTab("chat");
        else if (
          h.id === "clin" ||
          h.id === "juegos" ||
          h.id === "tech" ||
          h.id === "revisit"
        )
          setTab(h.id);
      };
      return { ...h, on: selected, go, disabled: false };
    }),
    herramientaNavCount: PACIENTE_HERRAMIENTAS.filter(
      (h) => !!mods[h.id] && !isPacienteHerramientaDisabled(h.id),
    ).length,
    goHome: () => setTab("home"),
    openResumen: () => setTab("resumen"),
    closeResumen: () => setTab("home"),
    greet,
    firstName,
    patientName: DP.name,
    patientId: pid,
    mods,
    waCard,
    callCard,
    revisitCard,
    groupCard,
    socialCard,
    openVideosLib,
    showTech: mods.tech,
    showResumen: false,
    showBracelet: false,
    hasAnyModule,
    showHomeTab,
    res,
    moods: MOODS.map((label, i) => {
      const on = mood === i;
      const tint = MOOD_TINTS[i];
      return {
        n: i + 1,
        label,
        on,
        bd: on ? "#0F2D3B" : tint.bd,
        bg: on ? tint.bgOn : tint.bg,
        fg: C.tinta,
        scale: on && moodPulse ? "1.06" : on ? "1.03" : "1",
        pick: () => pickMood(i),
      };
    }),
    moodDone: mood !== null && moodStep !== "idle",
    moodStep,
    moodBreathing: moodStep === "breath",
    moodThread: moodThread.map((b) => ({
      me: b.who === "me",
      teo: b.who === "teo",
      text: b.text,
    })),
    moodFace: naraAsset(`marca/personajes/teo-${moodFace}.svg`),
    moodCanTeo: mods.ia,
    moodLow: mood !== null && mood <= 1,
    moodActions: moodChoices.map((label) => ({
      label,
      primary: /Respirar|TEJIVA|hablar/i.test(label) && !/Cerrar|Prefiero/i.test(label),
      danger: /ayuda/i.test(label),
      go: () => {
        if (moodStep === "why") answerMoodWhy(label);
        else onMoodCareChoice(label);
      },
    })),
    onMoodBreathDone,
    moodChange: resetMoodFlow,
    startTechnique: () => {
      setTab("chat");
      if (!paused && stage !== "breath") {
        me("Quiero hacer la respiración de hoy");
        startBreath();
      }
    },
    chatMsgs,
    typing,
    quick: quick.map((label) => ({ label, go: () => quickDiana(label) })),
    /** Reinicia el hilo a solo el saludo por defecto de TEJIVA. */
    resetTeoChat: () => {
      const localId = pidRef.current;
      const row = (store.PATIENTS[localId] ||
        store.emptyPatient?.(localId, firstName || "Paciente", 0) ||
        {}) as { name?: string; sleep?: number[] };
      const fname = String(row.name || firstName || "Paciente").split(/\s+/)[0];
      const sleepHint = Array.isArray(row.sleep) && row.sleep.length
        ? `Ha dormido cerca de ${Number(row.sleep[row.sleep.length - 1]).toFixed(1).replace(".", ",")} horas.`
        : "Vamos con cómo se siente hoy.";
      setMsgs([
        {
          t: "ai",
          text: `${saludo()}, ${fname}. ${sleepHint} ¿Cómo se siente hoy?`,
        },
      ]);
      setQuick([]);
      setStage("free");
      setInput("");
      setTyping(false);
      setPaused(false);
    },
    paused,
    notPaused: !paused,
    input,
    setInput,
    sendDiana,
    askChips: ["¿Cómo voy?", "¿Qué hablé la última vez con la doctora?", "¿Qué me toca esta semana?"].map(
      (label) => ({ label, go: () => chipAnswer(label) }),
    ),
    topics: topics.map(([label, on], i) => ({
      label,
      mark: on ? "✓" : "",
      bg: on ? C.verde : "#fff",
      toggle: () =>
        setTopics((t) => t.map((row, j) => (j === i ? [row[0], !row[1]] : row))),
    })),
    topicInput,
    setTopicInput,
    addTopic: () => {
      const t = topicInput.trim();
      if (t) {
        setTopics((top) => top.concat([[t, true]]));
        setTopicInput("");
      }
    },
    sesionDia: "miércoles 7 de octubre",
    lib: {
      ...lib,
      tabs: lib.tabs.filter((t: { key: string }) => {
        if (t.key === "videos") return mods.videos;
        if (t.key === "tecnicas") return mods.tech;
        return false;
      }),
    },
    setLibTab: (k: string) => {
      setLibTab(k);
      setLibTema("");
    },
    setLibQ,
    setLibTema,
    libQ,
    libTema,
    playItem,
    route,
    routeChanges,
    hasRouteChanges: !!(S.pathAdjust[pid] || []).length || !!S.referrals.find((x: { pid: string }) => x.pid === pid),
    hist,
    consents: CL.map(([k, label]) => ({
      label,
      state: cons[k] ? "Sí" : "No",
      bg: cons[k] ? C.verde : "#C4BDB3",
      x: cons[k] ? "25px" : "3px",
      toggle: () => {
        const v = !cons[k];
        const id = pidRef.current;
        const P = store.PATIENTS[id] || store.emptyPatient(id, "Paciente", 0);
        store.set((s) => {
          s.consents = s.consents || {};
          s.consents[id] = s.consents[id] || {};
          s.consents[id][k] = v;
          if (!v)
            store.pushNotif(
              s,
              "clin",
              `Consentimiento retirado: ${P.name} · ${label.toLowerCase()}`,
              "/clinico/pacientes/" + encodeURIComponent(id),
            );
          if (!v)
            s.alerts.push({
              id: `a-cons-${k}${Date.now()}`,
              sev: "info",
              pid: id,
              name: P.name,
              age: P.age,
              place: P.place,
              profile: P.profile || "P05",
              what: `Retiró su consentimiento: ${label.toLowerCase()}.`,
              source: "App · Historial",
              at: Date.now(),
              status: "open",
            });
        });
        setConsentMsg(v ? "Cambio guardado." : "Cambio guardado. Le avisamos a su psicóloga.");
      },
    })),
    consentMsg,
    clearConsentMsg: () => setConsentMsg(""),
    tabs: activeHerramientas.map((h) => {
      const on =
        (h.id === "mood" && tab === "mood") ||
        (h.id === "ia" && tab === "chat") ||
        (h.id === "clin" && tab === "clin") ||
        (h.id === "juegos" && tab === "juegos") ||
        (h.id === "tech" && tab === "tech") ||
        (h.id === "revisit" && tab === "revisit");
      return {
        id: h.id,
        label: h.navLabel,
        name: h.name,
        on,
        fg: on ? "#0F2D3B" : "#6B7280",
        fw: on ? 600 : 500,
        dot: on ? "#31C6E6" : "transparent",
        op: on ? 1 : 0.7,
        isHome: h.id === "mood",
        isMood: h.id === "mood",
        isTeo: h.id === "ia",
        isRoute: false,
        isClin: h.id === "clin",
        isJuegos: h.id === "juegos",
        isTech: h.id === "tech",
        isRevisit: h.id === "revisit",
        go: () => {
          if (h.id === "mood") setTab("mood");
          else if (h.id === "ia") setTab("chat");
          else if (
            h.id === "clin" ||
            h.id === "juegos" ||
            h.id === "tech" ||
            h.id === "revisit"
          )
            setTab(h.id);
        },
      };
    }),
    tabCount: activeHerramientas.length,
    plOpen: !!pl,
    plView,
    plToggle: () => {
      if (!pl) return;
      if (pl.done) return playItem(pl.id);
      const on = !pl.playing;
      setPl({ ...pl, playing: on });
      if (on) setTimeout(runPlayer, 30);
      else if (plRef.current) clearInterval(plRef.current);
    },
    plClose: () => {
      if (plRef.current) clearInterval(plRef.current);
      setPl(null);
    },
    helpOpen: help,
    /** Estado del permiso/compartir ubicación en crisis. */
    locShare,
    /** Ya envió la alerta: pantalla roja (bloqueo total). */
    crisisAlertSent: (() => {
      const localId = pidRef.current;
      const { P, id, accountId } = resolvePatientRow(store, localId);
      const ids = [id, accountId, localId].filter(Boolean) as string[];
      const openCrisis = (S.alerts || []).some(
        (a: { id?: string; pid?: string; sev?: string; status?: string }) =>
          a.sev === "crisis" &&
          a.status !== "closed" &&
          a.status !== "awaiting_patient" &&
          ids.some(
            (x) =>
              a.pid === x ||
              String(a.id || "").startsWith("a-" + x + "-crisis-btn") ||
              String(a.id || "").startsWith("a-" + x + "-crisis-cuid"),
          ),
      );
      const inCrisis =
        P.crisisLock === true ||
        openCrisis ||
        (pid === "diana" && S.diana?.crisis) ||
        helpSent ||
        /^crisis$/i.test(String(P.status || P.signal || ""));
      // Crisis activa (p. ej. reportada por cuidador) gana sobre «estoy bien» local.
      if (inCrisis) return true;
      if (isWellConfirmedLocal(ids, wellConfirmedRef.current)) return false;
      return false;
    })(),
    /** Clínico ya cerró la alerta → aparece «estoy bien» (solo si sigue bloqueado). */
    crisisAttended: (() => {
      const localId = pidRef.current;
      const { P, id, accountId } = resolvePatientRow(store, localId);
      const ids = [id, accountId, localId].filter(Boolean) as string[];
      const stillInCrisisUi =
        P.crisisLock === true ||
        /^crisis$/i.test(String(P.status || P.signal || "")) ||
        (S.alerts || []).some(
          (a: { id?: string; pid?: string; sev?: string; status?: string }) =>
            a.sev === "crisis" &&
            a.status !== "closed" &&
            a.status !== "awaiting_patient" &&
            ids.some(
              (x) =>
                a.pid === x ||
                String(a.id || "").startsWith("a-" + x + "-crisis-btn") ||
                String(a.id || "").startsWith("a-" + x + "-crisis-cuid"),
            ),
        );
      if (!stillInCrisisUi) {
        if (isWellConfirmedLocal(ids, wellConfirmedRef.current)) return false;
        return false;
      }
      return crisisWasAttended(S, ids, P);
    })(),
    confirmWellBusy,
    helpNotSent: false,
    helpText: "",
    openHelp: () => {
      // Nueva crisis a propósito: quitar el bloqueo local de «estoy bien»
      // para que la pantalla roja no se cierre al instante.
      const localId = pidRef.current;
      const { id, accountId } = resolvePatientRow(store, localId);
      wellConfirmedRef.current = null;
      clearWellConfirmed(
        [id, localId, accountId].filter(Boolean) as string[],
      );
      setHelp(true);
    },
    closeHelp: () => {
      const id = pidRef.current;
      const P = (store.PATIENTS[id] || {}) as {
        status?: string;
        crisisLock?: boolean;
      };
      if (P.crisisLock || helpSent || /^crisis$/i.test(String(P.status || ""))) return;
      setHelp(false);
    },
    /** Confirma crisis: envía alerta + estado Crisis + bloqueo total. */
    askCall: () => {
      void (async () => {
        const sess = store.session() as {
          id?: string;
          name?: string;
          email?: string;
          patientId?: string;
        } | null;
        // Siempre refrescar ficha canónica antes de alertar.
        let fresh: (Record<string, unknown> & { id: string }) | null = null;
        try {
          const res = await fetch("/api/patients/me", { credentials: "same-origin" });
          const data = (await res.json()) as {
            ok?: boolean;
            patient?: Record<string, unknown> & { id: string };
          };
          if (res.ok && data.ok && data.patient?.id) fresh = data.patient;
        } catch {
          /* usar store local */
        }
        const map = (store.get().patients || store.PATIENTS || {}) as Record<
          string,
          Record<string, unknown>
        >;
        const localId = pidRef.current;
        const fromMap =
          (fresh?.id && map[fresh.id]) ||
          map[localId] ||
          (sess?.patientId && map[sess.patientId]) ||
          Object.values(map).find(
            (p) =>
              p &&
              (p.accountId === sess?.id ||
                p.accountId === localId ||
                (sess?.email && p.email === sess.email) ||
                p.id === localId),
          ) ||
          null;
        const P = {
          ...(fromMap || {}),
          ...(fresh || {}),
        } as Record<string, unknown> & {
          id?: string;
          name?: string;
          age?: number;
          place?: string;
          terr?: string;
          profile?: string;
          phone?: string;
          expert?: string;
          crisisLock?: boolean;
          crisisBtnReady?: boolean;
        };
        // pid canónico = ficha paciente, nunca el id de cuenta.
        const id = String(
          P.id || fresh?.id || sess?.patientId || localId || "",
        );
        if (!id) return;
        if (id !== localId) {
          pidRef.current = id;
          setWho(id);
        }
        if (fresh) {
          store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
            s.patients = s.patients || {};
            s.patients[id] = { ...(s.patients[id] || {}), ...fresh! };
          });
        }
        const openCrisis = (store.get().alerts || []).some(
          (a: { id?: string; pid?: string; sev?: string; status?: string }) =>
            a.sev === "crisis" &&
            a.status !== "closed" &&
            (a.pid === id ||
              a.pid === localId ||
              a.pid === sess?.id ||
              String(a.id || "").startsWith("a-" + id + "-crisis-btn") ||
              String(a.id || "").startsWith("a-" + localId + "-crisis-btn")),
        );
        if (openCrisis || P.crisisLock || (pid === "diana" && store.get().diana?.crisis)) {
          setHelpSent(true);
          setHelp(true);
          return;
        }
        if (helpSent && !P.crisisBtnReady) {
          setHelp(true);
          return;
        }
        const displayName =
          String(P.name || sess?.name || "").trim() || "Paciente";
        const ageN = Number(P.age);
        const place = String(P.place || P.terr || "")
          .split(",")[0]
          .trim();
        const profile =
          P.profile && /^P\d+$/i.test(String(P.profile)) ? String(P.profile) : "";
        const phone = String(P.phone || "").trim();
        wellConfirmedRef.current = null;
        clearWellConfirmed([id, localId, String(sess?.id || ""), String(sess?.patientId || "")]);
        confirmWellBusyRef.current = false;
        setConfirmWellBusy(false);
        setHelpSent(true);
        setHelp(true);
        store.set((s: any) => {
          s.patients = s.patients || {};
          const row = s.patients[id] || { id, name: displayName };
          row.crisisBtnReady = false;
          row.crisisLock = true;
          row.crisisAttendedAt = null;
          row.crisisAttendedOutcome = null;
          row.crisisPromptAt = null;
          row.status = "Crisis";
          row.signal = "Crisis";
          row.name = displayName;
          if (Number.isFinite(ageN) && ageN > 0) row.age = ageN;
          if (place) row.place = place;
          if (profile) row.profile = profile;
          if (phone) row.phone = phone;
          if (sess?.id) row.accountId = sess.id;
          s.patients[id] = row;
          const pe = (s.people || []).find(
            (p: { id?: string; accountId?: string }) =>
              p.id === id || p.accountId === sess?.id,
          );
          if (pe) pe.status = "Crisis";
          // Una sola crisis abierta por paciente: quitar duplicados previos.
          const idKeys = new Set(
            [id, localId, String(sess?.id || ""), String(sess?.patientId || "")]
              .filter(Boolean)
              .map(String),
          );
          s.alerts = (Array.isArray(s.alerts) ? s.alerts : []).filter(
            (a: { sev?: string; pid?: string; id?: string; status?: string }) => {
              if (a.sev !== "crisis") return true;
              const match =
                idKeys.has(String(a.pid || "")) ||
                [...idKeys].some((x) =>
                  String(a.id || "").startsWith("a-" + x + "-crisis-btn"),
                );
              if (!match) return true;
              return (
                a.status === "closed" || a.status === "awaiting_patient"
              );
            },
          );
          // Crisis anteriores «esperando estoy bien» no deben reaparecer el botón.
          const stamp = Date.now();
          s.closedToday = (Array.isArray(s.closedToday) ? s.closedToday : []).map(
            (c: {
              sev?: string;
              pid?: string;
              status?: string;
              patientConfirmedAt?: number | null;
            }) => {
              if (
                c.sev === "crisis" &&
                idKeys.has(String(c.pid || "")) &&
                c.status === "awaiting_patient" &&
                !c.patientConfirmedAt
              ) {
                return {
                  ...c,
                  status: "closed",
                  patientConfirmedAt: stamp,
                };
              }
              return c;
            },
          );
        });
        const now = Date.now();
        const cuidLoc = P.crisisPromptLoc as CrisisLoc | null | undefined;
        const patientLoc = pendingLocRef.current;
        const seedCandidates = [patientLoc, cuidLoc].filter(
          (x): x is CrisisLoc =>
            !!x &&
            Number.isFinite(Number(x.lat)) &&
            Number.isFinite(Number(x.lng)),
        );
        seedCandidates.sort(
          (a, b) => Number(b.at || 0) - Number(a.at || 0),
        );
        const seedLoc = seedCandidates[0];
        const loc: CrisisLoc | undefined = seedLoc
          ? {
              lat: Number(seedLoc.lat),
              lng: Number(seedLoc.lng),
              accuracy: seedLoc.accuracy,
              until: crisisLocUntil(now),
              at: Number(seedLoc.at) || now,
            }
          : undefined;
        const alertaPayload = {
          id: "a-" + id + "-crisis-btn-" + now,
          sev: "crisis" as const,
          pid: id,
          name: displayName,
          age: Number.isFinite(ageN) && ageN > 0 ? ageN : undefined,
          place: place || undefined,
          profile: profile || undefined,
          what: "Tocó «Estoy en crisis» → Ayuda en la app.",
          source: "Botón Estoy en crisis · app",
          phone: phone || undefined,
          expert: P.expert || undefined,
          createdBy: displayName,
          createdByRole: "paciente",
          ...(loc ? { loc } : {}),
        };
        store.addAlert(alertaPayload);
        pauseLiveHydrate(6_000);
        // Escritura atómica en servidor (como cuidador) + app-state + ficha.
        void Promise.all([
          fetch("/api/alerts", {
            credentials: "same-origin",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alertaPayload),
          }).catch(() => null),
          flushPersist(store),
          fetch("/api/people", {
            credentials: "same-origin",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              name: displayName,
              status: "Crisis",
              signal: "Crisis",
            }),
          }),
          fetch("/api/patients", {
            credentials: "same-origin",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              name: displayName,
              status: "Crisis",
              signal: "Crisis",
              crisisLock: true,
              crisisAttendedAt: null,
              crisisAttendedOutcome: null,
              crisisBtnReady: false,
              crisisPromptAt: null,
            }),
          }),
        ]).catch(() => {});
      })();
    },
    /** Solo tras atención clínica: sale de la pantalla roja y vuelve a la normalidad. */
    confirmWell: () => {
      if (confirmWellBusyRef.current) return;
      const localId = pidRef.current;
      const { P, id, accountId } = resolvePatientRow(store, localId);
      const canon = String(id || localId || "");
      const ids = [canon, localId, accountId].filter(Boolean) as string[];
      if (!canon || !crisisWasAttended(store.get(), ids, P)) return;
      confirmWellBusyRef.current = true;
      setConfirmWellBusy(true);
      wellConfirmedRef.current = { pid: canon, until: Date.now() + 120_000 };
      rememberWellConfirmed(canon);
      if (accountId) rememberWellConfirmed(accountId);
      if (localId && localId !== canon) rememberWellConfirmed(localId);
      const displayName = String(P.name || "Paciente");
      // Cerrar UI de inmediato (un solo log; no spam) y cortar GPS.
      setHelp(false);
      setHelpSent(false);
      setLocShare("idle");
      pendingLocRef.current = null;
      if (locWatchRef.current != null && typeof navigator !== "undefined") {
        try {
          navigator.geolocation.clearWatch(locWatchRef.current);
        } catch {
          /* ignore */
        }
        locWatchRef.current = null;
      }
      pauseLiveHydrate(30_000);
      const activeAt = Date.now();
      lastActivityRef.current = activeAt;
      const confirmedAt = Date.now();
      store.set((s: any) => {
        s.patients = s.patients || {};
        const patchRow = (key: string) => {
          if (!key || !s.patients[key]) return;
          s.patients[key].status = "Activo";
          s.patients[key].signal = "Activo";
          s.patients[key].crisisLock = false;
          s.patients[key].inactiveLock = false;
          s.patients[key].activeAt = activeAt;
          s.patients[key].crisisAttendedAt = null;
          s.patients[key].crisisAttendedOutcome = null;
          s.patients[key].crisisBtnReady = true;
          s.patients[key].crisisBtnReadyAt = activeAt;
          s.patients[key].crisisPromptAt = null;
          s.patients[key].crisisPromptLoc = null;
        };
        const row = s.patients[canon] || { id: canon, name: displayName };
        row.id = canon;
        row.name = displayName;
        s.patients[canon] = row;
        patchRow(canon);
        if (localId !== canon) patchRow(localId);
        if (accountId && accountId !== canon) patchRow(accountId);
        const pe = (s.people || []).find(
          (p: { id?: string; accountId?: string }) =>
            p.id === canon || p.accountId === localId || p.accountId === accountId,
        );
        if (pe) {
          pe.status = "Activo";
          pe.signal = "Activo";
          pe.inactiveLock = false;
          pe.crisisLock = false;
          pe.activeAt = activeAt;
        }
        const idSet = new Set(ids.map(String));
        const stopLoc = (row: { loc?: CrisisLoc | null }) => {
          if (!row?.loc) return;
          row.loc = {
            ...row.loc,
            until: confirmedAt,
            at: Math.min(Number(row.loc.at) || confirmedAt, confirmedAt),
          };
        };
        // Cerrar alertas aún abiertas (si el sync no las había movido).
        s.alerts = Array.isArray(s.alerts) ? s.alerts : [];
        s.closedToday = Array.isArray(s.closedToday) ? s.closedToday : [];
        const stillOpen = s.alerts.filter(
          (a: { sev?: string; pid?: string; id?: string }) =>
            a.sev === "crisis" &&
            (idSet.has(String(a.pid || "")) ||
              ids.some((x) => String(a.id || "").startsWith("a-" + x + "-crisis-btn"))),
        );
        s.alerts = s.alerts.filter(
          (a: { sev?: string; pid?: string; id?: string }) =>
            !(
              a.sev === "crisis" &&
              (idSet.has(String(a.pid || "")) ||
                ids.some((x) =>
                  String(a.id || "").startsWith("a-" + x + "-crisis-btn"),
                ))
            ),
        );
        for (const a of stillOpen) {
          a.status = "closed";
          a.patientConfirmedAt = confirmedAt;
          a.closedAt = confirmedAt;
          a.closedBy = displayName;
          stopLoc(a);
          s.closedToday.unshift(a);
        }
        s.closedToday.forEach(
          (c: {
            sev?: string;
            pid?: string;
            id?: string;
            status?: string;
            patientConfirmedAt?: number | null;
            closedAt?: number | null;
            closedBy?: string | null;
            loc?: CrisisLoc | null;
          }) => {
            const match =
              c.sev === "crisis" &&
              (idSet.has(String(c.pid || "")) ||
                ids.some((x) =>
                  String(c.id || "").startsWith("a-" + x + "-crisis-btn"),
                ));
            if (!match) return;
            stopLoc(c);
            if (c.patientConfirmedAt) return;
            c.status = "closed";
            c.patientConfirmedAt = confirmedAt;
            c.closedAt = confirmedAt;
            c.closedBy = displayName;
          },
        );
        if (typeof store.pushCrisisLog === "function") {
          store.pushCrisisLog(s, {
            type: "closed",
            pid: canon,
            name: displayName,
            by: displayName,
            byRole: "paciente",
            what: "Paciente confirmó «estoy bien» · crisis cerrada",
            detail: "Estado Crisis → Activo · servicios reactivados",
            status: "closed",
          });
          store.pushCrisisLog(s, {
            type: "status_changed",
            pid: canon,
            name: displayName,
            by: displayName,
            byRole: "paciente",
            what: "Paciente confirmó «estoy bien»",
            detail: "Estado Crisis → Activo · servicios reactivados",
            status: "Activo",
          });
        }
      });
      void (async () => {
        let apiId = canon;
        try {
          const meRes = await fetch("/api/patients/me", {
            credentials: "same-origin",
          });
          const meData = (await meRes.json()) as {
            ok?: boolean;
            patient?: { id?: string };
          };
          if (meRes.ok && meData.ok && meData.patient?.id) {
            apiId = String(meData.patient.id);
            rememberWellConfirmed(apiId);
          }
        } catch {
          /* usar canon */
        }
        try {
          await Promise.all([
            fetch("/api/people", {
              credentials: "same-origin",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: apiId,
                name: displayName,
                status: "Activo",
                crisisLock: false,
                inactiveLock: false,
                activeAt,
              }),
            }),
            fetch("/api/patients", {
              credentials: "same-origin",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: apiId,
                name: displayName,
                status: "Activo",
                signal: "Activo",
                crisisLock: false,
                inactiveLock: false,
                activeAt,
                crisisAttendedAt: null,
                crisisAttendedOutcome: null,
                crisisBtnReady: true,
                crisisPromptAt: null,
              }),
            }),
          ]);
        } catch {
          /* reintento vía sync más adelante */
        }
        // Persistir ya y dejar que admin/clínico hidraten el Activo en vivo.
        pauseLiveHydrate(2_000);
        await flushPersistWhenReady(store);
        confirmWellBusyRef.current = false;
        setConfirmWellBusy(false);
      })();
    },
    /** Inactividad: pantalla amarilla hasta «Volví» (sin alertas). */
    inactiveOpen: (() => {
      const localId = pidRef.current;
      const { P, id, accountId } = resolvePatientRow(store, localId);
      const ids = [id, accountId, localId].filter(Boolean);
      const back = backConfirmedRef.current;
      if (
        back &&
        Date.now() < back.until &&
        ids.some((x) => x === back.pid)
      ) {
        return false;
      }
      if (help || helpSent) return false;
      if (P.crisisLock === true || /^crisis$/i.test(String(P.status || ""))) {
        return false;
      }
      return (
        inactiveOpen ||
        P.inactiveLock === true ||
        /^inactivo$/i.test(String(P.status || P.signal || ""))
      );
    })(),
    confirmBackBusy,
    /** Sale de inactividad: Activo de nuevo, sin más efectos. */
    confirmBack: () => {
      if (confirmBackBusyRef.current) return;
      const localId = pidRef.current;
      const { P, id, accountId } = resolvePatientRow(store, localId);
      const canon = String(id || localId || "");
      if (!canon) return;
      confirmBackBusyRef.current = true;
      setConfirmBackBusy(true);
      backConfirmedRef.current = { pid: canon, until: Date.now() + 60_000 };
      const activeAt = Date.now();
      lastActivityRef.current = activeAt;
      const displayName = String(P.name || "Paciente");
      setInactiveOpen(false);
      pauseLiveHydrate(12_000);
      store.set((s: any) => {
        s.patients = s.patients || {};
        const row = s.patients[canon] || { id: canon, name: displayName };
        row.status = "Activo";
        row.signal = "Activo";
        row.inactiveLock = false;
        row.activeAt = activeAt;
        s.patients[canon] = row;
        if (localId !== canon && s.patients[localId]) {
          s.patients[localId].status = "Activo";
          s.patients[localId].inactiveLock = false;
          s.patients[localId].activeAt = activeAt;
        }
        if (accountId && accountId !== canon && s.patients[accountId]) {
          s.patients[accountId].status = "Activo";
          s.patients[accountId].inactiveLock = false;
          s.patients[accountId].activeAt = activeAt;
        }
        const pe = (s.people || []).find(
          (p: { id?: string; accountId?: string }) =>
            p.id === canon || p.accountId === localId || p.accountId === accountId,
        );
        if (pe) {
          pe.status = "Activo";
          pe.inactiveLock = false;
          pe.activeAt = activeAt;
        }
      });
      void (async () => {
        try {
          await Promise.all([
            apiFetch("/api/accounts/me", {
              method: "PATCH",
              body: JSON.stringify({ touch: true }),
            }),
            fetch("/api/people", {
              credentials: "same-origin",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: canon,
                name: displayName,
                status: "Activo",
                inactiveLock: false,
                activeAt,
              }),
            }),
            fetch("/api/patients", {
              credentials: "same-origin",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: canon,
                name: displayName,
                status: "Activo",
                signal: "Activo",
                inactiveLock: false,
                activeAt,
              }),
            }),
          ]);
        } catch {
          /* sync más adelante */
        }
        pauseLiveHydrate(6_000);
        await flushPersistWhenReady(store);
        confirmBackBusyRef.current = false;
        setConfirmBackBusy(false);
      })();
    },
    dianaLines: ((DP.place || "").includes("Salento") ? rosaLines : dianaLines),
    rosaLines,
    waMapped,
    waQuick: waQuick.map((label) => ({ label, go: () => waAnswer(label) })),
    waInput,
    setWaInput,
    waSendText,
    waEmpty: !waInput.trim(),
    waHasText: !!waInput.trim(),
    onBreathDone,
  };
}
