import fs from "fs";
import path from "path";

const file = path.join(path.resolve(import.meta.dirname, ".."), "src/modules/admin/screens/AdminMainContent.tsx");
let s = fs.readFileSync(file, "utf8");

const loopVars = [
  "m", "l", "t", "tt", "e", "f", "r", "c", "cell", "row", "pt", "dq", "o", "q", "s", "b", "k", "p", "sv", "d", "ch", "it", "a", "z", "n", "x", "col", "ri", "di", "v2", "w", "g", "h", "f2", "e2", "m2", "r2", "c2", "p2", "s2", "b2", "k2", "l2", "t2", "o2", "q2", "v3", "u", "y", "i", "j",
];

for (const name of loopVars) {
  const re = new RegExp(`v\\.${name}\\.`, "g");
  s = s.replace(re, `${name}.`);
}

s = s.replace(/onClick="\{([^}]+)\}"/g, (_, expr) => {
  const e = expr.trim();
  if (e.includes(".go") || e.includes(".pick") || e.includes(".open") || e.includes(".toggle") || e.includes("Filter") || e.includes("Form") || e.includes("Agent") || e.includes("Terr") || e.includes("Exp") || e.includes("Path") || e.includes("Rules") || e.includes("send") || e.includes("save") || e.includes("clear") || e.includes("export") || e.includes("approve") || e.includes("reject") || e.includes("assign")) {
    return `onClick={() => ${e}()}`;
  }
  return `onClick={${e}}`;
});

s = s.replace(/onChange="\{([^}]+)\}"/g, "onChange={$1}");
s = s.replace(/onKeyDown="\{([^}]+)\}"/g, "onKeyDown={$1}");
s = s.replace(/value="\{([^}]+)\}"/g, "value={String($1 ?? \"\")}");
s = s.replace(/selected="\{([^}]+)\}"/g, "defaultValue={$1}");

s = s.replace(/style="([^"]*)"/g, (_, css) => {
  if (!css.includes("{")) {
    const parts = css.split(";").filter(Boolean);
    const entries = parts.map((p) => {
      const i = p.indexOf(":");
      const k = p.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const v = p.slice(i + 1).trim().replace(/'/g, "\\'");
      return `${k}: '${v}'`;
    });
    return `style={{ ${entries.join(", ")} }}`;
  }
  const tpl = css.replace(/\{([^}]+)\}/g, (_, expr) => `\${${expr}}`);
  return `style={ix\`${tpl.replace(/`/g, "\\`")}\`}`;
});

s = s.replace(/ \/>\/\>/g, " />");
s = s.replace(/<AgentPanel([^>]*)\/>/g, (m, attrs) => {
  let a = attrs
    .replace(/on-action="\{([^}]+)\}"/g, "onAction={$1}")
    .replace(/on-open-drawer="\{([^}]+)\}"/g, "onOpenDrawer={$1}")
    .replace(/on-close="\{([^}]+)\}"/g, "onClose={$1}")
    .replace(/initial-ask="\{([^}]+)\}"/g, "initialAsk={$1}")
    .replace(/context-label="\{([^}]+)\}"/g, "contextLabel={$1}")
    .replace(/context="\{([^}]+)\}"/g, "context={$1}")
    .replace(/hint-size="[^"]*"/g, "")
    .replace(/style="\{([^}]+)\}"/g, "style={$1}");
  return `<AgentPanel${a} />`;
});

s = s.replace(
  'import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";',
  'import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";\nimport { ix } from "./inlineStyle";',
);

s = s.replace(/<a href="/g, '<Link href="');
s = s.replace(/<\/a>/g, "</Link>");

fs.writeFileSync(file, s);
console.log("Postprocessed AdminMainContent.tsx");
