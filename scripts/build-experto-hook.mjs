import fs from "fs";

const html = fs.readFileSync(
  "C:/Users/ll-lu/Videos/aliento-v1/src/modules/experto/screens/Experto.dc.html",
  "utf8",
);
const lines = html.split("\n");
const chunk = lines.slice(306, 628).join("\n");
const iScript = chunk.indexOf("const SCRIPT =");
const iRv = chunk.indexOf("_rv()");
if (iScript < 0 || iRv < 0) throw new Error("could not extract script block");
let body = chunk.slice(iScript);
body = body.replace(/\n  renderVals\(\) \{[^\n]*\}\n/, "\n");

body = body
  .replace(/\bthis\.state\b/g, "st")
  .replace(/\bthis\.setState\b/g, "setState")
  .replace(/\bthis\.ex\b/g, "ex")
  .replace(/\bthis\.scroll\b/g, "scrollRef")
  .replace(/\bthis\.chatBox\b/g, "chatRef")
  .replace(/\bthis\.canvas\b/g, "canvasRef.current")
  .replace(/\bthis\.visitStart\b/g, "visitStartRef.current")
  .replace(/\bthis\._short\b/g, "shortRef.current")
  .replace(/\bthis\._t\b/g, "toastTimerRef.current")
  .replace(/\bthis\./g, "")
  .replace(/\bAlientoStore\b/g, "store")
  .replace(/\bAlientoAI\b/g, "window.AlientoAI")
  .replace(/Admin\.dc\.html\?view=team/g, "/admin?view=team")
  .replace(/Clinico\.dc\.html\?pid=/g, "/clinico?pid=")
  .replace(/AdminExperto\.dc\.html\?e=/g, "/admin/experto?e=")
  .replace(/window\.store/g, "store")
  .replace(/_rv\(\)/, "rv()");

body = body.replace(/class Component extends DCLogic \{[\s\S]*?\n  go\(screen\)/, "\n  function go(screen)");
body = body.replace(/const blank =[\s\S]*?const OK_BG =[^\n]+\n\n/, "");

const methods = body
  .replace(/^const SCRIPT/m, "const SCRIPT")
  .split("\n")
  .map((line) => {
    if (/^  (go|flash|person|honor|startVisit|setItem|triggerCrisis|applyDrafts|async sendChat|coursePick|cpVals|erVals|calcResult|saveVisit|rv)\(/.test(line)) {
      return line.replace(/^  (async )?(\w+)\(/, "  function $1$2(");
    }
    return line;
  })
  .join("\n")
  .replace(/function async sendChat/g, "async function sendChat")
  .replace(
    /function applyDrafts\(list\)/,
    "function applyDrafts(list: [string, number, number][])",
  )
  .replace(
    /items\[sec\]\[i\] = \{ v, st \}/g,
    "items[sec][i] = { v, st: stItem }",
  )
  .replace(
    /function setItem\(sec, i, v, st\)/,
    "function setItem(sec: string, i: number, v: number, stItem: string)",
  )
  .replace(/const p = person\(\); const ex = ex;/, "const p = person();");

const header = fs.readFileSync(
  "C:/Users/ll-lu/Videos/aliento-v1/scripts/experto-hook-header.ts",
  "utf8",
);

const footer = `
  const v = useMemo(() => {
    if (!session) return null;
    return { ...rv(), ...erVals(), sigRef: sigInit, scrollRef, chatRef };
  }, [session, st, store, ex, sigInit]);

  return { v, session, ex };
}
`;

fs.writeFileSync(
  "C:/Users/ll-lu/Videos/aliento-v1/src/modules/experto/hooks/useExpertoScreen.ts",
  header + "\n" + methods + footer,
);
console.log("ok");
