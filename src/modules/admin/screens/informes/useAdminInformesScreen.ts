"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { filterRowsBySearch } from "@/components/shared/table-search/TableSearch";
import { adminPathForView } from "@/modules/admin/routes";
import { buildInforme } from "@/modules/informe/buildInforme";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";

const SECS: [string, string][] = [
  ["cap", "Captación"],
  ["cuotas", "Cuotas rural y 60+"],
  ["calidad", "Calidad de campo"],
  ["resultados", "Resultados"],
  ["crisis", "Crisis atendidas"],
  ["servicios", "Servicios del programa"],
];
const SEC_X: Record<string, string> = {
  cap: "Personas evaluadas por semana frente al ritmo necesario.",
  cuotas: "Participación rural y de 60+ frente a la meta de cada territorio.",
  calidad: "Visitas marcadas, aprobadas y rechazadas; llamadas de verificación.",
  resultados: "Mejoría por nivel digital (agregado).",
  crisis: "Crisis del período y tiempo de respuesta.",
  servicios: "Ánimo, clínica, TEJIVA y juegos entregados en el período.",
};
const TPL: Record<string, string[]> = {
  ops: ["cap", "cuotas", "calidad", "servicios"],
  board: ["cap", "resultados", "crisis", "servicios"],
  qc: ["calidad"],
  terr: ["cap", "cuotas"],
};
const TPLN: Record<string, string> = {
  ops: "Operaciones",
  board: "Junta · agregado",
  qc: "Calidad de campo",
  terr: "Territorio",
};
const AGG = ["cap", "cuotas", "resultados", "crisis", "servicios"];

type NfState = {
  name: string;
  tpl: string;
  per: string;
  terr: string;
  secs: string[];
};

type UiState = {
  zoom: number;
  agentOpen: boolean;
  msg: string;
  tab: string;
  ft: string;
  fa: string;
  fq: string;
  share: Record<string, boolean>;
  add: Record<string, string>;
  nf: NfState;
  newForm: boolean;
  pendingAsk: string;
};

function mapHref(href: string): string {
  if (!href || href === "#") return href || "#";
  let h = href;
  h = h.replace(/^Informe\.dc\.html/, "/informe");
  h = h.replace(/^AdminInformes\.dc\.html/, "/informes");
  h = h.replace(/^AdminUsuarios\.dc\.html/, "/usuarios");
  h = h.replace(/^Admin\.dc\.html/, "/inicio");
  h = h.replace(/back=AdminInformes\.dc\.html(\?tab=new)?/g, (_m, tab) =>
    tab ? "back=" + encodeURIComponent("/informes?tab=new") : "back=/informes",
  );
  h = h.replace(/back=AdminUsuarios\.dc\.html/g, "back=/usuarios");
  h = h.replace(/back=Admin\.dc\.html/g, "back=/inicio");
  // encoded back from mockup-style encodeURIComponent
  h = h.replace(
    /back=AdminInformes\.dc\.html%3Ftab%3Dnew/g,
    "back=" + encodeURIComponent("/informes?tab=new"),
  );
  return h;
}

function stripBack(href: string): string {
  return href
    .replace(/&back=\/informes[^&]*/g, "")
    .replace(/&back=%2Finformes[^&]*/g, "")
    .replace(/&back=\/admin\/informes[^&]*/g, "")
    .replace(/&back=%2Fadmin%2Finformes[^&]*/g, "")
    .replace(/&back=AdminInformes\.dc\.html[^&]*/g, "");
}

const INITIAL_NF: NfState = {
  name: "Operaciones · Salento",
  tpl: "ops",
  per: "w",
  terr: "Salento",
  secs: TPL.ops.slice(),
};

export function useAdminInformesScreen() {
  const A = useNaraStore();
  const live = useNaraLive();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [st, setSt] = useState<UiState>({
    zoom: 1,
    agentOpen: false,
    msg: "",
    tab: "lib",
    ft: "",
    fa: "",
    fq: "",
    share: {},
    add: {},
    nf: { ...INITIAL_NF, secs: TPL.ops.slice() },
    newForm: false,
    pendingAsk: "",
  });

  const setState = useCallback((patch: Partial<UiState> | ((s: UiState) => UiState)) => {
    setSt((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const u = A.session();
    if (!u || !/Admin/i.test(u.role || "")) {
      router.replace("/ingreso");
      return;
    }
    const t = searchParams.get("tab");
    if (t === "new") setSt((prev) => ({ ...prev, tab: "lib", newForm: true }));
    else if (t) setSt((prev) => ({ ...prev, tab: t }));
  }, [A, router, searchParams]);

  const v = useMemo(() => {
    const S = A.get();
    const C = A.C;
    const z = st.zoom || 1;
    const day = 86400000;
    const now = Date.now();
    const RN: Record<string, string> = {
      admin: "Paula Henao",
      clin: "Dra. Lucía Marín",
      fin: "Fundación financiadora",
      inv: "Grupo de investigación",
      inst: "Hospital local de Salento",
    };
    const fromAgent = Object.keys(S.reports || {})
      .filter((k) => S.reports[k] && S.reports[k].type === "answer")
      .map((k) => {
        const r = S.reports[k];
        return {
          id: k,
          name: r.q || "Respuesta del asistente",
          type: "Del asistente",
          date: A.fmtDay(r.at),
          author: RN[(r.role || "").split(":")[0]] || "Equipo",
          href: mapHref("Informe.dc.html?id=" + k + "&back=AdminInformes.dc.html"),
          agg: /^(fin|inv)/.test(r.role || ""),
          scope: "Pregunta al asistente",
          at: r.at,
        };
      });
    const pinned = (S.pins?.admin || []).map((qid: string) => ({
      id: "p" + qid,
      name: "Fijada en inicio · consulta " + qid,
      type: "Fijado",
      date: "Se actualiza",
      author: "Paula Henao",
      href: "/inicio",
      agg: false,
      scope: "Respuesta fijada",
    }));
    const custom = (S.customReports || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      type: "Creado",
      date: A.fmtDay(r.at),
      author: "Paula Henao",
      href: mapHref(r.href + "&back=AdminInformes.dc.html"),
      agg: r.agg,
      scope: (r.terr || "Todos los territorios") + " · " + TPLN[r.tpl],
      at: r.at,
    }));
    const allR = custom
      .concat(fromAgent)
      .sort((a: any, b: any) => (b.at || 0) - (a.at || 0))
      .concat(pinned);
    const byFilters = allR.filter(
      (r: any) => (!st.ft || r.type === st.ft) && (!st.fa || r.author === st.fa),
    );
    const lib = filterRowsBySearch(byFilters, st.fq);
    const accs = S.accounts.filter((a: any) => a.status === "Activo");
    const shareTo = (r: any) =>
      accs
        .filter((a: any) => a.roleId !== "admin" && !/Admin/i.test(a.role || ""))
        .map((a: any) => {
          const isFin =
            a.role === "Observador" &&
            !(a.modules || []).includes("datos") &&
            !(a.modules || []).includes("casos");
          const off = isFin && !r.agg;
          return {
            key: a.id,
            label: a.name,
            off,
            why: off ? "Solo recibe informes agregados" : "",
            bg: off ? "#F7F5EF" : "#fff",
            fg: off ? "#8C857C" : C.tinta,
            cur: off ? "not-allowed" : "pointer",
            go: () => {
              if (off) return;
              A.set((s: any) => {
                A.logActivity(s, (A.session()?.id || "admin"), "Compartió «" + r.name + "» con " + a.name);
                const link = stripBack(r.href);
                if (s.notifs[a.id]) A.pushNotif(s, a.id, "Paula Henao compartió un informe: " + r.name, link);
                else if (a.id === "lucia")
                  A.pushNotif(s, "clin", "Paula Henao compartió un informe: " + r.name, link);
              });
              setState({
                share: {},
                msg: "«" + r.name + "» compartido con " + a.name + ". Queda registrado.",
              });
            },
          };
        });

    const nf = st.nf;
    const setNf = (k: keyof NfState) => (e: { target: { value: string } }) => {
      const val = e.target.value;
      const nx: NfState = Object.assign({}, nf, { [k]: val });
      if (k === "tpl") {
        nx.secs = TPL[val].slice();
        nx.name = TPLN[val].replace(" · agregado", "") + (nx.terr ? " · " + nx.terr : "");
      }
      if (k === "terr") nx.name = TPLN[nx.tpl].replace(" · agregado", "") + (val ? " · " + val : "");
      setState({ nf: nx });
    };
    const href = (extra?: string) =>
      mapHref(
        "Informe.dc.html?t=custom&tpl=" +
          nf.tpl +
          "&per=" +
          nf.per +
          "&terr=" +
          encodeURIComponent(nf.terr) +
          "&secs=" +
          nf.secs.join(",") +
          "&name=" +
          encodeURIComponent(nf.name) +
          (extra || ""),
      );
    const isAgg = nf.secs.every((s) => AGG.includes(s)) && nf.tpl !== "qc";

    const excel = () => {
      const rows: any[][] = [
        ["Informe", nf.name],
        ["Período", ({ w: "Última semana", m: "Último mes", all: "Desde el inicio" } as Record<string, string>)[nf.per]],
        ["Territorio", nf.terr || "Todos"],
        [],
      ];
      const T = A.TERRS.filter((t: any) => !nf.terr || t.name === nf.terr).map((t: any) =>
        A.terrInfo(S, t.name),
      );
      if (nf.secs.includes("cap")) {
        rows.push(["Captación"]);
        rows.push(["Territorio", "Evaluadas", "Meta", "% meta", "Ritmo semanal"]);
        T.forEach((t: any) => rows.push([t.name, t.cap, t.goal, Math.round((t.cap / t.goal) * 100), t.pace]));
        rows.push([]);
      }
      if (nf.secs.includes("cuotas")) {
        rows.push(["Cuotas"]);
        rows.push(["Territorio", "Rural %", "Meta rural %", "60+ %", "Meta 60+ %"]);
        T.forEach((t: any) => rows.push([t.name, t.rural, t.ruralG, t.sixty, t.sixtyG]));
        rows.push([]);
      }
      if (nf.secs.includes("calidad")) {
        rows.push(["Calidad de campo"]);
        rows.push(["Experto", "Territorio", "Visita", "Motivos", "Estado"]);
        S.flags
          .filter((f: any) => !nf.terr || f.territory === nf.terr)
          .forEach((f: any) =>
            rows.push([f.expertName, f.territory, f.when, f.reasons.join(" · "), f.status]),
          );
        rows.push([]);
      }
      if (nf.secs.includes("resultados")) {
        rows.push(["Resultados (agregado)"]);
        rows.push(["Nivel digital", "Mejoraron 5+ puntos %", "n"]);
        A.SAMPLE.improveByDig.forEach((r: any) => rows.push(r));
        rows.push([]);
      }
      // H-005: servicios y crisis salen de la misma fuente que el informe en pantalla (sin cifras fijas).
      const calc = buildInforme(A, { per: nf.per, terr: nf.terr, secs: "servicios,crisis" });
      for (const key of ["servicios", "crisis"]) {
        if (!nf.secs.includes(key)) continue;
        const sec = calc.sections.find((x) => x.key === key);
        if (!sec) continue;
        rows.push([sec.title]);
        rows.push(sec.columns);
        sec.rows.forEach((r) => rows.push(r.cells));
        rows.push([]);
      }
      const csv =
        "\ufeff" +
        rows
          .map((r) => r.map((val) => '"' + String(val).replace(/"/g, '""') + '"').join(";"))
          .join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      a.download =
        nf.name
          .replace(/[^\wáéíóúñ -]/gi, "")
          .replace(/\s+/g, "-")
          .toLowerCase() + ".csv";
      a.click();
      A.set((s: any) => A.logActivity(s, (A.session()?.id || "admin"), "Descargó en Excel «" + nf.name + "»"));
    };

    const nextOf = (f: string) => {
      if (f === "Pausado") return "en pausa";
      const t = new Date();
      let d = 1;
      const want = /lunes/.test(f) ? 1 : /viernes/.test(f) ? 5 : null;
      if (want !== null) {
        while ((t.getDay() + d) % 7 !== want) d++;
        if (/Quincenal/.test(f)) d += 7;
        return A.fmtDay(now + d * day, { wd: true });
      }
      const n = new Date(t.getFullYear(), t.getMonth() + 1, 1);
      while (n.getDay() === 0 || n.getDay() === 6) n.setDate(n.getDate() + 1);
      return A.fmtDay(n.getTime(), { wd: true });
    };

    return {
      zoom: z,
      agentOpen: st.agentOpen,
      openAgent: () => setState({ agentOpen: true }),
      closeAgent: () => setState({ agentOpen: false, pendingAsk: "" }),
      pendingAsk: st.pendingAsk || "",
      ovW: window.innerWidth / z + "px",
      ovH: window.innerHeight / z + "px",
      drawerW: window.innerWidth < 720 ? window.innerWidth / z + "px" : "480px",
      agentAction: (a: string, p: any) => {
        if (a === "report") router.push("/informe?id=" + p + "&back=/informes");
        if (a === "detail") router.push(adminPathForView(p.target));
      },
      hasMsg: !!st.msg,
      msg: st.msg,
      clearMsg: () => setState({ msg: "" }),
      tabs: (
        [
          ["lib", "Biblioteca"],
          ["sched", "Programados"],
        ] as [string, string][]
      ).map(([k, label]) => ({
        key: k,
        label,
        bg: st.tab === k ? C.verde : "#fff",
        fg: st.tab === k ? "#fff" : C.verde,
        go: () => setState({ tab: k, msg: "" }),
      })),
      openNewForm: () => setState({ newForm: true, msg: "" }),
      closeNewForm: () => setState({ newForm: false }),
      tLib: st.tab === "lib" || st.tab === "new",
      tSched: st.tab === "sched",
      tNew: !!st.newForm,
      ft: st.ft,
      fa: st.fa,
      fq: st.fq,
      setFt: (e: { target: { value: string } }) => setState({ ft: e.target.value }),
      setFa: (e: { target: { value: string } }) => setState({ fa: e.target.value }),
      setFq: (value: string | { target: { value: string } }) =>
        setState({
          fq: typeof value === "string" ? value : value.target.value,
        }),
      typeOpts: allR.map((r: any) => r.type).filter((x: string, i: number, a: string[]) => a.indexOf(x) === i),
      authorOpts: allR
        .map((r: any) => r.author)
        .filter((x: string, i: number, a: string[]) => a.indexOf(x) === i),
      libCount: lib.length + " de " + allR.length + " informes",
      lib: lib.map((r: any) => ({
        key: r.id,
        name: r.name,
        scope: r.scope,
        type: r.type,
        date: r.date,
        author: r.author,
        href: r.href,
        shareOpen: !!st.share[r.id],
        toggleShare: () => setState({ share: { [r.id]: !st.share[r.id] } }),
        shareTo: shareTo(r),
        shareNote: r.agg
          ? "Informe agregado"
          : "Incluye detalle operativo: el financiador no puede recibirlo",
        agg: !!r.agg,
      })),
      closeShare: () => setState({ share: {} }),
      shareTarget: (() => {
        const openId = Object.keys(st.share).find((k) => st.share[k]);
        if (!openId) return null;
        const r = lib.find((x: any) => x.id === openId);
        if (!r) return null;
        return {
          id: r.id,
          name: r.name,
          shareTo: shareTo(r),
          shareNote: r.agg
            ? "Informe agregado: se puede compartir con el financiador."
            : "Incluye detalle operativo: el financiador no puede recibirlo.",
        };
      })(),
      noLib: !lib.length,
      scheds: (S.schedules || []).map((s: any) => {
        const sel = st.add[s.id] || "";
        return {
          key: s.id,
          name: s.name,
          freq: s.freq,
          next: nextOf(s.freq),
          href:
            s.tpl === "board"
              ? mapHref("Informe.dc.html?t=board&back=AdminInformes.dc.html")
              : mapHref("Informe.dc.html?t=admin-weekly&back=AdminInformes.dc.html"),
          setFreq: (e: { target: { value: string } }) => {
            const val = e.target.value;
            A.set((x: any) => {
              x.schedules.find((y: any) => y.id === s.id).freq = val;
              A.logActivity(
                x, (A.session()?.id || "admin"),
                "Cambió la frecuencia de «" + s.name + "» a " + val.toLowerCase(),
              );
            });
            setState({ msg: "«" + s.name + "»: " + val.toLowerCase() + "." });
          },
          to: s.to.map((n: string) => ({
            key: n,
            name: n,
            remove: () =>
              A.set((x: any) => {
                const y = x.schedules.find((q2: any) => q2.id === s.id);
                y.to = y.to.filter((m: string) => m !== n);
              }),
          })),
          addOpts: accs
            .filter((a: any) => !s.to.includes(a.name))
            .map((a: any) => {
              const isFin =
                a.role === "Observador" &&
                !(a.modules || []).includes("datos") &&
                !(a.modules || []).includes("casos");
              const off = isFin && s.tpl !== "board";
              return {
                key: a.id,
                v: a.name,
                l: a.name + (off ? " · solo agregados" : ""),
                off,
              };
            }),
          addSel: sel,
          setAdd: (e: { target: { value: string } }) =>
            setState({ add: Object.assign({}, st.add, { [s.id]: e.target.value }) }),
          add: () => {
            if (!sel) return;
            A.set((x: any) => {
              const y = x.schedules.find((q2: any) => q2.id === s.id);
              if (!y.to.includes(sel)) y.to.push(sel);
              A.logActivity(x, (A.session()?.id || "admin"), "Agregó a " + sel + " como destinatario de «" + s.name + "»");
            });
            setState({ add: Object.assign({}, st.add, { [s.id]: "" }) });
          },
          note:
            s.tpl === "board"
              ? "Agregado · se puede enviar al financiador"
              : "Detalle operativo · solo para el equipo del programa",
        };
      }),
      nf,
      nfSet: {
        name: setNf("name"),
        tpl: setNf("tpl"),
        per: setNf("per"),
        terr: setNf("terr"),
      },
      terrOpts: A.TERRS.map((t: any) => t.name),
      secs: SECS.map(([k, label]) => {
        const on = nf.secs.includes(k);
        return {
          key: k,
          label,
          mark: on ? "✓" : "",
          bd: on ? C.verde : C.texto2,
          bg: on ? C.verde : "#fff",
          toggle: () =>
            setState({
              nf: Object.assign({}, nf, {
                secs: on
                  ? nf.secs.filter((x) => x !== k)
                  : SECS.map((s) => s[0]).filter((x) => x === k || nf.secs.includes(x)),
              }),
            }),
        };
      }),
      nfErr: !nf.secs.length,
      previewHref: nf.secs.length
        ? href("&back=" + encodeURIComponent("/informes?tab=new"))
        : "#",
      pdfHref: nf.secs.length
        ? href("&print=1&back=" + encodeURIComponent("/informes?tab=new"))
        : "#",
      saveNew: () => {
        if (!nf.secs.length) {
          setState({ msg: "Elija al menos una sección." });
          return;
        }
        const id = "c" + Date.now();
        const rawHref =
          "Informe.dc.html?t=custom&tpl=" +
          nf.tpl +
          "&per=" +
          nf.per +
          "&terr=" +
          encodeURIComponent(nf.terr) +
          "&secs=" +
          nf.secs.join(",") +
          "&name=" +
          encodeURIComponent(nf.name);
        A.set((s: any) => {
          s.customReports = (s.customReports || []).concat([
            {
              id,
              name: nf.name,
              tpl: nf.tpl,
              terr: nf.terr,
              href: mapHref(rawHref),
              agg: isAgg,
              at: Date.now(),
            },
          ]);
          A.logActivity(s, (A.session()?.id || "admin"), "Creó el informe «" + nf.name + "»");
        });
        setState({ tab: "lib", newForm: false, msg: "«" + nf.name + "» guardado en la biblioteca." });
      },
      excel,
      outline: nf.secs.map((k) => ({
        key: k,
        t: SECS.find((s) => s[0] === k)![1],
        x: SEC_X[k],
      })),
      aggNote: isAgg
        ? "Solo datos agregados: se puede compartir con el financiador."
        : "Incluye detalle operativo: no se puede compartir con el financiador.",
    };
  }, [A, router, setState, st, live]);

  return { v };
}
