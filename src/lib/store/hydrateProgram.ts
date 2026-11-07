import { apiFetch } from "@/lib/api/client";
import { baseRoleId } from "@/lib/db/roles";
import { hydrateAppState, pausePersist } from "@/lib/store/persist";

/** Marca Crisis en fichas con alerta abierta o esperando «estoy bien». */
function applyOpenCrisisToPatients(store: Store) {
  const S = store.get() as {
    alerts?: Array<{ sev?: string; status?: string; pid?: string }>;
    closedToday?: Array<{
      sev?: string;
      pid?: string;
      status?: string;
      patientConfirmedAt?: number | null;
      closedAt?: number | null;
    }>;
    patients?: Record<string, Record<string, unknown>>;
    people?: Array<Record<string, unknown> & { id?: string }>;
  };
  const confirmedPids = new Set(
    (S.closedToday || [])
      .filter(
        (c) =>
          c.sev === "crisis" &&
          c.pid &&
          (c.patientConfirmedAt || c.status === "closed"),
      )
      .map((c) => String(c.pid)),
  );
  const openPids = new Set<string>();
  (S.alerts || []).forEach((a) => {
    if (a.sev !== "crisis" || !a.pid) return;
    const st = String(a.status || "");
    if (st !== "new" && st !== "mine" && st !== "retry" && st !== "other") {
      return;
    }
    if (confirmedPids.has(String(a.pid))) return;
    openPids.add(String(a.pid));
  });
  // Gestionada por clínico, aún sin «estoy bien»: el badge izquierdo sigue en Crisis.
  (S.closedToday || []).forEach((c) => {
    if (c.sev !== "crisis" || !c.pid || c.patientConfirmedAt) return;
    if (confirmedPids.has(String(c.pid))) return;
    const st = String(c.status || "");
    if (st === "awaiting_patient" || (!c.closedAt && st !== "closed")) {
      openPids.add(String(c.pid));
    }
  });
  if (!openPids.size) return;
  store.set((s: typeof S) => {
    s.patients = s.patients || {};
    openPids.forEach((pid) => {
      const mark = (row: Record<string, unknown> | undefined) => {
        if (!row) return;
        row.status = "Crisis";
        row.signal = "Crisis";
        row.crisisLock = true;
      };
      mark(s.patients![pid]);
      // Alias por accountId / id embebido (la app del paciente a veces lee por sesión).
      for (const row of Object.values(s.patients || {})) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        if (
          String(r.id || "") === pid ||
          String(r.accountId || "") === pid ||
          String(r.code || "") === pid
        ) {
          mark(r);
        }
      }
      const pe = (s.people || []).find((p) => String(p.id) === pid);
      if (pe) pe.status = "Crisis";
    });
  });
}

type Store = typeof import("@/lib/store/store").default;

async function hydrateTerritories(store: Store) {
  try {
    const res = await apiFetch("/api/territories");
    const data = (await res.json()) as {
      ok?: boolean;
      territories?: Array<Record<string, unknown> & { name: string; content?: string[] }>;
    };
    if (res.ok && data.ok && Array.isArray(data.territories)) {
      const seen = new Set<string>();
      const territories = data.territories.filter((t) => {
        const n = String(t.name || "").trim();
        if (!n || seen.has(n)) return false;
        seen.add(n);
        return true;
      });
      store.set((s: {
        territories: Record<string, unknown>[];
        terrOv: Record<string, { content?: string[] }>;
      }) => {
        s.territories = territories;
        s.terrOv = s.terrOv || {};
        territories.forEach((t) => {
          if (t.content?.length) {
            s.terrOv[t.name] = Object.assign({}, s.terrOv[t.name], { content: t.content });
          }
        });
      });
    }
  } catch {
    /* sin Mongo aún */
  }
}

async function hydrateExperts(store: Store) {
  try {
    const res = await apiFetch("/api/experts");
    const data = (await res.json()) as {
      ok?: boolean;
      experts?: Record<string, unknown>[];
    };
    if (res.ok && data.ok && Array.isArray(data.experts)) {
      store.set((s: { experts: Record<string, unknown>[] }) => {
        s.experts = data.experts!;
      });
    }
  } catch {
    /* sin expertos aún */
  }
}

async function hydrateAccounts(store: Store) {
  try {
    const res = await apiFetch("/api/accounts");
    const data = (await res.json()) as {
      ok?: boolean;
      accounts?: Record<string, unknown>[];
    };
    if (res.ok && data.ok && Array.isArray(data.accounts)) {
      store.set((s: { accounts: Record<string, unknown>[] }) => {
        s.accounts = data.accounts!;
      });
    }
  } catch {
    /* sin cuentas o sin permiso */
  }
}

let lastStaffLiveSig = "";

function staffPayloadSig(input: {
  people?: Record<string, unknown>[];
  flags?: Record<string, unknown>[];
  worklists?: Record<string, unknown>[];
  patients?: Record<string, unknown>[];
  assets?: Record<string, unknown>[];
}): string {
  const pe = (input.people || []).map((p) => [
    p.id,
    p.status,
    p.signal,
    p.profile,
    p.pendingEval === true,
    p.evalAt,
    p.expert,
  ]);
  const pa = (input.patients || []).map((p) => [
    p.id,
    p.status,
    p.signal,
    p.profile,
    p.pendingEval === true,
    p.modulesEnabled,
    p.modulesVisible,
    Array.isArray(p.timeline) ? p.timeline.length : 0,
    p.phq,
    p.crisisLock === true,
    p.crisisAttendedAt ?? null,
    p.crisisPromptAt ?? null,
    (p.crisisPromptLoc as { at?: number } | null | undefined)?.at ?? null,
  ]);
  return JSON.stringify({
    pe,
    pa,
    flags: (input.flags || []).length,
    wl: (input.worklists || []).length,
    assets: (input.assets || []).length,
  });
}

async function hydratePeopleFlagsWorklists(store: Store) {
  try {
    const [peopleRes, flagsRes, wlRes, patientsRes, assetsRes] = await Promise.all([
      apiFetch("/api/people"),
      apiFetch("/api/flags"),
      apiFetch("/api/worklists"),
      apiFetch("/api/patients"),
      // H-013: /api/assets es solo del admin; los demás roles no lo piden (antes daba 403 en consola).
      (store.session() as { roleId?: string | null } | null)?.roleId === "admin"
        ? apiFetch("/api/assets")
        : Promise.resolve(new Response(JSON.stringify({ ok: true, assets: [] }), { status: 200 })),
    ]);
    const peopleData = (await peopleRes.json()) as { ok?: boolean; people?: Record<string, unknown>[] };
    const flagsData = (await flagsRes.json()) as { ok?: boolean; flags?: Record<string, unknown>[] };
    const wlData = (await wlRes.json()) as {
      ok?: boolean;
      items?: Array<Record<string, unknown> & { expertId: string }>;
    };
    const patientsData = (await patientsRes.json()) as {
      ok?: boolean;
      patients?: Array<
        Record<string, unknown> & {
          id: string;
          name: string;
          profile?: string;
          phq?: number[];
          expert?: string;
          place?: string;
          age?: number;
        }
      >;
    };
    const assetsData = (await assetsRes.json()) as { ok?: boolean; assets?: Record<string, unknown>[] };

    const nextSig = staffPayloadSig({
      people: peopleRes.ok && peopleData.ok ? peopleData.people : undefined,
      flags: flagsRes.ok && flagsData.ok ? flagsData.flags : undefined,
      worklists: wlRes.ok && wlData.ok ? wlData.items : undefined,
      patients: patientsRes.ok && patientsData.ok ? patientsData.patients : undefined,
      assets: assetsRes.ok && assetsData.ok ? assetsData.assets : undefined,
    });
    if (nextSig === lastStaffLiveSig) return;
    lastStaffLiveSig = nextSig;

    store.set((s: {
      people: Record<string, unknown>[];
      flags: Record<string, unknown>[];
      worklists: Record<string, Record<string, unknown>[]>;
      patients: Record<string, Record<string, unknown>>;
      caseload: Record<string, unknown>[];
      assets: Record<string, unknown>[];
    }) => {
      if (peopleRes.ok && peopleData.ok && Array.isArray(peopleData.people)) {
        s.people = peopleData.people;
      }
      if (flagsRes.ok && flagsData.ok && Array.isArray(flagsData.flags)) {
        s.flags = flagsData.flags;
      }
      if (wlRes.ok && wlData.ok && Array.isArray(wlData.items)) {
        s.worklists = s.worklists || {};
        const byEx: Record<string, Record<string, unknown>[]> = {};
        wlData.items.forEach((item) => {
          const k = item.expertId;
          if (!byEx[k]) byEx[k] = [];
          byEx[k].push(item);
        });
        Object.keys(byEx).forEach((k) => {
          s.worklists[k] = byEx[k];
        });
      }
      if (patientsRes.ok && patientsData.ok && Array.isArray(patientsData.patients)) {
        s.patients = s.patients || {};
        s.caseload = [];
        const peopleRows = Array.isArray(s.people) ? s.people : [];
        const peopleById: Record<string, Record<string, unknown>> = {};
        const peopleByCode: Record<string, Record<string, unknown>> = {};
        peopleRows.forEach((pe) => {
          if (pe?.id) peopleById[String(pe.id)] = pe;
          if (pe?.code) peopleByCode[String(pe.code)] = pe;
        });
        const isProfile = (v: unknown) =>
          !!(v && /^P\d+$/i.test(String(v)));
        patientsData.patients.forEach((p) => {
          const pe =
            peopleById[p.id] ||
            (p.code ? peopleByCode[String(p.code)] : null) ||
            null;
          const merged = { ...p } as Record<string, unknown> & {
            id: string;
            name: string;
            profile?: string | null;
            status?: string;
            signal?: string;
            pendingEval?: boolean;
            phq?: number[];
            expert?: string;
            place?: string;
            age?: number;
          };
          if (pe) {
            if (!isProfile(merged.profile) && isProfile(pe.profile)) {
              merged.profile = String(pe.profile);
            }
            // Crisis en people o crisisLock en patients gana sobre Activo obsoleto.
            const peCrisis = /^crisis$/i.test(String(pe.status || ""));
            const lockCrisis = merged.crisisLock === true;
            if (peCrisis || lockCrisis) {
              merged.status = "Crisis";
              merged.signal = "Crisis";
              merged.crisisLock = true;
            } else if (
              (!merged.status || /^(nueva|activo|activa)$/i.test(String(merged.status))) &&
              pe.status
            ) {
              merged.status = String(pe.status);
            }
            // No pisar señales clínicas (Aceptado / Rechazado / Crisis) con el estado.
            const keepSignal = /^(Aceptado|Rechazado|Crisis)/i.test(
              String(merged.signal || ""),
            );
            if (!keepSignal) {
              // Legado: signal == status Activo tras aprobar → mostrar Aceptado.
              if (
                /^(activo|activa)$/i.test(String(merged.signal || merged.status || "")) &&
                /^(activo|activa)$/i.test(String(merged.status || pe.status || "")) &&
                isProfile(merged.profile)
              ) {
                merged.signal = "Aceptado";
              }
            }
            if (pe.pendingEval === true) merged.pendingEval = true;
            if (pe.activeAt != null && merged.activeAt == null) {
              merged.activeAt = pe.activeAt;
            }
            if (pe.inactiveLock === true) merged.inactiveLock = true;
            if (pe.evalAt != null && merged.evalAt == null) merged.evalAt = pe.evalAt;
            if (pe.evalBy != null && !merged.evalBy) merged.evalBy = pe.evalBy;
            if (pe.evalPhq != null && merged.evalPhq == null) merged.evalPhq = pe.evalPhq;
            if (pe.evalDig != null && merged.evalDig == null) merged.evalDig = pe.evalDig;
            if (pe.code && !merged.code) merged.code = pe.code;
            if (pe.expert && !merged.expert) merged.expert = pe.expert;
            if (pe.caregiverAccountId && !merged.caregiverAccountId) {
              merged.caregiverAccountId = pe.caregiverAccountId;
            }
            if (pe.caregiverId && !merged.caregiverId) {
              merged.caregiverId = pe.caregiverId;
            }
            if (pe.tieneCuidador === true) merged.tieneCuidador = true;
          }
          s.patients[merged.id] = {
            ...(s.patients[merged.id] || {}),
            ...merged,
          };
          s.caseload.push({
            id: merged.id,
            name: merged.name,
            age: merged.age,
            place: merged.place,
            profile: merged.profile,
            phq: Array.isArray(merged.phq) ? merged.phq[merged.phq.length - 1] : 0,
            expert: merged.expert,
            status: merged.status || merged.signal || null,
            pendingEval: merged.pendingEval === true,
          });
        });
        // Personas evaluadas en people sin ficha patients aún → caseload clínico.
        peopleRows.forEach((pe) => {
          const id = pe?.id ? String(pe.id) : "";
          if (!id || s.patients[id]) return;
          const pending =
            pe.pendingEval === true ||
            /por\s*aprobar/i.test(String(pe.status || ""));
          if (!pending && !isProfile(pe.profile)) return;
          s.patients[id] = {
            id,
            name: pe.name,
            age: pe.age || 0,
            place: pe.place || pe.terr || "",
            profile: isProfile(pe.profile) ? String(pe.profile) : null,
            status: pe.status || "Por aprobar",
            signal: pe.status || "Por aprobar",
            pendingEval: pe.pendingEval === true || pending,
            expert: pe.expert || "",
            code: pe.code || "",
            phq: pe.evalPhq != null ? [Number(pe.evalPhq)] : [],
            clin: pe.clin || null,
          };
          s.caseload.push({
            id,
            name: pe.name,
            age: pe.age || 0,
            place: pe.place || pe.terr || "",
            profile: isProfile(pe.profile) ? String(pe.profile) : null,
            phq: pe.evalPhq != null ? Number(pe.evalPhq) : 0,
            expert: pe.expert || "",
            status: pe.status || "Por aprobar",
            pendingEval: true,
          });
        });
      }
      if (assetsRes.ok && assetsData.ok && Array.isArray(assetsData.assets)) {
        s.assets = assetsData.assets;
      }
    });
  } catch {
    /* sin captación aún */
  }
}

/** Firma de campos que la UI del paciente debe reflejar en vivo. */
function patientLiveSig(p: Record<string, unknown> | undefined | null): string {
  if (!p) return "";
  return JSON.stringify({
    profile: p.profile ?? null,
    status: p.status ?? null,
    signal: p.signal ?? null,
    pendingEval: p.pendingEval === true,
    modulesEnabled: p.modulesEnabled ?? null,
    modulesVisible: p.modulesVisible ?? null,
    phq: p.phq ?? null,
    next: p.next ?? null,
    nextShort: p.nextShort ?? null,
    braceletStatus: p.braceletStatus ?? null,
    lastSession: p.lastSession ?? null,
    consent: p.consent ?? null,
    plan: p.plan ?? null,
    timelineLen: Array.isArray(p.timeline) ? p.timeline.length : 0,
    crisisLock: p.crisisLock === true,
    crisisAttendedAt: p.crisisAttendedAt ?? null,
    crisisAttendedOutcome: p.crisisAttendedOutcome ?? null,
    crisisBtnReady: p.crisisBtnReady === true,
    crisisPromptAt: p.crisisPromptAt ?? null,
    crisisPromptLocAt:
      (p.crisisPromptLoc as { at?: number } | null | undefined)?.at ?? null,
  });
}

async function hydratePatientSelf(store: Store) {
  try {
    const res = await apiFetch("/api/patients/me");
    const data = (await res.json()) as {
      ok?: boolean;
      patient?: Record<string, unknown> & { id: string; accountId?: string };
    };
    if (res.ok && data.ok && data.patient?.id) {
      const id = data.patient.id;
      const accountId = data.patient.accountId
        ? String(data.patient.accountId)
        : "";
      const prev = (store.get().patients || {})[id] as Record<string, unknown> | undefined;
      const merged = { ...(prev || {}), ...data.patient };
      // Normalizar attendedAt (API / BSON).
      if (merged.crisisAttendedAt != null) {
        const n = Number(merged.crisisAttendedAt);
        merged.crisisAttendedAt = Number.isFinite(n) && n > 0 ? n : null;
      }
      const closedToday = (
        store.get() as {
          closedToday?: Array<{
            sev?: string;
            pid?: string;
            status?: string;
            patientConfirmedAt?: number | null;
          }>;
        }
      ).closedToday || [];
      const openCrisis = (
        (store.get() as { alerts?: Array<{ sev?: string; status?: string; pid?: string }> })
          .alerts || []
      ).some(
        (a) =>
          a.sev === "crisis" &&
          a.status !== "closed" &&
          a.status !== "awaiting_patient" &&
          (a.pid === id || a.pid === accountId || String(a.pid) === id),
      );
      // Episodio actual esperando «estoy bien» (no historial cerrado).
      const awaitingWell = closedToday.some(
        (c) =>
          c.sev === "crisis" &&
          (c.pid === id || c.pid === accountId) &&
          c.status === "awaiting_patient" &&
          !c.patientConfirmedAt,
      );
      const remoteAttendedAt = (() => {
        const n = Number(data.patient.crisisAttendedAt);
        return Number.isFinite(n) && n > 0 ? n : 0;
      })();
      const remoteInCrisis =
        data.patient.crisisLock === true ||
        /^crisis$/i.test(String(data.patient.status || "")) ||
        remoteAttendedAt > 0 ||
        awaitingWell ||
        openCrisis;
      // Solo «confirmó bien» del episodio actual: no usar cierres viejos del mismo día
      // (si no, al recargar se fuerza Activo y desaparece «estoy bien»).
      const patientConfirmed =
        !remoteInCrisis &&
        closedToday.some(
          (c) =>
            c.sev === "crisis" &&
            !!c.patientConfirmedAt &&
            (c.pid === id || c.pid === accountId),
        );
      let sessionWell = false;
      try {
        if (typeof window !== "undefined") {
          const now = Date.now();
          for (const key of [id, accountId].filter(Boolean)) {
            const raw = window.sessionStorage.getItem(
              "nara:well-confirmed:" + key,
            );
            const until = Number(raw || 0);
            if (Number.isFinite(until) && now < until) {
              sessionWell = true;
              break;
            }
          }
        }
      } catch {
        /* private mode */
      }
      // Si hay crisis activa en servidor/cola, ignorar well local y borrar el flag
      // (si no, la app del paciente no vuelve a pintar la pantalla roja).
      if (remoteInCrisis) {
        sessionWell = false;
        try {
          if (typeof window !== "undefined") {
            for (const key of [id, accountId].filter(Boolean)) {
              window.sessionStorage.removeItem("nara:well-confirmed:" + key);
            }
          }
        } catch {
          /* private mode */
        }
      }
      const remoteCleared =
        data.patient.crisisLock === false &&
        /^activo$/i.test(String(data.patient.status || "")) &&
        !awaitingWell &&
        remoteAttendedAt <= 0;
      // Tras «estoy bien» local: no dejar que un /me obsoleto vuelva a Crisis.
      const localJustCleared =
        (Date.now() < suppressLiveUntil || sessionWell || patientConfirmed) &&
        (prev?.crisisLock === false || sessionWell || patientConfirmed) &&
        (/^activo$/i.test(String(prev?.status || "")) ||
          sessionWell ||
          patientConfirmed);
      if (
        (localJustCleared || sessionWell || patientConfirmed) &&
        !remoteCleared &&
        !remoteInCrisis
      ) {
        merged.status = "Activo";
        merged.signal = "Activo";
        merged.crisisLock = false;
        merged.crisisAttendedAt = null;
        merged.crisisAttendedOutcome = null;
        merged.crisisBtnReady = true;
      } else if (!remoteCleared) {
        const stillLocked =
          openCrisis ||
          awaitingWell ||
          merged.crisisLock === true ||
          remoteAttendedAt > 0 ||
          (prev?.crisisLock === true && data.patient.crisisLock !== false);
        if (stillLocked && !sessionWell && !patientConfirmed) {
          merged.status = "Crisis";
          merged.signal = "Crisis";
          merged.crisisLock = true;
        }
        // Remoto gana si ya marcó atendido; si no, conservar local.
        if (remoteAttendedAt > 0) {
          merged.crisisAttendedAt = remoteAttendedAt;
          merged.crisisAttendedOutcome =
            data.patient.crisisAttendedOutcome ?? merged.crisisAttendedOutcome;
        } else if (prev?.crisisAttendedAt && stillLocked) {
          merged.crisisAttendedAt = prev.crisisAttendedAt;
          merged.crisisAttendedOutcome = prev.crisisAttendedOutcome ?? null;
        }
      }
      if (patientLiveSig(prev) === patientLiveSig(merged)) return;
      store.set((s: { patients: Record<string, Record<string, unknown>> }) => {
        s.patients = s.patients || {};
        s.patients[id] = merged;
        // Alias por accountId para lecturas con id de sesión.
        if (accountId && accountId !== id) {
          s.patients[accountId] = { ...merged, id };
        }
      });
    }
  } catch {
    /* sin ficha aún */
  }
}

let inFlight: Promise<void> | null = null;
let lastHydratedSessionId: string | null = null;
/** Evita que un poll pise un write local recién enviado a la API. */
let suppressLiveUntil = 0;

/** Pausar el sync forzado tras mutaciones locales (tope 3s para no “congelar” la UI). */
export function pauseLiveHydrate(ms = 3_000) {
  const capped = Math.min(Math.max(0, Number(ms) || 0), 3_000);
  suppressLiveUntil = Date.now() + (capped || 3_000);
  lastStaffLiveSig = "";
}

const PATH_RETIRADO = new Set(["tech", "revisit", "cursos"]);

/**
 * Activo + modules vacíos (legado experto «Por aprobar») → copiar ids de la ruta.
 * Así la app del paciente no queda en blanco aunque Mongo aún tenga [].
 */
function healActivoModulesFromPath(store: Store) {
  const S = store.get() as {
    patients?: Record<string, Record<string, unknown>>;
    pathOverrides?: Record<string, { s?: Record<string, string> }>;
  };
  const patients = S.patients || {};
  const patches: Array<{ key: string; mods: string[] }> = [];
  Object.keys(patients).forEach((key) => {
    const p = patients[key];
    if (!p) return;
    if (!/^activo$/i.test(String(p.status || p.signal || ""))) return;
    const en = p.modulesEnabled;
    const vis = p.modulesVisible;
    const profile = String(p.profile || "");
    if (!/^P\d+$/i.test(profile)) return;
    try {
      const { r, d } = store.parseCode(profile);
      if (r < 0 || d < 0) return;
      const ctx =
        typeof store.ctxFor === "function"
          ? store.ctxFor(String(p.id || key))
          : p.ctx;
      const mods = (
        typeof store.appModuleIdsFromPath === "function"
          ? (store.appModuleIdsFromPath(r, d, null, ctx) as string[])
          : ((store.pathList(r, d, null, ctx) || []) as { id: string }[]).map(
              (x) => x.id,
            )
      ).filter((id) => id && !PATH_RETIRADO.has(id));
      if (!mods.length) return;
      const enArr = Array.isArray(en) ? en.map(String) : [];
      const visArr = Array.isArray(vis) ? vis.map(String) : [];
      const enEmpty = enArr.length === 0;
      const visEmpty = visArr.length === 0;
      const enMissing = mods.some((id) => !enArr.includes(id));
      const visMissing = mods.some((id) => !visArr.includes(id));
      // Vacío (legado) o snapshot viejo sin servicios nuevos de la ruta (p. ej. juegos).
      if (!enEmpty && !visEmpty && !enMissing && !visMissing) return;
      patches.push({ key, mods });
    } catch {
      /* ignore */
    }
  });
  if (!patches.length) return;
  store.set((s: { patients?: Record<string, Record<string, unknown>> }) => {
    s.patients = s.patients || {};
    patches.forEach(({ key, mods }) => {
      const p = s.patients![key];
      if (!p) return;
      const enArr = Array.isArray(p.modulesEnabled)
        ? (p.modulesEnabled as string[]).map(String)
        : [];
      const visArr = Array.isArray(p.modulesVisible)
        ? (p.modulesVisible as string[]).map(String)
        : [];
      p.modulesEnabled = Array.from(new Set([...enArr, ...mods]));
      p.modulesVisible = Array.from(
        new Set([...(visArr.length ? visArr : enArr), ...mods]),
      );
    });
  });
  // Persistir en API en segundo plano (un paciente canónico).
  const seen = new Set<string>();
  patches.forEach(({ key, mods }) => {
    const p = store.get().patients?.[key] as
      | {
          id?: string;
          code?: string;
          accountId?: string;
          modulesEnabled?: string[];
          modulesVisible?: string[];
        }
      | undefined;
    const id = String(p?.id || key);
    if (!id || seen.has(id)) return;
    seen.add(id);
    void apiFetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        code: p?.code,
        accountId: p?.accountId,
        modulesEnabled: p?.modulesEnabled || mods,
        modulesVisible: p?.modulesVisible || mods,
      }),
    }).catch(() => {});
  });
}

/** Partes opcionales: pantallas activas piden solo lo que usan. */
export type HydratePart =
  | "territories"
  | "experts"
  | "accounts"
  | "staff"
  | "appState"
  | "patientSelf";

/** Carga territorios, expertos, personas, etc. según el rol de la sesión activa. */
export async function hydrateProgramData(
  store: Store,
  opts?: { force?: boolean; parts?: HydratePart[] },
): Promise<void> {
  const session = store.session() as { id?: string; roleId?: string | null } | null;
  if (!session?.id) {
    lastHydratedSessionId = null;
    return;
  }

  if (opts?.force && Date.now() < suppressLiveUntil) return;

  if (!opts?.force && lastHydratedSessionId === session.id && !inFlight) return;
  if (inFlight) {
    if (!opts?.force) return inFlight;
    await inFlight;
  }

  const want = (p: HydratePart) => !opts?.parts || opts.parts.includes(p);

  inFlight = (async () => {
    pausePersist(true);
    try {
      // gestor → experto, persona → paciente (misma carga de datos).
      const roleId = baseRoleId(session.roleId || null) || session.roleId || null;
      const isPatient = roleId === "paciente";
      const isStaffPeople =
        roleId === "admin" ||
        roleId === "experto" ||
        roleId === "clinico" ||
        roleId === "cuidador";

      if (isPatient) {
        if (want("patientSelf")) await hydratePatientSelf(store);
        if (want("appState")) await hydrateAppState(store);
        // Alerta del cuidador/clínico → crisisLock en la ficha local (pinta pantalla roja).
        applyOpenCrisisToPatients(store);
        healActivoModulesFromPath(store);
        lastHydratedSessionId = session.id!;
        return;
      }

      const programJobs: Promise<unknown>[] = [];
      if (want("territories")) programJobs.push(hydrateTerritories(store));
      if (want("experts")) programJobs.push(hydrateExperts(store));
      if (want("appState")) programJobs.push(hydrateAppState(store));

      if (
        want("accounts") &&
        (roleId === "admin" || roleId === "clinico")
      ) {
        programJobs.push(hydrateAccounts(store));
      }

      if (want("staff") && isStaffPeople) {
        programJobs.push(hydratePeopleFlagsWorklists(store));
      }
      // H-004: el observador no carga personas en el store; su tablero pide el resumen agregado.

      await Promise.all(programJobs);
      if (want("staff") && isStaffPeople) {
        applyOpenCrisisToPatients(store);
      }
      lastHydratedSessionId = session.id!;
    } finally {
      pausePersist(false);
      inFlight = null;
    }
  })();

  return inFlight;
}

export function resetHydrateProgramCache() {
  lastHydratedSessionId = null;
  lastStaffLiveSig = "";
}
