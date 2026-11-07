"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type CrisisLoc,
  crisisLocUntil,
} from "@/lib/crisis/crisisLocation";
import { pauseLiveHydrate } from "@/lib/store/hydrateProgram";
import { LIVE_CUIDADOR, useLiveProgramSync } from "@/lib/store/liveSync";
import { useNaraStore } from "@/providers/nara-provider";

export type CuidadorTab = "resumen" | "citas" | "avisos";

export type PersonaVinculada = {
  id: string;
  name: string;
  age?: number | string;
  place?: string;
  status?: string;
  nextVisit?: string;
  profile?: string;
  phone?: string;
  expert?: string;
};

export type CrisisAviso = {
  id: string;
  name: string;
  what: string;
  source: string;
  statusLabel: string;
  status: string;
  sevLabel: string;
  ago: string;
  meta: string;
  outcome?: string;
  takenBy?: string;
  at: number;
  readonly: true;
};

export type LocShareState =
  | "idle"
  | "asking"
  | "sharing"
  | "denied"
  | "unavailable";

function isLinkedToCaregiver(
  row: Record<string, unknown>,
  caregiverId: string,
): boolean {
  const ids = [
    row.caregiverId,
    row.caregiverAccountId,
    row.cuidadorId,
    row.cuidadoraId,
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  if (ids.includes(caregiverId)) return true;
  const list = row.caregivers || row.vinculos;
  if (Array.isArray(list)) {
    return list.some((v) => {
      if (typeof v === "string") return v === caregiverId;
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        return [o.id, o.accountId, o.caregiverId]
          .map(String)
          .includes(caregiverId);
      }
      return false;
    });
  }
  return false;
}

function agoText(at: number) {
  const ms = Math.max(0, Date.now() - Number(at || 0));
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "hace un momento";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

function statusLabel(st: string) {
  if (st === "new") return "Por tomar";
  if (st === "mine" || st === "retry") return "En atención";
  if (st === "other") return "En atención (equipo)";
  if (st === "awaiting_patient") return "Esperando al paciente";
  if (st === "closed") return "Cerrada";
  return st || "Abierta";
}

function readGpsOnce(): Promise<CrisisLoc | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const now = Date.now();
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: now,
          until: crisisLocUntil(now),
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 5_000 },
    );
  });
}

export function useCuidadorScreen() {
  const store = useNaraStore();
  useLiveProgramSync({ parts: LIVE_CUIDADOR, intervalMs: 5_000 });
  const router = useRouter();
  const [tab, setTab] = useState<CuidadorTab>("resumen");
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [locShare, setLocShare] = useState<LocShareState>("idle");
  const locWatchRef = useRef<number | null>(null);
  const lastLocFlushRef = useRef(0);
  const shareForIdRef = useRef("");
  /** Id de la alerta de crisis creada desde este teléfono (para refrescar GPS). */
  const activeAlertIdRef = useRef("");

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);

  const session = store.session() as {
    id?: string;
    name?: string;
    role?: string;
    roleId?: string;
    href?: string;
  } | null;

  useEffect(() => {
    const roleId = session?.roleId;
    const ok =
      roleId === "cuidador" || /Cuidador/i.test(String(session?.role || ""));
    if (!session || !ok) {
      router.replace(
        session?.href ? `${session.href}?acceso=denegado` : "/ingreso",
      );
    }
  }, [session, router]);

  const personas = useMemo(() => {
    void tick;
    if (!session?.id) return [] as PersonaVinculada[];
    const S = store.get() as {
      people?: Record<string, unknown>[];
      patients?: Record<string, Record<string, unknown>>;
    };
    const byId = new Map<string, PersonaVinculada>();

    const push = (raw: Record<string, unknown>) => {
      if (!isLinkedToCaregiver(raw, session.id!)) return;
      const id = String(raw.id || raw.personId || raw.code || "").trim();
      if (!id) return;
      byId.set(id, {
        id,
        name: String(raw.name || "Persona vinculada"),
        age: (raw.age as number | string | undefined) ?? undefined,
        place: String(raw.place || raw.terr || "").trim() || undefined,
        status: String(raw.status || raw.signal || "").trim() || undefined,
        nextVisit:
          String(raw.nextVisit || raw.proximaVisita || "").trim() || undefined,
        profile: String(raw.profile || "").trim() || undefined,
        phone: String(raw.phone || "").trim() || undefined,
        expert: String(raw.expert || "").trim() || undefined,
      });
    };

    for (const p of S.people || []) push(p as Record<string, unknown>);
    for (const p of Object.values(S.patients || {})) {
      if (p && typeof p === "object") push(p);
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "es"),
    );
  }, [store, session?.id, tick]);

  useEffect(() => {
    if (!selectedId && personas[0]) setSelectedId(personas[0].id);
    if (selectedId && !personas.some((p) => p.id === selectedId)) {
      setSelectedId(personas[0]?.id || "");
    }
  }, [personas, selectedId]);

  const selected = personas.find((p) => p.id === selectedId) || null;

  const selectedInCrisis = useMemo(() => {
    void tick;
    if (!selected) return false;
    if (/^crisis$/i.test(String(selected.status || ""))) return true;
    const S = store.get() as {
      alerts?: Array<{ sev?: string; pid?: string; status?: string; id?: string }>;
      patients?: Record<string, { crisisLock?: boolean; status?: string }>;
    };
    const P = S.patients?.[selected.id];
    if (P?.crisisLock || /^crisis$/i.test(String(P?.status || ""))) return true;
    const open = (S.alerts || []).find(
      (a) =>
        a.sev === "crisis" &&
        String(a.pid) === selected.id &&
        a.status !== "closed" &&
        a.status !== "awaiting_patient",
    );
    if (open?.id) activeAlertIdRef.current = String(open.id);
    return !!open;
  }, [selected, store, tick]);

  /** Crisis de personas a cargo — mismo contenido que clínico/admin, solo lectura. */
  const crisisAvisos = useMemo(() => {
    void tick;
    const linked = new Set(personas.map((p) => p.id));
    if (!linked.size) return [] as CrisisAviso[];
    const S = store.get() as {
      alerts?: Array<Record<string, unknown>>;
      closedToday?: Array<Record<string, unknown>>;
    };
    const rows: CrisisAviso[] = [];
    const push = (a: Record<string, unknown>, forceStatus?: string) => {
      if (a.sev !== "crisis") return;
      const pid = String(a.pid || "");
      if (!linked.has(pid)) return;
      const st = forceStatus || String(a.status || "new");
      if (st === "closed" && !a.patientConfirmedAt && !a.outcome) return;
      const name = String(
        a.name || personas.find((p) => p.id === pid)?.name || "Persona",
      );
      const bits = [
        a.age != null ? `${a.age} años` : null,
        a.place ? String(a.place) : null,
        a.profile && /^P\d+$/i.test(String(a.profile))
          ? String(a.profile)
          : null,
      ].filter(Boolean);
      rows.push({
        id: String(a.id || `${pid}-${a.at}`),
        name,
        what: String(a.what || "Alerta de crisis"),
        source: String(a.source || "Crisis"),
        status: st,
        statusLabel: statusLabel(st),
        sevLabel: "Crisis",
        ago: agoText(Number(a.at || 0)),
        meta: bits.join(" · "),
        outcome: a.outcome ? String(a.outcome) : undefined,
        takenBy: a.takenBy ? String(a.takenBy) : undefined,
        at: Number(a.at || a.attendedAt || 0),
        readonly: true,
      });
    };
    for (const a of S.alerts || []) {
      const st = String(a.status || "");
      if (st === "closed" || st === "awaiting_patient") continue;
      push(a);
    }
    for (const c of S.closedToday || []) {
      const st = String(c.status || "");
      if (st !== "awaiting_patient" && st !== "closed") continue;
      push(c, st);
    }
    const byId = new Map<string, CrisisAviso>();
    for (const r of rows) {
      const prev = byId.get(r.id);
      if (!prev || r.at >= prev.at) byId.set(r.id, r);
    }
    return Array.from(byId.values()).sort((a, b) => b.at - a.at);
  }, [personas, store, tick]);

  const avisos = useMemo(() => {
    void tick;
    if (!session?.id) return [] as { id: string; text: string; at: number }[];
    const S = store.get() as {
      notifs?: Record<string, { id?: string; text?: string; at?: number }[]>;
    };
    return (S.notifs?.[session.id] || [])
      .map((n, i) => ({
        id: String(n.id || `n-${i}`),
        text: String(n.text || "Aviso"),
        at: Number(n.at || 0),
      }))
      .sort((a, b) => b.at - a.at);
  }, [store, session?.id, tick]);

  const citas = useMemo(() => {
    return personas
      .filter((p) => p.nextVisit)
      .map((p) => ({
        id: p.id,
        name: p.name,
        when: p.nextVisit!,
        place: p.place || "",
      }));
  }, [personas]);

  // GPS del cuidador mientras haya crisis activa (seguridad: el paciente puede no poder).
  useEffect(() => {
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

    if (!selectedInCrisis || !selected) {
      stopWatch();
      shareForIdRef.current = "";
      if (locShare !== "idle") setLocShare("idle");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocShare("unavailable");
      return;
    }

    const pid = selected.id;
    const pname = selected.name;
    shareForIdRef.current = pid;

    const flushLoc = (loc: CrisisLoc) => {
      store.set(
        (s: { patients?: Record<string, Record<string, unknown>> }) => {
          s.patients = s.patients || {};
          const row =
            s.patients[pid] ||
            ({ id: pid, name: pname } as Record<string, unknown>);
          row.crisisPromptLoc = loc;
          s.patients[pid] = row;
        },
      );
      const now = Date.now();
      if (now - lastLocFlushRef.current < 8_000) return;
      lastLocFlushRef.current = now;
      const alertId = activeAlertIdRef.current;
      void Promise.all([
        fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: pid,
            name: pname,
            crisisPromptLoc: loc,
          }),
        }).catch(() => null),
        alertId
          ? fetch("/api/alerts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                id: alertId,
                sev: "crisis",
                pid,
                name: pname,
                loc,
              }),
            }).catch(() => null)
          : Promise.resolve(null),
      ]);
    };

    const writeLoc = (coords: GeolocationCoordinates) => {
      if (shareForIdRef.current !== pid) return;
      const now = Date.now();
      const loc: CrisisLoc = {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        at: now,
        until: crisisLocUntil(now),
      };
      flushLoc(loc);
      setLocShare("sharing");
    };

    let cancelled = false;
    const startId = window.setTimeout(() => {
      if (cancelled) return;
      setLocShare((prev) => (prev === "sharing" ? prev : "asking"));
      navigator.geolocation.getCurrentPosition(
        (pos) => writeLoc(pos.coords),
        (e) => {
          setLocShare(e.code === 1 ? "denied" : "unavailable");
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
      );
      if (locWatchRef.current == null) {
        locWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => writeLoc(pos.coords),
          (e) => {
            if (e.code === 1) setLocShare("denied");
          },
          {
            enableHighAccuracy: true,
            timeout: 20_000,
            maximumAge: 8_000,
          },
        );
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      stopWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInCrisis, selected?.id, selected?.name, store]);

  /**
   * El cuidador reporta la crisis en nombre de la persona (si ella no puede).
   * Crea la alerta al instante → clínico/admin + pantalla roja del paciente ya avisada.
   */
  const reportCrisis = useCallback(async () => {
    if (!selected || !session?.id || busy) return;
    if (selectedInCrisis) {
      setTab("avisos");
      setMsg("Ya hay una crisis activa. Sígala en Avisos.");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    setLocShare("asking");

    const now = Date.now();
    const pid = selected.id;
    const ageN = Number(selected.age);
    const alertId = `a-${pid}-crisis-cuid-${now}`;
    const loc = await readGpsOnce();
    if (loc) setLocShare("sharing");

    const alertaPayload = {
      id: alertId,
      sev: "crisis" as const,
      pid,
      name: selected.name,
      age: Number.isFinite(ageN) && ageN > 0 ? ageN : undefined,
      place: selected.place || undefined,
      profile: selected.profile || undefined,
      what: "El cuidador reportó una crisis desde la app.",
      source: "Cuidador · Reportar crisis",
      phone: selected.phone || undefined,
      expert: selected.expert || undefined,
      createdBy: session.name || session.id,
      createdByRole: "cuidador",
      ...(loc ? { loc } : {}),
    };

    // Optimista: tablero local + ficha en Crisis.
    store.set(
      (s: {
        patients?: Record<string, Record<string, unknown>>;
        people?: Array<Record<string, unknown>>;
      }) => {
        s.patients = s.patients || {};
        const row =
          s.patients[pid] ||
          ({ id: pid, name: selected.name } as Record<string, unknown>);
        row.status = "Crisis";
        row.signal = "Crisis";
        row.crisisLock = true;
        row.crisisAttendedAt = null;
        row.crisisAttendedOutcome = null;
        row.crisisBtnReady = false;
        row.crisisPromptAt = null;
        if (loc) row.crisisPromptLoc = loc;
        s.patients[pid] = row;
        const pe = (s.people || []).find((p) => String(p.id) === pid);
        if (pe) {
          pe.status = "Crisis";
          pe.signal = "Crisis";
        }
      },
    );
    try {
      (
        store as {
          addAlert?: (a: Record<string, unknown>) => void;
        }
      ).addAlert?.(alertaPayload);
    } catch {
      /* addAlert puede no estar tipado */
    }
    activeAlertIdRef.current = alertId;
    pauseLiveHydrate(8_000);

    try {
      const [alertRes] = await Promise.all([
        fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(alertaPayload),
        }),
        loc
          ? fetch("/api/patients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                id: pid,
                name: selected.name,
                crisisPromptLoc: loc,
              }),
            }).catch(() => null)
          : Promise.resolve(null),
      ]);
      const data = (await alertRes.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!alertRes.ok || data.ok === false) {
        // Revertir optimista
        store.set(
          (s: {
            patients?: Record<string, Record<string, unknown>>;
            alerts?: Array<{ id?: string }>;
          }) => {
            if (s.patients?.[pid]) {
              s.patients[pid].status = selected.status || "Activo";
              s.patients[pid].signal = selected.status || "Activo";
              s.patients[pid].crisisLock = false;
            }
            if (Array.isArray(s.alerts)) {
              s.alerts = s.alerts.filter((a) => a.id !== alertId);
            }
          },
        );
        activeAlertIdRef.current = "";
        setLocShare("idle");
        setErr(
          data.error ||
            "No se pudo avisar al equipo. Intente de nuevo en un momento.",
        );
      } else {
        setMsg(
          `Crisis de ${selected.name} enviada al equipo clínico. Este teléfono comparte la ubicación.`,
        );
        setTab("avisos");
      }
    } catch {
      store.set(
        (s: {
          patients?: Record<string, Record<string, unknown>>;
          alerts?: Array<{ id?: string }>;
        }) => {
          if (s.patients?.[pid]) {
            s.patients[pid].status = selected.status || "Activo";
            s.patients[pid].signal = selected.status || "Activo";
            s.patients[pid].crisisLock = false;
          }
          if (Array.isArray(s.alerts)) {
            s.alerts = s.alerts.filter((a) => a.id !== alertId);
          }
        },
      );
      activeAlertIdRef.current = "";
      setLocShare("idle");
      setErr("Sin conexión. Intente de nuevo en un momento.");
    } finally {
      setBusy(false);
    }
  }, [selected, session, busy, selectedInCrisis, store]);

  return {
    session,
    tab,
    setTab,
    personas,
    selected,
    selectedId,
    setSelectedId,
    selectedInCrisis,
    selectedPromptPending: false,
    crisisAvisos,
    avisos,
    citas,
    helpOpen: false,
    helpSent: selectedInCrisis,
    openCrisisHelp: reportCrisis,
    closeCrisisHelp: () => {},
    confirmCrisis: reportCrisis,
    locShare,
    busy,
    msg,
    err,
    clearMsg: () => setMsg(""),
    clearErr: () => setErr(""),
  };
}
