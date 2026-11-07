import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "src/modules/admin/screens/Admin.dc.html"), "utf8");
const body = html.match(
  /<div style="max-width:1440px;margin:0 auto;padding:28px 32px 56px[^>]*>([\s\S]*)<\/div>\s*<\/div>\s*<\/x-dc>/,
)?.[1];
if (!body) throw new Error("body not found");

let jsx = body;
jsx = jsx.replace(/src="marca\//g, 'src="/nara/marca/');
jsx = jsx.replace(/href="Informe\.dc\.html\?t=admin-weekly&amp;back=Admin\.dc\.html"/g, 'href="/informe?t=admin-weekly&back=/admin"');
jsx = jsx.replace(/<sc-if value="\{\{ ([^}]+) \}\}"[^>]*>/g, "{v.$1 && (");
jsx = jsx.replace(/<\/sc-if>/g, ")}");
jsx = jsx.replace(/<sc-for list="\{\{ ([^}]+) \}\}" as="([^"]+)"[^>]*>/g, "{v.$1?.map(($2) => (");
jsx = jsx.replace(/<\/sc-for>/g, "))}");
jsx = jsx.replace(/\{\{ ([^}]+) \}\}/g, "{v.$1}");
jsx = jsx.replace(/onClick="\{\{ ([^}]+) \}\}"/g, 'onClick={() => v.$1?.()}');
jsx = jsx.replace(/onChange="\{\{ ([^}]+) \}\}"/g, "onChange={v.$1}");
jsx = jsx.replace(/onKeyDown="\{\{ ([^}]+) \}\}"/g, "onKeyDown={v.$1}");
jsx = jsx.replace(/ value="\{\{ ([^}]+) \}\}"/g, " value={String(v.$1 ?? '')}");
jsx = jsx.replace(/style-hover="[^"]*"/g, "");
jsx = jsx.replace(/hint-placeholder-[^=]*="[^"]*"/g, "");
jsx = jsx.replace(/<dc-import name="AgentPanel"([^>]*)><\/dc-import>/g, "<AgentPanel$1 />");
jsx = jsx.replace(/<dc-import name="AgentPanel"([^/]*)\/>/g, "<AgentPanel$1 />");
jsx = jsx.replace(/role="admin"/g, 'role="admin"');
jsx = jsx.replace(/on-action="\{\{ agentAction \}\}"/g, "onAction={v.agentAction}");
jsx = jsx.replace(/on-open-drawer="\{\{ askFromHome \}\}"/g, "onOpenDrawer={v.askFromHome}");
jsx = jsx.replace(/on-close="\{\{ closeAgent \}\}"/g, "onClose={v.closeAgent}");
jsx = jsx.replace(/initial-ask="\{\{ pendingAsk \}\}"/g, "initialAsk={v.pendingAsk}");
jsx = jsx.replace(/context="\{\{ view \}\}"/g, 'context={v.view}');
jsx = jsx.replace(/context-label="\{\{ ctxLabel \}\}"/g, "contextLabel={v.ctxLabel}");
jsx = jsx.replace(/mode="([^"]+)"/g, 'mode="$1"');
jsx = jsx.replace(/<\/input>/g, "/>");
jsx = jsx.replace(/<input([^>]*)(?<!\/)>/g, "<input$1 />");

const out = `"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { AgentPanel } from "@/components/shared/agent-panel/AgentPanel";

export function AdminMainContent({ v }: { v: Record<string, any> }) {
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

fs.writeFileSync(path.join(root, "src/modules/admin/screens/AdminMainContent.tsx"), out);
console.log("Wrote AdminMainContent.tsx");
