"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";
import { apiFetch } from "@/lib/api/client";

export function useAdminTerritorioScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = (searchParams.get("t") || "").trim();
  const [tick, setTick] = useState(0);
  const [agentOpen, setAgentOpen] = useState(false);
  const [crisisLine, setCrisisLine] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);

  useEffect(() => {
    const u = store.requireSession(["admin"]);
    if (!u) return;
  }, [store]);

  const v = useMemo(() => {
    void tick;
    const S = store.get();
    const C = store.C;
    if (!name) return null;
    const t = store.terrInfo(S, name);
    if (!t) return null;

    const ov = (S.terrOv || {})[name] || {};
    const exps = store.experts(S).filter((e: { terr?: string; active?: boolean }) => e.terr === name && e.active !== false);
    const people = store.people(S).filter((p: { terr?: string }) => p.terr === name);
    const map = store.placeMap(S, name);
    const doc = (S.territories || []).find((x: { name?: string }) => x.name === name) as { active?: boolean } | undefined;
    // A-01: el territorio está desactivado si así lo guardó la API (o, en datos viejos, la pausa local).
    const paused = doc?.active === false || !!ov.paused;
    // Captación viva = personas del territorio (no el campo estático t.cap del documento).
    const cap = people.length;
    const goal = t.goal || 0;
    const pct = goal ? Math.round((cap / goal) * 100) : 0;
    const ruralN = people.filter((p: { rural?: boolean; place?: string }) => {
      if (p.rural === true) return true;
      if (p.rural === false) return false;
      return /vereda/i.test(String(p.place || ""));
    }).length;
    const sixtyN = people.filter((p: { age?: number }) => (p.age || 0) >= 60).length;
    const ruralPct = cap ? Math.round((ruralN / cap) * 100) : 0;
    const sixtyPct = cap ? Math.round((sixtyN / cap) * 100) : 0;
    const ruralG = t.ruralG || 0;
    const sixtyG = t.sixtyG || 0;
    const hasEval = people.some(
      (p: { profile?: string; evalAt?: unknown; pendingEval?: boolean; status?: string }) =>
        !!(p.profile && /^P\d+$/i.test(String(p.profile))) ||
        !!p.evalAt ||
        p.pendingEval === true ||
        /por\s*aprobar|activo|crisis|rechazad|terminado/i.test(String(p.status || "")),
    );
    let status = "Sin iniciar";
    let sc = "#8C857C";
    if (goal && cap >= goal) {
      status = "Finalizado";
      sc = C.alDia;
    } else if (cap > 0 || hasEval) {
      status = "Iniciado";
      sc = C.alDia;
      if (goal && cap / goal < 0.3) {
        status = "Iniciado · captación lenta";
        sc = C.bajoMeta;
      } else if (ruralG && ruralPct < ruralG - 2) {
        status = "Iniciado · bajo cuota rural";
        sc = C.revisar;
      }
    }
    if (paused) {
      status = "En pausa";
      sc = "#8C857C";
    }
    const startOfDay = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const startOfWeek = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const day = d.getDay(); // 0 dom
      const diff = day === 0 ? 6 : day - 1; // lunes
      d.setDate(d.getDate() - diff);
      return d.getTime();
    })();
    const visitsForExpert = (e: { id?: string; name?: string }) => {
      const eid = e.id != null ? String(e.id) : "";
      const en = e.name != null ? String(e.name) : "";
      const matched = people.filter((p: { expertId?: string; expert?: string; evalAt?: number }) => {
        const peid = p.expertId != null ? String(p.expertId) : "";
        const pen = p.expert != null ? String(p.expert) : "";
        return (eid && peid === eid) || (en && pen === en) || (eid && pen === eid) || (en && peid === en);
      });
      const withEval = matched.filter(
        (p: { evalAt?: number }) => p.evalAt != null && Number(p.evalAt) > 0,
      );
      const today = withEval.filter(
        (p: { evalAt?: number }) => Number(p.evalAt) >= startOfDay,
      ).length;
      const week = withEval.filter(
        (p: { evalAt?: number }) => Number(p.evalAt) >= startOfWeek,
      ).length;
      // Worklists validadas del experto (por si aún no hay evalAt en people).
      const wlKeys = new Set<string>();
      if (eid) wlKeys.add(eid);
      if (en) wlKeys.add(en);
      let wlToday = 0;
      let wlWeek = 0;
      Object.keys(S.worklists || {}).forEach((k) => {
        if (!wlKeys.has(k) && k !== eid && k !== en) return;
        (S.worklists[k] || []).forEach(
          (w: { status?: string; at?: number; updatedAt?: number }) => {
            if (!/validada|crisis/i.test(String(w.status || ""))) return;
            const at = Number(w.at || w.updatedAt || 0);
            if (at >= startOfDay) wlToday += 1;
            if (at >= startOfWeek) wlWeek += 1;
          },
        );
      });
      return {
        today: Math.max(today, wlToday),
        week: Math.max(week, wlWeek),
      };
    };

    const content: string[] = ov.content || t.content || [];
    const instsList: string[] = Array.isArray(t.insts)
      ? t.insts
      : typeof t.insts === "number" && t.insts > 0
        ? [t.insts + (t.insts === 1 ? " institución configurada" : " instituciones configuradas")]
        : [];

    return {
      name,
      dep: t.dep || "—",
      level: t.level || "—",
      status,
      sc,
      paused,
      agentOpen,
      drawerW: typeof window !== "undefined" && window.innerWidth < 720 ? "100%" : "480px",
      openAgent: () => setAgentOpen(true),
      closeAgent: () => setAgentOpen(false),
      pendingAsk: "",
      back: () => router.push("/territorios"),
      kpis: [
        {
          label: "Captación",
          val: cap.toLocaleString("es-CO") + " / " + goal.toLocaleString("es-CO"),
          sub: pct + " % de la meta",
        },
        {
          label: "Rural",
          val: cap ? ruralPct + " %" : "—",
          sub: "Meta " + ruralG + " %",
        },
        {
          label: "60+",
          val: cap ? sixtyPct + " %" : "0",
          sub: "Meta " + sixtyG + " %",
        },
        {
          label: "Experto",
          val: exps[0]?.name || "Sin experto",
          sub: people.length + (people.length === 1 ? " persona en el territorio" : " personas en el territorio"),
        },
      ],
      content,
      insts: instsList,
      experts: exps.map((e: { id?: string; name: string; phone?: string; training?: string }) => {
        const v = visitsForExpert(e);
        return {
          name: e.name,
          today: v.today,
          week: v.week,
          phone: e.phone || "—",
          training: e.training || "—",
          open: () => router.push("/admin/experto?e=" + encodeURIComponent(e.name)),
        };
      }),
      // Sin columna Experto: con 1 experto/territorio se repetiría en cada fila.
      // Si solo hay un “lugar” igual al territorio, no listar (duplica el KPI Captación).
      places: (() => {
        const rows = (map?.rows || []).map((r: { name: string; rural: boolean; n: number; goal: number; pct: number; alerts: number }) => ({
          name: r.name,
          zone: r.rural ? "Rural" : "Urbano",
          n: r.n,
          goal: r.goal,
          pct: r.pct + "%",
          alerts: r.alerts,
        }));
        if (
          rows.length === 1 &&
          String(rows[0].name || "")
            .trim()
            .toLowerCase() === String(name || "").trim().toLowerCase()
        ) {
          return [];
        }
        return rows;
      })(),
      noPlaces: (() => {
        const rows = map?.rows || [];
        if (!rows.length) return true;
        if (
          rows.length === 1 &&
          String(rows[0].name || "")
            .trim()
            .toLowerCase() === String(name || "").trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      })(),
      placeSummary: (() => {
        const rows = map?.rows || [];
        if (
          rows.length === 1 &&
          String(rows[0].name || "")
            .trim()
            .toLowerCase() === String(name || "").trim().toLowerCase()
        ) {
          return "La captación del territorio está en el resumen de arriba · aún no hay veredas o barrios distintos.";
        }
        return map?.summary || "Sin veredas ni barrios registrados";
      })(),
      crisisLine,
      setCrisisLine: (e: ChangeEvent<HTMLInputElement>) => setCrisisLine(e.target.value),
      msg,
      clearMsg: () => setMsg(""),
      togglePause: async () => {
        // A-01 (TRL 2026-10-10): desactivar o reactivar se guarda en la API (`active`), así deja de verse
        // para expertos y clínicos; antes solo cambiaba el estado local.
        const activo = paused;
        const res = await apiFetch("/api/territories", { method: "POST", body: JSON.stringify({ name, active: activo }) }).catch(() => null);
        if (!res || !res.ok) {
          setMsg("No se pudo guardar el cambio. Intente de nuevo.");
          return;
        }
        store.set((s) => {
          const x = (s.territories || []).find((y: { name: string }) => y.name === name);
          if (x) x.active = activo;
          s.terrOv = s.terrOv || {};
          s.terrOv[name] = Object.assign({}, s.terrOv[name], { paused: !activo });
          store.logActivity(s, (store.session()?.id || "admin"), (activo ? "Reactivó" : "Desactivó") + " el territorio " + name);
        });
        setMsg(activo ? "Territorio reactivado." : "Territorio desactivado. Ya no aparece para expertos ni clínicos.");
      },
      saveCrisis: async () => {
        const linea = crisisLine.trim();
        const res = await apiFetch("/api/territories", { method: "POST", body: JSON.stringify({ name, crisisLine: linea }) }).catch(() => null);
        if (!res || !res.ok) {
          setMsg("No se pudo guardar la línea de crisis. Intente de nuevo.");
          return;
        }
        store.set((s) => {
          s.terrOv = s.terrOv || {};
          s.terrOv[name] = Object.assign({}, s.terrOv[name], { crisisLine: linea });
          store.logActivity(s, (store.session()?.id || "admin"), "Actualizó la línea de crisis de " + name);
        });
        setMsg("Línea de crisis guardada.");
      },
      assignBands: () => {
        store.set((s) => {
          const x = (s.territories || []).find((y: { name: string }) => y.name === name);
          if (x) {
            x.br = (x.br || 0) + 100;
            x.brA = (x.brA || 0) + 100;
            x.brAv = (x.brAv || 0) + 100;
          }
          s.terrOv = s.terrOv || {};
          s.terrOv[name] = Object.assign({}, s.terrOv[name], { extraBr: ((s.terrOv[name] || {}).extraBr || 0) });
          store.logActivity(s, (store.session()?.id || "admin"), "Asignó 100 manillas a " + name);
        });
        setMsg("Se asignaron 100 manillas a " + name + ".");
      },
      goExperts: () => router.push("/equipos"),
      goAssets: () => router.push("/activos"),
      goPeople: () => router.push("/personas"),
    };
  }, [agentOpen, crisisLine, msg, name, router, store, tick]);

  useEffect(() => {
    if (!name) {
      router.replace("/territorios");
      return;
    }
    const S = store.get();
    if (!store.terrInfo(S, name)) {
      router.replace("/territorios");
      return;
    }
    const ov = (S.terrOv || {})[name] || {};
    setCrisisLine(ov.crisisLine || "");
    if (typeof window !== "undefined") {
      (window as unknown as { __naraTerr?: string }).__naraTerr = name;
    }
  }, [name, router, store, tick]);

  return { v };
}
