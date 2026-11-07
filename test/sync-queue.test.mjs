// R-04 / TRL 5.16: reglas de cola offline (sin IndexedDB; solo contratos exportables).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/offline/sync-queue.ts"), "utf8");

test("cola offline: soporta POST de recursos y PUT de app-state", () => {
  assert.match(src, /export type QueueKind/);
  assert.match(src, /"app-state"/);
  assert.match(src, /method: "POST" \| "PUT"/);
  assert.match(src, /export async function putAppStateOrQueue/);
  assert.match(src, /export async function enqueueAppState/);
  assert.match(src, /\/api\/app-state/);
});

test("cola offline: 4xx de validación no se encola; red caída sí", () => {
  assert.match(src, /r\.status >= 400 && r\.status < 500 && r\.status !== 408/);
  assert.match(src, /if \(!isBrowserOnline\(\)\)/);
  assert.match(src, /return "queued"/);
});

test("experto: guardar visita usa putAppStateOrQueue (consentimiento offline)", () => {
  const hook = readFileSync(
    join(root, "src/modules/experto/hooks/useExpertoScreen.ts"),
    "utf8",
  );
  assert.match(hook, /putAppStateOrQueue/);
  assert.match(hook, /consents:\$\{personId\}/);
  assert.match(hook, /OFFLINE_KEEP_MSG/);
  // No debe quedar el bucle fetch/retry que bloqueaba la visita sin red.
  assert.doesNotMatch(
    hook,
    /No se pudo guardar el consentimiento en el servidor\. Revise la señal y toque/,
  );
});
