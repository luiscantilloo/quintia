import fs from "fs";

const html = fs.readFileSync(
  "C:/Users/ll-lu/Videos/aliento-v1/src/modules/experto/screens/Experto.dc.html",
  "utf8",
);
const i0 = html.indexOf("const SCRIPT =");
const i1 = html.indexOf("renderVals()");
let body = html.slice(i0, i1);
body = body.replace(/class Component extends DCLogic[\s\S]*?constructor\(p\) \{[\s\S]*?this\.ex = e;/, (m) =>
  m.replace(/class Component extends DCLogic[\s\S]*?this\.ex = e;/, ""),
);
// Take from SCRIPT to saveVisit end
const j = body.lastIndexOf("saveVisit() {");
const k = body.indexOf("  }", body.indexOf("this.flash", j)) + 4;
body = body.slice(0, k);

const out = `/* eslint-disable @typescript-eslint/no-explicit-any */
/** Ported from Experto.dc.html — keep in sync with mockup logic */
${body.replace(/this\.ex/g, "this.ex").replace(/AlientoStore/g, "store")}

export function createExpertoController(ctx: {
  ex: string;
  getState: () => any;
  setState: (u: any) => void;
  refs: { visitStart: { current: number }; canvas: { current: HTMLCanvasElement | null }; short: { current: number }; toastTimer: { current: ReturnType<typeof setTimeout> | null } };
  store: any;
}) {
  const ctrl: any = { ex: ctx.ex, get state() { return ctx.getState(); }, setState: ctx.setState, ...ctx.refs };
  ctrl.store = ctx.store;
  // methods attached below by eval of ported class prototype — placeholder
  return ctrl;
}
`;
fs.writeFileSync(
  "C:/Users/ll-lu/Videos/aliento-v1/src/modules/experto/hooks/experto-controller.stub.ts",
  out,
);
console.log("stub bytes", out.length);
