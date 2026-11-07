"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { useNaraStore } from "@/providers/nara-provider";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function PacientePlanScreen() {
  const store = useNaraStore();
  const router = useRouter();

  useEffect(() => {
    const u = store.session() as { id?: string; role?: string; roleId?: string } | null;
    const ok =
      !!u &&
      (u.roleId === "paciente" || /Paciente/i.test(u.role || ""));
    if (!ok) router.replace("/ingreso");
  }, [store, router]);

  const model = useMemo(() => {
    const A = store;
    const S = A.get();
    const u = A.session() as { id?: string } | null;
    const pid = u?.id || "oscar";
    const sessionUser = u as { id?: string; name?: string } | null;
    const P = (A.PATIENTS && (A.PATIENTS[pid] || A.PATIENTS.oscar)) || {
      name: sessionUser?.name || "Paciente",
      plan: [],
      ctx: { dano: 0, perdida: 0 },
    };
    const day = 86400000;
    const t0 = A.today0().getTime();
    const series = [
      {
        mark: "D",
        first: 2,
        every: 7,
        what: "La Dra. Marín lo visita en su casa, 10 de la mañana",
      },
      {
        mark: "L",
        first: 6,
        every: 7,
        what: "Llamada de seguimiento al celular de su vecina, 9 de la mañana",
      },
      {
        mark: "A",
        first: 7,
        every: 14,
        what: "Andrés lo visita y repasa esta hoja con usted",
      },
    ];
    const occ = (s: { first: number; every: number }, from: number, to: number) => {
      const out: number[] = [];
      let d = s.first;
      while (d > from) d -= s.every;
      for (; d <= to; d += s.every) if (d >= from) out.push(d);
      return out;
    };
    const upcoming = series
      .flatMap((s) => occ(s, 0, 21).slice(0, 1).map((o) => ({ o, s })))
      .sort((a, b) => a.o - b.o);
    const now = new Date(t0);
    const ref = new Date(t0 + (upcoming.length ? upcoming[0].o : 0) * day);
    const y = ref.getFullYear();
    const mo = ref.getMonth();
    const todayIn = now.getMonth() === mo && now.getFullYear() === y;
    const first = new Date(y, mo, 1);
    const lead = (first.getDay() + 6) % 7;
    const dim = new Date(y, mo + 1, 0).getDate();
    const dayOff = (dt: number) =>
      Math.round((new Date(y, mo, dt).getTime() - t0) / day);
    const marks: Record<number, string[]> = {};
    series.forEach((s) =>
      occ(s, dayOff(1), dayOff(dim)).forEach((o) => {
        const dt = new Date(t0 + o * day).getDate();
        (marks[dt] = marks[dt] || []).push(s.mark);
      }),
    );
    const cells: {
      n: string;
      marks: string[];
      bg: string;
      fw: number;
      fg: string;
    }[] = [];
    for (let i = 0; i < lead; i++)
      cells.push({ n: "", marks: [], bg: "#fff", fw: 400, fg: "#0F2D3B" });
    for (let d = 1; d <= dim; d++) {
      const isToday = todayIn && d === now.getDate();
      cells.push({
        n: String(d),
        marks: (marks[d] || []).map(
          (m) => ({ D: "D · Doctora", L: "L · Llamada", A: "A · Andrés" })[m] || m,
        ),
        bg: isToday ? "#E7FAF5" : "#fff",
        fw: isToday ? 700 : 500,
        fg: "#0F2D3B",
      });
    }
    while (cells.length % 7)
      cells.push({ n: "", marks: [], bg: "#fff", fw: 400, fg: "#0F2D3B" });
    const pr = S.oscarPlan && S.oscarPlan.printedAt;
    return {
      todayNote: todayIn
        ? "El día sombreado es el día en que se imprimió esta hoja."
        : "Este es el mes de sus próximas citas.",
      hasSocial: A.pathList(4, 0, null, P.ctx).some((x: { id: string }) => x.id === "social"),
      localLines: A.crisisLines("Calarcá")
        .slice(2)
        .map((l: { text: string }) => l.text),
      name: P.name,
      teamPhone: "606 741 2200",
      neighbor: "doña Ofelia, en la casa de al lado",
      nextAppts: upcoming.map(({ o, s }) => ({
        mark: s.mark,
        when: A.fmtDay(t0 + o * day, { wd: true, long: true }),
        what: s.what,
      })),
      monthTitle: `${MONTHS[mo]} de ${y}`,
      weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      cells,
      printedNote: pr
        ? `La última copia se imprimió el ${A.fmtDay(pr, { long: true })}.`
        : "",
    };
  }, [store]);

  const print = () => {
    store.set((s: { oscarPlan: { printedAt: number } }) => {
      s.oscarPlan = { printedAt: Date.now() };
    });
    setTimeout(() => window.print(), 50);
  };

  return (
    <div
      data-screen-label="Paciente · Plan impreso"
      style={{
        fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
        color: "#0F2D3B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        padding: "0 0 64px",
        minHeight: "100vh",
        background: "#F7F5EF",
      }}
    >
      <style>{`
        @page { size: letter; margin: 0 }
        @media print {
          body { background: #fff }
          [data-screen-label] { background: #fff !important; padding: 0 !important; gap: 0 !important }
          [data-noprint] { display: none !important }
          [data-page] { box-shadow: none !important; margin: 0 !important; break-after: page }
        }
      `}</style>

      <div data-noprint="1" style={{ width: "100%", background: "#fff", borderBottom: "1px solid #E5E0D5" }}>
        <div
          style={{
            maxWidth: 816,
            margin: "0 auto",
            padding: "0 16px",
            minHeight: 64,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0F2D3B" }}>
            <QuintiaLogo href={null} size={28} />
          </div>
          <span style={{ fontSize: 15, color: "#6B7280" }}>Mi plan impreso</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={print}
              style={{
                fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                fontSize: 17,
                fontWeight: 500,
                height: 48,
                padding: "0 22px",
                borderRadius: 14,
                border: "none",
                background: "#31C6E6",
                color: "#0F2D3B",
                cursor: "pointer",
              }}
            >
              Imprimir
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      <div
        data-noprint="1"
        style={{
          width: 816,
          maxWidth: "calc(100% - 32px)",
          fontSize: 16,
          color: "#0F2D3B",
          lineHeight: 1.5,
        }}
      >
        Esta es la hoja que Andrés le entrega en papel y repasa con usted en cada visita.{" "}
        {model.printedNote}
      </div>

      <div
        data-page="1"
        style={{
          width: 816,
          maxWidth: "100%",
          minHeight: 1056,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(22,20,19,.12), 0 24px 50px rgba(22,20,19,.30)",
          padding: "56px 64px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 30,
          fontSize: 24,
          lineHeight: 1.4,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            borderBottom: "3px solid #0F2D3B",
            paddingBottom: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 22, color: "#0F2D3B", fontWeight: 500 }}>Mi plan</span>
            <span
              style={{
                fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 46,
                lineHeight: 1.1,
              }}
            >
              {model.name}
            </span>
          </div>
          <QuintiaLogo href={null} size={40} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 32,
            }}
          >
            Su equipo
          </span>
          <span>
            <b style={{ fontWeight: 600 }}>Dra. Lucía Marín</b>, su psicóloga. Lo visita en su casa.
          </span>
          <span>
            <b style={{ fontWeight: 600 }}>Andrés Ocampo</b>, su acompañante de QUINTIA. Le trae esta hoja.
          </span>
          {model.hasSocial ? (
            <span>
              Andrés también le ayuda con los trámites de{" "}
              <b style={{ fontWeight: 600 }}>vivienda y reconstrucción</b>.
            </span>
          ) : null}
          <span
            style={{
              border: "3px solid #0F2D3B",
              borderRadius: 14,
              padding: "12px 18px",
              alignSelf: "flex-start",
            }}
          >
            Para llamarnos: <b style={{ fontWeight: 700 }}>{model.teamPhone}</b>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 32,
            }}
          >
            Sus próximas citas
          </span>
          {model.nextAppts.map(
            (n: { mark: string; when: string; what: string }, i: number) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span
                  style={{
                    flex: "none",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "3px solid #0F2D3B",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  {n.mark}
                </span>
                <span>
                  <b style={{ fontWeight: 600 }}>{n.when}</b> · {n.what}
                </span>
              </div>
            ),
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src="/quintia/tejiva/tejiva-base.svg"
              alt=""
              style={{ flex: "none", width: 56, height: "auto", display: "block" }}
            />
            <span
              style={{
                fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 32,
              }}
            >
              Qué hacer esta semana
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px minmax(0,1fr)",
              gap: 20,
              alignItems: "center",
            }}
          >
            <span />
            <span>
              <b style={{ fontWeight: 600 }}>Respirar despacio.</b> Tome aire por la nariz contando
              hasta 4. Suéltelo por la boca contando hasta 6. Hágalo 5 veces, en la mañana y antes de
              dormir.
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px minmax(0,1fr)",
              gap: 20,
              alignItems: "center",
            }}
          >
            <span />
            <span>
              <b style={{ fontWeight: 600 }}>Dormir a la misma hora.</b> Acuéstese y levántese a la
              misma hora todos los días. Si se despierta con miedo, siéntese, respire despacio y
              vuelva a acostarse.
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            border: "4px solid #B42318",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 32,
              color: "#8A1C14",
            }}
          >
            Si se siente en peligro
          </span>
          <span>
            Si está en peligro ahora: llame al{" "}
            <b style={{ fontWeight: 700, fontSize: 30 }}>123</b>. Mandan ayuda a su casa.
          </span>
          <span>
            Si necesita hablar con alguien: <b style={{ fontWeight: 700 }}>Línea 192, opción 4</b>.
          </span>
          {model.localLines.map((l: string, i: number) => (
            <span key={i}>{l}</span>
          ))}
          <span>
            También puede ir donde su vecina, <b style={{ fontWeight: 600 }}>{model.neighbor}</b>, y
            pedirle que llame a QUINTIA al {model.teamPhone}.
          </span>
        </div>
      </div>

      <div
        data-page="1"
        style={{
          width: 816,
          maxWidth: "100%",
          minHeight: 1056,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(22,20,19,.12), 0 24px 50px rgba(22,20,19,.30)",
          padding: "56px 64px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          fontSize: 22,
          lineHeight: 1.4,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: "3px solid #0F2D3B",
            paddingBottom: 14,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-texto), "Space Grotesk", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 40,
            }}
          >
            {model.monthTitle}
          </span>
          <span style={{ fontSize: 22 }}>{model.name}</span>
        </div>
        <div
          data-real-date="1"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,minmax(0,1fr))",
            borderTop: "2px solid #0F2D3B",
            borderLeft: "2px solid #0F2D3B",
          }}
        >
          {model.weekdays.map((w: string) => (
            <span
              key={w}
              style={{
                borderRight: "2px solid #0F2D3B",
                borderBottom: "2px solid #0F2D3B",
                padding: "8px 6px",
                fontWeight: 600,
                fontSize: 20,
                textAlign: "center",
                background: "#F7F5EF",
              }}
            >
              {w}
            </span>
          ))}
          {model.cells.map(
            (
              c: { n: string; marks: string[]; bg: string; fw: number; fg: string },
              i: number,
            ) => (
              <div
                key={i}
                style={{
                  borderRight: "2px solid #0F2D3B",
                  borderBottom: "2px solid #0F2D3B",
                  minHeight: 118,
                  padding: "6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  background: c.bg,
                  boxSizing: "border-box",
                }}
              >
                <span style={{ fontWeight: c.fw, fontSize: 24, color: c.fg }}>{c.n}</span>
                {c.marks.map((m, j) => (
                  <span key={j} style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
                    {m}
                  </span>
                ))}
              </div>
            ),
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Qué quiere decir cada letra</span>
          <span>
            <b style={{ fontWeight: 700 }}>D</b> · Visita de la Dra. Marín en su casa (cada semana)
          </span>
          <span>
            <b style={{ fontWeight: 700 }}>L</b> · Llamada de seguimiento al celular de su vecina
            (cada semana)
          </span>
          <span>
            <b style={{ fontWeight: 700 }}>A</b> · Visita de Andrés (cada 2 semanas)
          </span>
          <span style={{ marginTop: 10 }}>{model.todayNote}</span>
        </div>
      </div>
    </div>
  );
}
