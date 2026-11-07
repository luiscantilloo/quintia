import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "src/modules/admin/screens/Admin.dc.html"), "utf8");
const m = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*)<\/script>/);
if (!m) throw new Error("script not found");
let js = m[1];
js = js.replace(/^const TERR = [\s\S]*?^const NOTES = \{[\s\S]*?\};\n/m, "");
js = js.replace(
  /class Component extends DCLogic \{\s*state = \{[\s\S]*?\};\s*/,
  "",
);
js = js.replace(/\n  componentDidMount\(\)[\s\S]*?\n  componentWillUnmount\(\)[^\n]*\n/, "\n");
js = js.replace(/  go\(view, extra\) \{[\s\S]*?\n  \}\n/, "");
js = js.replace(
  /  draft\(code\) \{[\s\S]*?\n  \}\n  setDraft\(code, fn\) \{[\s\S]*?\n  \}\n/,
  "",
);
js = js.replace(/this\.state/g, "st");
js = js.replace(/this\.setState\(/g, "api.setState(");
js = js.replace(/this\.go\(/g, "api.go(");
js = js.replace(/this\.draft\(/g, "api.draft(");
js = js.replace(/this\.setDraft\(/g, "api.setDraft(");
js = js.replace(/this\.moreVals/g, "moreVals");
js = js.replace(/this\.rulesVals/g, "rulesVals");
js = js.replace(/this\.perfVals/g, "perfVals");
js = js.replace(/this\.libVals/g, "libVals");
js = js.replace(/  (perfVals|rulesVals|moreVals|libVals)\(/g, "  function $1(");
js = js.replace(
  /const A = window\.AlientoStore; if \(!A\) return \{\};\s*const S = A\.get\(\); const C = A\.C; const st = st;/,
  "const S = A.get(); const C = A.C;",
);
js = js.replace(/AlientoStore\./g, "A.");
js = js.replace(
  /location\.href = 'AdminTerritorio\.dc\.html\?t=' \+ encodeURIComponent\(([^)]+)\)/g,
  "api.router.push('/admin/territorio?t=' + encodeURIComponent($1))",
);
js = js.replace(
  /location\.href = 'AdminExperto\.dc\.html\?e=' \+ encodeURIComponent\(([^)]+)\)/g,
  "api.router.push('/admin/experto?e=' + encodeURIComponent($1))",
);
js = js.replace(
  /location\.href = 'AdminActivos\.dc\.html\?t=' \+ encodeURIComponent\(([^)]+)\) \+ '&k=manilla'/g,
  "api.router.push('/admin/activos?t=' + encodeURIComponent($1) + '&k=manilla')",
);
js = js.replace(
  /location\.href = 'AdminActivos\.dc\.html\?t=' \+ encodeURIComponent\(([^)]+)\) \+ '&k=tablet'/g,
  "api.router.push('/admin/activos?t=' + encodeURIComponent($1) + '&k=tablet')",
);
js = js.replace(
  /location\.href = 'AdminPersona\.dc\.html\?c=' \+ p\.code/g,
  "api.router.push('/admin/persona?c=' + p.code)",
);
js = js.replace(/location\.href = 'AdminUsuarios\.dc\.html'/g, "api.router.push('/admin/usuarios')");
js = js.replace(/location\.href = 'AdminInformes\.dc\.html'/g, "api.router.push('/admin/informes')");
js = js.replace(
  /location\.href = 'Informe\.dc\.html\?id=' \+ p \+ '&back=Admin\.dc\.html'/g,
  "api.router.push('/informe?id=' + p + '&back=/admin')",
);
js = js.replace(/'Clinico\.dc\.html\?view=approvals'/g, "'/clinico?view=approvals'");
js = js.replace(/'Admin\.dc\.html\?view=paths'/g, "'/admin?view=paths'");
js = js.replace(/'Experto\.dc\.html'/g, "'/experto'");

const body = `export function buildAdminModel(A: any, st: AdminUiState, api: AdminModelApi) {
  function draft(code: string) {
    if (st.drafts[code]) return st.drafts[code];
    const { r, d } = A.parseCode(code);
    const S0 = A.get();
    const p = (S0.pathOverrides && S0.pathOverrides[code]) || A.defaultPath(r, d);
    return { s: Object.assign({}, p.s), months: p.months };
  }
  function setDraft(code: string, fn: (d: { s: Record<string, string>; months: number }) => void) {
    const d = JSON.parse(JSON.stringify(draft(code)));
    fn(d);
    api.setState({ drafts: Object.assign({}, st.drafts, { [code]: d }) });
  }
  api.draft = draft;
  api.setDraft = setDraft;

${js.replace(/^\s*renderVals\(\) \{/, "  function renderVals() {").replace(/\n\}\s*$/, "\n  return renderVals();\n}\n")}`;

const out = `/* eslint-disable @typescript-eslint/no-explicit-any */
// Auto-ported from Admin.dc.html — keep in sync with prototype logic.
import { CHECKS, EXPERTS, NOTES, TERR, type AdminUiState } from "./adminConstants";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export type AdminModelApi = {
  setState: (patch: Partial<AdminUiState> | ((s: AdminUiState) => AdminUiState)) => void;
  go: (view: string, extra?: Partial<AdminUiState>) => void;
  draft: (code: string) => { s: Record<string, string>; months: number };
  setDraft: (code: string, fn: (d: { s: Record<string, string>; months: number }) => void) => void;
  router: AppRouterInstance;
};

${body}
`;

fs.writeFileSync(path.join(root, "src/modules/admin/screens/adminModel.ts"), out);
console.log("Wrote adminModel.ts");
