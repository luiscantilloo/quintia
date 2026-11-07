import fs from "fs";

const [htmlPath, outPath, label] = process.argv.slice(2);
const html = fs.readFileSync(htmlPath, "utf8");
const re = new RegExp(`<div data-screen-label="${label}"[\\s\\S]*?(?=</x-dc>)`);
const m = html.match(re);
if (!m) throw new Error("no match");
let jsx = m[0];
jsx = jsx
  .replace(/<helmet>[\s\S]*?<\/helmet>/g, "")
  .replace(/<sc-if value="\{\{ ([^}]+) \}\}"[^>]*>/g, (_, k) => `{v.${k.trim()} && (`)
  .replace(/<sc-for list="\{\{ ([^}]+) \}\}" as="(\w+)"[^>]*>/g, (_, list, as) => `{v.${list.trim()}?.map((${as}: any) => (`)
  .replace(/<\/sc-if>/g, ")}")
  .replace(/<\/sc-for>/g, "))}")
  .replace(/onClick="\{\{ ([^}]+) \}\}"/g, "onClick={() => { const fn = $1; typeof fn === 'function' && fn(); }}")
  .replace(/onChange="\{\{ ([^}]+) \}\}"/g, "onChange={$1}")
  .replace(/\{\{ ([^}]+) \}\}/g, "{($1)}")
  .replace(/src="marca\//g, 'src="/nara/marca/')
  .replace(/<dc-import name="UserMenu"[^/]*\/>/g, '<UserMenu notifKey={String(v.ex)} />')
  .replace(
    /<dc-import name="AgentPanel" role="\{\{ agentRole \}\}" mode="drawer"[^/]*\/>/g,
    '<AgentPanel role={String(v.agentRole)} mode="drawer" initialAsk={String(v.pendingAsk || "")} contextLabel={String(v.agentCtx || "")} onClose={() => v.closeAgent?.()} />',
  )
  .replace(/style="([^"]*)"/g, (_, s) => {
    const parts = s.split(";").filter(Boolean);
    const obj = parts
      .map((p) => {
        const idx = p.indexOf(":");
        const k = p.slice(0, idx).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        let val = p.slice(idx + 1).trim();
        if (/^\{\{/.test(val)) val = val.replace(/\{\{ ([^}]+) \}\}/, "$1");
        if (/^[\d#(]/.test(val) || val.startsWith("inset") || val.includes("px") || val.includes("%"))
          return `${k}: ${JSON.stringify(val.replace(/^['"]|['"]$/g, ""))}`;
        return `${k}: ${val}`;
      })
      .join(", ");
    return `style={{ ${obj} }}`;
  })
  .replace(/<img([^>]*?)(?<!\/)>/g, "<img$1 />")
  .replace(/<input([^>]*?)(?<!\/)>/g, "<input$1 />")
  .replace(/<textarea([^>]*?)(?<!\/)>/g, "<textarea$1 />")
  .replace(/<polyline([^>]*?)(?<!\/)>/g, "<polyline$1 />")
  .replace(/<canvas([^>]*?)(?<!\/)>/g, "<canvas$1 />");

const out = `/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";

export function ExpertoBody({ v }: { v: any }) {
  return (
    <>
${jsx
  .split("\n")
  .map((l) => "      " + l)
  .join("\n")}
    </>
  );
}
`;
fs.writeFileSync(outPath, out);
console.log("written", outPath);
