/** Ciclo de aviso del analizador: abierto → tomado → cerrado (como crisis, sin rojo). */

export function tomarAviso(store, avisoId, quien) {
  const now = Date.now();
  store.set((s) => {
    s.avisos = (s.avisos || []).map((a) => {
      if (a.id !== avisoId) return a;
      if (a.estado !== "abierto") return a;
      return {
        ...a,
        estado: "tomado",
        tomadoPor: quien || "Clínico",
        tomadoAt: now,
        historia: [...(a.historia || []), { at: now, tipo: "tomado", quien }],
      };
    });
  });
}

export function decidirAviso(store, avisoId, decision) {
  const now = Date.now();
  const { tipo, nota, quien } = decision || {};
  store.set((s) => {
    s.avisos = (s.avisos || []).map((a) => {
      if (a.id !== avisoId) return a;
      if (a.estado === "cerrado") return a;
      return {
        ...a,
        estado: "cerrado",
        closedAt: now,
        decision: { tipo: tipo || "seguir", nota: nota || "", quien },
        historia: [
          ...(a.historia || []),
          { at: now, tipo: "cerrado", decision: tipo, nota, quien },
        ],
      };
    });
    // Timeline en ficha
    const a = (s.avisos || []).find((x) => x.id === avisoId);
    if (a?.pid) {
      s.analizadorByPid = s.analizadorByPid || {};
      const snap = s.analizadorByPid[a.pid] || { pid: a.pid };
      const decs = Array.isArray(snap.decisiones) ? snap.decisiones.slice() : [];
      decs.push({
        at: now,
        tipo: tipo || "seguir",
        nota: nota || "",
        quien,
        avisoId,
      });
      s.analizadorByPid[a.pid] = { ...snap, decisiones: decs };
    }
  });
}

export const DECISIONES = [
  { id: "seguir", label: "Sin cambios · seguir observando" },
  { id: "repetir", label: "Repetir la medición" },
  { id: "ajustar", label: "Ajustar la ruta" },
  { id: "remitir", label: "Remitir a valoración" },
  { id: "otra", label: "Otra (con nota)" },
];
