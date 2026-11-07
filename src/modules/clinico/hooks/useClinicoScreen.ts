// @ts-nocheck
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRouteLoading } from "@/components/shared/nara-loading/RouteLoadingProvider";
import { useRequireSession } from "@/hooks/useRequireSession";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { pauseLiveHydrate } from "@/lib/store/hydrateProgram";
import { LIVE_CLINICO, useLiveProgramSync } from "@/lib/store/liveSync";
import { flushPersist } from "@/lib/store/persist";
import {
  DEFAULT_INACTIVE_MINUTES,
  PATIENT_STATES,
  patientStateMeta,
  profileCatalog,
  resolveAdminPersonState,
} from "@/lib/clinical/patientStates";
import {
  CLINICO_LEGACY_VIEW,
  clinicoPathForView,
  clinicoViewForPath,
} from "@/modules/clinico/routes";
import { collapsePathListForHub } from "@/lib/nara-services/gamesCatalog.js";
import { buildAnalizadorPanel } from "@/modules/clinico/analizador/buildAnalizadorPanel";

const INSTS = [
  { id: "hsal", label: "Hospital local de Salento · Psicología y psiquiatría" },
  { id: "hdep", label: "Hospital departamental · Psiquiatría" },
  { id: "cuni", label: "Clínica universitaria · Teleconsulta" },
];
const OUTCOMES = [
  "Contactado · plan de seguridad acordado",
  "Contactado · remitido a urgencias",
  "No contestó · reintentar en 10 min",
  "Falso positivo · cerrar y enviar a revisión de la lista",
];

export function useClinicoScreen() {
  const store = useNaraStore();
  const live = useNaraLive();
  useLiveProgramSync({ parts: LIVE_CLINICO });
  const session = useRequireSession(["clinico"]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { start: startRouteLoading } = useRouteLoading();
  const initialFromPath = clinicoViewForPath(pathname || "/clinico");
  const [st, setStateRaw] = useState({
    view: initialFromPath.view || "home",
    agentOpen: false,
    pid: initialFromPath.pid || "gloria",
    outcome: {},
    copied: "",
    note: "",
    refInst: "hsal",
    refReason: "Insomnio que no cede después de las réplicas. Considerar medicación.",
    refErr: false,
    msg: "",
    zoom: 1,
    pendingAsk: "",
    fileFrom: null,
    asg: null,
    tick: 0,
    /** Filtro de la sección Aprobaciones: all | eval | path | rules */
    apprFilter: "all",
    /** Filtro de estados en Mis pacientes */
    stateFilter: "all",
    /** Tab del tablero de crisis: take | mine | all | done */
    crisisTab: "take",
    /** Avisos del analizador marcados como vistos en esta sesión */
    avisosVistos: [] as string[],
  });
  const setState = useCallback((u) => {
    setStateRaw((prev) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
  }, []);

  const stRef = useRef(st);
  stRef.current = st;
  const pendingPathRef = useRef(null);

  /** Navega por ruta real (como admin) y actualiza el estado de vista. */
  const navigateView = useCallback(
    (view, extra = {}) => {
      const next = { ...stRef.current, ...extra, view };
      const path = clinicoPathForView(
        view,
        view === "file" ? next.pid : null,
      );
      // Loading primero; luego cambia la vista (no al revés).
      if (path !== pathname) {
        startRouteLoading();
        pendingPathRef.current = path;
      }
      stRef.current = next;
      setStateRaw(next);
      window.scrollTo(0, 0);
    },
    [pathname, startRouteLoading],
  );

  // Empuja la URL fuera del render (evita update de Router mid-render).
  useEffect(() => {
    const path = pendingPathRef.current;
    if (!path) return;
    pendingPathRef.current = null;
    if (path !== pathname) router.push(path);
  }, [st.view, st.pid, pathname, router]);

  // URL → estado (+ redirects legacy ?view= / ?pid=)
  useEffect(() => {
    const v0 = searchParams.get("view");
    const p0 = searchParams.get("pid");
    if (p0) {
      pendingPathRef.current = null;
      router.replace(clinicoPathForView("file", p0));
      return;
    }
    if (v0 && CLINICO_LEGACY_VIEW[v0]) {
      pendingPathRef.current = null;
      router.replace(clinicoPathForView(CLINICO_LEGACY_VIEW[v0]));
      return;
    }
    const parsed = clinicoViewForPath(pathname || "/clinico");
    setStateRaw((prev) => {
      if (
        parsed.view === prev.view &&
        (!parsed.pid || parsed.pid === prev.pid)
      ) {
        return prev;
      }
      return {
        ...prev,
        view: parsed.view,
        ...(parsed.pid ? { pid: parsed.pid } : {}),
      };
    });
  }, [pathname, searchParams, router]);

  // Inactividad: solo cambia el estado (derivado / inactiveLock). Sin alertas ni notifs.

  function openFile(pid, fromAgent) {
    const st0 = st;
    const from =
      st0.view === "file"
        ? st0.fileFrom
        : { view: st0.view, agent: !!fromAgent };
    navigateView("file", {
      pid,
      fileFrom: from,
      msg: "",
      note: "",
      refReason:
        pid === "gloria"
          ? "Insomnio que no cede después de las réplicas. Considerar medicación."
          : "",
    });
  }

  function recFile(A, S, P) {
    const R = A.REC,
      pr = A.recPerson(S, P.id),
      as = ((S.recursos || {}).assigned || []).filter(
        (x) =>
          x.pid === P.id &&
          x.kind !== "cuento" &&
          x.kind !== "curso",
      );
    const o = {
      assign: () =>
        setState({ asg: { pid: P.id, name: P.name, q: "", tipo: "", tema: "", para: "" } }),
      has: false,
      none: true,
      mods: [],
      read: "N/A",
      techs: [] as { n: string; v: string }[],
      answers: [] as { h: string; a: string }[],
      noAns: true,
      assigned: as.map(
        (x) =>
          "Asignado por usted: «" +
          (R.item(x.id) || {}).title +
          "»" +
          (x.session ? " · se trabajará en sesión" : ""),
      ),
    };
    if (!pr) return o;
    o.techs = Object.keys(pr.tech4w || {}).map((k) => ({
      n: R.tecnica(k).title,
      v: pr.tech4w[k] + (pr.tech4w[k] === 1 ? " vez" : " veces"),
    }));
    return o;
  }

  function asVals(A, S, stLocal) {
    const g = stLocal.asg;
    if (!g) return { asOpen: false, as: { items: [], temas: [] } };
    const R = A.REC,
      up = (v) => setState({ asg: Object.assign({}, g, v) });
    const all = []
      .concat(
        R.VIDEOS.map((v) => ({
          kind: "video",
          id: v.id,
          title: v.title,
          temas: v.tema,
          para: "Todos",
          meta: "Video · " + v.min + " min · " + v.tema,
        })),
        R.TECNICAS.map((t) => ({
          kind: "tecnica",
          id: t.id,
          title: t.title,
          temas: t.tema,
          para: "Todos",
          meta: "Técnica · " + t.min + " min · " + t.tema,
        })),
      );
    const q = (g.q || "").toLowerCase();
    const list = all.filter(
      (x) =>
        (!g.tipo || x.kind === g.tipo) &&
        (!g.tema || R.temaMatch(x, g.tema)) &&
        (!g.para || x.para.includes(g.para)) &&
        (!q || (x.title + " " + x.temas).toLowerCase().includes(q)),
    );
    const save = (x, sessionFlag) => {
      A.set((s) => {
        s.recursos.assigned.push({
          pid: g.pid,
          id: x.id,
          kind: x.kind,
          session: !!sessionFlag,
          by: "Dra. Lucía Marín",
          at: Date.now(),
        });
      });
      up({
        confirm: null,
        msg:
          "«" +
          x.title +
          "» quedó asignado a " +
          g.name +
          (sessionFlag ? " para trabajarlo en sesión." : "."),
      });
    };
    const cf = g.confirm && all.find((x) => x.id === g.confirm);
    return {
      asOpen: true,
      asMaxH: window.innerHeight / (stLocal.zoom || 1) - 80 + "px",
      as: {
        name: g.name,
        q: g.q,
        tipo: g.tipo,
        tema: g.tema,
        para: g.para,
        setQ: (e) => up({ q: e.target.value }),
        setTipo: (e) => up({ tipo: e.target.value }),
        setTema: (e) => up({ tema: e.target.value }),
        setPara: (e) => up({ para: e.target.value }),
        temas: R.TEMAS,
        close: () => setState({ asg: null }),
        hasMsg: !!g.msg,
        msg: g.msg,
        clearMsg: () => up({ msg: "" }),
        confirming: !!cf,
        cTag: cf ? R.TAG[cf.restr] : "",
        cTitle: cf ? cf.title : "",
        cWarn:
          cf && cf.restr === "restringido"
            ? "habla de un intento de suicidio. Solo se asigna para leerlo en sesión, nunca por primera vez a solas. TEJIVA no lo menciona."
            : "tiene un personaje que dice «no quiero vivir». Se usa en sesión con usted.",
        confirm: () => cf && save(cf, true),
        cancel: () => up({ confirm: null }),
        items: list.map((x) => ({
          title: x.title,
          meta: x.meta,
          hasCover: !!x.cover,
          cover: x.cover || "",
          hasTag: !!x.restr,
          tag: x.restr ? R.TAG[x.restr] : "",
          tagBg: x.restr === "pandemia" ? "#F7F5EF" : "#FDE7E4",
          pick: () =>
            x.restr === "restringido" || x.restr === "acompanamiento"
              ? up({ confirm: x.id, msg: "" })
              : save(x, false),
        })),
      },
    };
  }

  function rv() {
    const A = store;
    const S = A.get();
    const C = A.C;
    const SEV = {
      crisis: ["Crisis", "#6B0000", "#fff"],
      revisar: ["Revisar", "#F7E2D2", "#7A3A10"],
      info: ["Informativa", "#E5E0D5", C.azul],
    };
    const order = { crisis: 0, revisar: 1, info: 2 };
    const peopleLookup = {};
    const peopleByAccount = {};
    (A.people ? A.people(S) : S.people || []).forEach((p) => {
      if (p?.id) peopleLookup[p.id] = p;
      if (p?.code) peopleLookup[p.code] = p;
      if (p?.accountId) peopleByAccount[String(p.accountId)] = p;
    });
    const patientsMap = { ...(S.patients || {}), ...(A.PATIENTS || {}) };
    const patientsByAccount = {};
    Object.values(patientsMap).forEach((p) => {
      if (p?.id && p?.accountId) patientsByAccount[String(p.accountId)] = p;
    });
    /** Resuelve ficha aunque la alerta traiga id de cuenta en vez de id de paciente. */
    const resolveFicha = (rawPid) => {
      const pid = rawPid ? String(rawPid) : "";
      if (!pid) return { P: null, pe: null, pid: "" };
      let P = patientsMap[pid] || null;
      let pe = peopleLookup[pid] || null;
      if (!P) P = patientsByAccount[pid] || null;
      if (!pe) pe = peopleByAccount[pid] || null;
      // Si people apunta a otra ficha canónica.
      if (!P && pe?.id && patientsMap[String(pe.id)]) P = patientsMap[String(pe.id)];
      if (!pe && P?.id && peopleLookup[String(P.id)]) pe = peopleLookup[String(P.id)];
      const canon = String(P?.id || pe?.id || pid);
      return { P, pe, pid: canon };
    };
    const enrichFromFicha = (a) => {
      const { P, pe, pid } = resolveFicha(a.pid);
      const rawName = String(
        P?.name || pe?.name || a.name || "",
      ).trim();
      // «Paciente» genérico no cuenta si hay ficha con nombre real.
      const fichaName = String(P?.name || pe?.name || "").trim();
      const name =
        (fichaName && !/^paciente$/i.test(fichaName) ? fichaName : null) ||
        (rawName && !/^paciente$/i.test(rawName) ? rawName : null) ||
        fichaName ||
        rawName ||
        "Sin nombre";
      const ageN = Number(P?.age ?? pe?.age ?? a.age);
      const age = Number.isFinite(ageN) && ageN > 0 ? ageN : null;
      const place = String(
        P?.place || pe?.place || pe?.terr || P?.terr || a.place || "",
      )
        .split(",")[0]
        .trim();
      const profile =
        (P?.profile && /^P\d+$/i.test(String(P.profile)) && String(P.profile)) ||
        (pe?.profile && /^P\d+$/i.test(String(pe.profile)) && String(pe.profile)) ||
        (a.profile && /^P\d+$/i.test(String(a.profile)) && String(a.profile)) ||
        "—";
      const phone = String(P?.phone || pe?.phone || a.phone || "").trim();
      return { name, age, place, profile, phone, pid };
    };
    // H-002 (SPEC-002 FR-005): la cola y el contador «en crisis» salen de la misma fuente. Una ficha en
    // Crisis sin alerta abierta (p. ej. la alerta se perdió) aparece en «Por tomar» para que alguien la tome.
    // Si ya está en Cola abierta (esperando «estoy bien»), NO regenerar «Por tomar».
    const pidsAwaitingWell = new Set(
      (S.closedToday || [])
        .filter(
          (c) =>
            c.sev === "crisis" &&
            !c.patientConfirmedAt &&
            (c.status === "awaiting_patient" ||
              (!!c.outcome && c.outcome !== "Vista" && c.status !== "closed")),
        )
        .flatMap((c) => {
          const f = resolveFicha(c.pid);
          return [String(c.pid || ""), String(f.pid || "")].filter(Boolean);
        }),
    );
    const pidsConAlerta = new Set(
      S.alerts
        .filter((a) => a.sev === "crisis" && a.status !== "closed")
        .flatMap((a) => [String(a.pid || ""), resolveFicha(a.pid).pid]),
    );
    const sinAlerta = Object.values(patientsMap)
      .filter((P: any) => P?.id && !P.archived && (P.crisisLock === true || /crisis/i.test(String(P.status || P.signal || ""))))
      .filter((P: any) => !pidsConAlerta.has(String(P.id)))
      .filter((P: any) => !pidsAwaitingWell.has(String(P.id)))
      .map((P: any) => ({
        id: "a-" + P.id,
        sev: "crisis",
        status: "new",
        pid: String(P.id),
        name: P.name || "",
        at: Number(new Date(P.updatedAt || 0)) || Date.now(),
        what: "La ficha está en Crisis sin alerta registrada. Revise el caso y tómelo.",
        term: "Estado Crisis",
        source: "Ficha del paciente",
        sintetica: true,
      }));
    // Una fila por paciente en crisis (evitar duplicados de varios addAlert).
    // Si el pid ya espera «estoy bien», no listar otra alerta abierta del mismo.
    const crisisDeduped = (() => {
      const byPid = new Map();
      const rest = [];
      for (const a of S.alerts.concat(sinAlerta)) {
        if (a.sev !== "crisis") {
          rest.push(a);
          continue;
        }
        const st = String(a.status || "");
        if (st === "closed" || st === "awaiting_patient") continue;
        const key = String(a.pid || a.id || "");
        if (!key) {
          rest.push(a);
          continue;
        }
        const fPid = String(resolveFicha(a.pid).pid || key);
        if (pidsAwaitingWell.has(key) || pidsAwaitingWell.has(fPid)) continue;
        const prev = byPid.get(key);
        if (!prev || Number(a.at || 0) >= Number(prev.at || 0)) {
          byPid.set(key, a);
        }
      }
      return [...byPid.values(), ...rest];
    })();
    const alerts = crisisDeduped
      .slice()
      .sort((a, b) => order[a.sev] - order[b.sev] || b.at - a.at)
      .map((a) => {
        const [sevLabel, tagBg, tagFg] = SEV[a.sev] || SEV.info;
        const isCrisis = a.sev === "crisis";
        const cd = isCrisis && a.status !== "other" ? A.countdown(a.at) : null;
        const pick = st.outcome[a.id];
        const info = enrichFromFicha(a);
        const metaBits = [
          info.age != null ? info.age + " años" : null,
          info.place || null,
          info.phone ? info.phone : null,
        ].filter(Boolean);
        return Object.assign({}, a, {
          name: info.name,
          age: info.age,
          place: info.place,
          profile: info.profile,
          phone: info.phone || "Sin teléfono",
          metaLine: metaBits.join(" · ") || (info.name !== "Sin nombre" ? "Ficha vinculada" : "Buscando ficha…"),
          sevLabel,
          tagBg,
          tagFg,
          ago: A.agoText(a.at),
          cd: isCrisis ? (a.status === "other" ? "Tomado por un colega" : cd.text) : "",
          cdFg: cd && cd.late ? "#6B0000" : C.tinta,
          bd: isCrisis && a.status !== "other" ? "#6B0000" : C.lineas,
          isNewCrisis: isCrisis && a.status === "new",
          canTake: isCrisis && a.status === "new",
          isOther: a.status === "other",
          isMine: a.status === "mine" || a.status === "retry",
          isInfo: !isCrisis,
          isLate: !!(cd && cd.late),
          isCrisis,
          hasFile: !!(info.pid && (A.PATIENTS[info.pid] || patientsMap[info.pid])),
          hasOutcome: pick !== undefined,
          take: () => {
            const who =
              (A.session() && A.session().name) || "Clínico de turno";
            const snap = enrichFromFicha(a);
            A.set((s) => {
              let x = s.alerts.find((y) => y.id === a.id);
              if (!x && a.sintetica) {
                // FR-005: la alerta de respaldo de una ficha en Crisis pasa a ser una alerta real al tomarla.
                const { sintetica: _s, ...real } = a;
                x = real;
                s.alerts.unshift(x);
              }
              if (!x) return;
              x.status = "mine";
              x.takenAt = Date.now();
              x.takenBy = who;
              // Corregir datos de la alerta con la ficha real (y pid canónico).
              if (snap.pid) x.pid = snap.pid;
              x.name = snap.name;
              if (snap.age != null) x.age = snap.age;
              if (snap.place) x.place = snap.place;
              if (snap.profile && snap.profile !== "—") x.profile = snap.profile;
              if (snap.phone) x.phone = snap.phone;
              if (A.pushCrisisLog)
                A.pushCrisisLog(s, {
                  type: "taken",
                  alertId: x.id,
                  pid: x.pid || null,
                  name: x.name,
                  by: who,
                  byRole: "clinico",
                  what: "Tomó el caso de crisis",
                  detail: "Pasó a atención clínica",
                  status: "mine",
                  at: x.takenAt,
                });
            });
            setState({ crisisTab: "mine" });
          },
          copy: () => {
            const phone = info.phone || a.phone || "";
            try {
              navigator.clipboard.writeText(phone);
            } catch (e) {}
            setState({ copied: a.id });
          },
          copyLabel: st.copied === a.id ? "Copiado" : "Copiar",
          retryText:
            a.status === "retry"
              ? "No contestó. La alerta sigue abierta · reintente a las " + a.retryAt
              : "",
          loc: a.loc || null,
          outcomes: OUTCOMES.map((label, i) => ({
            label,
            selected: pick === i,
            pick: () => setState({ outcome: Object.assign({}, st.outcome, { [a.id]: i }) }),
          })),
          closeLabel: "Registrar atención",
          close: () => {
            if (pick === undefined) return;
            const who =
              (A.session() && A.session().name) || "Clínico de turno";
            const outcomeLabel = OUTCOMES[pick];
            let closedPid: string | null = null;
            let closedName = "";
            A.set((s) => {
              const x = s.alerts.find((y) => y.id === a.id);
              if (!x) return;
              const samePid = String(x.pid || "");
              // Quitar esta alerta y cualquier duplicado abierto del mismo paciente.
              s.alerts = s.alerts.filter(
                (y) =>
                  y.id !== a.id &&
                  !(
                    y.sev === "crisis" &&
                    samePid &&
                    String(y.pid || "") === samePid &&
                    y.status !== "closed" &&
                    y.status !== "awaiting_patient"
                  ),
              );
              // Aún no está cerrada: falta «estoy bien» del paciente.
              x.status = "awaiting_patient";
              x.outcome = outcomeLabel;
              x.attendedAt = Date.now();
              x.closedAt = null;
              x.closedBy = null;
              x.attendedBy = who;
              x.patientConfirmedAt = null;
              // Solo quitar del mismo episodio en cola abierta (mismo id);
              // no borrar otras crisis ya gestionadas del mismo paciente hoy.
              s.closedToday = (s.closedToday || []).filter(
                (c) =>
                  !(
                    c.sev === "crisis" &&
                    String(c.id || "") === String(x.id || "") &&
                    !c.patientConfirmedAt &&
                    (c.status === "awaiting_patient" ||
                      (!!c.outcome && c.outcome !== "Vista"))
                  ),
              );
              s.closedToday.unshift(x);
              if (A.pushCrisisLog)
                A.pushCrisisLog(s, {
                  type: "awaiting_patient",
                  alertId: x.id,
                  pid: x.pid || null,
                  name: x.name,
                  by: who,
                  byRole: "clinico",
                  what: "Gestionó la crisis · esperando al paciente",
                  detail: outcomeLabel,
                  outcome: outcomeLabel,
                  status: "awaiting_patient",
                  at: x.attendedAt,
                });
              // Atendido por clínico: el paciente sigue en pantalla roja hasta «estoy bien».
              if (x.pid && s.patients[x.pid]) {
                const snap = enrichFromFicha(x);
                closedPid = x.pid;
                closedName = snap.name || x.name || "";
                x.name = closedName;
                if (snap.age != null) x.age = snap.age;
                if (snap.place) x.place = snap.place;
                if (snap.profile && snap.profile !== "—") x.profile = snap.profile;
                if (snap.phone) x.phone = snap.phone;
                s.patients[x.pid].status = "Crisis";
                s.patients[x.pid].signal = "Crisis";
                s.patients[x.pid].crisisLock = true;
                s.patients[x.pid].crisisAttendedAt = Date.now();
                s.patients[x.pid].crisisAttendedOutcome = outcomeLabel;
                s.patients[x.pid].crisisBtnReady = false;
                const pe = (s.people || []).find((p) => p.id === x.pid);
                if (pe) pe.status = "Crisis";
                if (A.pushCrisisLog)
                  A.pushCrisisLog(s, {
                    type: "status_changed",
                    alertId: x.id,
                    pid: x.pid,
                    name: x.name,
                    by: who,
                    byRole: "clinico",
                    what: "Crisis atendida · esperando «estoy bien» del paciente",
                    detail: outcomeLabel,
                    status: "Crisis",
                  });
              }
              if (pick === 3)
                s.falsePositives.push({
                  name: x.name,
                  what: x.what,
                  term: x.term || "",
                  at: Date.now(),
                });
              if (x.expert)
                A.pushNotif(
                  s,
                  x.expert,
                  "Crisis atendida: " + x.name + " · " + outcomeLabel,
                  "/experto",
                );
              if (x.expert) {
                s.notices[x.expert] = s.notices[x.expert] || [];
                s.notices[x.expert].unshift({
                  kind: "crisis",
                  tag: "Crisis atendida",
                  text:
                    who +
                    " atendió la alerta de " +
                    x.name +
                    ": " +
                    outcomeLabel +
                    ".",
                });
                if (A.pushCrisisLog)
                  A.pushCrisisLog(s, {
                    type: "notified",
                    alertId: x.id,
                    pid: x.pid || null,
                    name: x.name,
                    by: who,
                    byRole: "clinico",
                    what: "Avisó al experto de campo",
                    detail: "Notificación a " + x.expert + " · crisis atendida",
                  });
              }
            });
            if (closedPid) {
              pauseLiveHydrate(6_000);
              void flushPersist(A);
              void fetch("/api/patients", {
                credentials: "same-origin",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: closedPid,
                  name: closedName || closedPid,
                  status: "Crisis",
                  signal: "Crisis",
                  crisisLock: true,
                  crisisAttendedAt: Date.now(),
                  crisisAttendedOutcome: outcomeLabel,
                  crisisBtnReady: false,
                }),
              }).catch(() => {});
              void fetch("/api/people", {
                credentials: "same-origin",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: closedPid,
                  name: closedName || closedPid,
                  status: "Crisis",
                }),
              }).catch(() => {});
            }
            // Tras gestionar → Cola abierta (esperan «estoy bien»), no Gestionadas.
            setState({ crisisTab: "all" });
          },
          dismiss: () =>
            A.set((s) => {
              const x = s.alerts.find((y) => y.id === a.id);
              if (!x) return;
              s.alerts = s.alerts.filter((y) => y.id !== a.id);
              x.outcome = "Vista";
              s.closedToday.unshift(x);
              if (x.sev === "crisis" && A.pushCrisisLog)
                A.pushCrisisLog(s, {
                  type: "dismissed",
                  alertId: x.id,
                  pid: x.pid || null,
                  name: x.name,
                  by: (A.session() && A.session().name) || "Clínico",
                  byRole: "clinico",
                  what: "Marcó la alerta como vista",
                  outcome: "Vista",
                  status: "closed",
                });
            }),
          open: () => openFile(info.pid || a.pid),
        });
      });
    const closed = S.closedToday.map((c) => {
      const info = enrichFromFicha(c);
      const ficha = resolveFicha(c.pid);
      const stillInCrisis =
        ficha.P?.crisisLock === true ||
        /^crisis$/i.test(
          String(ficha.P?.status || ficha.pe?.status || ""),
        );
      // Solo «esperando» si el clínico ya gestionó Y el paciente sigue en Crisis.
      // Si ya está Activo (confirmó «estoy bien» o salió de crisis), es Cerrada.
      const waiting =
        c.sev === "crisis" &&
        !!c.outcome &&
        c.outcome !== "Vista" &&
        !c.patientConfirmedAt &&
        stillInCrisis;
      const respondedAt = c.attendedAt || c.closedAt || c.takenAt || c.at;
      return {
        id: c.id,
        pid: c.pid || info.pid || null,
        sev: c.sev,
        status: c.status,
        at: c.at,
        name: info.name,
        outcome: c.outcome,
        waiting,
        patientConfirmedAt: c.patientConfirmedAt || null,
        statusLabel: waiting
          ? "Esperando al paciente"
          : c.sev === "crisis"
            ? "Cerrada"
            : "Vista",
        statusHint: waiting
          ? "Gestionada por el clínico · falta «estoy bien» en la app"
          : c.sev === "crisis"
            ? c.patientConfirmedAt
              ? "El paciente confirmó que está bien"
              : "El paciente ya no está en crisis"
            : "",
        canReopen:
          (c.pid === "diana" && S.diana.crisis) ||
          (c.pid === "rosalba" && S.rosalbaWA.crisis && c.sev === "crisis"),
        reopen: () =>
          A.set((s) => {
            if (c.pid === "diana") {
              s.diana.crisis = false;
              s.dianaInbox.push({
                id: "d" + Date.now(),
                text: "Su psicóloga revisó su mensaje y reabrió su conversación con TEJIVA.",
                tab: "chat",
                seen: false,
              });
            }
            if (c.pid === "rosalba") s.rosalbaWA.crisis = false;
          }),
        reopenLabel:
          c.pid === "diana"
            ? "Reabrir la conversación con TEJIVA"
            : "Reabrir el acompañamiento por WhatsApp",
        meta:
          c.sev === "crisis"
            ? "Crisis · respondida en " +
              Math.max(1, Math.round((respondedAt - c.at) / 60000)) +
              " min"
            : (SEV[c.sev] || SEV.info)[0],
      };
    });
    // Cola abierta: una fila por paciente (episodio activo esperando «estoy bien»).
    const awaitingPatient = (() => {
      const byPid = new Map<string, (typeof closed)[0]>();
      for (const c of closed.filter((x) => x.waiting)) {
        const key = String(c.pid || c.id || "");
        const prev = byPid.get(key);
        if (!prev || Number(c.at || 0) >= Number(prev.at || 0)) byPid.set(key, c);
      }
      return Array.from(byPid.values());
    })();
    // Gestionadas hoy: TODAS las crisis cerradas del día (mismo paciente puede tener varias).
    // Solo deduplicar por id de alerta, no por pid.
    const closedDone = (() => {
      const awaitIds = new Set(awaitingPatient.map((c) => String(c.id || "")));
      const byId = new Map<string, (typeof closed)[0]>();
      for (const c of closed.filter((x) => !x.waiting)) {
        const id = String(c.id || "");
        if (!id || awaitIds.has(id)) continue;
        const prev = byId.get(id);
        if (!prev || Number(c.at || 0) >= Number(prev.at || 0)) byId.set(id, c);
      }
      return Array.from(byId.values()).sort(
        (a, b) => Number(b.at || 0) - Number(a.at || 0),
      );
    })();

    const ids: string[] = [];
    const seen = new Set<string>();
    const pushId = (id: string) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      ids.push(id);
    };
    A.CASE_IDS.forEach((id: string) => pushId(id));
    (S.caseload || []).forEach((c) => {
      const caseloadStatus = c.status || c.signal || null;
      if (!A.PATIENTS[c.id]) {
        A.PATIENTS[c.id] = {
          id: c.id,
          name: c.name,
          age: c.age,
          place: c.place,
          profile: c.profile,
          phone: "—",
          phq: [c.phq],
          phqDates: [new Date().toISOString().slice(0, 10)], // H-013: fecha ISO, no «Hoy»
          sleep: null,
          braceletStatus: "",
          adherence: null,
          next: "Primera llamada dentro de 7 días",
          nextShort: "Primera llamada",
          consent: true,
          signal: caseloadStatus || "Sin evaluación",
          status: caseloadStatus || "Sin evaluación",
          pendingEval: !!c.pendingEval,
          summary: null,
          audios: 0,
          timeline: [
            {
              d: "Hoy",
              t: "Visita de campo · " + c.expert,
              x: "Evaluación inicial. PHQ-9 " + c.phq + ". Perfil " + c.profile + ".",
            },
          ],
        };
      } else {
        const P0 = A.PATIENTS[c.id];
        if (
          c.profile &&
          /^P\d+$/i.test(String(c.profile)) &&
          !(P0.profile && /^P\d+$/i.test(String(P0.profile)))
        ) {
          P0.profile = c.profile;
        }
        if (caseloadStatus && (!P0.status || /^(nueva|activo|activa)$/i.test(String(P0.status)))) {
          P0.status = caseloadStatus;
        }
        if (c.signal && /^(Aceptado|Rechazado|Crisis)/i.test(String(c.signal))) {
          P0.signal = c.signal;
        }
        if (c.pendingEval) P0.pendingEval = true;
      }
      pushId(c.id);
    });
    if (S.visits.rosalba && !S.visits.rosalba.crisis) ids.push("rosalba");
    if (
      S.visits.hernan ||
      S.alerts.find((a) => a.id === "a-hernan") ||
      S.closedToday.find((a) => a.id === "a-hernan")
    )
      ids.unshift("hernan");
    const sigColor = (t) =>
      /Crisis|Rechazad|atendida|abierta|atención/i.test(t)
        ? "#8A1C14"
        : /Aceptad|Mejorando|Confirmó|cerrada/i.test(t)
          ? C.verde
          : /Sueño|subiendo|Faltó|Por aprobar|Esperando/i.test(t)
            ? "#9A4D14"
            : C.tinta;
    const peopleById = {};
    (A.people ? A.people(S) : S.people || []).forEach((p) => {
      if (p?.id) peopleById[p.id] = p;
      if (p?.code) peopleById[p.code] = p;
    });
    const pushCrisisPid = (set: Set<string>, raw: unknown) => {
      const id = String(raw || "").trim();
      if (!id) return;
      set.add(id);
      const resolved = resolveFicha(id).pid;
      if (resolved) set.add(resolved);
    };
    const crisisPids = new Set<string>();
    // Alertas aún en cola (por tomar / en atención / colega).
    S.alerts.forEach((a) => {
      if (a.sev !== "crisis") return;
      const st = String(a.status || "");
      if (st === "closed") return;
      if (a.pid) pushCrisisPid(crisisPids, a.pid);
      const m = String(a.id || "").match(/^a-(.+?)-(?:crisis-btn|crisis-cuid)/);
      if (m?.[1]) pushCrisisPid(crisisPids, m[1]);
      // TEO / id estable a-{pid}
      const teo = String(a.id || "").match(/^a-([^-]+)$/);
      if (teo?.[1]) pushCrisisPid(crisisPids, teo[1]);
    });
    // Ya gestionadas por clínico pero esperando «estoy bien»: siguen en crisis.
    (S.closedToday || []).forEach((c) => {
      if (c.sev !== "crisis" || !c.pid || c.patientConfirmedAt) return;
      const st = String(c.status || "");
      if (st === "awaiting_patient" || (!c.closedAt && st !== "closed")) {
        pushCrisisPid(crisisPids, c.pid);
      }
    });

    const readAttendedAtSafe = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    /** Última acción ≠ estado: prioriza el último evento de crisis / clínico. */
    const lastActionFor = (
      patientId: string,
      patientName: string,
      accountId: string,
      P: { signal?: string; crisisAttendedAt?: unknown; crisisLock?: boolean },
      pe: { signal?: string } | null,
      stateLabel: string,
    ) => {
      const idSet = new Set(
        [patientId, accountId].filter(Boolean).map(String),
      );
      const nameKey = String(patientName || "")
        .trim()
        .toLowerCase();
      const matches = (pid?: unknown, name?: unknown) => {
        const p = pid != null ? String(pid) : "";
        if (p && idSet.has(p)) return true;
        const resolved = p ? resolveFicha(p).pid : "";
        if (resolved && idSet.has(resolved)) return true;
        const n = name != null ? String(name).trim().toLowerCase() : "";
        return !!(nameKey && n && n === nameKey);
      };
      type Ev = { at: number; label: string };
      const events: Ev[] = [];
      const push = (at: unknown, label: string) => {
        const n = Number(at) || 0;
        if (!label) return;
        events.push({ at: n > 0 ? n : 1, label });
      };

      (S.crisisLog || []).forEach(
        (e: {
          type?: string;
          pid?: string;
          name?: string;
          at?: number;
          byRole?: string;
          what?: string;
        }) => {
          if (!matches(e.pid, e.name)) return;
          const t = String(e.type || "");
          if (t === "awaiting_patient") push(e.at, "Crisis atendida");
          else if (t === "closed") {
            push(
              e.at,
              /paciente|estoy bien/i.test(String(e.byRole || e.what || ""))
                ? "Confirmó estoy bien"
                : "Crisis cerrada",
            );
          } else if (t === "taken") push(e.at, "Crisis en atención");
          else if (t === "created") push(e.at, "Crisis abierta");
          else if (t === "retry") push(e.at, "Crisis · reintento");
          else if (
            t === "status_changed" &&
            /crisis atendida|esperando/i.test(String(e.what || ""))
          ) {
            push(e.at, "Crisis atendida");
          }
        },
      );

      (S.closedToday || []).forEach(
        (c: {
          sev?: string;
          pid?: string;
          name?: string;
          outcome?: string;
          patientConfirmedAt?: number;
          attendedAt?: number;
          closedAt?: number;
          at?: number;
        }) => {
          if (c.sev !== "crisis" || !matches(c.pid, c.name)) return;
          if (c.patientConfirmedAt) {
            push(c.patientConfirmedAt, "Confirmó estoy bien");
          } else if (c.outcome && c.outcome !== "Vista") {
            push(c.attendedAt || c.closedAt || c.at, "Crisis atendida");
          }
        },
      );

      (S.alerts || []).forEach(
        (a: {
          sev?: string;
          status?: string;
          pid?: string;
          name?: string;
          at?: number;
          takenAt?: number;
        }) => {
          if (a.sev !== "crisis" || a.status === "closed") return;
          if (!matches(a.pid, a.name)) return;
          if (a.status === "mine" || a.status === "retry") {
            push(a.takenAt || a.at, "Crisis en atención");
          } else if (a.status === "awaiting_patient") {
            push(a.takenAt || a.at, "Crisis atendida");
          } else {
            push(a.at, "Crisis abierta");
          }
        },
      );

      if (readAttendedAtSafe(P.crisisAttendedAt) && P.crisisLock) {
        push(P.crisisAttendedAt, "Crisis atendida");
      }

      events.sort((a, b) => b.at - a.at);
      let label = events[0]?.label || "";
      const sig = String(P.signal || pe?.signal || "").trim();
      // Sin eventos de crisis: acciones clínicas de evaluación.
      if (!label) {
        if (/^aceptad/i.test(sig)) label = "Aceptado";
        else if (/^rechazad/i.test(sig)) label = "Rechazado";
        else if (P.crisisLock || /^crisis$/i.test(stateLabel))
          label = "Crisis abierta";
        else label = "—";
      }
      // Nunca repetir el chip de Estado (p. ej. ambos «Crisis»).
      if (label.toLowerCase() === String(stateLabel || "").toLowerCase()) {
        if (/^crisis$/i.test(stateLabel)) label = "Crisis abierta";
        else label = "—";
      }
      return label;
    };

    const patientsAll = ids
      .map((id) => {
        const P = A.PATIENTS[id];
        if (!P) return null;
        const pe =
          peopleById[id] ||
          (P.code ? peopleById[P.code] : null) ||
          null;
        const profileResolved =
          (P.profile && /^P\d+$/i.test(String(P.profile)) && String(P.profile)) ||
          (pe?.profile && /^P\d+$/i.test(String(pe.profile)) && String(pe.profile)) ||
          null;
        const statusResolved =
          P.status ||
          pe?.status ||
          (P.pendingEval || pe?.pendingEval ? "Por aprobar" : null);
        const { r } = A.parseCode(profileResolved || "");
        const mx = 27;
        const pts =
          Array.isArray(P.phq) && P.phq.length
            ? P.phq.length === 1
              ? [P.phq[0], P.phq[0]]
              : P.phq
            : [0, 0];
        const spark = pts
          .map(
            (v, i) =>
              (4 + i * (82 / (pts.length - 1))).toFixed(1) +
              "," +
              (26 - (v / mx) * 24).toFixed(1),
          )
          .join(" ");
        const accRow =
          (S.accounts || []).find(
            (a: {
              id?: string;
              email?: string;
              roleId?: string;
              role?: string;
              patientId?: string;
            }) => {
              const isPatient =
                a.roleId === "paciente" || /Paciente/i.test(a.role || "");
              if (!isPatient) return false;
              return (
                (P.accountId && a.id === P.accountId) ||
                (pe?.accountId && a.id === pe.accountId) ||
                (P.email && a.email && a.email === P.email) ||
                (pe?.email && a.email && a.email === pe.email) ||
                (a.patientId &&
                  (a.patientId === id || a.patientId === P.id || a.patientId === pe?.id))
              );
            },
          ) || null;
        let inactiveMinutes = DEFAULT_INACTIVE_MINUTES;
        if (profileResolved && /^P\d+$/i.test(profileResolved)) {
          try {
            const pc = A.parseCode(profileResolved);
            const path =
              (S.pathOverrides && S.pathOverrides[profileResolved]) ||
              A.defaultPath(pc.r, pc.d);
            const m = Number(path?.inactiveMinutes);
            if (Number.isFinite(m) && m > 0) inactiveMinutes = m;
          } catch {
            /* default */
          }
        }
        const inCrisis =
          crisisPids.has(id) ||
          P.crisisLock === true ||
          /crisis/i.test(String(statusResolved || ""));
        // Mismo criterio que Administrador → Personas (cuenta + umbral del perfil).
        const stateId = resolveAdminPersonState(
          {
            status: statusResolved,
            profile: profileResolved,
            pendingEval: !!(P.pendingEval || pe?.pendingEval),
            week: P.week ?? pe?.week,
            weeks: P.weeks ?? pe?.weeks,
            id,
            code: P.code || pe?.code,
            email: P.email || pe?.email,
            accountId: P.accountId || pe?.accountId,
            finalEvalAt: P.finalEvalAt ?? pe?.finalEvalAt,
            inactiveLock:
              P.inactiveLock === true || pe?.inactiveLock === true,
            activeAt: P.activeAt ?? pe?.activeAt,
          },
          {
            account: accRow,
            inactiveMinutes,
            inCrisis,
          },
        );
        const stMeta = patientStateMeta(stateId);
        const lastSignal = lastActionFor(
          id,
          String(P.name || pe?.name || ""),
          String(P.accountId || pe?.accountId || ""),
          P,
          pe,
          stMeta.label,
        );
        return {
          id,
          name: P.name || pe?.name,
          age: P.age ?? pe?.age,
          place: P.place || pe?.place,
          profile: profileResolved || "Sin perfil",
          rc: r >= 0 && A.RISK[r] ? A.RISK[r].c : "#C4BDB3",
          spark,
          last: P.phq[P.phq.length - 1],
          next: P.nextShort,
          adh: P.adherence == null ? "—" : P.adherence + " %",
          signal: lastSignal,
          sigFg: sigColor(lastSignal),
          stateId,
          stateLabel: stMeta.label,
          stateBg: stMeta.bg,
          stateFg: stMeta.fg,
          inCrisis,
          signalIsPending: /por\s*aprobar/i.test(lastSignal),
          signalIsCrisis: /crisis/i.test(lastSignal),
          open: () => openFile(id),
          openCrisis: () =>
            navigateView("alerts", { fileFrom: { view: "patients" } }),
          openApprovals: () =>
            navigateView("approvals", { fileFrom: { view: "patients" } }),
        };
      })
      .filter(Boolean);
    // Mismo criterio que la columna Crisis / estado en Mis pacientes.
    const pending = patientsAll.filter((p) => p.inCrisis).length;
    // C-01: ordenados por riesgo. Primero las crisis, luego de mayor a menor riesgo según el perfil
    // (P13–P15 Severo … P01–P03 Mínimo) y al final quienes aún no tienen perfil.
    const riesgoDe = (p: { profile?: string; inCrisis?: boolean }) => {
      const n = parseInt(String(p.profile || "").replace(/^P/, ""), 10);
      return Number.isFinite(n) && n >= 1 && n <= 15 ? Math.floor((n - 1) / 3) : -1;
    };
    const patients = patientsAll
      .filter((p) => st.stateFilter === "all" || p.stateId === st.stateFilter)
      .sort(
        (a, b) =>
          Number(!!b.inCrisis) - Number(!!a.inCrisis) ||
          riesgoDe(b) - riesgoDe(a) ||
          String(a.name || "").localeCompare(String(b.name || ""), "es"),
      );

    const fallbackId = ids.find((id) => A.PATIENTS[id]);
    const P = A.PATIENTS[st.pid] || (fallbackId ? A.PATIENTS[fallbackId] : null) || A.emptyPatient(st.pid || "—", "Sin paciente", 0);
    if (!Array.isArray(P.phq) || !P.phq.length) P.phq = [0];
    const pc = A.parseCode(P.profile);
    const consent = P.consentKey && S.consents && S.consents[P.consentKey] ? S.consents[P.consentKey].remision : P.consent;
    const ref = S.referrals.find((x) => x.pid === P.id);
    const cur = P.phq[P.phq.length - 1],
      base = P.phq[0];
    const cx = (i) => 70 + i * (500 / Math.max(1, P.phq.length - 1));
    const cy = (v) => 10 + ((27 - v) / 27) * 195;
    const bands = A.RISK.map((r) => ({
      k: r.k,
      bg: r.bg,
      y: cy(r.max + (r.max === 27 ? 0 : 1)),
      h: cy(r.min) - cy(r.max + (r.max === 27 ? 0 : 1)),
      ty: (cy(r.min) + cy(r.max + (r.max === 27 ? 0 : 1))) / 2 + 4,
    }));
    const phqPts = P.phq.map((v, i) => ({
      x: P.phq.length === 1 ? 315 : cx(i),
      y: cy(v),
      ly: cy(v) - 12,
      v,
      d: P.phqDates[i],
    }));
    const sy = (h) => 200 - (h / 8) * 185;
    const bars = (P.sleep || []).map((h, i) => ({
      x: 36 + i * 39.5,
      cx: 51 + i * 39.5,
      y: sy(h),
      h: 200 - sy(h),
      c: h < 4.5 ? "#D9692B" : "#A9D4FF",
      v: h.toFixed(1).replace(".", ","),
      ty: sy(h) - 6,
      lbl: h < 4.5 ? "bajo" : i === 13 ? "anoche" : "",
      lc: h < 4.5 ? "#9A4D14" : C.texto2,
    }));
    // C-04: cada nota y ajuste guarda quién y cuándo (las antiguas, solo texto, se muestran sin autor).
    const fechaHora = (at: unknown) =>
      at
        ? new Date(Number(at)).toLocaleString("es-CO", {
            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota",
          })
        : "Sin fecha";
    const traza = (n: unknown, tipo: string) =>
      typeof n === "string"
        ? { d: "Sin fecha", t: tipo, x: n }
        : { d: fechaHora((n as { at?: number }).at), t: `${tipo} · ${(n as { byName?: string }).byName || "Sin autor"}`, x: String((n as { text?: string }).text || "") };
    const notes = (S.notes[P.id] || []).map((n: unknown) => traza(n, "Nota clínica"));
    const adj = (S.pathAdjust[P.id] || []).map((n: unknown) => traza(n, "Cambio de ruta"));
    const refT = ref
      ? [{ d: ref.date, t: "Remisión · " + (INSTS.find((i) => i.id === ref.inst) || {}).label, x: ref.reason + " · " + ref.status }].concat(
          ref.contra ? [{ d: "Hoy", t: "Contrarreferencia · Hospital local de Salento", x: ref.contra }] : [],
        )
      : [];
    const aiT = (S.aiLog || [])
      .filter((l) => l.pid === P.id)
      .map((l) => ({ d: "Registro IA", t: l.channel, x: l.text }));
    const timeline = P.timeline.concat(refT, adj, notes, aiT).reverse();
    const f = {
      rec: recFile(A, S, P),
      id: P.id,
      name: P.name,
      age: P.age,
      place: P.place,
      profile: P.profile || "Sin perfil",
      risk: pc.r >= 0 && A.RISK[pc.r] ? A.RISK[pc.r].k : "Sin perfil",
      rc: pc.r >= 0 && A.RISK[pc.r] ? A.RISK[pc.r].c : "#C4BDB3",
      rbg: pc.r >= 0 && A.RISK[pc.r] ? A.RISK[pc.r].bg : "#F7F5EF",
      dig: pc.d >= 0 && A.DIG[pc.d] ? A.DIG[pc.d].k : "—",
      dc: pc.d >= 0 && A.DIG[pc.d] ? A.DIG[pc.d].c : "#C4BDB3",
      dbg: pc.d >= 0 && A.DIG[pc.d] ? A.DIG[pc.d].bg : "#F7F5EF",
      consText: consent ? "Autorizó remisión" : "No autorizó compartir su caso",
      consBg: consent ? "#E7FAF5" : "#F7F5EF",
      consFg: consent ? C.verde : C.tinta,
      kpis: [
        {
          label: "PHQ-9 actual",
          val: cur + " de 27",
          sub:
            P.phq.length > 1
              ? cur < base
                ? "Bajó " + (base - cur) + " desde " + base
                : "Subió " + (cur - base) + " desde " + base
              : "Medición inicial",
          subFg: cur < base ? C.verde : cur > base ? "#9A4D14" : C.texto2,
        },
      ],
      bands,
      phqPts,
      phqLine: phqPts.map((p) => p.x + "," + p.y).join(" "),
      hasSleep: !!P.sleep,
      noSleep: !P.sleep,
      braceletStatus: "",
      bars,
      refY: sy(4.5),
      refTy: sy(4.5) - 6,
      hasSummary: !!P.summary,
      summary: P.summary,
      audioLink: P.audios
        ? "Escuchar los " + P.audios + " audios originales"
        : "Ver conversaciones originales",
      timeline,
      canRefer: consent && !ref,
      referBlocked: !consent,
      referred: !!ref,
      referredText: ref
        ? "Remitida a " +
          (INSTS.find((i) => i.id === ref.inst) || {}).label +
          " el " +
          ref.date +
          ". Estado: " +
          ref.status +
          "." +
          (ref.contra ? " Contrarreferencia recibida." : "")
        : "",
    };
    const ruleLines = (pd, livePack) => {
      const L = [];
      const liveRisk = (livePack && livePack.risk) || S.rules.risk || [];
      const liveDig = (livePack && livePack.dig) || S.rules.dig || {};
      const livePhq = (livePack && livePack.phq) || S.rules.phq;
      const liveCtx = (livePack && livePack.ctx) || S.rules.ctx;
      (pd.draft.risk || []).forEach((r, i) => {
        const o = liveRisk[i] || { k: "?", min: "?", max: "?", c: "" };
        if (r.k !== o.k || r.min !== o.min || r.max !== o.max || r.c !== o.c)
          L.push(
            "Nivel " +
              o.k +
              ": " +
              o.k +
              " " +
              o.min +
              "–" +
              o.max +
              " → " +
              r.k +
              " " +
              r.min +
              "–" +
              r.max +
              (r.c !== o.c ? " · color nuevo" : ""),
          );
      });
      ((pd.draft.dig && pd.draft.dig.cuts) || []).forEach((c, i) => {
        const o = (liveDig.cuts || [])[i] || { k: "?", min: "?", max: "?" };
        if (c.min !== o.min || c.max !== o.max)
          L.push("Digital " + o.k + ": " + o.min + "–" + o.max + " → " + c.min + "–" + c.max);
      });
      const diffQ = (label, draftQ, liveQ) => {
        const dQ = (draftQ && draftQ.q) || [];
        const lQ = (liveQ && liveQ.q) || [];
        if (dQ.length !== lQ.length) L.push(label + ": " + lQ.length + " → " + dQ.length + " preguntas");
        dQ.forEach((q, qi) => {
          const oq = lQ[qi];
          if (!oq) {
            L.push(label + " · nueva: «" + q.q + "»");
            return;
          }
          if (q.q !== oq.q) L.push(label + ": «" + oq.q + "» → «" + q.q + "»");
          (q.o || []).forEach((x, oi) => {
            const o = (oq.o || [])[oi];
            if (!o) {
              L.push(label + " · «" + q.q + "»: opción nueva «" + x.o + "» (" + x.p + " pts)");
              return;
            }
            if (x.o !== o.o || x.p !== o.p)
              L.push(
                label +
                  " · «" +
                  q.q +
                  "»: «" +
                  o.o +
                  "» (" +
                  o.p +
                  " pts) → «" +
                  x.o +
                  "» (" +
                  x.p +
                  " pts)",
              );
          });
        });
      };
      diffQ("PHQ-9", pd.draft.phq, livePhq);
      diffQ("Digital", pd.draft.dig, liveDig);
      diffQ("Contexto", pd.draft.ctx, liveCtx);
      return L.length ? L : ["Sin diferencias con las reglas vigentes."];
    };
    const approvals = [];
    // Evaluaciones de campo pendientes de visto bueno clínico.
    const pendingEvals = [];
    const seenEval = new Set();
    const pushEval = (row) => {
      const id = row.id || row.code;
      if (!id || seenEval.has(id)) return;
      const pending =
        row.pendingEval ||
        /por\s*aprobar/i.test(String(row.status || "")) ||
        /por\s*aprobar/i.test(String(row.signal || ""));
      if (!pending) return;
      if (!row.profile || !/^P\d+$/i.test(String(row.profile))) return;
      seenEval.add(id);
      pendingEvals.push(row);
    };
    (A.people ? A.people(S) : S.people || []).forEach(pushEval);
    Object.values(S.patients || {}).forEach(pushEval);
    (S.caseload || []).forEach(pushEval);
    pendingEvals.forEach((ev) => {
      const { r, d } = A.parseCode(ev.profile);
      const prev = ev.previousProfile || null;
      const expertName = ev.expert || ev.evalBy || "Experto de campo";
      const expertKey =
        ev.expertId ||
        (/Armenia/i.test(String(ev.place || "")) ? "mj" : "andres");
      approvals.push({
        kind: "eval",
        code: ev.profile,
        pid: ev.id,
        riskLabel: r >= 0 ? A.RISK[r]?.k : "",
        digLabel: d >= 0 ? (A.DIG[d]?.k || "").toLowerCase() : "",
        riskColor: r >= 0 ? A.RISK[r]?.c : "#0F2D3B",
        title: "Evaluación · " + ev.name + " · " + ev.profile,
        meta:
          "Enviada por " +
          expertName +
          (ev.evalPhq != null ? " · PHQ-9 " + ev.evalPhq : "") +
          (ev.evalDig != null ? " · digital " + ev.evalDig : "") +
          (ev.evalAt ? " · " + A.agoText(ev.evalAt) : ""),
        lines: [
          "Perfil propuesto: " + ev.profile,
          prev ? "Perfil anterior: " + prev : "Sin perfil anterior (primera evaluación)",
          "Al rechazar se restaura el estado anterior y vuelve a la cola del experto.",
        ],
        approve: () => {
          const nextStatus = "Activo";
          const activeAt = Date.now();
          A.set((s) => {
            const pe = (s.people || []).find(
              (p) => p.id === ev.id || p.code === ev.id || p.code === ev.code,
            );
            if (pe) {
              pe.profile = ev.profile;
              pe.status = nextStatus;
              pe.pendingEval = false;
              pe.activeAt = activeAt;
              pe.inactiveLock = false;
            }
            const patKey =
              (s.patients[ev.id] && ev.id) ||
              Object.keys(s.patients || {}).find(
                (k) =>
                  s.patients[k]?.id === ev.id ||
                  s.patients[k]?.code === ev.id ||
                  (ev.code && s.patients[k]?.code === ev.code),
              ) ||
              ev.id;
            if (!s.patients[patKey]) {
              s.patients[patKey] = A.emptyPatient
                ? A.emptyPatient(patKey, ev.name, ev.age || 0)
                : { id: patKey, name: ev.name, phq: [], timeline: [] };
            }
            const pat = s.patients[patKey];
            pat.id = patKey;
            pat.name = ev.name || pat.name;
            pat.profile = ev.profile;
            pat.status = nextStatus;
            pat.signal = "Aceptado";
            pat.pendingEval = false;
            pat.activeAt = activeAt;
            pat.inactiveLock = false;
            if (pe) pe.signal = "Aceptado";
            const approveEntry = {
              d: "Hoy",
              t: "Aprobación clínica",
              x:
                "El clínico aceptó la evaluación. Perfil " +
                ev.profile +
                " formalizado · estado Activo.",
            };
            const prevTl = Array.isArray(pat.timeline) ? pat.timeline.slice() : [];
            const cleanedTl = prevTl
              .map((row) => {
                if (!row || typeof row !== "object") return row;
                const x = String(row.x || "");
                if (/pendiente de aprobación/i.test(x)) {
                  return {
                    ...row,
                    x: x.replace(
                      /pendiente de aprobación clínica\.?/i,
                      "aceptada por el clínico.",
                    ),
                  };
                }
                return row;
              })
              .filter(
                (row) =>
                  !(
                    row &&
                    /aprobaci[oó]n clínica/i.test(String(row.t || ""))
                  ),
              );
            pat.timeline = [approveEntry].concat(cleanedTl);
            // Módulos de la app = servicios activos de la ruta del perfil.
            const { r: ar, d: ad } = A.parseCode(ev.profile);
            if (ar >= 0 && ad >= 0) {
              const pathMods =
                typeof A.appModuleIdsFromPath === "function"
                  ? A.appModuleIdsFromPath(ar, ad, null, pat.ctx)
                  : (A.pathList(ar, ad, null, pat.ctx) || []).map(
                      (x: { id: string }) => x.id,
                    );
              const mods = Array.from(new Set(pathMods as string[]));
              pat.modulesEnabled = mods;
              pat.modulesVisible = mods.slice();
            }
            s.caseload = (s.caseload || []).map((c) =>
              c.id === ev.id || c.id === patKey
                ? {
                    ...c,
                    profile: ev.profile,
                    status: nextStatus,
                    signal: "Aceptado",
                    pendingEval: false,
                  }
                : c,
            );
            s.alerts = (s.alerts || []).filter((a) => a.id !== "a-new-" + ev.id);
            A.pushNotif(
              s,
              expertKey,
              "Evaluación aprobada: " + ev.name + " · " + ev.profile,
              "/experto",
            );
            A.logActivity(
              s,
              "lucia",
              "Aprobó la evaluación de " + ev.name + " (" + ev.profile + ") · Activo",
            );
            // Persistir timeline + señal en el mismo tick (cierre sobre pat.timeline).
            pauseLiveHydrate(5_000);
            void Promise.all([
              fetch("/api/people", {
                credentials: "same-origin",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: ev.id,
                  code: ev.code || undefined,
                  name: ev.name,
                  profile: ev.profile,
                  status: nextStatus,
                  pendingEval: false,
                  activeAt,
                  inactiveLock: false,
                }),
              }),
              fetch("/api/patients", {
                credentials: "same-origin",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: ev.id,
                  code: ev.code || undefined,
                  name: ev.name,
                  profile: ev.profile,
                  status: nextStatus,
                  signal: "Aceptado",
                  pendingEval: false,
                  activeAt,
                  inactiveLock: false,
                  timeline: pat.timeline,
                  modulesEnabled: pat.modulesEnabled,
                  modulesVisible: pat.modulesVisible,
                }),
              }),
            ]).catch(() => {});
          });
          setState({
            msg:
              "Evaluación de " +
              ev.name +
              " aceptada. Perfil " +
              ev.profile +
              " · estado Activo.",
            tick: Date.now(),
          });
        },
        reject: () => {
          const restored = prev && /^P\d+$/i.test(String(prev)) ? prev : null;
          A.set((s) => {
            const pe = (s.people || []).find(
              (p) => p.id === ev.id || p.code === ev.id || (ev.code && p.code === ev.code),
            );
            if (pe) {
              // Perfil propuesto se anula; el anterior queda en previousProfile.
              pe.previousProfile = restored;
              pe.profile = null;
              pe.status = "Rechazado";
              pe.pendingEval = false;
              pe.needsReeval = true;
              pe.evalAt = null;
              pe.evalBy = null;
              pe.evalPhq = null;
              pe.evalDig = null;
            }
            const patKey =
              (s.patients[ev.id] && ev.id) ||
              Object.keys(s.patients || {}).find(
                (k) =>
                  s.patients[k]?.id === ev.id ||
                  s.patients[k]?.code === ev.id ||
                  (ev.code && s.patients[k]?.code === ev.code),
              ) ||
              ev.id;
            if (pe) pe.signal = "Rechazado";
            if (s.patients[patKey]) {
              const pat = s.patients[patKey];
              pat.previousProfile = restored;
              pat.profile = null;
              pat.status = "Rechazado";
              pat.signal = "Rechazado";
              pat.pendingEval = false;
              pat.needsReeval = true;
              pat.evalAt = null;
              // Sin servicios en la app hasta nueva aprobación → Activo.
              pat.modulesEnabled = [];
              pat.modulesVisible = [];
              const tl = pat.timeline || [];
              tl.unshift({
                d: "Hoy",
                t: "Evaluación rechazada",
                x:
                  "El experto debe repetir la evaluación" +
                  (restored ? " (perfil anterior " + restored + " en historial)." : "."),
              });
              pat.timeline = tl;
            }
            s.caseload = (s.caseload || []).filter(
              (c) => c.id !== ev.id && c.id !== patKey,
            );
            // Worklist del experto: debe repetir la entrevista.
            const matchWl = (x) =>
              x.id === ev.id ||
              x.name === ev.name ||
              (ev.code && x.code === ev.code);
            Object.keys(s.worklists || {}).forEach((k) => {
              (s.worklists[k] || []).forEach((w) => {
                if (!matchWl(w)) return;
                w.status = "rechazada";
                w.profile = null;
              });
            });
            const wl = s.worklists[expertKey] || [];
            if (!wl.find(matchWl)) {
              s.worklists[expertKey] = s.worklists[expertKey] || [];
              s.worklists[expertKey].unshift({
                id: ev.id,
                time: "—",
                name: ev.name,
                age: ev.age,
                place: (ev.place || "").split(",")[0],
                rural: true,
                status: "rechazada",
                code: ev.code || ev.id,
                profile: null,
              });
            }
            s.alerts = (s.alerts || []).filter((a) => a.id !== "a-new-" + ev.id);
            A.pushNotif(
              s,
              expertKey,
              "Evaluación rechazada: " + ev.name + " · debe reevaluar",
              "/experto",
            );
            A.logActivity(s, "lucia", "Rechazó la evaluación de " + ev.name);
          });
          pauseLiveHydrate(5_000);
          void Promise.all([
            fetch("/api/people", {
              credentials: "same-origin",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: ev.id,
                code: ev.code || undefined,
                name: ev.name,
                profile: null,
                previousProfile: restored,
                status: "Rechazado",
                pendingEval: false,
                evalAt: null,
                evalBy: null,
                evalPhq: null,
                evalDig: null,
              }),
            }),
            fetch("/api/patients", {
              credentials: "same-origin",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: ev.id,
                code: ev.code || undefined,
                name: ev.name,
                profile: null,
                previousProfile: restored,
                status: "Rechazado",
                signal: "Rechazado",
                pendingEval: false,
                modulesEnabled: [],
                modulesVisible: [],
              }),
            }),
            fetch("/api/worklists", {
              credentials: "same-origin",
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: ev.id,
                expertId: expertKey,
                name: ev.name,
                age: ev.age,
                place: (ev.place || "").split(",")[0],
                status: "rechazada",
                profile: null,
                code: ev.code || ev.id,
              }),
            }),
          ]).catch(() => {});
          setState({
            msg:
              "Rechazado. " +
              ev.name +
              " vuelve a la cola del experto para repetir la evaluación.",
            tick: Date.now(),
          });
        },
      });
    });
    const pendingRulePacks: { terr: string | null; pd: any; live: any }[] = [];
    if (S.rules.pending) {
      pendingRulePacks.push({ terr: null, pd: S.rules.pending, live: S.rules });
    }
    Object.entries((S.rules.byTerr || {}) as Record<string, any>).forEach(([terr, pack]) => {
      if (pack && pack.pending) pendingRulePacks.push({ terr, pd: pack.pending, live: pack });
    });
    pendingRulePacks.forEach(({ terr, pd, live }) => {
      const terrLabel = terr || "Programa (global)";
      approvals.push({
        title: "Reglas de clasificación · " + terrLabel,
        meta: "Enviado por " + pd.by + " · " + A.agoText(pd.at),
        lines: ruleLines(pd, live).concat([
          "Territorio: " + terrLabel,
          "La crisis solo se activa desde el botón «Estoy en crisis» en la app del paciente.",
        ]),
        kind: "rules",
        approve: () => {
          try {
            A.set((s) => {
              if (terr) {
                const pack = A.ensureTerrRules
                  ? A.ensureTerrRules(s, terr)
                  : (s.rules.byTerr && s.rules.byTerr[terr]);
                const p = pack && pack.pending;
                if (!p?.draft) return;
                pack.risk = p.draft.risk;
                pack.dig = p.draft.dig;
                if (p.draft.phq) pack.phq = p.draft.phq;
                if (p.draft.ctx) pack.ctx = p.draft.ctx;
                if (Array.isArray(p.draft.custom)) pack.custom = p.draft.custom;
                pack.pending = null;
                pack.pendingClearedAt = Date.now();
                pack.versions = Array.isArray(pack.versions) ? pack.versions : [];
                const prevV = (pack.versions[0] && pack.versions[0].v) || 1;
                pack.versions.unshift({
                  v: prevV + 1,
                  by: "Dra. Lucía Marín (líder clínica)",
                  at: Date.now(),
                  what:
                    "Aprobó reglas de " +
                    terr +
                    " enviadas por " +
                    p.by +
                    ": " +
                    ruleLines(p, pack).join(" · "),
                });
                if (typeof A.applyRules === "function") A.applyRules(s, terr);
              } else {
                const p = s.rules.pending;
                if (!p?.draft) return;
                s.rules.risk = p.draft.risk;
                s.rules.dig = p.draft.dig;
                if (p.draft.phq) s.rules.phq = p.draft.phq;
                if (p.draft.ctx) s.rules.ctx = p.draft.ctx;
                if (typeof A.applyRules === "function") A.applyRules(s);
                else if (typeof A.ensure === "function") A.ensure(s);
                s.rules.pending = null;
                s.rules.pendingClearedAt = Date.now();
                s.rules.versions = Array.isArray(s.rules.versions) ? s.rules.versions : [];
                const prevV = (s.rules.versions[0] && s.rules.versions[0].v) || 1;
                s.rules.versions.unshift({
                  v: prevV + 1,
                  by: "Dra. Lucía Marín (líder clínica)",
                  at: Date.now(),
                  what:
                    "Aprobó el cambio de reglas enviado por " +
                    p.by +
                    ": " +
                    ruleLines(p, s.rules).join(" · "),
                });
              }
              A.pushNotif(
                s,
                "admin",
                "La líder clínica aprobó las reglas" + (terr ? " de " + terr : ""),
                "/rutas",
              );
              A.logActivity(
                s,
                "lucia",
                "Aprobó reglas de clasificación" + (terr ? " · " + terr : ""),
              );
            });
            setState({
              msg: "Reglas aprobadas" + (terr ? " para " + terr : "") + ". Ya aplican.",
              tick: Date.now(),
            });
          } catch (e) {
            setState({ msg: "No se pudo aprobar el cambio de reglas." });
          }
        },
        reject: () => {
          A.set((s) => {
            if (terr && s.rules.byTerr && s.rules.byTerr[terr]) {
              s.rules.byTerr[terr].pending = null;
              s.rules.byTerr[terr].pendingClearedAt = Date.now();
            } else {
              s.rules.pending = null;
              s.rules.pendingClearedAt = Date.now();
            }
            A.pushNotif(
              s,
              "admin",
              "La líder clínica devolvió sin aprobar las reglas" + (terr ? " de " + terr : ""),
              "/rutas",
            );
            A.logActivity(
              s,
              "lucia",
              "Devolvió reglas sin aprobar" + (terr ? " · " + terr : ""),
            );
          });
          setState({ msg: "Cambio de reglas devuelto sin aprobar.", tick: Date.now() });
        },
      });
    });
    (S.pathRequests || []).forEach((rq) => {
      const stRq = String(rq.status || "pending").toLowerCase();
      if (stRq !== "pending") return;
      const { r, d } = A.parseCode(rq.code);
      const pathCtx = {
        terr: rq.scope && rq.scope !== "all" ? rq.scope : null,
      };
      const curPath = A.pathList(r, d, null, pathCtx);
      const nx = A.pathList(r, d, rq.draft, pathCtx);
      const kept = nx.filter((x) => curPath.find((c) => c.id === x.id && c.freq === x.freq));
      const changed = nx.filter((x) => {
        const prev = curPath.find((c) => c.id === x.id);
        return prev && prev.freq !== x.freq;
      });
      const added = nx.filter((x) => !curPath.find((c) => c.id === x.id));
      const removed = curPath.filter((c) => !nx.find((x) => x.id === c.id));
      const riskLabel = A.RISK[r]?.k || "";
      const digLabel = (A.DIG[d]?.k || "").toLowerCase();
      approvals.push({
        kind: "path",
        code: rq.code,
        riskLabel,
        digLabel,
        riskColor: A.RISK[r]?.c || "#0F2D3B",
        title: "Ruta " + rq.code + " · " + riskLabel + " × digital " + digLabel,
        meta: rq.scope === "all" ? "Todos los territorios" : "Solo " + rq.scope,
        months: rq.draft?.months || 3,
        inactiveMinutes:
          rq.draft?.inactiveMinutes != null
            ? rq.draft.inactiveMinutes
            : DEFAULT_INACTIVE_MINUTES,
        kept: kept.map((x) => ({ name: x.name, freq: x.freq })),
        changed: changed.map((x) => {
          const prev = curPath.find((c) => c.id === x.id);
          return { name: x.name, freq: x.freq, from: prev?.freq || "" };
        }),
        added: added.map((x) => ({ name: x.name, freq: x.freq })),
        removed: removed.map((c) => ({ name: c.name, freq: c.freq })),
        lines: nx
          .map(
            (x) =>
              x.name +
              " · " +
              x.freq +
              (curPath.find((c) => c.id === x.id && c.freq === x.freq) ? "" : " (cambia)"),
          )
          .concat(removed.map((c) => "Se quita: " + c.name))
          .concat(["Duración: " + (rq.draft?.months || 3) + " meses"])
          .concat([
            "Inactividad: " +
              (rq.draft?.inactiveMinutes != null
                ? rq.draft.inactiveMinutes
                : DEFAULT_INACTIVE_MINUTES) +
              " min",
          ]),
        approve: () => {
          try {
            const syncedPatients: {
              id: string;
              code?: string;
              name?: string;
              profile?: string;
              modulesEnabled: string[];
              modulesVisible: string[];
            }[] = [];
            A.set((s) => {
              s.pathOverrides = s.pathOverrides || {};
              // Copia profunda + catálogo completo ('' = apagado; pathList no rellena default).
              const approved = JSON.parse(
                JSON.stringify(
                  rq.draft || {
                    s: {},
                    months: 3,
                    inactiveMinutes: DEFAULT_INACTIVE_MINUTES,
                  },
                ),
              );
              if (approved.inactiveMinutes == null) {
                approved.inactiveMinutes = DEFAULT_INACTIVE_MINUTES;
              }
              if (!approved.s || typeof approved.s !== "object") approved.s = {};
              if (typeof A.normalizePathS === "function") {
                approved.s = A.normalizePathS(approved.s);
              }
              const ovKey =
                typeof A.pathOverrideKey === "function"
                  ? A.pathOverrideKey(rq.code, rq.scope || "all")
                  : rq.code;
              s.pathOverrides[ovKey] = approved;
              // Pacientes de este perfil (y territorio si aplica): alinear app.
              const { r: pr, d: pd } = A.parseCode(rq.code);
              const approvedIds = new Set(
                (typeof A.appModuleIdsFromPath === "function"
                  ? (A.appModuleIdsFromPath(pr, pd, approved, {
                      terr: rq.scope !== "all" ? rq.scope : null,
                    }) as string[])
                  : Object.keys(approved.s || {}).filter(
                      (k) => approved.s[k] && String(approved.s[k]).trim(),
                    )
                ).map(String),
              );
              const mods = Array.from(approvedIds);
              Object.keys(s.patients || {}).forEach((pid) => {
                const pat = s.patients[pid];
                if (!pat || String(pat.profile || "") !== String(rq.code)) return;
                if (
                  rq.scope &&
                  rq.scope !== "all" &&
                  String(pat.terr || "") !== String(rq.scope)
                ) {
                  return;
                }
                pat.modulesEnabled = mods.slice();
                pat.modulesVisible = mods.slice();
                syncedPatients.push({
                  id: String(pat.id || pid),
                  code: pat.code ? String(pat.code) : undefined,
                  name: pat.name ? String(pat.name) : undefined,
                  profile: String(pat.profile || rq.code),
                  modulesEnabled: mods.slice(),
                  modulesVisible: mods.slice(),
                });
              });
              const now = Date.now();
              s.pathRequests = (s.pathRequests || []).map((x) =>
                x.code === rq.code && x.scope === rq.scope
                  ? { ...x, status: "approved", resolvedAt: now }
                  : x,
              );
              s.rules = s.rules || {};
              s.rules.versions = Array.isArray(s.rules.versions) ? s.rules.versions : [];
              const prevV = (s.rules.versions[0] && s.rules.versions[0].v) || 1;
              s.rules.versions.unshift({
                v: prevV + 1,
                by: "Dra. Lucía Marín (líder clínica)",
                at: now,
                what:
                  "Aprobó la ruta " +
                  rq.code +
                  " (" +
                  (rq.scope === "all" ? "todos los territorios" : rq.scope) +
                  ").",
              });
              A.pushNotif(
                s,
                "admin",
                "Ruta " + rq.code + (rq.scope && rq.scope !== "all" ? " · " + rq.scope : "") + " aprobada por la líder clínica",
                "/rutas",
              );
              A.logActivity(s, "lucia", "Aprobó la ruta " + rq.code);
            });
            void flushPersist(A);
            syncedPatients.forEach((pat) => {
              void fetch("/api/patients", {
                credentials: "same-origin",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pat),
              }).catch(() => {});
            });
            setState({
              msg: "Ruta " + rq.code + " aprobada. Ya aplica en el programa.",
              tick: Date.now(),
            });
          } catch (e) {
            setState({ msg: "No se pudo aprobar la ruta. Intente de nuevo." });
          }
        },
        reject: () => {
          A.set((s) => {
            const now = Date.now();
            s.pathRequests = (s.pathRequests || []).map((x) =>
              x.code === rq.code && x.scope === rq.scope
                ? { ...x, status: "rejected", resolvedAt: now }
                : x,
            );
            A.pushNotif(
              s,
              "admin",
              "Ruta " + rq.code + " devuelta sin aprobar",
              "/rutas",
            );
            A.logActivity(s, "lucia", "Devolvió la ruta " + rq.code + " sin aprobar");
          });
          setState({
            msg: "Ruta " + rq.code + " devuelta sin aprobar.",
            tick: Date.now(),
          });
        },
      });
    });
    const apprN = approvals.length;
    const filteredApprovals =
      st.apprFilter === "all"
        ? approvals
        : approvals.filter((a) => a.kind === st.apprFilter);
    const evalN = approvals.filter((a) => a.kind === "eval").length;
    const pathN = approvals.filter((a) => a.kind === "path").length;
    const rulesN = approvals.filter((a) => a.kind === "rules").length;
    const filePe = peopleById[P.id] || (P.code ? peopleById[P.code] : null);
    const fileProfile =
      (P.profile && /^P\d+$/i.test(String(P.profile)) && String(P.profile)) ||
      (filePe?.profile && /^P\d+$/i.test(String(filePe.profile)) && String(filePe.profile)) ||
      null;
    const fileStatus =
      P.status ||
      P.signal ||
      filePe?.status ||
      (P.pendingEval || filePe?.pendingEval ? "Por aprobar" : null);
    const fileInCrisis =
      crisisPids.has(P.id) ||
      P.crisisLock === true ||
      /crisis/i.test(String(fileStatus || ""));
    const fileAcc =
      (S.accounts || []).find(
        (a: {
          id?: string;
          email?: string;
          roleId?: string;
          role?: string;
          patientId?: string;
        }) => {
          const isPatient =
            a.roleId === "paciente" || /Paciente/i.test(a.role || "");
          if (!isPatient) return false;
          return (
            (P.accountId && a.id === P.accountId) ||
            (filePe?.accountId && a.id === filePe.accountId) ||
            (P.email && a.email && a.email === P.email) ||
            (filePe?.email && a.email && a.email === filePe.email) ||
            (a.patientId && (a.patientId === P.id || a.patientId === filePe?.id))
          );
        },
      ) || null;
    let fileInactiveMinutes = DEFAULT_INACTIVE_MINUTES;
    if (fileProfile && /^P\d+$/i.test(fileProfile)) {
      try {
        const pc = A.parseCode(fileProfile);
        const path =
          (S.pathOverrides && S.pathOverrides[fileProfile]) ||
          A.defaultPath(pc.r, pc.d);
        const m = Number(path?.inactiveMinutes);
        if (Number.isFinite(m) && m > 0) fileInactiveMinutes = m;
      } catch {
        /* default */
      }
    }
    const fileStateId = resolveAdminPersonState(
      {
        status: fileStatus,
        profile: fileProfile,
        pendingEval: !!(P.pendingEval || filePe?.pendingEval),
        week: P.week ?? filePe?.week,
        weeks: P.weeks ?? filePe?.weeks,
        id: P.id,
        code: P.code || filePe?.code,
        email: P.email || filePe?.email,
        accountId: P.accountId || filePe?.accountId,
        finalEvalAt: P.finalEvalAt ?? filePe?.finalEvalAt,
        inactiveLock:
          P.inactiveLock === true || filePe?.inactiveLock === true,
        activeAt: P.activeAt ?? filePe?.activeAt,
      },
      {
        account: fileAcc,
        inactiveMinutes: fileInactiveMinutes,
        inCrisis: fileInCrisis,
      },
    );
    const fileState = patientStateMeta(fileStateId);

    const TYPE_META: Record<string, { label: string; bg: string; fg: string }> = {
      created: { label: "Alerta creada", bg: "#FDE7E4", fg: "#8A1C14" },
      taken: { label: "Caso tomado", bg: "#E7FAF5", fg: "#0F2D3B" },
      retry: { label: "Reintento", bg: "#F7E2D2", fg: "#7A3A10" },
      awaiting_patient: {
        label: "Esperando al paciente",
        bg: "#E7FAF5",
        fg: "#0F2D3B",
      },
      closed: { label: "Crisis cerrada", bg: "#E5E0D5", fg: "#0F2D3B" },
      dismissed: { label: "Marcada vista", bg: "#E5E0D5", fg: "#6B7280" },
      status_changed: { label: "Cambio de estado", bg: "#E5E0D5", fg: "#0F2D3B" },
      notified: { label: "Aviso al experto", bg: "#A9D4FF", fg: "#0F2D3B" },
    };
    const fmtCrisisWhen = (at: number) => {
      if (!at) return "—";
      const d = new Date(at);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return dd + "/" + mm + "/" + d.getFullYear() + " · " + hh + ":" + mi;
    };
    const matchesPerson = (e: { pid?: unknown; name?: unknown }, pid: string, name: string) => {
      const ep = e.pid != null ? String(e.pid) : "";
      const en = e.name != null ? String(e.name) : "";
      if (pid && ep && ep === pid) return true;
      if (name && en && en.toLowerCase() === name.toLowerCase()) return true;
      return false;
    };
    const buildCrisisHistory = (filterPid?: string, filterName?: string) => {
      const rows: Array<Record<string, unknown> & { _at: number }> = [];
      const seen = new Set<string>();
      /** Misma crisis en crisisLog + relleno desde alerts/closedToday → un solo evento. */
      const eventKey = (e: Record<string, unknown>) => {
        const type = String(e.type || "");
        const alertId = String(e.alertId || "");
        const at = Number(e.at) || 0;
        if (alertId && type) {
          // created/taken: uno por alerta. retry/cierre: agrupar por ~2 min.
          if (
            type === "retry" ||
            type === "closed" ||
            type === "awaiting_patient" ||
            type === "dismissed"
          ) {
            return [type, alertId, Math.floor(at / 120000)].join("|");
          }
          return [type, alertId].join("|");
        }
        const pid = e.pid != null ? String(e.pid) : "";
        if (type && pid) {
          return [type, pid, Math.floor(at / 60000)].join("|");
        }
        return String(e.id || "") || [type, at, e.what].join("|");
      };
      const push = (e: Record<string, unknown>) => {
        if (
          filterPid &&
          !matchesPerson(
            { pid: e.pid, name: e.name },
            filterPid,
            filterName || "",
          )
        ) {
          return;
        }
        const at = Number(e.at) || 0;
        const key = eventKey(e);
        if (seen.has(key)) return;
        seen.add(key);
        const meta = TYPE_META[String(e.type || "")] || {
          label: String(e.type || "Evento"),
          bg: "#E5E0D5",
          fg: "#0F2D3B",
        };
        const roleLabel =
          e.byRole === "paciente"
            ? "Paciente"
            : e.byRole === "experto"
              ? "Experto de campo"
              : e.byRole === "clinico"
                ? "Clínico"
                : e.byRole
                  ? String(e.byRole)
                  : "";
        rows.push({
          key,
          _at: at,
          type: e.type || "",
          when: fmtCrisisWhen(at),
          ago: A.agoText(at || Date.now()),
          typeLabel: meta.label,
          typeBg: meta.bg,
          typeFg: meta.fg,
          name: e.name || "—",
          by: e.by || "—",
          byMeta: roleLabel,
          source: e.source || "",
          what: e.what || "",
          detail: e.detail || e.outcome || "",
          profile: e.profile || "",
          place: e.place || "",
          status: e.status || "",
          openFile: e.pid ? () => openFile(String(e.pid), false) : null,
          hasFile: !!(e.pid && A.PATIENTS[String(e.pid)]),
        });
      };
      (Array.isArray(S.crisisLog) ? S.crisisLog : []).forEach((e) =>
        push(e as Record<string, unknown>),
      );
      (S.alerts || [])
        .filter((a) => a.sev === "crisis")
        .forEach((a) => {
          push({
            id: "bf-created-" + a.id,
            type: "created",
            alertId: a.id,
            at: a.at,
            pid: a.pid,
            name: a.name,
            by: a.createdBy || a.source || "Sistema",
            byRole: a.createdByRole || "",
            source: a.source,
            what: a.what || "Alerta de crisis abierta",
            detail:
              a.status === "mine" || a.status === "retry"
                ? "En atención"
                : "Pendiente de toma",
            profile: a.profile,
            place: a.place,
            status: a.status,
          });
          if (a.takenAt)
            push({
              id: "bf-taken-" + a.id,
              type: "taken",
              alertId: a.id,
              at: a.takenAt,
              pid: a.pid,
              name: a.name,
              by: a.takenBy || "Clínico",
              byRole: "clinico",
              what: "Tomó el caso de crisis",
              status: "mine",
            });
          if (a.status === "retry" && a.retryAt)
            push({
              id: "bf-retry-" + a.id,
              type: "retry",
              alertId: a.id,
              at: a.takenAt || a.at,
              pid: a.pid,
              name: a.name,
              by: a.takenBy || "Clínico",
              byRole: "clinico",
              what: "Registró intento sin respuesta",
              detail: "Reintentar a las " + a.retryAt,
              status: "retry",
            });
        });
      (S.closedToday || [])
        .filter((c) => c.sev === "crisis")
        .forEach((c) => {
          push({
            id: "bf-created-closed-" + c.id,
            type: "created",
            alertId: c.id,
            at: c.at,
            pid: c.pid,
            name: c.name,
            by: c.createdBy || c.source || "Sistema",
            byRole: c.createdByRole || "",
            source: c.source,
            what: c.what || "Alerta de crisis",
            profile: c.profile,
            place: c.place,
            status: "new",
          });
          if (c.takenAt)
            push({
              id: "bf-taken-closed-" + c.id,
              type: "taken",
              alertId: c.id,
              at: c.takenAt,
              pid: c.pid,
              name: c.name,
              by: c.takenBy || c.closedBy || "Clínico",
              byRole: "clinico",
              what: "Tomó el caso de crisis",
            });
          const clinAt = c.attendedAt || c.closedAt || c.at;
          const waiting =
            c.status === "awaiting_patient" ||
            (!c.patientConfirmedAt && c.status !== "closed");
          push({
            id: "bf-await-" + c.id + "-" + clinAt,
            type: waiting || !c.patientConfirmedAt ? "awaiting_patient" : "closed",
            alertId: c.id,
            at: clinAt,
            pid: c.pid,
            name: c.name,
            by: c.attendedBy || c.closedBy || "Clínico",
            byRole: "clinico",
            what: waiting
              ? "Gestionó la crisis · esperando al paciente"
              : "Crisis cerrada (clínico)",
            detail: c.outcome || "",
            outcome: c.outcome,
            profile: c.profile,
            place: c.place,
            status: waiting ? "awaiting_patient" : "closed",
          });
          if (c.patientConfirmedAt) {
            push({
              id: "bf-confirmed-" + c.id + "-" + c.patientConfirmedAt,
              type: "closed",
              alertId: c.id,
              at: c.patientConfirmedAt,
              pid: c.pid,
              name: c.name,
              by: c.name || "Paciente",
              byRole: "paciente",
              what: "Paciente confirmó «estoy bien» · crisis cerrada",
              detail: c.outcome || "",
              outcome: c.outcome,
              status: "closed",
            });
          }
        });
      rows.sort((a, b) => b._at - a._at);
      return rows.map(({ _at, ...rest }) => rest);
    };
    const allCrisisHistory = buildCrisisHistory();
    const fileCrisisHistory = buildCrisisHistory(P.id, P.name);
    const fileCrisisCreated = fileCrisisHistory.filter(
      (e) => e.type === "created",
    );
    const fileCrisisLast = fileCrisisCreated[0] || fileCrisisHistory[0] || null;

    Object.assign(f, {
      profile: fileProfile || f.profile || "Sin perfil",
      inCrisis: fileInCrisis,
      stateId: fileStateId,
      stateLabel: fileState.label,
      stateBg: fileState.bg,
      stateFg: fileState.fg,
      crisisAlert: S.alerts.find((a) => a.pid === P.id && a.sev === "crisis"),
      goCrisis: () => navigateView("alerts"),
      crisisHistory: fileCrisisHistory,
      crisisCount: fileCrisisCreated.length,
      crisisCountLabel:
        fileCrisisCreated.length === 0
          ? "Sin crisis registradas"
          : fileCrisisCreated.length === 1
            ? "1 crisis registrada"
            : fileCrisisCreated.length + " crisis registradas",
      crisisLastAgo: fileCrisisLast
        ? "Última: " + (fileCrisisLast.ago as string)
        : "Sin episodios previos",
      crisisLastWhen: fileCrisisLast
        ? (fileCrisisLast.when as string)
        : "",
      hasCrisisHistory: fileCrisisHistory.length > 0,
    });

    const analizadorPanel = buildAnalizadorPanel({
      store: A,
      patients: patientsAll.map((p) => ({
        id: p.id,
        name: p.name,
        profile: p.profile,
        weeks: A.PATIENTS[p.id]?.weeks ?? A.PATIENTS[p.id]?.week,
        week: A.PATIENTS[p.id]?.week,
        adherence: A.PATIENTS[p.id]?.adherence ?? null,
      })),
      avisosVistos: st.avisosVistos || [],
    });
    const analizadorAvisos = analizadorPanel.avisos.map((a) => ({
      ...a,
      abrir: () => openFile(a.pid),
      vista: () =>
        setState({
          avisosVistos: [...(stRef.current.avisosVistos || []), a.id],
        }),
    }));
    const analizadorCarga = analizadorPanel.carga.map((c) => ({
      ...c,
      open: () => openFile(c.pid),
    }));

    return {
      dev: A.devMode(),
      zoom: st.zoom || 1,
      isHome: st.view === "home",
      view: st.view,
      showFab: st.view !== "home" && !st.agentOpen,
      agentOpen: st.agentOpen,
      openAgent: () => setState({ agentOpen: true }),
      closeAgent: () => setState({ agentOpen: false, pendingAsk: "" }),
      askFromHome: (q) => setState({ agentOpen: true, pendingAsk: q }),
      pendingAsk: st.pendingAsk || "",
      ovW: window.innerWidth / (st.zoom || 1) + "px",
      ovH: window.innerHeight / (st.zoom || 1) + "px",
      drawerW: window.innerWidth < 720 ? window.innerWidth / (st.zoom || 1) + "px" : "480px",
      ctxLabel:
        "Sobre: " +
        ({
          alerts: "Crisis",
          crisisHistory: "Historial de crisis",
          patients: "Mis pacientes",
          approvals: "Aprobaciones",
          analizador: "Analizador",
          file: "Ficha de " + P.name,
        }[st.view] || "Inicio"),
      goAlerts: () => {
        const toTakeN = alerts.filter((a) => a.canTake).length;
        const mineN = alerts.filter((a) => a.isMine).length;
        navigateView("alerts", {
          crisisTab: toTakeN > 0 ? "take" : mineN > 0 ? "mine" : "all",
        });
      },
      goCrisisHistory: () => navigateView("crisisHistory"),
      goApprovals: () => navigateView("approvals"),
      goAnalizador: () => navigateView("analizador"),
      openCount: pending,
      upcoming: ids
        .map((id) => A.PATIENTS[id])
        .filter((p) => p && p.next)
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          next: p.next,
          open: () => openFile(p.id),
        })),
      agentAction: (action, p) => {
        if (action === "detail") {
          if (p.target === "file") openFile(p.pid, true);
          else navigateView(p.target, { agentOpen: false });
          if (p.target === "file") setState({ agentOpen: false });
        }
        if (action === "file") {
          openFile(p, true);
          setState({ agentOpen: false });
        }
        if (action === "prep-gloria")
          router.push(
            "/informes?t=session-gloria&back=" + encodeURIComponent("/clinico"),
          );
        if (action === "report")
          router.push(
            "/informes?id=" + p + "&back=" + encodeURIComponent("/clinico"),
          );
        if (action === "use-ref-gloria")
          navigateView("file", {
            refReason: p.draft,
            pid: "gloria",
            msg: "Borrador confirmado en el formulario de remisión. Revise y envíe.",
          });
      },
      screenCode: {
        home: "ClinicianHome",
        alerts: "ClinicianCrisis",
        crisisHistory: "ClinicianCrisisHistory",
        patients: "ClinicianCaseload",
        approvals: "ClinicianApprovals",
        analizador: "ClinicianAnalizador",
        file: "CaseFile",
      }[st.view],
      nav: [
        ["home", "Inicio"],
        ["approvals", apprN ? "Aprobaciones · " + apprN : "Aprobaciones"],
        ["patients", "Mis pacientes"],
        ["analizador", "Analizador"],
        ["crisisHistory", "Historial de crisis"],
      ].map(([k, label]) => {
        const active =
          (st.view === "file" ? (st.fileFrom || {}).view : st.view) === k;
        return {
          key: k,
          label,
          active,
          href: clinicoPathForView(k),
          bd: active ? C.amarillo : "transparent",
          fg: active ? C.verde : C.tinta,
          go: () => navigateView(k),
        };
      }),
      critText: pending
        ? "en crisis " + pending
        : "Sin crisis pendientes",
      critBd: pending ? "#6B0000" : C.lineas,
      critBg: pending ? "#6B0000" : "#fff",
      critFg: pending ? "#FFFFFF" : C.texto2,
      hasCrisisPending: pending > 0,
      isAlerts: st.view === "alerts",
      isCrisisHistory: st.view === "crisisHistory",
      isPatients: st.view === "patients",
      isFile: st.view === "file",
      isApprovals: st.view === "approvals",
      isAnalizador: st.view === "analizador",
      goHome: () => navigateView("home"),
      crisisHistory: allCrisisHistory,
      analizadorTotales: analizadorPanel.totales,
      analizadorAvisos,
      analizadorSinAvisos: analizadorPanel.sinAvisos,
      analizadorCarga,
      anCardTxt: analizadorPanel.anCardTxt,
      fileBackLabel:
        "← Volver a " +
        ({
          home: "Inicio",
          alerts: "Crisis",
          crisisHistory: "Historial de crisis",
          patients: "Mis pacientes",
          approvals: "Aprobaciones",
          analizador: "Analizador",
        }[(st.fileFrom || {}).view] || "Mis pacientes") +
        ((st.fileFrom || {}).agent ? " y al asistente" : ""),
      fileBack: () => {
        const fr = st.fileFrom || { view: "patients" };
        navigateView(fr.view || "patients", {
          agentOpen: !!fr.agent && fr.view !== "home",
        });
      },
      approvals: filteredApprovals,
      approvalsAll: approvals,
      noApprovals: !filteredApprovals.length,
      apprFilter: st.apprFilter,
      apprFilters: [
        { id: "all", label: "Todas", n: apprN },
        { id: "eval", label: "Evaluaciones", n: evalN },
        { id: "path", label: "Rutas", n: pathN },
        { id: "rules", label: "Reglas", n: rulesN },
      ].map((x) => ({
        ...x,
        active: st.apprFilter === x.id,
        pick: () => setState({ apprFilter: x.id }),
      })),
      patientStates: PATIENT_STATES,
      stateFilter: st.stateFilter,
      stateFilters: [{ id: "all", label: "Todos" }]
        .concat(
          PATIENT_STATES.filter((s) => s.id !== "aprobado").map((s) => ({
            id: s.id,
            label: s.label,
          })),
        )
        .map((x) => ({
          ...x,
          active: st.stateFilter === x.id,
          pick: () => setState({ stateFilter: x.id }),
        })),
      profiles: profileCatalog(A.RISK, A.DIG),
      fRoute: (() => {
        const pc2 = A.parseCode(P.profile);
        if (pc2.r < 0 || pc2.d < 0) return [];
        const terr =
          String(P.terr || "").trim() ||
          String((P.ctx as { terr?: string } | undefined)?.terr || "").trim() ||
          "";
        const ctx = {
          ...(P.ctx && typeof P.ctx === "object" ? P.ctx : {}),
          terr: terr || undefined,
        };
        // Misma fuente que la app del paciente: pathOverrides del territorio ('' = off).
        const list = collapsePathListForHub(
          A.pathList(pc2.r, pc2.d, null, ctx) || [],
        );
        return list.map((x: { name: string; freq: string; channel?: string }) => ({
          name: x.name,
          freq: x.freq + (x.channel ? " · " + x.channel : ""),
        }));
      })(),
      /** Herramientas = ruta aprobada del territorio (igual que el paciente). */
      fHerramientas: (() => {
        const pc2 = A.parseCode(P.profile);
        if (pc2.r < 0 || pc2.d < 0) return [];
        const terr =
          String(P.terr || "").trim() ||
          String((P.ctx as { terr?: string } | undefined)?.terr || "").trim() ||
          "";
        const ctx = {
          ...(P.ctx && typeof P.ctx === "object" ? P.ctx : {}),
          terr: terr || undefined,
        };
        const list = collapsePathListForHub(
          A.pathList(pc2.r, pc2.d, null, ctx) || [],
        );
        return list.map(
          (x: { id: string; name: string; freq: string; channel?: string }) => ({
            id: x.id,
            name: x.name,
            freq: x.freq,
            channel: x.channel || "",
          }),
        );
      })(),
      alerts,
      noAlerts: alerts.length === 0,
      closed: closedDone,
      awaiting: awaitingPatient,
      noClosed: closedDone.length === 0,
      crisisTab: st.crisisTab || "take",
      crisisBoard: (() => {
        const toTake = alerts.filter((a) => a.canTake);
        const mine = alerts.filter((a) => a.isMine);
        const others = alerts.filter((a) => a.isOther);
        const info = alerts.filter((a) => a.isInfo);
        /** Cola abierta = esperan «estoy bien» del paciente (ya gestionadas por clínico). */
        const late = alerts.filter((a) => a.isCrisis && a.isLate && a.status !== "closed");
        const tab = st.crisisTab || "take";
        const tabs = [
          { id: "take", label: "Por tomar", n: toTake.length, hint: "Aún no las ha tomado nadie" },
          { id: "mine", label: "En atención", n: mine.length, hint: "Casos que usted está gestionando" },
          {
            id: "all",
            label: "Cola abierta",
            n: awaitingPatient.length,
            hint: "Esperan confirmación «estoy bien» del paciente",
          },
          {
            id: "done",
            label: "Gestionadas hoy",
            n: closedDone.length,
            hint: "Ya cerradas hoy (paciente confirmó o salió de crisis)",
          },
        ].map((t) => ({
          ...t,
          active: tab === t.id,
          pick: () => setState({ crisisTab: t.id }),
        }));
        return {
          tabs,
          toTake,
          mine,
          others,
          info,
          late,
          awaiting: awaitingPatient,
          closed: closedDone,
          counts: {
            toTake: toTake.length,
            mine: mine.length,
            others: others.length,
            info: info.length,
            late: late.length,
            done: closedDone.length,
            open: awaitingPatient.length,
          },
          emptyTake: toTake.length === 0,
          emptyMine: mine.length === 0,
          emptyAll: awaitingPatient.length === 0,
          emptyDone: closedDone.length === 0,
        };
      })(),
      patients,
      f,
      noteText: st.note,
      setNote: (e) => setState({ note: e.target.value }),
      addNote: () => {
        if (!st.note.trim()) return;
        const yo = A.session() || {};
        A.set((s) => {
          s.notes = s.notes || {};
          (s.notes[P.id] = s.notes[P.id] || []).push({
            pid: P.id, text: st.note.trim(), by: yo.id || "", byName: yo.name || "Clínico", at: Date.now(),
          });
        });
        setState({ note: "", msg: "Nota agregada a la línea de tiempo." });
      },
      adjust: ["Subir a sesiones semanales", "Bajar intensidad", "Agregar revisita del experto"].map(
        (label) => ({
          label,
          go: () => {
            const yo = A.session() || {};
            const persona = (S.people || []).find((x: { id?: string }) => x.id === P.id) as { expertId?: string; expert?: string } | undefined;
            const ex = persona?.expertId || persona?.expert || "";
            A.set((s) => {
              s.pathAdjust = s.pathAdjust || {};
              (s.pathAdjust[P.id] = s.pathAdjust[P.id] || []).push({
                pid: P.id, text: label + ". Notificado a la paciente y al experto.", by: yo.id || "", byName: yo.name || "Clínico", at: Date.now(),
              });
              if (label === "Agregar revisita del experto" && ex) {
                (s.revisits[ex] = s.revisits[ex] || []).push({
                  pid: P.id,
                  name: P.name,
                  place: String(P.place || "").split(",")[0],
                  when: "Esta semana",
                  why: "Pedida por " + (yo.name || "el clínico"),
                });
                A.pushNotif(s, ex, "Nueva revisita asignada: " + P.name, "/experto");
              }
            });
            setState({
              msg: "Ruta ajustada: " + label.toLowerCase() + ". Se notificó a la paciente y al experto.",
            });
          },
        }),
      ),
      insts: INSTS,
      refInst: st.refInst,
      setRefInst: (e) => setState({ refInst: e.target.value }),
      refReason: st.refReason,
      setRefReason: (e) => setState({ refReason: e.target.value, refErr: false }),
      refBd: st.refErr ? C.revisar : C.lineas,
      refer: () => {
        if (!st.refReason.trim())
          return setState({ refErr: true, msg: "Escriba el motivo de la remisión." });
        A.set((s) => {
          s.referrals.unshift({
            id: "r-" + P.id,
            pid: P.id,
            name: P.name,
            age: P.age,
            date: "29 sep",
            by: "Dra. Lucía Marín",
            reason: st.refReason.trim(),
            phq: P.phq[0] + " → " + cur,
            status: "Pendiente de cita",
            inst: st.refInst,
          });
          s.alerts = s.alerts.filter((a) => a.pid !== P.id || a.sev === "crisis");
          if (st.refInst === "hsal")
            A.pushNotif(s, "inst", "Nueva remisión: " + P.name, "/observador");
          if (P.id === "diana")
            s.dianaInbox.push({
              id: "d" + Date.now(),
              text: "Su psicóloga la remitió a otra institución. Vea los detalles en Mi ruta.",
              tab: "route",
              seen: false,
            });
        });
        setState({ msg: "Remisión enviada. La institución la ve en «Casos remitidos»." });
      },
      msg: st.msg,
      clearMsg: () => setState({ msg: "" }),
    };
  }

  const v = useMemo(() => {
    if (!session) return null;
    if (typeof window === "undefined") return null;
    const base = rv();
    const asPart = asVals(store, store.get(), st);
    return { ...base, ...asPart };
  }, [session, st, store, router, live]);

  return { v, session };
}
