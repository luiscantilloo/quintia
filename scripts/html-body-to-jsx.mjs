import fs from "fs";

const htmlPath = process.argv[2];
const html = fs.readFileSync(htmlPath, "utf8");
const bodyMatch = html.match(/<div data-screen-label="Experto"[\s\S]*<\/x-dc>/);
if (!bodyMatch) throw new Error("body not found");
let jsx = bodyMatch[0].replace(/<\/x-dc>$/, "");

jsx = jsx
  .replace(/<sc-if value="\{\{ ([^}]+) \}\}"[^>]*>/g, "{v.$1 ? (")
  .replace(/<\/sc-if>/g, ") : null}")
  .replace(/<sc-for list="\{\{ ([^}]+) \}\}" as="(\w+)"[^>]*>/g, "{v.$1?.map(($2) => (")
  .replace(/<\/sc-for>/g, "))}")
  .replace(/onClick="\{\{ ([^}]+) \}\}"/g, 'onClick={() => v.$1?.()}')
  .replace(/onChange="\{\{ ([^}]+) \}\}"/g, "onChange={v.$1}")
  .replace(/value="\{\{ ([^}]+) \}\}"/g, "value={v.$1 ?? ''}")
  .replace(/placeholder="\{\{ ([^}]+) \}\}"/g, "placeholder={v.$1}")
  .replace(/href="\{\{ ([^}]+) \}\}"/g, "href={v.$1}")
  .replace(/src="\{\{ ([^}]+) \}\}"/g, "src={v.$1}")
  .replace(/ref="\{\{ ([^}]+) \}\}"/g, "ref={v.$1}")
  .replace(/style="([^"]*\{\{[^"]*)"/g, (m) => {
    return (
      "style={{" +
      m
        .slice(7, -1)
        .replace(/\{\{ ([^}]+) \}\}/g, "$1")
        .split(";")
        .filter(Boolean)
        .map((p) => {
          const [k, val] = p.split(":").map((x) => x.trim());
          const ck = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          if (/^[#a-z(\d]/i.test(val)) return `${ck}: "${val.replace(/"/g, "")}"`;
          return `${ck}: ${val}`;
        })
        .join(", ") +
      "}}"
    );
  })
  .replace(/src="marca\//g, 'src="/nara/marca/')
  .replace(/<dc-import name="UserMenu"[^/]*\/>/g, '<UserMenu notifKey={v.ex} />')
  .replace(/<dc-import name="AgentPanel"[^>]*><\/dc-import>/g, "<AgentPanel role={v.agentRole} mode=\"drawer\" initialAsk={v.pendingAsk} contextLabel={v.agentCtx} onClose={v.closeAgent} />")
  .replace(/<img([^>]*)(?<!\/)>/g, "<img$1 />")
  .replace(/<input([^>]*)(?<!\/)>/g, "<input$1 />")
  .replace(/<textarea([^>]*)(?<!\/)>/g, "<textarea$1 />")
  .replace(/<polyline([^>]*)(?<!\/)>/g, "<polyline$1 />")
  .replace(/<canvas([^>]*)(?<!\/)>/g, "<canvas$1 />");

const out = `/* AUTO-GENERATED rough JSX — review */
export function ExpertoBody({ v }: { v: Record<string, unknown> }) {
  return (
    <>
${jsx
  .split("\n")
  .slice(0, -1)
  .map((l) => "      " + l)
  .join("\n")}
    </>
  );
}
`;
fs.writeFileSync(process.argv[3], out);
console.log("wrote", process.argv[3]);
