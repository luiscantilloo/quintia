// Ítem #6: contrato de logs de integración (sin PII).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  join(root, "src/lib/observability/integration-log.ts"),
  "utf8",
);

test("integration-log web: solo metadatos, servicios gemini/n8n/osm", () => {
  assert.match(src, /"gemini" \| "n8n" \| "osm"/);
  assert.match(src, /kind: "integration"/);
  // El payload del log no incluye estos campos (pueden aparecer en comentarios).
  const payload = src.slice(src.indexOf("JSON.stringify"));
  assert.doesNotMatch(payload, /patientName|apiKey|Authorization|prompt:/);
});

test("integraciones cableadas: gemini, n8n (IaPanel), osm (mapa)", () => {
  const gemini = readFileSync(join(root, "src/lib/ai/gemini.ts"), "utf8");
  const ia = readFileSync(
    join(root, "src/modules/paciente/herramientas/tools/ia/IaPanel.tsx"),
    "utf8",
  );
  const map = readFileSync(
    join(root, "src/components/shared/visits-map/VisitsMapInner.tsx"),
    "utf8",
  );
  assert.match(gemini, /logIntegration/);
  assert.match(ia, /service: "n8n"/);
  assert.match(map, /service: "osm"/);
});
