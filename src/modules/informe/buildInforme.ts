/* eslint-disable @typescript-eslint/no-explicit-any */

export const SEC_LABELS: Record<string, string> = {
  cap: "Captación",
  cuotas: "Cuotas rural y 60+",
  calidad: "Calidad de campo",
  resultados: "Resultados",
  crisis: "Crisis atendidas",
  servicios: "Servicios del programa",
};

export const SEC_BLURB: Record<string, string> = {
  cap: "Evaluadas frente a la meta y al ritmo semanal.",
  cuotas: "Participación rural y 60+ frente a la meta.",
  calidad: "Visitas marcadas: estado y motivos.",
  resultados: "Mejoría del PHQ-9 por nivel digital.",
  crisis: "Crisis del período y tiempo de respuesta.",
  servicios: "Ánimo, clínica, TEJIVA y juegos del período.",
};

const TPL_SECS: Record<string, string[]> = {
  ops: ["cap", "cuotas", "calidad", "servicios"],
  board: ["cap", "resultados", "crisis", "servicios"],
  qc: ["calidad"],
  terr: ["cap", "cuotas"],
};

const PER_LABEL: Record<string, string> = {
  w: "Última semana",
  m: "Último mes",
  all: "Desde el inicio",
};

const TPL_LABEL: Record<string, string> = {
  ops: "Operaciones",
  board: "Junta · agregado",
  qc: "Calidad de campo",
  terr: "Territorio",
};

export type InformeRow = {
  cells: string[];
  tone?: "ok" | "warn" | "muted";
};

export type InformeSection = {
  key: string;
  title: string;
  blurb: string;
  columns: string[];
  rows: InformeRow[];
  empty?: string;
  kpis?: { label: string; value: string; hint?: string }[];
};

export type InformeModel = {
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  sections: InformeSection[];
  actions: string[];
  answer?: { q: string; when: string };
};

const SIN_REGISTRO = "Sin registro";

/** Inicio del período del informe en milisegundos (w = 7 días, m = 30 días, all = todo). */
function periodStart(per: string, now = Date.now()): number {
  if (per === "m") return now - 30 * 24 * 60 * 60 * 1000;
  if (per === "all") return 0;
  return now - 7 * 24 * 60 * 60 * 1000;
}

function pct(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function statusLabel(s: string): string {
  if (s === "pending") return "Por revisar";
  if (s === "approved") return "Aprobada";
  if (s === "rejected") return "Rechazada";
  return s || "—";
}

function resolveSecs(params: {
  t?: string | null;
  tpl?: string | null;
  secs?: string | null;
}): string[] {
  const t = params.t || "";
  if (t === "admin-weekly") return ["cap", "cuotas", "calidad", "servicios"];
  if (t === "board") return TPL_SECS.board.slice();
  const fromUrl = (params.secs || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SEC_LABELS[s]);
  if (fromUrl.length) return fromUrl;
  const tpl = params.tpl || "ops";
  return (TPL_SECS[tpl] || TPL_SECS.ops).slice();
}

export function buildInforme(
  store: any,
  params: {
    name?: string | null;
    t?: string | null;
    tpl?: string | null;
    per?: string | null;
    terr?: string | null;
    secs?: string | null;
    id?: string | null;
  },
): InformeModel {
  const S = store.get();
  const id = params.id || "";
  const t = params.t || "";
  const per = params.per || (t === "admin-weekly" ? "w" : t === "board" ? "m" : "w");
  const terr = (params.terr || "").trim();
  const tpl = params.tpl || (t === "board" ? "board" : t === "admin-weekly" ? "ops" : "ops");
  const secs = resolveSecs(params);

  const title =
    params.name ||
    (t === "admin-weekly"
      ? "Operaciones de la semana"
      : t === "board"
        ? "Informe mensual para la junta"
        : id
          ? "Respuesta del asistente"
          : "Informe");

  const terrList = (store.TERRS || [])
    .filter((x: any) => !terr || x.name === terr)
    .map((x: any) => store.terrInfo(S, x.name))
    .filter(Boolean);

  const meta = [
    { label: "Período", value: PER_LABEL[per] || PER_LABEL.w },
    { label: "Territorio", value: terr || "Todos" },
    { label: "Plantilla", value: TPL_LABEL[tpl] || TPL_LABEL.ops },
    {
      label: "Generado",
      value: new Date().toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    },
  ];

  if (id && S.reports && S.reports[id]) {
    const r = S.reports[id];
    return {
      title,
      subtitle: "Respuesta guardada desde el asistente de datos.",
      meta: [
        {
          label: "Guardado",
          value: r.at
            ? new Date(r.at).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—",
        },
      ],
      sections: [],
      actions: [],
      answer: {
        q: r.q || "Consulta guardada",
        when: r.at
          ? new Date(r.at).toLocaleString("es-CO", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      },
    };
  }

  const sections: InformeSection[] = [];

  if (secs.includes("cap")) {
    const totalCap = terrList.reduce((a: number, ti: any) => a + (ti.cap || 0), 0);
    const totalGoal = terrList.reduce((a: number, ti: any) => a + (ti.goal || 0), 0);
    sections.push({
      key: "cap",
      title: SEC_LABELS.cap,
      blurb: SEC_BLURB.cap,
      columns: ["Territorio", "Evaluadas", "Meta", "% meta", "Ritmo / sem"],
      rows: terrList.slice(0, 5).map((ti: any) => {
        const p = pct(ti.cap, ti.goal);
        return {
          cells: [
            ti.name,
            String(ti.cap ?? 0),
            String(ti.goal ?? 0),
            p + " %",
            String(ti.pace ?? 0),
          ],
          tone: p < 70 ? "warn" : "ok",
        };
      }),
      empty: "Aún no hay territorios con captación registrada.",
      kpis: [
        {
          label: "Evaluadas",
          value: totalCap.toLocaleString("es-CO"),
          hint: totalGoal ? `de ${totalGoal.toLocaleString("es-CO")} meta` : undefined,
        },
        { label: "Avance", value: pct(totalCap, totalGoal) + " %" },
        {
          label: "Ritmo sem.",
          value: String(
            terrList.reduce((a: number, ti: any) => a + (ti.pace || 0), 0) || "—",
          ),
        },
      ],
    });
  }

  if (secs.includes("cuotas")) {
    sections.push({
      key: "cuotas",
      title: SEC_LABELS.cuotas,
      blurb: SEC_BLURB.cuotas,
      columns: ["Territorio", "Rural %", "Meta rural", "60+ %", "Meta 60+"],
      rows: terrList.slice(0, 5).map((ti: any) => {
        const ruralOk = (ti.rural || 0) >= (ti.ruralG || 0) - 2;
        const sixtyOk = (ti.sixty || 0) >= (ti.sixtyG || 0) - 2;
        return {
          cells: [
            ti.name,
            String(ti.rural ?? 0),
            String(ti.ruralG ?? 0),
            String(ti.sixty ?? 0),
            String(ti.sixtyG ?? 0),
          ],
          tone: ruralOk && sixtyOk ? "ok" : "warn",
        };
      }),
      empty: "Sin datos de cuotas para este filtro.",
      kpis: terrList[0]
        ? [
            {
              label: "Rural",
              value: `${terrList[0].rural ?? 0} %`,
              hint: `meta ${terrList[0].ruralG ?? 0} %`,
            },
            {
              label: "60+",
              value: `${terrList[0].sixty ?? 0} %`,
              hint: `meta ${terrList[0].sixtyG ?? 0} %`,
            },
          ]
        : undefined,
    });
  }


  if (secs.includes("calidad")) {
    const flags = (S.flags || []).filter((f: any) => !terr || f.territory === terr);
    const pending = flags.filter((f: any) => f.status === "pending").length;
    const rejected = flags.filter((f: any) => f.status === "rejected").length;
    const approved = flags.filter((f: any) => f.status === "approved").length;
    sections.push({
      key: "calidad",
      title: SEC_LABELS.calidad,
      blurb: SEC_BLURB.calidad,
      columns: ["Experto", "Territorio", "Visita", "Motivos", "Estado"],
      rows: flags.slice(0, 4).map((f: any) => ({
        cells: [
          f.expertName || f.expert || "—",
          f.territory || "—",
          f.when || "—",
          (f.reasons || []).join(" · ") || "—",
          statusLabel(f.status),
        ],
        tone:
          f.status === "rejected"
            ? "warn"
            : f.status === "pending"
              ? "muted"
              : "ok",
      })),
      empty: "No hay visitas marcadas en control de calidad.",
      kpis: [
        { label: "Por revisar", value: String(pending) },
        { label: "Aprobadas", value: String(approved) },
        { label: "Rechazadas", value: String(rejected) },
      ],
    });
  }

  if (secs.includes("resultados")) {
    const dig = store.SAMPLE?.improveByDig || [];
    sections.push({
      key: "resultados",
      title: SEC_LABELS.resultados,
      blurb: SEC_BLURB.resultados,
      columns: ["Nivel digital", "Mejoraron 5+ pts", "n"],
      rows: dig.slice(0, 4).map((r: any[]) => ({
        cells: [String(r[0]), String(r[1]) + " %", String(r[2])],
      })),
      empty: "Aún no hay resultados agregados de mejoría.",
    });
  }

  // H-005 (TRL 2026-10-10): sin cifras fijas. Todo sale del estado del programa; lo que no se registra
  // en la plataforma se muestra como «Sin registro», nunca con un número inventado.
  const desde = periodStart(per);

  if (secs.includes("servicios")) {
    const people = (S.people || []).filter(
      (p: any) => !p.archived && (!terr || p.terr === terr),
    );
    const activas = people.filter((p: any) => p.status === "Activo" || p.status === "Crisis").length;
    const conPerfil = people.filter((p: any) => /^P\d+$/.test(String(p.profile || ""))).length;
    const rows: [string, string][] = [
      ["Personas registradas", people.length.toLocaleString("es-CO")],
      ["Personas activas", activas.toLocaleString("es-CO")],
      ["Con perfil asignado (psicólogo clínico, TEJIVA y estado de ánimo)", conPerfil.toLocaleString("es-CO")],
      ["Juegos / herramientas digitales", SIN_REGISTRO],
    ];
    sections.push({
      key: "servicios",
      title: SEC_LABELS.servicios,
      blurb: SEC_BLURB.servicios,
      columns: ["Servicio", "Valor"],
      rows: rows.map(([label, v]) => ({
        cells: [label, v],
        tone: v === SIN_REGISTRO ? "muted" : undefined,
      })),
      kpis: [
        { label: "Registradas", value: people.length.toLocaleString("es-CO") },
        { label: "Activas", value: activas.toLocaleString("es-CO") },
        { label: "Con perfil", value: conPerfil.toLocaleString("es-CO") },
      ],
    });
  }

  if (secs.includes("crisis")) {
    const log: any[] = (S.crisisLog || []).filter((c: any) => Number(c.at || 0) >= desde);
    const creadas = log.filter((c: any) => c.type === "created");
    const tomadas = new Map<string, number>();
    for (const c of S.crisisLog || []) {
      if ((c.type === "taken" || c.type === "closed") && c.alertId) {
        const prev = tomadas.get(c.alertId);
        if (prev === undefined || c.at < prev) tomadas.set(c.alertId, Number(c.at));
      }
    }
    const conRespuesta = creadas.filter((c: any) => tomadas.has(c.alertId));
    const en30 = conRespuesta.filter((c: any) => (tomadas.get(c.alertId) as number) - Number(c.at) <= 30 * 60 * 1000).length;
    const pct30 = conRespuesta.length ? pct(en30, conRespuesta.length) + " %" : SIN_REGISTRO;
    sections.push({
      key: "crisis",
      title: SEC_LABELS.crisis,
      blurb: SEC_BLURB.crisis,
      columns: ["Indicador", "Valor"],
      rows: [
        { cells: ["Crisis del período", String(creadas.length)], tone: "muted" },
        { cells: ["Con respuesta registrada", String(conRespuesta.length)] },
        { cells: ["Atendidas en menos de 30 min", pct30], tone: conRespuesta.length ? "ok" : "muted" },
      ],
      kpis: [
        { label: "Crisis", value: String(creadas.length) },
        { label: "≤ 30 min", value: pct30 },
      ],
    });
  }

  const actions: string[] = [];
  terrList.forEach((ti: any) => {
    if (ti.goal && pct(ti.cap, ti.goal) < 70) {
      actions.push(
        `Acelerar captación en ${ti.name}: va al ${pct(ti.cap, ti.goal)} % de la meta.`,
      );
    }
    if ((ti.ruralG || 0) && (ti.rural || 0) < ti.ruralG - 2) {
      actions.push(
        `Reforzar mezcla rural en ${ti.name}: ${ti.rural} % frente a meta ${ti.ruralG} %.`,
      );
    }
  });
  const pendingQc = (S.flags || []).filter(
    (f: any) => f.status === "pending" && (!terr || f.territory === terr),
  ).length;
  if (pendingQc) {
    actions.push(
      `Revisar ${pendingQc} visita${pendingQc === 1 ? "" : "s"} pendiente${pendingQc === 1 ? "" : "s"} en control de calidad.`,
    );
  }
  if (!actions.length) {
    actions.push("Sin alertas operativas en este filtro. Mantener el ritmo de visitas y verificación.");
  }

  const subtitleParts = [
    TPL_LABEL[tpl] || "Informe",
    PER_LABEL[per] || "",
    terr || "Todos los territorios",
  ].filter(Boolean);

  return {
    title,
    subtitle: subtitleParts.join(" · "),
    meta,
    sections,
    actions: actions.slice(0, 3),
  };
}
