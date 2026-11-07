import fs from "fs";

const html = fs.readFileSync(
  "C:/Users/ll-lu/Videos/aliento-v1/src/modules/clinico/screens/Clinico.dc.html",
  "utf8",
);
const lines = html.split("\n");
const chunk = lines.slice(214, 387).join("\n");
const iState = chunk.indexOf("state =");
const iRv = chunk.indexOf("_rv()");
if (iState < 0 || iRv < 0) throw new Error("missing clinico script");
let body = chunk.slice(0, chunk.lastIndexOf("\n  }\n") + 5);
body = body
  .replace(/class Component extends DCLogic \{[\s\S]*?state = /, "const INITIAL = ")
  .replace(/;\s*componentDidMount[\s\S]*?componentWillUnmount\(\) \{[\s\S]*?\}\s*/m, ";\n\n")
  .replace(/\bthis\.state\b/g, "st")
  .replace(/\bthis\.setState\b/g, "setState")
  .replace(/\bthis\./g, "")
  .replace(/\bAlientoStore\b/g, "store")
  .replace(/Admin\.dc\.html\?view=team/g, "/admin?view=team")
  .replace(/Admin\.dc\.html\?view=paths/g, "/admin?view=paths")
  .replace(/Admin\.dc\.html\?view=paths&tab=2/g, "/admin?view=paths&tab=2")
  .replace(/Clinico\.dc\.html\?pid=/g, "/clinico?pid=")
  .replace(/Clinico\.dc\.html\?view=/g, "/clinico?view=")
  .replace(/Experto\.dc\.html/g, "/experto")
  .replace(/Observador\.dc\.html/g, "/observador")
  .replace(/Informe\.dc\.html/g, "/admin/informes")
  .replace(/Informe\.dc\.html\?t=session-gloria&back=Clinico\.dc\.html/g, "/admin/informes?t=session-gloria")
  .replace(/location\.href = 'Informe\.dc\.html[^']*'/g, "/* report link */")
  .replace(/_rv\(\)/, "rv()")
  .replace(/\n  renderVals\(\) \{[^\n]*\}\n/, "\n");

const header = `"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireSession } from "@/hooks/useRequireSession";
import { useNaraStore } from "@/providers/nara-provider";

export function useClinicoScreen() {
  const store = useNaraStore();
  const session = useRequireSession(["lucia"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [st, setStateRaw] = useState<any>(() => ({
    view: "home",
    agentOpen: false,
    pid: "gloria",
    outcome: {},
    copied: "",
    note: "",
    refInst: "hsal",
    refReason: "Insomnio que no cede después de las réplicas. Considerar medicación.",
    refErr: false,
    msg: "",
    zoom: 1,
    pendingAsk: "",
    fileFrom: null,
    asg: null,
  }));
  const setState = useCallback((u: any) => {
    setStateRaw((prev: any) => ({ ...prev, ...(typeof u === "function" ? u(prev) : u) }));
  }, []);

  useEffect(() => {
    const onR = () => setState({ zoom: Math.min(1, window.innerWidth / 1024) });
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [setState]);

  useEffect(() => {
    const v0 = searchParams.get("view");
    const p0 = searchParams.get("pid");
    if (v0) setState({ view: v0 });
    if (p0) setState({ view: "file", pid: p0 });
  }, [searchParams, setState]);

`;

const footer = `
  const v = useMemo(() => {
    if (!session) return null;
    const base = rv();
    const asPart = asVals(store, store.get(), st);
    return { ...base, ...asPart };
  }, [session, st, store]);

  return { v, session, setState, router };
}
`;

let methods = body
  .split("\n")
  .map((line) => {
    if (/^  (openFile|recFile|asVals|rv)\(/.test(line))
      return line.replace(/^  (\w+)\(/, "  function $1(");
    if (/^  (openFile|recFile)/.test(line)) return line;
    return line;
  })
  .join("\n");

methods = methods.replace(/function asVals\(A, S, st\)/, "function asVals(A: any, S: any, st: any)");

fs.writeFileSync(
  "C:/Users/ll-lu/Videos/aliento-v1/src/modules/clinico/hooks/useClinicoScreen.ts",
  header + methods + footer,
);
console.log("clinico hook written");
