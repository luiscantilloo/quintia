"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNaraStore } from "@/providers/nara-provider";

export function useAdminExpertoScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = (searchParams.get("e") || "").trim();
  const [tick, setTick] = useState(0);
  const [agentOpen, setAgentOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => store.subscribe(() => setTick((n) => n + 1)), [store]);

  useEffect(() => {
    store.requireSession(["admin"]);
  }, [store]);

  useEffect(() => {
    if (!name) {
      router.replace("/equipos");
      return;
    }
    const S = store.get();
    const found = store.experts(S).find((e: { name: string }) => e.name === name);
    if (!found) router.replace("/equipos");
  }, [name, router, store, tick]);

  const v = useMemo(() => {
    void tick;
    const S = store.get();
    const C = store.C;
    if (!name) return null;
    const e = store.experts(S).find((x: { name: string }) => x.name === name);
    if (!e) return null;

    const eov = (S.expertOv || {})[name] || {};
    const terr = eov.terr || e.terr || "—";
    const exKey = e.id || e.accountId || name;
    const goals = store.teamGoals(S);
    const midWeek = Math.max(1, Math.round(goals.weekly * 34 / 45));
    const q = store.quotas(S, exKey);
    const alertCount =
      typeof store.expertAlertCount === "function"
        ? store.expertAlertCount(S, exKey)
        : 0;
    const isDurFlag = (f: { reasons?: string[] }) => {
      const reasons = f.reasons || [];
      return (
        reasons.length > 0 &&
        reasons.every((r) =>
          /mínimo\s*20|minimo\s*20|menos de\s*20\s*minutos|entrevista de\s+\d+/i.test(
            String(r || ""),
          ),
        )
      );
    };
    const flags = (S.flags || []).filter(
      (f: {
        expertName?: string;
        expert?: string;
        expertId?: string;
        reasons?: string[];
      }) =>
        (f.expertName === name ||
          f.expert === e.id ||
          f.expertId === e.id ||
          f.expert === e.accountId) &&
        !isDurFlag(f),
    );
    const people = store
      .people(S)
      .filter(
        (p: { expert?: string; expertId?: string }) =>
          p.expert === name ||
          p.expert === e.id ||
          p.expertId === e.id ||
          p.expertId === e.accountId,
      );
    const active = eov.active !== false && e.active !== false;
    const training = e.training || "Pendiente";
    const statusKey =
      typeof store.expertTeamStatus === "function"
        ? store.expertTeamStatus(S, exKey, e)
        : (q.week || 0) >= midWeek
          ? "ok"
          : "low";
    const statusMap: Record<string, { label: string; sc: string }> = {
      ok: { label: "Al día", sc: C.alDia },
      low: { label: "Bajo meta", sc: C.bajoMeta },
      rev: { label: "Revisar", sc: C.revisar },
      new: { label: "Capacitación pendiente", sc: "#8C857C" },
      off: { label: "Desactivado", sc: "#8C857C" },
    };
    const statusMeta = statusMap[statusKey] || statusMap.low;
    const status = statusMeta.label;
    const sc = statusMeta.sc;
    const pending = alertCount;

    const terrNames = (S.territories || []).map((t: { name: string }) => t.name);

    return {
      name,
      phone: e.phone || "—",
      terr,
      status,
      sc,
      active,
      training,
      tablet: e.tablet || null,
      agentOpen,
      drawerW: typeof window !== "undefined" && window.innerWidth < 720 ? "100%" : "480px",
      openAgent: () => setAgentOpen(true),
      closeAgent: () => setAgentOpen(false),
      pendingAsk: "",
      back: () => router.push("/equipos"),
      msg,
      clearMsg: () => setMsg(""),
      kpis: [
        { label: "Visitas hoy", val: String(q.today || 0) + " / " + (q.todayT || e.target || goals.daily), sub: "Meta diaria" },
        { label: "Semana", val: String(q.week || 0) + " / " + (q.weekT || goals.weekly), sub: "Visitas validadas" },
        {
          label: "Alertas",
          val: String(pending),
          sub:
            flags.filter((f: { status: string }) => f.status === "pending").length
              ? "Incluye QC y crisis abiertas"
              : "Crisis / cola / fichas abiertas",
        },
        { label: "Personas", val: String(people.length), sub: "Asignadas a este experto" },
      ],
      people: people.slice(0, 50).map((p: { code?: string; name: string; place?: string; status?: string; profile?: string }) => ({
        code: p.code || "—",
        name: p.name,
        place: p.place || "—",
        status: p.status || "—",
        profile: p.profile || "—",
        open: () => p.code && router.push("/admin/persona?c=" + encodeURIComponent(p.code)),
      })),
      noPeople: people.length === 0,
      flags: flags.slice(0, 20).map((f: { id?: string; when?: string; person?: string; reasons?: string[]; status: string }) => ({
        key: f.id || f.person + f.when,
        when: f.when || "—",
        person: f.person || "—",
        reasons: f.reasons || [],
        status: f.status === "pending" ? "Pendiente" : f.status === "approved" ? "Aprobada" : "Rechazada",
      })),
      noFlags: flags.length === 0,
      terrNames,
      setTerr: async (terrName: string) => {
        const next = String(terrName || "")
          .split(/\s*[,;/|]\s*|\s+y\s+/i)
          .map((x) => x.trim())
          .filter(Boolean)[0];
        if (!next || /^todos$/i.test(next)) {
          setMsg("El experto debe tener un único territorio asignado.");
          return;
        }
        if (next === terr) return;
        try {
          const res = await fetch("/api/experts", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: e.id,
              name: e.name,
              phone: e.phone,
              terr: next,
              target: e.target || goals.daily,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setMsg(data.error || "No se pudo actualizar el territorio.");
            return;
          }
          store.set((s) => {
            const x = (s.experts || []).find((y: { name: string }) => y.name === name);
            if (x) x.terr = next;
            s.expertOv = s.expertOv || {};
            s.expertOv[name] = Object.assign({}, s.expertOv[name], { terr: next });
            store.logActivity(s, (store.session()?.id || "admin"), "Cambió el territorio de " + name + " a " + next);
          });
          setMsg("Territorio actualizado a " + next + ".");
        } catch {
          setMsg("No se pudo conectar con la base de datos.");
        }
      },
      toggleActive: () => {
        const nextActive = !active;
        store.set((s) => {
          s.expertOv = s.expertOv || {};
          s.expertOv[name] = Object.assign({}, s.expertOv[name], { active: nextActive });
          const x = (s.experts || []).find((y: { name: string }) => y.name === name);
          if (x) x.active = nextActive;
          store.logActivity(s, (store.session()?.id || "admin"), (nextActive ? "Activó" : "Desactivó") + " a " + name);
        });
        setMsg(nextActive ? "Experto activado." : "Experto desactivado.");
      },
      completeTraining: () => {
        store.set((s) => {
          const x = (s.experts || []).find((y: { name: string }) => y.name === name);
          if (x) {
            x.training = "Completa · 16 h";
            x.isNew = false;
          }
          store.logActivity(s, (store.session()?.id || "admin"), "Marcó capacitación completa de " + name);
        });
        setMsg("Capacitación marcada como completa.");
      },
      assignTablet: () => {
        store.set((s) => {
          const x = (s.experts || []).find((y: { name: string }) => y.name === name);
          if (x && !x.tablet) {
            const n = (s.experts || []).filter((z: { tablet?: string | boolean }) => z.tablet).length + 1;
            x.tablet = "TB-" + String(n).padStart(3, "0");
          }
          store.logActivity(s, (store.session()?.id || "admin"), "Asignó tablet a " + name);
        });
        setMsg("Tablet asignada.");
      },
      goAssets: () => router.push("/activos"),
      goTeam: () => router.push("/equipos"),
    };
  }, [agentOpen, msg, name, router, store, tick]);

  return { v };
}
