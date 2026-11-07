import { NARA_SERVICES } from "@/lib/nara-services";
import type { PathServiceRowModel } from "./types";

type Draft = { s: Record<string, string> };
type Colors = { verde: string; lineas: string; tinta: string; texto2: string };

/** Vacío: ya no hay servicios «Próximamente» en la matriz. */
export const PATH_SERVICES_LOCKED = new Set<string>();


/**
 * Arma las filas del editor de Rutas desde el catálogo por servicio
 * (`src/lib/nara-services/<id>.js`) + estado del borrador.
 */
export function buildPathServiceRows(
  dr: Draft,
  C: Colors,
  api: {
    setDraft: (code: string, fn: (d: Draft & { months?: number }) => void) => void;
    setState: (patch: Record<string, unknown>) => void;
  },
  pathCode: string,
): PathServiceRowModel[] {
  return NARA_SERVICES.map((sv) => {
    const on = !!(dr.s[sv.id] && String(dr.s[sv.id]).trim());
    return {
      id: sv.id,
      name: sv.name,
      note: sv.note || "",
      op: on ? 1 : 0.6,
      swBg: on ? C.verde : "#C4BDB3",
      x: on ? "25px" : "3px",
      cur: "pointer",
      locked: false,
      lockHint: undefined,
      toggle: () => {
        api.setDraft(pathCode, (d) => {
          // Apagado explícito (''): pathList no lo rellena desde el default.
          if (d.s[sv.id] && String(d.s[sv.id]).trim()) d.s[sv.id] = "";
          else d.s[sv.id] = sv.freqs[0] || "Activo";
        });
      },
      // IA / Analizador: solo interruptor; sin chips de frecuencia.
      // Apagado: ningún chip seleccionado (evita «2h» amarillo con toggle off).
      freqs: sv.id === "ia" || sv.id === "analizador"
        ? []
        : (sv.freqs || []).map((label) => {
            const sel = on && dr.s[sv.id] === label;
            return {
              label,
              bd: sel ? C.verde : C.lineas,
              bg: sel ? "#E7FAF5" : "#fff",
              fg: on ? C.tinta : C.texto2,
              pick: () => {
                api.setDraft(pathCode, (d) => {
                  d.s[sv.id] = label;
                });
              },
            };
          }),
      libBtn: null,
    };
  });
}
