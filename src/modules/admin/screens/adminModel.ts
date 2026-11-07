/* eslint-disable @typescript-eslint/no-explicit-any */
// Auto-ported from Admin.dc.html — keep in sync with prototype logic.
import {
  DEFAULT_INACTIVE_MINUTES,
  patientStateLabel,
  resolveAdminPersonState,
} from "@/lib/clinical/patientStates";
import { CHECKS, type AdminUiState } from "./adminConstants";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { resolvePlaceLatLng, terrCenter } from "@/lib/geo/quindioPlaces";
import { buildPathServiceRows } from "@/modules/admin/rutas/servicios";
import {
  generateAccessPassword,
  generateConsienteEmail,
} from "@/lib/auth/generateCredentials";
import {
  minPasswordLengthForRole,
  passwordPolicyError,
} from "@/lib/auth/passwordPolicy";
import { withTestTerritory } from "@/lib/geo/colombia";

const EMPTY_EF = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  terr: "",
  target: "",
  password: "",
};

export type AdminModelApi = {
  setState: (patch: Partial<AdminUiState> | ((s: AdminUiState) => AdminUiState)) => void;
  go: (view: string, extra?: Partial<AdminUiState>) => void;
  draft: (code: string) => { s: Record<string, string>; months: number; inactiveMinutes?: number };
  setDraft: (code: string, fn: (d: { s: Record<string, string>; months: number; inactiveMinutes?: number }) => void) => void;
  router: AppRouterInstance;
};

export function buildAdminModel(A: any, st: AdminUiState, api: AdminModelApi) {
  function perfVals(A: any, S: any, C: any, st: AdminUiState) {
    const per = st.pfPer || '4w', terr = st.pfTerr || '';
    const P = A.teamPerf(S, per, terr), sk = st.pfSort || 'name', dir = st.pfDir || 1;
    const rows = P.rows.slice().sort((a, b) => { const x = sk === 'mix' ? a.rural - a.ruralG : a[sk], y = sk === 'mix' ? b.rural - b.ruralG : b[sk]; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir; });
    const cols = [['name', 'Experto · territorio'], ['vpd', 'Visitas por día'], ['dur', 'Duración promedio (min)'], ['gps', 'GPS correcto'], ['ver', 'Verificación'], ['rej', 'Rechazadas'], ['gap', 'Tiempo entre visitas (min)'], ['mix', 'Mezcla · rural / 60+'], ['status', 'Estado']];
    const SC = { 'Al día': C.alDia, 'Bajo meta': C.bajoMeta, 'Revisar': C.revisar };
    const mapT = terr || 'Salento', T = A.terrInfo(S, mapT) || { places: [] };
    const places = T.places.slice(0, 10), n = places.length;
    const exps = A.experts(S).filter(e => e.terr === mapT && e.active !== false && !e.isNew);
    const PAL = ['#0F2D3B', '#31C6E6', '#6C04C9', '#61F0D2'];
    const h = (str: string) => { let x = 3; for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0; return x; };
    const mapMarkers: { lat: number; lng: number; color: string; tip: string; alert?: boolean; kind: 'place' | 'visit' }[] = [];
    if (!places.length) {
      const [lat, lng] = terrCenter(mapT);
      mapMarkers.push({ lat, lng, color: '#31C6E6', kind: 'place', tip: mapT + ' · centro del municipio' });
    }
    places.forEach(([name, rural]: [string, boolean]) => {
      const [lat, lng] = resolvePlaceLatLng(name, mapT);
      mapMarkers.push({
        lat, lng, color: rural ? '#31C6E6' : '#C4BDB3', kind: 'place',
        tip: name + (rural ? ' · Vereda rural' : ' · Barrio urbano'),
      });
    });
    const visitMarkers: typeof mapMarkers = [];
    exps.forEach((e: any, ei: number) => {
      const wl = e.id === 'andres' || e.id === 'mj'
        ? (S.worklists[e.id] || []).filter((w: any) => /validada|crisis|curso|revision/.test(w.status)).map((w: any) => ({ place: w.place, who: w.time }))
        : Array.from({ length: e.today || 0 }, (_, i) => ({ place: n ? places[(h(e.name) + i * 3) % n][0] : mapT, who: 'visita ' + (i + 1) }));
      const gpsFlag = (S.flags || []).find((f: any) => f.expertName === e.name && /GPS/.test((f.reasons || []).join(' ')) && f.status === 'pending');
      wl.forEach((w: any, i: number) => {
        const place = w.place || mapT;
        const [lat, lng] = resolvePlaceLatLng(place, mapT, h(e.name + i) % 17 + 1);
        const bad = !!(gpsFlag && i === wl.length - 1);
        visitMarkers.push({
          lat, lng,
          color: bad ? '#B42318' : PAL[ei % PAL.length],
          alert: bad,
          kind: 'visit',
          tip: e.name + ' · ' + place + ' · ' + w.who + (bad ? ' · GPS de cierre lejos del inicio' : ''),
        });
      });
    });
    mapMarkers.push(...visitMarkers);
    const pct = (v: number) => v + ' %', A0 = P.program;
    return {
      teamTabs: [['1', 'Equipo'], ['2', 'Desempeño']].map(([k, label]) => ({ label, bd: (st.teamTab || '1') === k ? C.amarillo : 'transparent', fg: (st.teamTab || '1') === k ? C.verde : C.tinta, go: () => api.setState({ teamTab: k }) })),
      teamTab1: (st.teamTab || '1') === '1', teamTab2: st.teamTab === '2',
      pfTerr: terr, setPfTerr: (e: any) => api.setState({ pfTerr: e.target.value }),
      pfPeriods: [['week', 'Esta semana'], ['4w', '4 semanas'], ['month', 'Mes']].map(([k, label]) => ({ label, bg: per === k ? C.verde : '#fff', fg: per === k ? '#fff' : C.verde, go: () => api.setState({ pfPer: k }) })),
      pfCols: cols.map(([k, label]) => ({ label, arrow: sk === k ? (dir > 0 ? ' ↑' : ' ↓') : '', fg: sk === k ? C.verde : C.texto2, go: () => api.setState({ pfSort: k, pfDir: sk === k ? -dir : 1 }) })),
      pfRows: rows.map((r: any) => ({ open: () => { api.router.push('/admin/experto?e=' + encodeURIComponent(r.name)); }, name: r.name, terr: r.terr, vpd: String(r.vpd).replace('.', ','), dur: r.dur + ' min', durFg: r.dur < 20 ? '#7A3A10' : C.tinta, durBg: r.dur < 20 ? '#F7E2D2' : 'transparent', durFw: r.dur < 20 ? 600 : 400, gps: pct(r.gps), gpsFg: r.gps < 90 ? '#7A3A10' : C.tinta, gpsFw: r.gps < 90 ? 600 : 400, ver: pct(r.ver), verFg: r.ver < 88 ? '#7A3A10' : C.tinta, verFw: r.ver < 88 ? 600 : 400, rej: r.rej, gap: r.gap + ' min', gapFg: r.gap < 10 ? '#7A3A10' : C.tinta, gapFw: r.gap < 10 ? 600 : 400, mix: r.rural + ' % / ' + r.ruralG + ' · ' + r.sixty + ' % / ' + r.sixtyG, status: r.status, sc: SC[r.status] })),
      pfAvg: { vpd: String(A0.vpd).replace('.', ','), dur: A0.dur + ' min', gps: pct(A0.gps), ver: pct(A0.ver), rej: String(A0.rej).replace('.', ','), gap: A0.gap + ' min', mix: A0.rural + ' % / ' + A0.ruralG + ' · ' + A0.sixty + ' % / ' + A0.sixtyG },
      mapTerr: mapT,
      mapCenter: terrCenter(mapT),
      mapMarkers,
      mapEmpty: !visitMarkers.length,
      mapLegend: exps.map((e: any, i: number) => ({ name: e.name, c: PAL[i % PAL.length] })),
    };
  }
  function rulesVals(A, S, C, st) {
    A.ensure(S);
    const terrNames: string[] = withTestTerritory(
      (S.territories || []).map((t: { name?: string }) => t.name).filter(Boolean) as string[],
    );
    const pathTerr =
      (st.pathTerr && terrNames.includes(st.pathTerr) ? st.pathTerr : null) ||
      terrNames[0] ||
      '';
    if (pathTerr && typeof A.applyRules === 'function') {
      A.applyRules(S, pathTerr);
    }
    const pack =
      (pathTerr && A.getTerrRules && A.getTerrRules(S, pathTerr)) ||
      null;
    const live = pack
      ? {
          risk: pack.risk,
          phq: pack.phq || (A.defaultPhqRules && A.defaultPhqRules()),
          dig: pack.dig,
          ctx: pack.ctx || (A.defaultCtxRules && A.defaultCtxRules()),
          custom: Array.isArray(pack.custom) ? pack.custom : [],
        }
      : {
          risk: S.rules.risk,
          phq: S.rules.phq || (A.defaultPhqRules && A.defaultPhqRules()),
          dig: S.rules.dig,
          ctx: S.rules.ctx || (A.defaultCtxRules && A.defaultCtxRules()),
          custom: Array.isArray(S.rules.custom) ? S.rules.custom : [],
        };
    const base = pack && pack.pending ? pack.pending.draft : (S.rules.pending && !pack ? S.rules.pending.draft : live);
    // Siempre clonar: al sincronizar cortes/riesgo no mutamos st.rd en el render.
    const rd = JSON.parse(JSON.stringify(st.rd || base));
    if (!rd.dig) rd.dig = {};
    if (!Array.isArray(rd.dig.q) || !rd.dig.q.length) {
      rd.dig.q = (A.defaultDigRules ? A.defaultDigRules().q : A.DIGQ.map((x: { q: string; o: string[] }) => ({
        q: x.q,
        o: x.o.map((o: string, i: number) => ({ o, p: i })),
      })));
    }
    if (!Array.isArray(rd.dig.cuts) || !rd.dig.cuts.length) {
      rd.dig.cuts = A.DIG.map((d: { k: string; min: number; max: number }) => ({
        k: d.k,
        min: d.min,
        max: d.max,
      }));
    }
    if (!rd.phq || !Array.isArray(rd.phq.q) || !rd.phq.q.length) {
      rd.phq = A.defaultPhqRules ? A.defaultPhqRules() : { q: A.PHQ.map((t: string) => ({ q: t, o: A.PHQ_OPTS.map((o: string, i: number) => ({ o, p: i })) })) };
    }
    if (!rd.ctx || !Array.isArray(rd.ctx.q) || !rd.ctx.q.length) {
      rd.ctx = A.defaultCtxRules ? A.defaultCtxRules() : { q: A.CTX.map((x: { q: string; o: string[] }) => ({ q: x.q, o: x.o.map((o: string, i: number) => ({ o, p: i })) })) };
    }
    if (!Array.isArray(rd.custom)) rd.custom = [];
    const num = (v) => (v === '' || isNaN(+v) ? NaN : +v);
    const LIKERT: string[] = A.PHQ_OPTS || ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'];
    const likertOpts = () => LIKERT.slice(0, 4).map((o, i) => ({ o, p: i }));
    /** Toda pregunta: exactamente 4 opciones, puntos fijos 0–3. */
    const ensureLikert4 = (q: { o?: { o?: string; p?: number | string }[] }) => {
      const prev = Array.isArray(q.o) ? q.o : [];
      q.o = [0, 1, 2, 3].map((i) => ({
        o: String((prev[i] && prev[i].o) || LIKERT[i] || ('Opción ' + (i + 1))),
        p: i,
      }));
    };
    const qMax = (qs) => (qs || []).reduce((a, q) => a + Math.max(0, ...((q.o || []).map((o) => num(o.p) || 0))), 0);
    const redistributeBands = (bands, maxPts) => {
      if (!Array.isArray(bands) || !bands.length) return;
      const n = bands.length;
      let prev = -1;
      for (let i = 0; i < n; i++) {
        const lo = prev + 1;
        const hi = i === n - 1 ? maxPts : Math.floor(((i + 1) * maxPts) / n);
        bands[i].min = lo;
        bands[i].max = Math.max(lo, hi);
        prev = bands[i].max;
      }
      bands[0].min = 0;
      bands[n - 1].max = maxPts;
    };
    /** Si el máximo de puntos ya no calza con el último corte/rango, lo extiende (o redistribuye si hace falta). */
    const fitBandsToMax = (bands, maxPts) => {
      if (!Array.isArray(bands) || !bands.length) return;
      bands[0].min = 0;
      const last = bands[bands.length - 1];
      if (num(last.max) === maxPts) return;
      if (maxPts >= num(last.min)) {
        last.max = maxPts;
        return;
      }
      redistributeBands(bands, maxPts);
    };
    const syncScoreBands = (d) => {
      (d.phq?.q || []).forEach(ensureLikert4);
      (d.dig?.q || []).forEach(ensureLikert4);
      (d.ctx?.q || []).forEach(ensureLikert4);
      (d.custom || []).forEach((c: { q?: unknown[] }) => (c.q || []).forEach(ensureLikert4));
      fitBandsToMax(d.dig?.cuts, qMax(d.dig?.q || []));
      fitBandsToMax(d.risk, qMax(d.phq?.q || []));
    };
    syncScoreBands(rd);
    const upd = (fn) => {
      const d = JSON.parse(JSON.stringify(rd));
      fn(d);
      syncScoreBands(d);
      api.setState({ rd: d, rulesMsg: '' });
    };
    const mapQBlock = (sec: 'phq' | 'dig' | 'ctx') =>
      (rd[sec].q || []).map((q, qi) => ({
        n: qi + 1,
        q: q.q,
        showCrisisToggle: sec === 'phq' && qi === 8,
        crisisOn: sec === 'phq' && qi === 8 ? q.crisis !== false : false,
        toggleCrisis: sec === 'phq' && qi === 8
          ? () => upd((d) => {
              const row = d.phq.q[8];
              if (!row) return;
              row.crisis = row.crisis === false;
            })
          : undefined,
        setQ: (e) => upd((d) => { d[sec].q[qi].q = e.target.value; }),
        remove: () => upd((d) => { d[sec].q.splice(qi, 1); }),
        opts: (q.o || []).slice(0, 4).map((o, oi) => ({
          o: o.o,
          p: String(oi),
          setO: (e) => upd((d) => {
            ensureLikert4(d[sec].q[qi]);
            d[sec].q[qi].o[oi].o = e.target.value;
          }),
        })),
      }));
    let err = '';
    const rs = rd.risk;
    const phqMax = qMax(rd.phq.q);
    if (!rd.phq.q.length) err = 'El cuestionario de ánimo debe tener al menos una pregunta.';
    if (!rs || !rs.length) err = err || 'Defina al menos un nivel de riesgo.';
    else {
      if (num(rs[0].min) !== 0 || num(rs[rs.length - 1].max) !== phqMax) err = err || 'Los niveles de riesgo deben cubrir de 0 a ' + phqMax + '.';
      rs.forEach((r, i) => { if (!(num(r.min) <= num(r.max))) err = 'Revise el rango de ' + (r.k || 'un nivel') + '.'; if (i && num(r.min) !== num(rs[i - 1].max) + 1) err = 'Los rangos deben ser seguidos, sin huecos ni cruces (' + rs[i - 1].k + ' → ' + r.k + ').'; if (!String(r.k).trim()) err = 'Cada nivel necesita un nombre.'; });
    }
    const digMax = qMax(rd.dig.q);
    if (!rd.dig.q.length) err = err || 'Capacidad digital debe tener al menos una pregunta.';
    const cuts = rd.dig.cuts;
    if (!cuts || !cuts.length) err = err || 'Defina al menos un corte digital.';
    else {
      if (num(cuts[0].min) !== 0 || num(cuts[cuts.length - 1].max) !== digMax) err = err || 'Los cortes digitales deben cubrir de 0 a ' + digMax + '.';
      cuts.forEach((c, i) => { if (!(num(c.min) <= num(c.max)) || (i && num(c.min) !== num(cuts[i - 1].max) + 1)) err = err || 'Revise los cortes de capacidad digital.'; });
    }
    if (!rd.ctx.q.length) err = err || 'Contexto de vida debe tener al menos una pregunta.';
    const allQs = [
      ...rd.phq.q,
      ...rd.dig.q,
      ...rd.ctx.q,
      ...(rd.custom || []).flatMap((c: { q?: unknown[] }) => c.q || []),
    ];
    allQs.forEach((q) => {
      if (!String(q.q || '').trim()) err = err || 'Toda pregunta necesita un enunciado.';
      if (!q.o || q.o.length !== 4) err = err || 'Cada pregunta debe tener exactamente 4 opciones (0 a 3 pts).';
      (q.o || []).forEach((o, oi) => {
        if (num(o.p) !== oi) err = err || 'Los puntos de cada pregunta deben ser 0, 1, 2 y 3.';
        if (!String(o.o || '').trim()) err = err || 'Toda opción necesita un texto.';
      });
    });
    (rd.custom || []).forEach((c: { title?: string }) => {
      if (!String(c.title || '').trim()) err = err || 'Cada cuestionario extra necesita un nombre.';
    });
    const liveSnap = {
      risk: live.risk,
      phq: live.phq,
      dig: live.dig,
      ctx: live.ctx,
      custom: live.custom || [],
    };
    const changed = JSON.stringify(rd) !== JSON.stringify(liveSnap);
    const au = st.au || S.rules.auto, auChanged = JSON.stringify(au) !== JSON.stringify(S.rules.auto);
    const sp = num(st.simPhq ?? '17'), sd = num(st.simDig ?? '6');
    const ri = rs.findIndex(r => sp >= num(r.min) && sp <= num(r.max)), di = cuts.findIndex(c => sd >= num(c.min) && sd <= num(c.max));
    const diForced = st.simNoPhone ? 0 : di;
    const simOk = ri > -1 && (st.simNoPhone || di > -1);
    let sim = { services: [] };
    if (simOk) {
      const ri2 = Math.min(rs.length - 1, ri);
      const di2 = Math.min(cuts.length - 1, st.simNoPhone ? 0 : diForced);
      const digLabel = st.simNoPhone ? 'baja' : String(cuts[di].k).toLowerCase();
      const code = A.code(ri2, di2);
      const dr = (st.drafts || {})[code];
      sim = {
        code,
        label: rs[ri].k + ' × digital ' + digLabel,
        bg: rs[ri].c + '33',
        crisis: false,
        months: A.defaultPath(ri2, di2).months,
        services: A.pathList(ri2, di2, dr, { dano: +(st.simDano || 0), perdida: st.simLoss ? 1 : 0, terr: pathTerr }).map(s => ({ name: s.name, freq: s.freq + (s.channel ? ' · ' + s.channel : '') })),
      };
    }
    const pend = (pack && pack.pending) || (!pack ? S.rules.pending : null);
    const pathStep = st.pathTab || '1';
    const versionsSrc = (pack && pack.versions) || S.rules.versions || [];
    // Perfiles de matriz distintos al vigente (misma fusión pathServicesMap).
    const matrixDirtyCodes: string[] = (() => {
      const drafts = st.drafts || {};
      const dirtyFlags = st.pathDraftDirty || {};
      const codes = new Set<string>();
      const considerKey = (key: string) => {
        let code = "";
        if (pathTerr && key.startsWith(pathTerr + "|")) code = key.slice(pathTerr.length + 1);
        else if (!key.includes("|")) code = key;
        if (code) codes.add(code);
      };
      Object.keys(drafts).forEach(considerKey);
      Object.keys(dirtyFlags).forEach((key) => {
        if (dirtyFlags[key]) considerKey(key);
      });
      const ctx = { terr: pathTerr || undefined };
      return Array.from(codes).filter((code) => {
        const local =
          drafts[pathTerr ? pathTerr + "|" + code : code] || drafts[code];
        if (!local || !local.s) return false;
        const { r, d } = A.parseCode(code);
        if (r < 0 || d < 0) return false;
        const next =
          typeof A.pathServicesMap === "function"
            ? A.pathServicesMap(r, d, local, ctx)
            : local;
        const cur =
          typeof A.pathServicesMap === "function"
            ? A.pathServicesMap(r, d, null, ctx)
            : A.defaultPath(r, d);
        return (
          JSON.stringify(next.s || {}) !== JSON.stringify(cur.s || {}) ||
          Number(next.months) !== Number(cur.months) ||
          Number(next.inactiveMinutes ?? DEFAULT_INACTIVE_MINUTES) !==
            Number(cur.inactiveMinutes ?? DEFAULT_INACTIVE_MINUTES)
        );
      });
    })();
    const btnGhost = { fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif', fontSize: '13px', height: '34px', padding: '0 10px', borderRadius: '8px', border: '1.5px solid #E5E0D5', background: '#fff', color: '#0F2D3B', cursor: 'pointer' };
    const riskColors = ['#31C6E6', '#e9a319', '#E0A526', '#D9692B', '#9C2F25', '#0F2D3B'];
    return {
      pathTerr,
      pathTerrOpts: terrNames,
      setPathTerr: (e: { target: { value: string } } | string) => {
        const next = typeof e === 'string' ? e : e.target.value;
        api.setState({ pathTerr: next, rd: null, rulesMsg: '', drafts: {}, pathDraftDirty: {}, sel: 'P01', scope: next || 'all' });
      },
      pathTabs: (
        [
          ['1', '1 · Cuestionarios'],
          ['2', '2 · Niveles'],
          ['3', '3 · Matriz'],
          ['4', '4 · Envío'],
          ['J', 'Juegos'],
          ['A', 'Analizador'],
        ] as [string, string][]
      ).map(([k, label]) => ({
        key: k,
        label,
        ml: k === 'J' ? 24 : 0,
        bd: pathStep === k ? C.amarillo : 'transparent',
        fg: pathStep === k ? C.verde : C.tinta,
        go: () => api.setState({ pathTab: k }),
      })),
      pathTab1: pathStep === '1',
      pathTab2: pathStep === '2',
      pathTab3: pathStep === '3',
      pathTab4: pathStep === '4',
      pathTabJ: pathStep === 'J',
      pathTabA: pathStep === 'A',
      pathTabLib: pathStep === 'lib',
      closeLib: () => api.setState({ pathTab: '3' }),
      pathStepNext: () => {
        const order = ['1', '2', '3', '4', 'J', 'A'];
        const i = order.indexOf(pathStep);
        if (i >= 0 && i < order.length - 1) api.setState({ pathTab: order[i + 1] });
      },
      pathStepPrev: () => {
        const order = ['1', '2', '3', '4', 'J', 'A'];
        const i = order.indexOf(pathStep);
        if (i > 0) api.setState({ pathTab: order[i - 1] });
      },
      pathGames: (() => {
        const demo = (S as {
          quintiaDemo?: {
            games?: Record<string, { id: string; nombre: string; hab: string }>;
            gameIds?: string[];
            storeDefaults?: {
              gameCfg?: Record<
                string,
                {
                  version?: number;
                  nivel?: number;
                  sube?: string;
                  mov?: number;
                  corazones?: number;
                  cartas?: number;
                  sonido?: boolean;
                  historial?: { v: number; cuando: string; cambio: string; quien: string }[];
                }
              >;
            };
          };
        }).quintiaDemo;
        const ids = demo?.gameIds || ['frutas', 'simon', 'duelo', 'sudoku'];
        const names: Record<string, { nombre: string; hab: string }> = {
          frutas: { nombre: 'Frutas', hab: 'Atención visual y planificación' },
          simon: { nombre: 'Simón dice', hab: 'Memoria de trabajo y atención' },
          duelo: { nombre: 'Duelo de cartas', hab: 'Flexibilidad y decisiones' },
          sudoku: { nombre: 'Sudoku', hab: 'Lógica y planificación' },
        };
        const defaults: Record<
          string,
          {
            version: number;
            nivel: number;
            sube: string;
            mov?: number;
            corazones?: number;
            cartas?: number;
            sonido: boolean;
            historial: { v: number; cuando: string; cambio: string; quien: string }[];
          }
        > = {
          frutas: {
            version: 3,
            nivel: 1,
            sube: 'Automático según desempeño',
            mov: 18,
            sonido: true,
            historial: [
              { v: 3, cuando: 'Hace 3 semanas', quien: 'Marcela Ríos', cambio: 'Movimientos por partida: 20 → 18' },
              { v: 2, cuando: 'Hace 2 meses', quien: 'Marcela Ríos', cambio: 'Sonido activado' },
              { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' },
            ],
          },
          simon: {
            version: 3,
            nivel: 2,
            sube: 'Automático según desempeño',
            corazones: 2,
            sonido: true,
            historial: [
              { v: 3, cuando: 'Hace 5 semanas', quien: 'Marcela Ríos', cambio: 'Corazones: 3 → 2' },
              { v: 2, cuando: 'Hace 3 meses', quien: 'Marcela Ríos', cambio: 'Velocidad de la secuencia más lenta' },
              { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' },
            ],
          },
          duelo: {
            version: 2,
            nivel: 1,
            sube: 'Fijo',
            cartas: 5,
            sonido: false,
            historial: [
              { v: 2, cuando: 'Hace 2 meses', quien: 'Marcela Ríos', cambio: 'La regla cambia cada 4 jugadas' },
              { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' },
            ],
          },
          sudoku: {
            version: 1,
            nivel: 1,
            sube: 'Fijo',
            sonido: false,
            historial: [
              { v: 1, cuando: 'Hace 6 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' },
            ],
          },
        };
        return ids.map((id) => {
          const g = demo?.games?.[id] || { id, ...names[id] };
          const cfg = { ...defaults[id], ...(demo?.storeDefaults?.gameCfg?.[id] || {}) };
          const campos: { l: string; opts: string[]; cur: string }[] = [
            { l: 'Nivel inicial', opts: ['1', '2', '3', '4', '5'], cur: String(cfg.nivel ?? 1) },
            {
              l: 'Cómo sube el nivel',
              opts: ['Automático según desempeño', 'Fijo'],
              cur: String(cfg.sube || 'Fijo'),
            },
          ];
          if (id === 'frutas') {
            campos.push({
              l: 'Movimientos por partida',
              opts: ['12', '18', '24'],
              cur: String(cfg.mov ?? 18),
            });
          }
          if (id === 'simon') {
            campos.push({
              l: 'Corazones por partida',
              opts: ['2', '3'],
              cur: String(cfg.corazones ?? 2),
            });
          }
          if (id === 'duelo') {
            campos.push({
              l: 'Cartas por mano',
              opts: ['5', '7'],
              cur: String(cfg.cartas ?? 5),
            });
          }
          if (id === 'sudoku') {
            campos.push({
              l: 'Duración por partida',
              opts: ['Sin límite'],
              cur: 'Sin límite',
            });
          }
          campos.push({
            l: 'Sonido',
            opts: ['Sí', 'No'],
            cur: cfg.sonido ? 'Sí' : 'No',
          });
          return {
            id,
            nombre: g.nombre || names[id]?.nombre || id,
            hab: g.hab || names[id]?.hab || '',
            version: Number(cfg.version) || 1,
            campos,
            hist: cfg.historial || defaults[id]?.historial || [],
          };
        });
      })(),
      pathAnalizador: (() => {
        const an = (S as {
          quintiaDemo?: {
            medidas?: Record<string, string[]>;
            storeDefaults?: {
              anCfg?: {
                partidas?: number;
                dias?: number;
                descarta?: number;
                sens?: string;
                plazo?: number;
                version?: number;
                sugerencias?: string[];
                historial?: { v: number; cuando: string; cambio: string; quien: string }[];
                fuentes?: Record<string, boolean>;
              };
            };
            estadosAnalizador?: Record<string, { label: string; fg?: string; bg?: string; icon?: string }>;
          };
        }).quintiaDemo;
        const cfg = an?.storeDefaults?.anCfg || {
          partidas: 10,
          dias: 14,
          descarta: 3,
          sens: 'Media',
          plazo: 7,
          version: 2,
          sugerencias: [
            'Repetir la medición en 2 semanas',
            'Conversar en la próxima sesión',
            'Seguir observando',
            'Revisar la constancia con la persona',
          ],
          historial: [
            { v: 2, cuando: 'Hace 1 mes', quien: 'Marcela Ríos', cambio: 'Sensibilidad: Alta → Media' },
            { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' },
          ],
          fuentes: { frutas: true, simon: true, duelo: true, sudoku: true },
        };
        const medidasDefault: Record<string, string[]> = {
          frutas: ['Tiempo hasta cada movimiento', 'Movimientos inválidos', 'Puntaje', 'Nivel'],
          simon: ['Secuencia más larga', 'Posición del error', 'Rondas', 'Nivel'],
          duelo: ['Tiempo por jugada', 'Jugadas fuera de la regla', 'Resultado'],
          sudoku: ['Tiempo total', 'Casillas borradas', 'Errores', 'Terminado o no'],
        };
        const medidas = an?.medidas || medidasDefault;
        const estados = an?.estadosAnalizador || {
          base: { label: 'Construyendo línea base', fg: '#4F4868', bg: '#ECE9F2', icon: '◔' },
          estable: { label: 'Estable', fg: '#24566A', bg: '#E1EDF1', icon: '●' },
          mejorando: { label: 'Mejorando', fg: '#2C6247', bg: '#E0EFE5', icon: '▲' },
          cambio: { label: 'Cambio a revisar', fg: '#6E4705', bg: '#FAE7BF', icon: '◆' },
        };
        return {
          version: Number(cfg.version) || 2,
          partidas: Number(cfg.partidas) || 10,
          dias: Number(cfg.dias) || 14,
          descarta: Number(cfg.descarta) || 3,
          sens: String(cfg.sens || 'Media'),
          plazo: Number(cfg.plazo) || 7,
          sugerencias: Array.isArray(cfg.sugerencias) ? cfg.sugerencias : [],
          hist: Array.isArray(cfg.historial) ? cfg.historial : [],
          fuentesOn: cfg.fuentes || {},
          medidas,
          estados: Object.entries(estados).map(([k, v]) => ({
            id: k,
            label: v.label,
            fg: v.fg,
            bg: v.bg,
            icon: v.icon,
          })),
        };
      })(),
      matrixSizeLabel: (rs.length || 0) + ' × ' + (cuts.length || 0) + ' = ' + ((rs.length || 0) * (cuts.length || 0)) + ' perfiles',
      ...libVals(A, S, st),
      rRisk: rs.map((r, i) => ({
        k: r.k, c: r.c, min: String(r.min), max: String(r.max),
        bd: num(r.min) <= num(r.max) ? C.lineas : C.revisar,
        setK: e => upd(d => { d.risk[i].k = e.target.value; }),
        setC: e => upd(d => { d.risk[i].c = e.target.value; }),
        setMin: e => upd(d => { d.risk[i].min = e.target.value.replace(/\D/g, ''); }),
        setMax: e => upd(d => { d.risk[i].max = e.target.value.replace(/\D/g, ''); }),
        remove: rs.length > 2
          ? () => upd((d) => {
              d.risk.splice(i, 1);
              redistributeBands(d.risk, qMax(d.phq.q));
            })
          : undefined,
      })),
      addRiskLevel: () => upd((d) => {
        d.risk.push({ k: 'Nuevo nivel', c: riskColors[d.risk.length % riskColors.length], min: 0, max: 0 });
        redistributeBands(d.risk, qMax(d.phq.q));
      }),
      phqMax,
      rPhqQ: mapQBlock('phq'),
      addPhqQ: () => upd((d) => {
        d.phq.q.push({ q: 'Nueva pregunta', o: likertOpts() });
      }),
      rDigQ: mapQBlock('dig'),
      addDigQ: () => upd((d) => { d.dig.q.push({ q: 'Nueva pregunta', o: likertOpts() }); }),
      rCtxQ: mapQBlock('ctx'),
      addCtxQ: () => upd((d) => { d.ctx.q.push({ q: 'Nueva pregunta', o: likertOpts() }); }),
      rCustom: (rd.custom || []).map((c: { id?: string; title?: string; subtitle?: string; q?: unknown[] }, ci: number) => {
        const qs = Array.isArray(c.q) ? c.q : [];
        const maxPts = qMax(qs);
        return {
          id: c.id || ('c' + ci),
          title: c.title || 'Cuestionario',
          subtitle: c.subtitle || 'Cuestionario adicional de este territorio',
          maxLabel: 'Máx. ' + maxPts + ' pts',
          setTitle: (e: { target: { value: string } }) =>
            upd((d) => {
              if (!d.custom[ci]) return;
              d.custom[ci].title = e.target.value;
            }),
          remove: () =>
            upd((d) => {
              d.custom.splice(ci, 1);
            }),
          addQuestion: () =>
            upd((d) => {
              if (!d.custom[ci]) return;
              d.custom[ci].q = d.custom[ci].q || [];
              d.custom[ci].q.push({ q: 'Nueva pregunta', o: likertOpts() });
            }),
          questions: qs.map((q: any, qi: number) => ({
            n: qi + 1,
            q: q.q,
            setQ: (e: { target: { value: string } }) =>
              upd((d) => {
                d.custom[ci].q[qi].q = e.target.value;
              }),
            remove: () =>
              upd((d) => {
                d.custom[ci].q.splice(qi, 1);
              }),
            opts: (q.o || []).slice(0, 4).map((o: { o: string }, oi: number) => ({
              o: o.o,
              p: String(oi),
              setO: (e: { target: { value: string } }) =>
                upd((d) => {
                  ensureLikert4(d.custom[ci].q[qi]);
                  d.custom[ci].q[qi].o[oi].o = e.target.value;
                }),
            })),
          })),
        };
      }),
      addCustomQuestionnaire: () =>
        upd((d) => {
          d.custom = d.custom || [];
          d.custom.push({
            id: 'c' + Date.now().toString(36),
            title: 'Nuevo cuestionario',
            subtitle: 'Preguntas adicionales para este territorio',
            q: [{ q: 'Nueva pregunta', o: likertOpts() }],
          });
        }),
      rCuts: cuts.map((c, i) => ({
        k: c.k, min: String(c.min), max: String(c.max), bd: C.lineas,
        setK: e => upd(d => { d.dig.cuts[i].k = e.target.value; }),
        setMin: e => upd(d => { d.dig.cuts[i].min = e.target.value.replace(/\D/g, ''); }),
        setMax: e => upd(d => { d.dig.cuts[i].max = e.target.value.replace(/\D/g, ''); }),
        remove: cuts.length > 2
          ? () => upd((d) => {
              d.dig.cuts.splice(i, 1);
              redistributeBands(d.dig.cuts, qMax(d.dig.q));
            })
          : undefined,
      })),
      addDigCut: () => upd((d) => {
        const names = ['Baja', 'Media', 'Alta', 'Muy alta'];
        d.dig.cuts.push({ k: names[d.dig.cuts.length] || ('Nivel ' + (d.dig.cuts.length + 1)), min: 0, max: 0 });
        redistributeBands(d.dig.cuts, qMax(d.dig.q));
      }),
      digMax, ctxMax: qMax(rd.ctx.q), rulesErr: !!err && changed, rulesErrText: err,
      rulesFlash: st.rulesMsg || '', clearRulesFlash: () => api.setState({ rulesMsg: '' }),
      pathDirtyCodes: matrixDirtyCodes,
      rulesStatus: (() => {
        if (!pathTerr) return "Seleccione un territorio para configurar su ruta.";
        if (pend) {
          return (
            "Hay un cambio de " +
            pathTerr +
            " esperando aprobación clínica, enviado " +
            A.agoText(pend.at) +
            ". Mientras tanto siguen las reglas vigentes de este territorio."
          );
        }
        if (err && changed) return err;
        const bits = [];
        if (changed) bits.push("cuestionarios/niveles");
        if (matrixDirtyCodes.length) {
          bits.push(
            "matriz (" +
              matrixDirtyCodes.length +
              ": " +
              matrixDirtyCodes.slice(0, 4).join(", ") +
              (matrixDirtyCodes.length > 4 ? "…" : "") +
              ")",
          );
        }
        if (bits.length) {
          return "Cambios sin enviar · " + bits.join(" + ") + " · " + pathTerr + ".";
        }
        return (
          "Vigente en " +
          pathTerr +
          " · versión " +
          ((versionsSrc[0] && versionsSrc[0].v) || 1) +
          ". Envíe desde aquí cuestionarios y matriz."
        );
      })(),
      rulesCanSend: !!pathTerr && !err && (changed || matrixDirtyCodes.length > 0),
      sendRulesBg:
        !!pathTerr && !err && (changed || matrixDirtyCodes.length > 0)
          ? C.verde
          : "#8C857C",
      sendRules: () => {
        if (!pathTerr) return api.setState({ rulesMsg: 'Seleccione un territorio.' });
        if (err) return api.setState({ rulesMsg: err });

        const dirtyCodes = matrixDirtyCodes.slice();

        if (!changed && !dirtyCodes.length) return;

        const who = (A.session() && A.session().name) || 'Administrador';
        A.set((s) => {
          if (changed) {
            const clean = JSON.parse(JSON.stringify(rd));
            clean.risk.forEach((r) => { r.min = +r.min; r.max = +r.max; });
            clean.dig.cuts.forEach((c) => { c.min = +c.min; c.max = +c.max; });
            clean.dig.q.forEach((q) => q.o.forEach((o) => { o.p = +o.p; }));
            clean.phq.q.forEach((q) => q.o.forEach((o) => { o.p = +o.p; }));
            clean.ctx.q.forEach((q) => q.o.forEach((o) => { o.p = +o.p; }));
            (clean.custom || []).forEach((c) => {
              (c.q || []).forEach((q) => q.o.forEach((o) => { o.p = +o.p; }));
            });
            const terrPack = A.ensureTerrRules(s, pathTerr);
            terrPack.pending = { draft: clean, at: Date.now(), by: who, terr: pathTerr };
            terrPack.pendingClearedAt = 0;
            A.logActivity(s, (A.session()?.id || 'admin'), 'Envió a aprobación reglas de ' + pathTerr);
          }

          // Servicios / frecuencias de la matriz (uno por perfil).
          s.pathRequests = s.pathRequests || [];
          const now = Date.now();
          dirtyCodes.forEach((code) => {
            const live = api.draft(code);
            const draft = JSON.parse(JSON.stringify(live));
            if (!draft.s || typeof draft.s !== "object") draft.s = {};
            draft.s =
              typeof A.normalizePathS === "function"
                ? A.normalizePathS(draft.s)
                : draft.s;
            s.pathRequests = s.pathRequests.map((x) => {
              const same =
                x.code === code && String(x.scope || "all") === String(pathTerr);
              const stRq = String(x.status || "pending").toLowerCase();
              if (same && stRq === "pending") {
                return { ...x, status: "superseded", resolvedAt: now };
              }
              return x;
            });
            s.pathRequests.push({
              id: code + "-" + pathTerr + "-" + now + "-" + Math.random().toString(36).slice(2, 7),
              code,
              scope: pathTerr,
              draft,
              at: now,
              status: "pending",
            });
          });

          if (changed || dirtyCodes.length) {
            const bits = [];
            if (changed) bits.push("reglas");
            if (dirtyCodes.length) bits.push("matriz (" + dirtyCodes.join(", ") + ")");
            const msg =
              "Cambio de ruta en " + pathTerr + " (" + bits.join(" + ") + ") esperando aprobación clínica";
            A.pushNotif(s, "clin", msg, "/clinico/aprobaciones");
            A.pushNotif(s, "clinico", msg, "/clinico/aprobaciones");
          }
        });
        void import('@/lib/store/persist').then((m) => m.flushPersistWhenReady(A));
        const parts = [];
        if (changed) parts.push("cuestionarios/niveles");
        if (dirtyCodes.length) {
          parts.push(
            dirtyCodes.length === 1
              ? "perfil " + dirtyCodes[0]
              : dirtyCodes.length + " perfiles de la matriz",
          );
        }
        const nextDrafts = { ...(st.drafts || {}) };
        const nextDirty = { ...(st.pathDraftDirty || {}) };
        dirtyCodes.forEach((code) => {
          const terrKey = pathTerr ? pathTerr + "|" + code : code;
          delete nextDrafts[terrKey];
          delete nextDrafts[code];
          delete nextDirty[terrKey];
          delete nextDirty[code];
        });
        api.setState({
          rd: null,
          drafts: nextDrafts,
          pathDraftDirty: nextDirty,
          rulesMsg:
            "Enviado a la líder clínica (" +
            pathTerr +
            "): " +
            parts.join(" y ") +
            ". Se aplica al aprobar (incluye frecuencias).",
        });
      },
      resetRules: () => {
        // Descartar borrador de reglas y de matriz del territorio.
        const nextDrafts = { ...(st.drafts || {}) };
        const nextDirty = { ...(st.pathDraftDirty || {}) };
        Object.keys(nextDrafts).forEach((key) => {
          if (pathTerr && key.startsWith(pathTerr + "|")) {
            delete nextDrafts[key];
            delete nextDirty[key];
          } else if (!key.includes("|")) {
            delete nextDrafts[key];
            delete nextDirty[key];
          }
        });
        api.setState({ rd: null, rulesMsg: '', drafts: nextDrafts, pathDraftDirty: nextDirty });
      },
      btnGhost,
      autoV: au, autoSet: { expert: e => api.setState({ au: Object.assign({}, au, { expert: e.target.value }), autoMsg: '' }), clin: e => api.setState({ au: Object.assign({}, au, { clin: e.target.value }), autoMsg: '' }), review: e => api.setState({ au: Object.assign({}, au, { review: e.target.value }), autoMsg: '' }) },
      autoBg: auChanged ? C.verde : '#8C857C', autoMsg: st.autoMsg || '', clearAutoMsg: () => api.setState({ autoMsg: '' }),
      saveAuto: () => { if (!auChanged) return; const L = { territorio: 'por territorio', vereda: 'por vereda o barrio', carga: 'por carga' }; A.set(s => { s.rules.auto = au; s.rules.versions = s.rules.versions || []; const prev = (s.rules.versions[0] && s.rules.versions[0].v) || 1; s.rules.versions.unshift({ v: prev + 1, by: (A.session() && A.session().name) || 'Administrador', at: Date.now(), what: 'Asignación automática: experto ' + L[au.expert] + ', clínico ' + L[au.clin] + ', revisión de ruta ' + au.review.toLowerCase() + '.' }); A.logActivity(s, (A.session()?.id || "admin"), 'Cambió la asignación automática'); }); api.setState({ au: null, autoMsg: 'Guardado. Aplica a las personas nuevas desde hoy.' }); },
      simPhq: st.simPhq ?? '17', simDig: st.simDig ?? '6', setSimPhq: e => api.setState({ simPhq: e.target.value.replace(/\D/g, '') }), setSimDig: e => api.setState({ simDig: e.target.value.replace(/\D/g, '') }),
      simDano: st.simDano || '0', setSimDano: e => api.setState({ simDano: e.target.value }), toggleSimLoss: () => api.setState({ simLoss: !st.simLoss }), simLossBd: st.simLoss ? C.verde : C.texto2, simLossBg: st.simLoss ? C.verde : '#fff', simLossMark: st.simLoss ? '✓' : '',
      toggleSimNoPhone: () => api.setState({ simNoPhone: !st.simNoPhone }), simNoPhoneBd: st.simNoPhone ? C.verde : C.texto2, simNoPhoneBg: st.simNoPhone ? C.verde : '#fff', simNoPhoneMark: st.simNoPhone ? '✓' : '',
      toggleSimQ9: () => api.setState({ simQ9: !st.simQ9 }), simQ9Bd: st.simQ9 ? C.rojo : C.texto2, simQ9Bg: st.simQ9 ? C.rojo : '#fff', simQ9Mark: st.simQ9 ? '✓' : '',
      simOk, simBad: !simOk, sim,
      versions: versionsSrc.map(v => ({ v: v.v, by: v.by, what: v.what, when: A.fmtDay(v.at, { year: true }) }))
    };
  }
  function moreVals(A, S, C, st) {
    const fmt = n => n.toLocaleString('es-CO');
    const full = A.people(S);
    const all = full;
    const classified = (p) => !!(p.profile && /^P\d+$/i.test(String(p.profile)));
    const patientsMap = S.patients || {};
    const accountsList = S.accounts || [];
    const accountForPerson = (p) => {
      const pat =
        patientsMap[p.id] ||
        Object.values(patientsMap).find(
          (x: { id?: string; code?: string; email?: string; accountId?: string }) =>
            x.id === p.id ||
            (p.code && x.code === p.code) ||
            (p.email && x.email === p.email),
        );
      return (
        accountsList.find((a: { id?: string; email?: string; roleId?: string; role?: string }) => {
          const isPatient = a.roleId === "paciente" || /Paciente/i.test(a.role || "");
          if (!isPatient) return false;
          return (
            (p.accountId && a.id === p.accountId) ||
            (pat?.accountId && a.id === pat.accountId) ||
            (p.email && a.email && a.email === p.email) ||
            (pat?.email && a.email && a.email === pat.email)
          );
        }) || null
      );
    };
    const courseMetaFor = (p) => {
      const prog =
        (A.courseProgress && (A.courseProgress(S, p.id) || A.courseProgress(S, p.code))) ||
        null;
      if (!prog) return { courseDone: null, courseWeeks: null };
      return {
        courseDone: Number(prog.done) || 0,
        courseWeeks: Number(prog.c?.weeks) || null,
      };
    };
    const inactiveMinutesFor = (p) => {
      const code = String(p?.profile || '');
      if (!/^P\d+$/i.test(code)) return DEFAULT_INACTIVE_MINUTES;
      try {
        const { r, d } = A.parseCode(code);
        const path = (S.pathOverrides && S.pathOverrides[code]) || A.defaultPath(r, d);
        const m = Number(path?.inactiveMinutes);
        return Number.isFinite(m) && m > 0 ? m : DEFAULT_INACTIVE_MINUTES;
      } catch {
        return DEFAULT_INACTIVE_MINUTES;
      }
    };
    const estadoDe = (p) => {
      const { courseDone, courseWeeks } = courseMetaFor(p);
      const pat =
        patientsMap[p.id] ||
        Object.values(patientsMap).find(
          (x: { id?: string; code?: string; email?: string }) =>
            x.id === p.id ||
            (p.code && x.code === p.code) ||
            (p.email && x.email === p.email),
        );
        return patientStateLabel(
        resolveAdminPersonState(
          {
            ...p,
            inactiveLock: !!(p.inactiveLock || pat?.inactiveLock),
            activeAt: p.activeAt ?? pat?.activeAt,
          },
          {
            account: accountForPerson(p),
            inactiveMinutes: inactiveMinutesFor(p),
            courseDone,
            courseWeeks,
          },
        ),
      );
    };
    const heatGrid = A.RISK.map(() => [0, 0, 0]);
    all.forEach(p => {
      if (!classified(p)) return;
      const c = A.parseCode(p.profile);
      if (heatGrid[c.r]) heatGrid[c.r][c.d] = (heatGrid[c.r][c.d] || 0) + 1;
    });
    const heatMax = Math.max(1, ...heatGrid.flat());
    const heat = A.RISK.map((r, ri) => ({ k: r.k, c: r.c, cells: [0, 1, 2].map(di => { const v = heatGrid[ri][di]; const a = v ? (0.1 + v / heatMax * 0.85) : 0.05; return { v, code: A.code(ri, di), bg: 'rgba(30,94,72,' + a.toFixed(2) + ')', fg: a > 0.45 ? '#fff' : C.tinta }; }) }));
    // Pendientes de evaluación: sin evaluación inicial, o rechazadas que deben reevaluarse.
    // No cuentan Activo / Por aprobar / Crisis / Terminados (ya pasaron por el cuestionario).
    const porEvaluar = all.filter((p) => {
      const st = estadoDe(p);
      if (st === 'Sin evaluación' || st === 'Rechazado') return true;
      if (
        st === 'Por aprobar' ||
        st === 'Activo' ||
        st === 'Crisis' ||
        st === 'Inactivo' ||
        st === 'Terminado blanco' ||
        st === 'Terminado negro' ||
        st === 'Aprobado'
      ) {
        return false;
      }
      return !classified(p) && !p.evalAt && p.pendingEval !== true;
    });
    const evaluadas = all.filter((p) => {
      const st = estadoDe(p);
      return (
        classified(p) ||
        st === 'Por aprobar' ||
        st === 'Activo' ||
        st === 'Crisis' ||
        st === 'Rechazado' ||
        st === 'Terminado blanco' ||
        st === 'Terminado negro' ||
        !!p.evalAt ||
        p.pendingEval === true
      );
    }).length;
    const conRuta = all.filter(p => classified(p)).length;
    const primer = all.filter(p => (p.week || 0) > 0).length;
    const activas = all.filter(p => estadoDe(p) === 'Activo').length;
    const terminadoBlanco = all.filter((p) => estadoDe(p) === 'Terminado blanco').length;
    const terminadoNegro = all.filter((p) => estadoDe(p) === 'Terminado negro').length;
    // KPI: personas en estado Inactivo (umbral del perfil; default = 1 día).
    const sinContacto = all.filter((p) => estadoDe(p) === 'Inactivo').length;
    // Crisis abiertas: botón «Estoy en crisis», visita de campo, o estado Crisis en la ficha.
    const crisisPids = new Set();
    (S.alerts || []).forEach((a: { sev?: string; status?: string; pid?: string; name?: string; source?: string; id?: string; what?: string }) => {
      if (a.sev !== 'crisis') return;
      if (/closed|cerrada|other/i.test(String(a.status || ''))) return;
      crisisPids.add(String(a.pid || a.name || a.id || ''));
    });
    all.forEach((p) => {
      if (estadoDe(p) !== 'Crisis' && !/crisis/i.test(String(p.status || ''))) return;
      crisisPids.add(String(p.id || p.code || p.name || ''));
    });
    Object.values(patientsMap).forEach((p: { id?: string; code?: string; name?: string; status?: string; signal?: string }) => {
      if (!/crisis/i.test(String(p.status || p.signal || ''))) return;
      crisisPids.add(String(p.id || p.code || p.name || ''));
    });
    crisisPids.delete('');
    const crisisMes = crisisPids.size;
    const F = [
      ['Evaluadas', evaluadas],
      ['Con ruta asignada', conRuta],
      ['Primer contacto de la ruta', primer],
      ['Activas', activas],
      ['Terminado blanco', terminadoBlanco],
      ['Terminado negro', terminadoNegro],
    ];
    const denom = Math.max(1, all.length);
    const brRows = (S.territories || []).map(t => {
      const info = A.terrInfo(S, t.name) || t;
      const a = info.brA || t.br || 0, d = info.brD || 0, s = Math.min(d, a), av = (info.brAv != null ? info.brAv : t.br || 0) + (((S.terrOv || {})[t.name] || {}).extraBr || 0);
      return {
        open: () => api.setState({ assetTerr: t.name, assetKind: 'manilla' }),
        active: st.assetTerr === t.name && st.assetKind === 'manilla',
        name: t.name, a, d, s, n: Math.max(0, d - s), av, low: av > 0 && av < 50, canAssign: a === 0,
        assign: async e2 => {
          e2 && e2.stopPropagation && e2.stopPropagation();
          try {
            const res = await fetch('/api/assets/bracelets', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terr: t.name, count: 100 }) });
            const data = await res.json();
            if (!res.ok || !data.ok) return api.setState({ msg: data.error || 'No se pudieron asignar manillas.', msgActions: [] });
            A.set(s0 => {
              const x = s0.territories.find(y => y.name === t.name);
              if (x) { x.br = 100; x.brA = 100; x.brAv = 100; }
            });
            api.setState({ msg: '100 manillas asignadas a ' + t.name + ' (guardado en MongoDB).', msgActions: [] });
          } catch (err) {
            api.setState({ msg: 'No se pudo conectar con la base de datos.', msgActions: [] });
          }
        },
      };
    });
    const manillasAsig = brRows.reduce((a, r) => a + r.a, 0);
    const manillasEnt = brRows.reduce((a, r) => a + r.d, 0);
    const manillasDisp = brRows.reduce((a, r) => a + r.av, 0);
    const manillasAssets = (S.assets || []).filter(x => /^MN-/.test(x.code || '') || x.kind === 'manilla');
    const sinDatos = manillasAssets.filter(x => /Sin datos/i.test(x.state || '')).length;
    const elegibles = all.filter(p => classified(p) && A.parseCode(p.profile).r >= 2).length;
    const tabByTerr = {};
    A.experts(S).forEach(e => {
      if (!e.terr) return;
      const row = tabByTerr[e.terr] || { name: e.terr, n: 0, ns: 0, r: 0, last: '—' };
      if (e.tablet) row.n += 1;
      tabByTerr[e.terr] = row;
    });
    (S.assets || []).filter(x => x.kind === 'tablet' || /^TB-/.test(x.code || '')).forEach(a => {
      const row = tabByTerr[a.terr] || { name: a.terr, n: 0, ns: 0, r: 0, last: '—' };
      row.n += 1;
      tabByTerr[a.terr] = row;
    });
    const tabRows = Object.values(tabByTerr).map((row: any) => ({
      open: () => api.setState({ assetTerr: row.name, assetKind: 'tablet' }),
      active: st.assetTerr === row.name && st.assetKind === 'tablet',
      cur: 'pointer', name: row.name, n: row.n, ns: row.ns, r: row.r, last: row.last, fw: row.ns ? 500 : 400, canAssign: false,
    }))
      .concat(A.experts(S).filter(e => !e.tablet).map(e => ({
        name: e.terr + ' · ' + e.name, n: 0, ns: 0, r: 0, last: '—', fw: 400, canAssign: true, assignLabel: 'Asignar tablet',
        assign: async e2 => {
          e2 && e2.stopPropagation && e2.stopPropagation();
          try {
            const res = await fetch('/api/assets/tablet', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expertId: e.id, expertName: e.name }) });
            const data = await res.json();
            if (!res.ok || !data.ok) return api.setState({ msg: data.error || 'No se pudo asignar la tablet.', msgActions: [] });
            A.set(s0 => {
              const x = s0.experts.find(y => y.id === e.id || y.name === e.name);
              if (x) x.tablet = data.expert.tablet;
              s0.assets = s0.assets || [];
              if (data.asset && !s0.assets.find(a => a.code === data.asset.code)) {
                s0.assets.push({ code: data.asset.code, kind: 'tablet', status: 'Asignada', assignedTo: e.id || e.name, terr: e.terr });
              }
            });
            api.setState({
              msg: 'Tablet ' + data.expert.tablet + ' asignada a ' + e.name + ' (guardado en MongoDB).',
              msgActions: [{ label: 'Asignar tablet', go: () => api.go('assets', { msg: '', assetKind: 'tablet', assetTerr: e.terr }) }],
            });
          } catch (err) {
            api.setState({ msg: 'No se pudo conectar con la base de datos.', msgActions: [] });
          }
        },
        open: () => {}, cur: 'default', active: false,
      })));

    const assetTerr = st.assetTerr || '';
    const assetKind = 'tablet' as 'manilla' | 'tablet';
    const assetItems = assetTerr
      ? A.assetList(S, assetTerr, assetKind).map((x: any) => ({
          code: x.code || '—',
          who: x.who || x.person || '—',
          state: x.state || '—',
          sync: x.sync ? A.fmtDay(x.sync) : (x.last || '—'),
          bat: x.bat != null ? x.bat + ' %' : '—',
        }))
      : [];
    const assetBr = assetTerr ? brRows.find((r) => r.name === assetTerr) : null;
    const assetTab = assetTerr ? tabRows.find((r: any) => r.name === assetTerr) : null;
    const assetDetail = assetTerr ? {
      terr: assetTerr,
      kind: assetKind,
      title: assetKind === 'manilla' ? 'Manillas · ' + assetTerr : 'Tablets · ' + assetTerr,
      close: () => api.setState({ assetTerr: '', assetKind: undefined }),
      openTerr: () => api.router.push('/admin/territorio?t=' + encodeURIComponent(assetTerr)),
      summary: assetKind === 'manilla'
        ? [
            { label: 'Asignadas', val: assetBr ? assetBr.a : 0 },
            { label: 'Entregadas', val: assetBr ? assetBr.d : 0 },
            { label: 'Envían datos', val: assetBr ? assetBr.s : 0 },
            { label: 'Disponibles', val: assetBr ? assetBr.av : 0 },
          ]
        : [
            { label: 'Tablets', val: assetTab ? assetTab.n : 0 },
            { label: 'Sin sincronizar +24 h', val: assetTab ? assetTab.ns : 0 },
            { label: 'En reparación', val: assetTab ? assetTab.r : 0 },
            { label: 'Última sync', val: assetTab ? assetTab.last : '—' },
          ],
      items: assetItems,
      empty: assetItems.length === 0
        ? (assetKind === 'manilla'
          ? 'No hay manillas individuales registradas en este territorio. Use «Asignar 100» en el resumen o registre entregas desde campo.'
          : 'No hay tablets registradas en este territorio. Asigne una desde la fila del experto.')
        : '',
    } : null;
    const q = (st.q || '').toLowerCase().trim(), pf = st.pf || {};
    const uniq = a => a.filter((x, i) => x && a.indexOf(x) === i).sort();
    const hasProfile = (p) => !!(p.profile && /^P\d+$/i.test(String(p.profile)));
    const safeParse = (p) => (hasProfile(p) ? A.parseCode(p.profile) : { r: -1, d: -1 });
    const hay = (p) => {
      if (!q) return true;
      const blob = [
        p.code, p.id, p.name, p.terr, p.place, p.age, p.profile, estadoDe(p),
        p.expert, p.expertId, p.clin, p.phone, p.email, p.week, p.weeks,
      ].map((x) => String(x ?? '').toLowerCase()).join(' ');
      return blob.includes(q);
    };
    const rOk = (p) => {
      const c = safeParse(p);
      if (pf.terr && p.terr !== pf.terr) return false;
      if (pf.profile === '—') { if (hasProfile(p)) return false; }
      else if (pf.profile && p.profile !== pf.profile) return false;
      if (pf.risk !== undefined && pf.risk !== '' && c.r !== +pf.risk) return false;
      if (pf.dig !== undefined && pf.dig !== '' && c.d !== +pf.dig) return false;
      if (pf.status && estadoDe(p) !== pf.status) return false;
      if (pf.expert) {
        if (pf.expert === '—') { if (p.expert) return false; }
        else if (p.expert !== pf.expert) return false;
      }
      return hay(p);
    };
    const list = all.filter(rOk);
    const expertNameForTerr = (terr: string) => {
      if (!terr) return '';
      const e = A.experts(S).find((x: { terr?: string; active?: boolean; name?: string }) => x.terr === terr && x.active !== false);
      return e?.name || '';
    };
    const roster = list.slice(0, 300).map((p) => {
      const ri = safeParse(p).r;
      const rc = ri >= 0 && A.RISK[ri] ? A.RISK[ri].c : '#C4BDB3';
      const expertLabel = p.expert || expertNameForTerr(p.terr) || 'Sin experto';
      const status = estadoDe(p);
      const inCrisis = status === 'Crisis' || /crisis/i.test(String(p.status || p.signal || ''));
      return {
        open: () => { api.router.push('/admin/persona?c=' + encodeURIComponent(p.code || p.id || '')); },
        code: p.code || '—',
        terr: p.terr,
        place: p.place,
        age: p.age,
        profile: hasProfile(p) ? p.profile : 'Sin perfil',
        rc,
        pct: p.weeks ? Math.round((p.week || 0) / p.weeks * 100) + '%' : '0%',
        prog: 'Semana ' + (p.week || 0) + ' de ' + (p.weeks || 0),
        expert: expertLabel,
        status,
        inCrisis,
        fw: inCrisis || /Sin contacto|Sin experto/.test(p.status || '') || expertLabel === 'Sin experto' ? 500 : 400,
      };
    });
    const opt = (all0, lab) => [{ v: '', l: lab }].concat(all0.map(x => typeof x === 'object' ? x : { v: x, l: x }));
    const setPf = k => e => api.setState({ pf: Object.assign({}, pf, { [k]: e.target.value }) });
    const profileOpts = [{ v: '—', l: 'Sin perfil' }].concat(uniq(all.map(p => p.profile).filter(x => x && /^P\d+$/i.test(String(x)))));
    const pFilters = [
      ['terr', 'Territorio', opt(uniq((S.territories || []).map(x => x.name).concat(all.map(p => p.terr))), 'Todos')],
      ['profile', 'Perfil', opt(profileOpts, 'Todos')],
      ['risk', 'Riesgo', opt(A.RISK.map((r, i) => ({ v: String(i), l: r.k })), 'Todos')],
      ['dig', 'Capacidad digital', opt(A.DIG.map((r, i) => ({ v: String(i), l: r.k })), 'Todas')],
      ['status', 'Estado', opt(uniq(all.map(estadoDe)), 'Todos')],
      ['expert', 'Experto', opt([{ v: '—', l: 'Sin experto' }].concat(uniq(all.map(p => p.expert))), 'Todos')],
    ].map(([k, label, opts]) => ({ label, opts, val: pf[k] || '', set: setPf(k), bd: pf[k] ? C.verde : C.lineas }));
    const exportRoster = () => {
      const rows = [['Código', 'Nombre', 'Territorio', 'Vereda o barrio', 'Edad', 'Perfil', 'Semana', 'De', 'Experto', 'Clínico', 'Estado', 'Correo', 'Teléfono']]
        .concat(list.map(p => [p.code, p.name || '', p.terr, p.place, p.age, hasProfile(p) ? p.profile : '', p.week, p.weeks, p.expert || '', p.clin || '', estadoDe(p), p.email || '', p.phone || '']));
      const csv = '\ufeff' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'personas-nara.csv';
      a.click();
      A.set(s => A.logActivity(s, (A.session()?.id || "admin"), 'Exportó ' + list.length + ' personas'));
    };
    const digDrop = [0, 1, 2].map(di => {
      const group = all.filter(p => classified(p) && A.parseCode(p.profile).d === di);
      const drop = group.filter(p => /Sin contacto|Sin experto/i.test(p.status || '')).length;
      const pct = group.length ? Math.round(drop / group.length * 100) : 0;
      return [A.DIG[di].k, pct, A.DIG[di].c];
    });
    const rosterCount =
      list.length + ' de ' + full.length + ' personas' + (list.length > 300 ? ' · se muestran 300' : '');
    return {
      q: st.q || '', setQ: (value) => api.setState({ q: typeof value === 'string' ? value : value?.target?.value }), roster, noRoster: roster.length === 0,
      rosterCount,
      pFilters, exportRoster, hasPF: Object.values(pf).some(Boolean) || !!q, clearPF: () => api.setState({ pf: {}, q: '' }),
      pk: [
        {
          label: 'Personas a evaluar',
          val: fmt(porEvaluar.length),
          sub: porEvaluar.length
            ? 'Sin evaluación inicial todavía'
            : 'Nadie pendiente de evaluación',
        },
        { label: 'Evaluadas con ruta', val: fmt(conRuta), sub: 'Ya evaluadas y con ruta asignada' },
        { label: 'Sin contacto +1 día', val: fmt(sinContacto), sub: 'Pacientes sin actividad en la app (login o clics) según el umbral del perfil · estado Inactivo en Personas' },
        {
          label: 'Alertas de crisis',
          val: fmt(crisisMes),
          sub: crisisMes
            ? 'Crisis abiertas · botón del paciente o visita de campo'
            : 'Sin alertas',
        },
      ],
      heat, funnel: F.map(([label, v]) => ({ label, v: fmt(v), w: (Number(v) / denom * 100).toFixed(1) + '%' })),
      dropout: digDrop.map(([label, v, c]) => ({ label, v: v + ' %', w: (Number(v) / Math.max(20, Number(v)) * 100) + '%', c })),
      bk: [],
      brRows: [],
      tabRows,
      assetDetail,
    };
  }
  function libVals(A, S, st) {
    const R = A.REC, RC = S.recursos || {}, ST = RC.status || {};
    const kind = st.libKind === 'tecnicas' ? 'tecnicas' : 'videos';
    const SB = { 'Aprobado': '#E5E0D5', 'En revisión clínica': '#F0E8E0', 'Borrador': '#F7F5EF', 'Retirado': '#E5E0D5' };
    const items = kind === 'videos'
      ? R.VIDEOS.map(v => ({ id: v.id, title: v.title, meta: 'Video · ' + v.min + ' min · ' + v.tema, o: v }))
      : R.TECNICAS.map(v => ({ id: v.id, title: v.title, meta: 'Técnica · ' + v.min + ' min · audio y hoja impresa', o: v }));
    const ov = id => ST[id] || {}, est = it => ov(it.id).estado || it.o.estado || 'Aprobado';
    const setSt = (id, k, v) => A.set(s => { const x = (s.recursos.status[id] = s.recursos.status[id] || {}); x[k] = v; if (k === 'estado') { x.version = (x.version || 1) + 1; A.logActivity(s, (A.session()?.id || "admin"), 'Cambió el estado de un recurso a ' + v); } });
    const sel = items.find(x => x.id === st.libSel);
    const FIELDS = [['title', 'Título'], ['min', 'Duración (min)'], ['tema', 'Tema']];
    const rules = (RC.rules || R.RULES);
    return { lib: {
      kinds: [['videos', 'Videos'], ['tecnicas', 'Técnicas']].map(([k, label]) => ({ label, bg: kind === k ? '#31C6E6' : '#fff', go: () => api.setState({ libKind: k, libSel: null }) })),
      rows: items.map(it => { const e = est(it); return { hasCover: false, cover: '', title: it.title, meta: it.meta, estado: e, sBg: SB[e], version: ov(it.id).version || it.o.version || 1, fecha: e === 'Aprobado' ? (it.o.aprobado || '14 sep') : '—', bg: st.libSel === it.id ? '#E7FAF5' : '#fff', pick: () => api.setState({ libSel: it.id }) }; }),
      hasSel: !!sel, sel: sel ? { title: (ov(sel.id).title) || sel.title, hasCover: false, cover: '', hasTag: false, tag: '', estado: est(sel), setEstado: e => setSt(sel.id, 'estado', e.target.value), fields: FIELDS.map(([k, label]) => ({ k: label, v: String(ov(sel.id)[k] != null ? ov(sel.id)[k] : sel.o[k]), set: e => setSt(sel.id, k, e.target.value) })) } : { fields: [] },
      mods: [],
      rules: rules.map((r, i) => ({ k: r[0], c: (A.RISK[i] || {}).c, v: r[1], set: e => A.set(s => { s.recursos.rules[i][1] = e.target.value; }) }))
    } };
  }
  function renderVals() {
    const S = A.get(); const C = A.C;
    const terrSeen = new Set();
    const allTerr = (S.territories || []).filter((t) => {
      const n = String(t.name || "").trim();
      if (!n || terrSeen.has(n)) return false;
      terrSeen.add(n);
      return true;
    }).map(t => {
      const info = A.terrInfo(S, t.name) || t;
      const nExp = A.experts(S).filter(e => e.terr === t.name && e.active !== false).length;
      const cohort = (A.people ? A.people(S) : S.people || []).filter(
        (p: { terr?: string }) => p.terr === t.name,
      );
      // Captación viva (personas del territorio), no el campo estático t.cap.
      const cap = cohort.length;
      const goal = info.goal || t.goal || 0;
      const ruralN = cohort.filter((p: { rural?: boolean; place?: string }) => {
        if (p.rural === true) return true;
        if (p.rural === false) return false;
        return /vereda/i.test(String(p.place || ''));
      }).length;
      const rural = cap ? Math.round((ruralN / cap) * 100) : 0;
      const hasEval = cohort.some(
        (p: { profile?: string; evalAt?: unknown; pendingEval?: boolean; status?: string }) =>
          !!(p.profile && /^P\d+$/i.test(String(p.profile))) ||
          !!p.evalAt ||
          p.pendingEval === true ||
          /por\s*aprobar|activo|crisis|rechazad|terminado/i.test(String(p.status || '')),
      );
      return {
        name: t.name, dep: info.dep || t.dep, level: info.level || t.level,
        experts: nExp, cap, goal, hasEval,
        rural, ruralG: info.ruralG || t.ruralG || 0,
        br: info.brAv != null ? info.brAv : (t.br || 0),
        insts: Array.isArray(info.insts) ? info.insts.length : (t.insts || 0),
        isNew: !!t.isNew,
      };
    });
    const terrQ = String(st.terrQ || '').toLowerCase().trim();
    const terrs = allTerr.filter(t => !st.terrFilter || t.name === st.terrFilter).map(t => {
      // Sin iniciar → Iniciado (hay captación o evaluación) → Finalizado (meta de captación cumplida).
      let status = 'Sin iniciar', sc = '#8C857C';
      if (t.goal && t.cap >= t.goal) {
        status = 'Finalizado';
        sc = C.alDia;
      } else if (t.cap > 0 || t.hasEval) {
        status = 'Iniciado';
        sc = C.alDia;
        if (t.goal && t.cap / t.goal < 0.3) {
          status = 'Iniciado · captación lenta';
          sc = C.bajoMeta;
        } else if (t.ruralG && t.rural < t.ruralG - 2) {
          status = 'Iniciado · bajo cuota rural';
          sc = C.revisar;
        }
      }
      const ov = (S.terrOv || {})[t.name] || {}; if (ov.paused) { status = 'En pausa'; sc = '#8C857C'; }
      return { open: () => { api.router.push('/admin/territorio?t=' + encodeURIComponent(t.name)); }, name: t.name, dep: t.dep, level: t.level, experts: t.experts, capText: t.cap.toLocaleString('es-CO') + ' / ' + t.goal.toLocaleString('es-CO'), pct: t.goal ? Math.round(t.cap / t.goal * 100) + '%' : '0%', rural: (t.cap ? t.rural + ' %' : '—') + ' / ' + t.ruralG + ' %', bracelets: t.br, insts: t.insts, status, sc, rowBg: t.isNew ? '#FFF9E3' : '#fff' };
    }).filter((t) => {
      if (!terrQ) return true;
      const blob = [t.name, t.dep, t.level, t.experts, t.capText, t.rural, t.bracelets, t.insts, t.status]
        .map((x) => String(x ?? '').toLowerCase())
        .join(' ');
      return blob.includes(terrQ);
    });
    const terrCountLabel = terrs.length + (terrQ || st.terrFilter ? ' de ' + allTerr.length : '') + ' territorios';
    const tf = st.tf;
    const setTf = (k) => (e) => {
      const value = typeof e === 'string' ? e : e?.target?.value;
      const next = Object.assign({}, tf, { [k]: value });
      // Al cambiar departamento, limpia municipio si ya no pertenece.
      if (k === 'dep' && next.mun) {
        /* mun se valida en UI con municipios del dep; si cambia dep, vaciar mun */
        next.mun = '';
      }
      api.setState({ tf: next, tfErr: '' });
    };
    const chk = (group, k, label) => ({ label, mark: tf[group][k] ? '✓' : '', bd: tf[group][k] ? C.verde : C.texto2, bg: tf[group][k] ? C.verde : '#fff', toggle: () => api.setState({ tf: Object.assign({}, tf, { [group]: Object.assign({}, tf[group], { [k]: !tf[group][k] }) }) }) });

    const goals = A.teamGoals(S);
    const midWeek = Math.max(1, Math.round(goals.weekly * 34 / 45));
    const experts = A.experts(S).map(e => {
      // Cuotas, alertas y estado desde cola / crisis / QC reales.
      const exKey = e.id || e.accountId || e.name;
      const q = A.quotas(S, exKey);
      const today = q.today || 0;
      const week = q.week || 0;
      const flags = A.expertAlertCount
        ? A.expertAlertCount(S, exKey)
        : A.openFlags(S, exKey);
      let status = A.expertTeamStatus
        ? A.expertTeamStatus(S, exKey, e)
        : week >= midWeek
          ? 'ok'
          : 'low';
      const map = { ok: ['Al día', C.alDia], low: ['Bajo meta', C.bajoMeta], rev: ['Revisar', C.revisar], new: ['Capacitación pendiente', '#8C857C'], off: ['Desactivado', '#8C857C'] };
      const eov = (S.expertOv || {})[e.name] || {};
      if (eov.active === false || e.active === false) status = 'off';
      const target = e.target || goals.daily;
      return {
        id: e.id || `${e.name}-${eov.terr || e.terr || ''}`,
        open: () => { api.router.push('/admin/experto?e=' + encodeURIComponent(e.name)); },
        name: e.name,
        terr: eov.terr || e.terr,
        today: today + ' / ' + target,
        week: week + ' / ' + goals.weekly,
        flags,
        status: map[status][0],
        sc: map[status][1],
        rowBg: e.isNew && status === 'new' ? '#FFF9E3' : '#fff',
      };
    });
    const ef = st.ef;
    const setEf = (k) => (e) => {
      const value = typeof e === 'string' ? e : e?.target?.value;
      api.setState({ ef: Object.assign({}, ef, { [k]: value }) });
    };
    const gf = st.gf || { daily: String(goals.daily), weekly: String(goals.weekly) };
    const setGfDaily = e => {
      const daily = String(e.target.value || '').replace(/\D/g, '');
      const weekly = daily === '' ? '' : String(parseInt(daily, 10) * 5);
      api.setState({ gf: Object.assign({}, gf, { daily, weekly }), gfErr: '' });
    };
    const setGfWeekly = e => api.setState({ gf: Object.assign({}, gf, { weekly: e.target.value.replace(/\D/g, '') }), gfErr: '' });
    const isDurFlag = (f: { reasons?: string[] }) => {
      const reasons = f.reasons || [];
      return reasons.length > 0 && reasons.every((r) => /mínimo\s*20|minimo\s*20|menos de\s*20\s*minutos|entrevista de\s+\d+/i.test(String(r || '')));
    };
    const flags = S.flags.filter((f) => !isDurFlag(f)).map(f => ({ expertName: f.expertName, territory: f.territory, when: f.when, person: f.person, reasons: f.reasons, pending: f.status === 'pending', done: f.status !== 'pending', doneText: f.status === 'approved' ? 'Aprobada · cuenta para la cuota' : f.fromVisit ? 'Rechazada · no cuenta para la cuota' : 'Rechazada · se restó de la cuota',
      approve: async () => {
        try {
          await fetch('/api/flags', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id, status: 'approved' }) });
          if (f.fromVisit && f.wid) {
            await fetch('/api/worklists', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.wid, expertId: f.expert, status: 'validada' }) });
          }
        } catch (e) { /* local fallback */ }
        A.set(s => { const fl = s.flags.find(x => x.id === f.id); if (fl) fl.status = 'approved'; if (f.fromVisit) { const w = (s.worklists[f.expert] || []).find(x => x.id === f.wid); if (w) w.status = 'validada'; } if (s.notifs[f.expert]) A.pushNotif(s, f.expert, 'Visita aprobada en control de calidad: ' + f.person, '/experto'); });
        api.setState({ msg: 'Visita de ' + f.person + ' aprobada. Ya cuenta para la cuota.', msgActions: [] });
      },
      reject: async () => {
        try {
          await fetch('/api/flags', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id, status: 'rejected' }) });
          if (f.fromVisit && f.wid) {
            await fetch('/api/worklists', { credentials: 'same-origin', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.wid, expertId: f.expert, status: 'rechazada' }) });
          }
        } catch (e) { /* local fallback */ }
        A.set(s => { const fl = s.flags.find(x => x.id === f.id); if (fl) fl.status = 'rejected'; if (f.fromVisit) { const w = (s.worklists[f.expert] || []).find(x => x.id === f.wid); if (w) w.status = 'rechazada'; A.pushNotif(s, f.expert, 'Visita rechazada: ' + f.person + ' · no cuenta para la cuota', '/experto'); } else if (s.rejected[f.expert] !== undefined) { s.rejected[f.expert] += 1; A.pushNotif(s, f.expert, 'Visita rechazada: ' + f.person + ' · se restó de su cuota', '/experto'); s.notices[f.expert] = s.notices[f.expert] || []; s.notices[f.expert].unshift({ kind: 'qc', tag: 'Control de calidad', text: 'Su visita a ' + f.person + ' (' + f.when.toLowerCase() + ') fue rechazada: ' + f.reasons.join(' · ').toLowerCase() + '. Se restó de su cuota semanal.' }); } });
        api.setState({ msg: f.fromVisit ? 'Visita rechazada. No cuenta para la cuota de ' + f.expertName + ' y se le avisó.' : 'Visita rechazada. Se restó de la cuota de ' + f.expertName + ' y se le avisó.', msgActions: [] });
      } }));

    const pathTerrNow =
      (st.pathTerr && (S.territories || []).some((t: { name?: string }) => t.name === st.pathTerr)
        ? st.pathTerr
        : null) ||
      ((S.territories || [])[0] && (S.territories || [])[0].name) ||
      '';
    if (pathTerrNow && typeof A.applyRules === 'function') A.applyRules(S, pathTerrNow);
    const terrPackNow =
      (pathTerrNow && A.getTerrRules && A.getTerrRules(S, pathTerrNow)) || null;
    const draftRules = (st.rd as { risk?: typeof A.RISK; dig?: { cuts?: typeof A.DIG } } | null | undefined) || null;
    const pendingDraft = (terrPackNow && terrPackNow.pending && terrPackNow.pending.draft) || null;
    const riskBands = (draftRules && Array.isArray(draftRules.risk) && draftRules.risk.length)
      ? draftRules.risk
      : (pendingDraft && pendingDraft.risk) || A.RISK;
    const digBands = (draftRules && draftRules.dig && Array.isArray(draftRules.dig.cuts) && draftRules.dig.cuts.length)
      ? draftRules.dig.cuts
      : (pendingDraft && pendingDraft.dig && pendingDraft.dig.cuts) || A.DIG;
    const digN = digBands.length || 3;
    const profileCode = (ri: number, di: number) =>
      'P' + String(ri * digN + di + 1).padStart(2, '0');
    const cellFor = (ri, di) => {
      const code = profileCode(ri, di);
      const dr = api.draft(code);
      const n = Object.keys(dr.s || {}).filter(
        (k) => dr.s[k] && String(dr.s[k]).trim(),
      ).length;
      return { code, n };
    };
    const pm = riskBands.map((r, ri) => ({
      k: r.k,
      c: r.c,
      cells: digBands.map((_dg, di) => {
        const x = cellFor(ri, di);
        const on = st.sel === x.code;
        return Object.assign(x, {
          bg: on ? C.verde : (r.bg || '#F7F5EF'),
          fg: on ? '#fff' : C.tinta,
          bd: on ? C.amarillo : 'transparent',
          pick: () => api.setState({ sel: x.code }),
        });
      }),
    }));
    const digHeaders = digBands.map((d) => d.k || 'Digital');
    const selNum = parseInt(String(st.sel || 'P01').replace(/\D/g, ''), 10) - 1;
    let sr = Number.isFinite(selNum) && selNum >= 0 ? Math.floor(selNum / digN) : 0;
    let sd = Number.isFinite(selNum) && selNum >= 0 ? selNum % digN : 0;
    if (sr < 0 || sd < 0 || sr >= riskBands.length || sd >= digN) {
      sr = 0;
      sd = 0;
    }
    const selCode = profileCode(sr, sd);
    const dr = api.draft(st.sel || selCode);
    const req = (S.pathRequests || []).find(
      (x) =>
        x.code === st.sel &&
        String(x.scope || 'all') === String(pathTerrNow || st.scope || 'all') &&
        String(x.status || 'pending').toLowerCase() === 'pending',
    );
    const peRows = buildPathServiceRows(dr, C, api, st.sel);
    const pe = {
      title: (st.sel || selCode) + ' · ' + (riskBands[sr]?.k || '') + ' × digital ' + String(digBands[sd]?.k || '').toLowerCase(),
      people: A.people(S).filter(p => p.profile === st.sel).length,
      // Con pending: solo lectura de lo vigente (no editar el envío en curso).
      rows: req
        ? peRows.map((row) => ({
            ...row,
            locked: true,
            lockHint: "Hay un cambio pendiente de aprobación clínica",
            cur: "not-allowed",
            toggle: () => {},
            freqs: (row.freqs || []).map((f) => ({ ...f, pick: () => {} })),
          }))
        : peRows,
      warn: false,
      durs: [3, 6, 12].map(m => ({
        label: m + ' meses',
        bd: dr.months === m ? C.verde : C.lineas,
        bg: dr.months === m ? '#E7FAF5' : '#fff',
        fg: C.tinta,
        pick: () => {
          if (req) return;
          api.setDraft(st.sel, (d) => { d.months = m; });
        },
      })),
      inactiveMins: [
        { label: '5 minutos', minutes: 5 },
        { label: '1 día', minutes: 1440 },
        { label: '5 días', minutes: 7200 },
        { label: '10 días', minutes: 14400 },
      ].map((opt) => {
        const cur = dr.inactiveMinutes != null ? Number(dr.inactiveMinutes) : DEFAULT_INACTIVE_MINUTES;
        const sel = cur === opt.minutes;
        return {
          label: opt.label,
          bd: sel ? C.verde : C.lineas,
          bg: sel ? '#E7FAF5' : '#fff',
          fg: C.tinta,
          pick: () => {
            if (req) return;
            api.setDraft(st.sel, (d) => { d.inactiveMinutes = opt.minutes; });
          },
        };
      }),
      sendBg: C.verde,
      status: (() => {
        if (req) {
          return "Hay un cambio pendiente de aprobación clínica. Aquí se ve lo vigente (aún no aplicado). Cuando la líder apruebe, se actualiza esta matriz y la app del paciente.";
        }
        const sel = String(st.sel || selCode);
        const dKey = pathTerrNow ? pathTerrNow + "|" + sel : sel;
        const hasLocal =
          !!(st.pathDraftDirty && (st.pathDraftDirty[dKey] || st.pathDraftDirty[sel])) &&
          !!(st.drafts && (st.drafts[dKey] || st.drafts[sel]));
        if (hasLocal) {
          return "Hay cambios en este perfil sin enviar · vaya a la etapa 4 · Envío para mandarlos a aprobación clínica.";
        }
        return "Edite aquí y envíe desde la etapa 4 · Envío (servicios y periodicidad).";
      })(),
    };
    const extra = moreVals(A, S, C, st);
    Object.assign(extra, rulesVals(A, S, C, st), perfVals(A, S, C, st));
    return Object.assign({
      vHome: st.view === 'home', view: st.view, showFab: st.view !== 'home' && !st.agentOpen, agentOpen: st.agentOpen,
      openAgent: () => api.setState({ agentOpen: true }), closeAgent: () => api.setState({ agentOpen: false, pendingAsk: '' }), askFromHome: q => api.setState({ agentOpen: true, pendingAsk: q }), pendingAsk: st.pendingAsk || '', ovW: (window.innerWidth / (st.zoom || 1)) + 'px', ovH: (window.innerHeight / (st.zoom || 1)) + 'px', drawerW: window.innerWidth < 720 ? (window.innerWidth / (st.zoom || 1)) + 'px' : '480px',
      ctxLabel: 'Sobre: ' + ({ terr: 'Territorios', team: st.teamTab === '2' ? 'Equipos de campo · Desempeño' : 'Equipos de campo', paths: 'Rutas', people: 'Personas', assets: 'Activos' }[st.view] || 'Inicio'),
      agentAction: (action, p) => {
        if (action === 'detail') api.go(p.target, { terrFilter: p.filter || '', agentOpen: false, msg: '' });
        if (action === 'report') api.router.push('/informe?id=' + p + '&back=/inicio');
      },
      hasFilter: st.view === 'terr' && !!st.terrFilter, terrFilter: st.terrFilter, clearFilter: () => api.setState({ terrFilter: '' }),
      homeLinks: [['terr', 'Territorios', 'Captación, cuotas y estado'], ['team', 'Equipos de campo', S.flags.filter(f => f.status === 'pending').length + ' visitas por revisar'], ['paths', 'Rutas', (riskBands.length * digN) + ' perfiles'], ['assets', 'Activos', 'Tablets de campo'], ['users', 'Usuarios y permisos', S.accounts.length + ' cuentas'], ['reports', 'Informes', 'Biblioteca y programados']].map(([k, label, sub]) => ({ id: k, label, sub, go: () => api.go(k, { msg: '', terrFilter: '' }) })),
      digHeaders,
      matrixCols: digN,
      matrixRowsN: riskBands.length,
      matrixProfiles: riskBands.length * digN,
      dev: A.devMode(), zoom: st.zoom || 1, screenCode: { home: 'AdminHome', terr: 'AdminTerritories', team: 'AdminFieldTeams', paths: st.pathTab === '1' ? 'PathQuestionnaires' : st.pathTab === '2' ? 'PathLevels' : st.pathTab === '4' ? 'PathSubmit' : 'PathEditor', people: 'AdminPeople', assets: 'AdminAssets' }[st.view],
      navActive: st.view, navGo: k => api.go(k, { msg: '' }),
      nav: [['home', 'Inicio'], ['terr', 'Territorios'], ['team', 'Equipos de campo'], ['paths', 'Rutas'], ['people', 'Personas'], ['assets', 'Activos'], ['users', 'Usuarios y permisos'], ['reports', 'Informes']].map(([k, label]) => ({ label, bd: st.view === k ? C.amarillo : 'transparent', fg: st.view === k ? C.verde : C.tinta, go: () => api.go(k, { msg: '' }) })),
      hasMsg: !!st.msg, msg: st.msg, msgActions: st.msgActions,
      clearMsg: () => api.setState({ msg: '', msgActions: [] }),
      vTerr: st.view === 'terr', vTeam: st.view === 'team', vPaths: st.view === 'paths', vPeople: st.view === 'people', vAssets: st.view === 'assets',
      totalCap: allTerr.reduce((a, t) => a + t.cap, 0).toLocaleString('es-CO'),
      totalEvaluadas: (A.people ? A.people(S) : S.people || []).filter(
        (p: { profile?: string; evalAt?: unknown; pendingEval?: boolean; status?: string }) =>
          !!(p.profile && /^P\d+$/i.test(String(p.profile))) ||
          !!p.evalAt ||
          p.pendingEval === true ||
          /por\s*aprobar|activo|crisis|rechazad|terminado/i.test(String(p.status || '')),
      ).length.toLocaleString('es-CO'),
      terrs,
      terrQ: st.terrQ || '', setTerrQ: (value) => api.setState({ terrQ: typeof value === 'string' ? value : value?.target?.value }),
      terrCountLabel,
      terrForm: st.terrForm, terrFormBtn: '+ Crear territorio',
      toggleTerrForm: () => api.setState({
        terrForm: true,
        tfErr: '',
        tf: {
          dep: '', mun: '', goal: '', level: '', rural: '', sixty: '',
          mods: { base: true, ctx: false, videos: false },
          insts: { hl: false, cu: false, cf: false },
        },
      }),
      closeTerrForm: () => api.setState({ terrForm: false, tfErr: '' }),
      tf, tfSet: { dep: setTf('dep'), mun: setTf('mun'), goal: setTf('goal'), rural: setTf('rural'), sixty: setTf('sixty'), level: setTf('level') }, tfErr: st.tfErr, clearTfErr: () => api.setState({ tfErr: '' }),
      levels: ['Municipio completo', 'Veredas seleccionadas', 'Barrios seleccionados'].map(label => ({ label, bd: tf.level === label ? C.verde : C.texto2, dot: tf.level === label ? C.verde : '#fff', pick: () => api.setState({ tf: Object.assign({}, tf, { level: label }) }) })),
      modules: [chk('mods', 'base', 'PHQ-9 + capacidad digital (base)'), chk('mods', 'ctx', 'Contexto de vida'), chk('mods', 'videos', 'Videos adaptados a la región')],
      tinsts: [chk('insts', 'hl', 'Hospital público local'), chk('insts', 'cu', 'Clínica universitaria · teleconsulta'), chk('insts', 'cf', 'Comisaría de familia')],
      saveTerr: async () => {
        if (!tf.mun.trim() || !(parseInt(tf.goal, 10) > 0)) return api.setState({ tfErr: 'Escriba el municipio y una meta de captación mayor que cero.' });
        if (allTerr.find(t => t.name === tf.mun.trim())) return api.setState({ tfErr: 'Ese territorio ya existe.' });
        const name = tf.mun.trim();
        const content = ['PHQ-9 + capacidad digital (base)'].concat(tf.mods.ctx ? ['Contexto de vida'] : [], tf.mods.videos ? ['Videos adaptados a la región'] : []);
        const payload = {
          name, dep: tf.dep, level: tf.level, goal: parseInt(tf.goal, 10),
          ruralG: parseInt(tf.rural, 10) || 0, sixtyG: parseInt(tf.sixty, 10) || 0,
          insts: Object.values(tf.insts).filter(Boolean).length, content,
        };
        try {
          const res = await fetch('/api/territories', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || !data.ok) return api.setState({ tfErr: data.error || 'No se pudo guardar el territorio.' });
          const t = data.territory;
          A.set(s => {
            s.territories = (s.territories || []).filter(x => x.name !== t.name).concat([t]);
            s.terrOv = s.terrOv || {};
            s.terrOv[t.name] = Object.assign({}, s.terrOv[t.name], { content: t.content || content });
            if (typeof A.ensureTerrRules === 'function') A.ensureTerrRules(s, t.name);
          });
          api.setState({
            terrForm: false,
            ef: Object.assign({}, st.ef, { terr: name }),
            pathTerr: name,
            msg: 'Territorio ' + name + ' creado. Configure su ruta en Rutas.',
            msgActions: [
              { label: 'Configurar ruta', go: () => api.go('paths', { pathTerr: name, pathTab: '1', msg: '' }) },
              { label: 'Asignar expertos', go: () => api.go('team', { expForm: true, ef: { ...EMPTY_EF }, msg: '' }) },
              { label: 'Ver tablets', go: () => api.go('assets', { msg: '', assetKind: 'tablet' }) },
            ],
          });
        } catch (e) {
          api.setState({ tfErr: 'No se pudo conectar con la base de datos.' });
        }
      },
      expForm: st.expForm, expFormBtn: '+ Crear experto',
      toggleExpForm: () => api.setState({ expForm: true, ef: { ...EMPTY_EF }, msg: '', msgActions: [] }),
      closeExpForm: () => api.setState({ expForm: false, ef: { ...EMPTY_EF } }),
      ef, efSet: {
        firstName: setEf('firstName'),
        lastName: setEf('lastName'),
        phone: setEf('phone'),
        email: setEf('email'),
        terr: setEf('terr'),
        target: setEf('target'),
        password: setEf('password'),
      },
      genExpEmail: () => {
        const email = generateConsienteEmail(
          String(ef.firstName || ''),
          String(ef.lastName || ''),
        );
        if (!email) {
          return api.setState({ msg: 'Escriba nombre y apellido para generar el correo.', msgActions: [] });
        }
        api.setState({ ef: Object.assign({}, ef, { email }), msg: '' });
      },
      genExpPassword: () => {
        const len = Math.max(8, minPasswordLengthForRole('Gestor de campo'));
        api.setState({
          ef: Object.assign({}, ef, { password: generateAccessPassword(len) }),
          msg: '',
        });
      },
      terrNames: withTestTerritory(allTerr.map(t => t.name).filter(Boolean)),
      goalsForm: st.goalsForm,
      openGoalsForm: () => api.setState({ goalsForm: true, gf: { daily: String(goals.daily), weekly: String(goals.weekly) }, gfErr: '' }),
      closeGoalsForm: () => api.setState({ goalsForm: false, gfErr: '' }),
      gf, gfSet: { daily: setGfDaily, weekly: setGfWeekly }, gfErr: st.gfErr || '', clearGfErr: () => api.setState({ gfErr: '' }),
      teamGoalsDaily: goals.daily, teamGoalsWeekly: goals.weekly,
      saveGoals: async () => {
        if (gf.daily === '' || gf.weekly === '') {
          return api.setState({ gfErr: 'Indique metas diarias y semanales (mínimo 1).' });
        }
        const daily = parseInt(gf.daily, 10);
        const weekly = parseInt(gf.weekly, 10);
        if (!Number.isFinite(daily) || !Number.isFinite(weekly) || daily < 1 || weekly < 1) {
          return api.setState({ gfErr: 'Indique metas diarias y semanales válidas (mínimo 1).' });
        }
        if (weekly < daily) return api.setState({ gfErr: 'La meta semanal no puede ser menor que la diaria.' });
        try {
          const res = await fetch('/api/experts/goals', {
            credentials: 'same-origin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ daily, weekly }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) return api.setState({ gfErr: data.error || 'No se pudieron guardar las metas.' });
          const next = data.goals || { daily, weekly };
          A.set(s => {
            s.rules = s.rules || {};
            s.rules.goals = { daily: next.daily, weekly: next.weekly };
            (s.experts || []).forEach(ex => { ex.target = next.daily; ex.weekT = next.weekly; });
            s.rules.versions = s.rules.versions || [];
            const prev = (s.rules.versions[0] && s.rules.versions[0].v) || 1;
            s.rules.versions.unshift({
              v: prev + 1,
              by: (A.session() && A.session().name) || 'Administrador',
              at: Date.now(),
              what: 'Metas de captación del equipo: ' + next.daily + ' visitas/día y ' + next.weekly + ' /semana.',
            });
            A.logActivity(s, (A.session()?.id || 'admin'), 'Actualizó las metas de captación del equipo');
          });
          api.setState({
            goalsForm: false,
            gf: { daily: String(next.daily), weekly: String(next.weekly) },
            gfErr: '',
            ef: Object.assign({}, st.ef, { target: String(next.daily) }),
            msg: 'Metas actualizadas para todo el equipo: ' + next.daily + ' /día y ' + next.weekly + ' /semana.',
            msgActions: [],
          });
        } catch (err) {
          api.setState({ gfErr: 'No se pudo conectar con la base de datos.' });
        }
      },
      terrChips: allTerr.map(t => ({ n: t.name, bd: ef.terr === t.name ? C.verde : C.lineas, bg: ef.terr === t.name ? '#E7FAF5' : '#fff', fw: ef.terr === t.name ? 500 : 400, pick: () => api.setState({ ef: Object.assign({}, ef, { terr: t.name }) }) })),
      saveExp: async () => {
        const firstName = String(ef.firstName || '').trim();
        const lastName = String(ef.lastName || '').trim();
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        const email = String(ef.email || '').trim().toLowerCase();
        const password = String(ef.password || '').trim();
        if (!firstName || !lastName || ef.phone.replace(/\D/g, '').length < 10) {
          return api.setState({ msg: 'Faltan datos: escriba nombre, apellido y un celular de 10 dígitos.', msgActions: [] });
        }
        if (!email || !/@/.test(email)) {
          return api.setState({ msg: 'Escriba un correo válido para el acceso del experto (ej. nombre@quintia.com).', msgActions: [] });
        }
        if (!password) {
          return api.setState({ msg: 'Defina una contraseña para el acceso del experto.', msgActions: [] });
        }
        const policyErr = passwordPolicyError({
          password,
          email,
          name: fullName,
          role: 'Gestor de campo',
        });
        if (policyErr) return api.setState({ msg: policyErr, msgActions: [] });
        if (!ef.terr) return api.setState({ msg: 'Seleccione un territorio para el experto.', msgActions: [] });
        const payload = {
          name: fullName,
          firstName,
          lastName,
          phone: ef.phone,
          email,
          password,
          terr: ef.terr,
          target: parseInt(ef.target, 10) || goals.daily,
        };
        try {
          const res = await fetch('/api/experts', { credentials: 'same-origin', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const data = await res.json();
          if (!res.ok || !data.ok) return api.setState({ msg: data.error || 'No se pudo guardar el experto.', msgActions: [] });
          const e = data.expert;
          A.set(s => {
            s.experts = (s.experts || []).filter(x => x.id !== e.id).concat([e]);
            if (e.accountId || data.tempPassword) {
              const accId = e.accountId;
              const existingAcc = (s.accounts || []).find((a: { id?: string }) => a.id === accId);
              if (!existingAcc && accId) {
                s.accounts = (s.accounts || []).concat([{
                  id: accId,
                  name: e.name,
                  firstName: e.firstName || firstName,
                  lastName: e.lastName || lastName,
                  email: e.email || email,
                  contact: e.email || email,
                  phone: e.phone,
                  role: 'Gestor de campo',
                  roleId: 'experto',
                  terr: e.terr,
                  org: 'QUINTIA',
                  status: 'Activo',
                }]);
              }
            }
            const t = (s.territories || []).find(x => x.name === e.terr);
            if (t) t.experts = (t.experts || 0) + 1;
          });
          api.setState({
            expForm: false,
            ef: { ...EMPTY_EF },
            msg: 'Experto ' + e.name + ' creado en ' + e.terr + ' con correo ' + (e.email || email) + ' y la contraseña definida. Siguiente: asignar tablet y capacitar.',
            msgActions: [
              { label: 'Asignar tablet', go: () => api.go('assets', { msg: '' }) },
              { label: 'Ver en Usuarios', go: () => api.go('users', { msg: '' }) },
            ],
          });
        } catch (err) {
          api.setState({ msg: 'No se pudo conectar con la base de datos.', msgActions: [] });
        }
      },
      experts, flags, flagCount: flags.filter(f => f.pending).length + ' por revisar', checks: CHECKS.map(([k, v]) => ({ k, v })),
      pm, pe, scope: pathTerrNow || st.scope || "all",
      setScope: (e) => api.setState({ scope: e.target.value }),
      /** @deprecated El envío de matriz va solo por etapa 4 · Envío (`sendRules`). */
      sendPath: () => {
        api.setState({
          pathTab: "4",
          msg: "Los cambios de la matriz se envían desde la etapa 4 · Envío.",
          msgActions: [],
        });
      },
    }, extra);
  }
  return renderVals();
}

