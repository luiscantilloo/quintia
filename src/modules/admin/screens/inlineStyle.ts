import type { CSSProperties } from "react";

/** Convierte estilo inline del prototipo (con expresiones ${}) a objeto React. */
export function ix(template: TemplateStringsArray, ...values: unknown[]): CSSProperties {
  const raw = template.reduce((acc, part, i) => acc + part + (i < values.length ? `__EXPR_${i}__` : ""), "");
  const out: Record<string, string | number> = {};
  for (const chunk of raw.split(";")) {
    const piece = chunk.trim();
    if (!piece) continue;
    const colon = piece.indexOf(":");
    if (colon < 0) continue;
    const key = piece.slice(0, colon).trim();
    let val = piece.slice(colon + 1).trim();
    val = val.replace(/__EXPR_(\d+)__/g, (_, i) => String(values[Number(i)] ?? ""));
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = val;
  }
  return out as CSSProperties;
}
