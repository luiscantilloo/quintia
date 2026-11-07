/** Rutas del shell experto (paths reales, sin screen interno oculto). */
export const EXPERTO_ROUTES = {
  list: "/experto",
  nueva: "/experto/nueva",
} as const;

export function expertoPathForScreen(
  screen: string,
  opts?: { pid?: string | null; newForm?: boolean },
): string {
  if (opts?.newForm || screen === "nueva") return EXPERTO_ROUTES.nueva;
  const pid = opts?.pid ? encodeURIComponent(String(opts.pid)) : "";
  if (screen === "consent" && pid) {
    return `/experto/visita/${pid}/consentimiento`;
  }
  if (screen === "eval" && pid) {
    return `/experto/visita/${pid}/evaluacion`;
  }
  if (screen === "result" && pid) {
    return `/experto/visita/${pid}/resultado`;
  }
  return EXPERTO_ROUTES.list;
}

export function expertoScreenForPath(pathname: string): {
  screen: string;
  pid?: string;
  newForm?: boolean;
} {
  const base = pathname.replace(/\/$/, "") || "/experto";
  if (base === "/experto/nueva") return { screen: "list", newForm: true };
  const m = base.match(
    /^\/experto\/visita\/([^/]+)\/(consentimiento|evaluacion|resultado)$/,
  );
  if (m) {
    const pid = decodeURIComponent(m[1]);
    const step = m[2];
    const screen =
      step === "consentimiento"
        ? "consent"
        : step === "evaluacion"
          ? "eval"
          : "result";
    return { screen, pid };
  }
  return { screen: "list" };
}
