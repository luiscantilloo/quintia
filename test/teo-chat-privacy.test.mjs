// Punto 5 · T4 (front): chat paciente sin PII hacia n8n.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ia = readFileSync(
  join(root, "src/modules/paciente/herramientas/tools/ia/IaPanel.tsx"),
  "utf8",
);
const paciente = readFileSync(
  join(root, "src/modules/paciente/app/usePacienteScreen.ts"),
  "utf8",
);
const redact = readFileSync(join(root, "src/lib/ai/redactForTeo.ts"), "utf8");
const store = readFileSync(join(root, "src/lib/store/store.js"), "utf8");

test("redactForTeo: teléfonos y correos", () => {
  assert.match(redact, /\[tel\]/);
  assert.match(redact, /\[correo\]/);
  assert.match(redact, /redactTextForTeo/);
});

test("IaPanel: no llama al webhook n8n ni envía patientName/age/place", () => {
  assert.doesNotMatch(ia, /polariatech\.app\.n8n\.cloud/);
  assert.match(ia, /\/api\/teo\/chat/);
  assert.match(ia, /redactTextForTeo/);
  const ask = ia.slice(ia.indexOf("async function askN8n"), ia.indexOf("async function send"));
  const payload = ask.slice(ask.indexOf("const payload"), ask.indexOf("};") + 2);
  assert.doesNotMatch(payload, /patientName/);
  assert.doesNotMatch(payload, /\bage\b/);
  assert.doesNotMatch(payload, /\bplace\b/);
  assert.match(payload, /profile/);
});

test("usePacienteScreen chat: payload sin patientName/age/place", () => {
  assert.match(paciente, /redactTextForTeo/);
  const chat = paciente.slice(paciente.indexOf("const cleanText"));
  assert.doesNotMatch(chat.slice(0, 800), /patientName:/);
  assert.doesNotMatch(chat.slice(0, 800), /\bage:/);
  assert.doesNotMatch(chat.slice(0, 800), /\bplace,/);
});

test("store crisis notifs: código, no nombre", () => {
  assert.match(store, /personCodeForAlert/);
  assert.match(store, /Nueva alerta de crisis: ' \+ codeLabel/);
  assert.doesNotMatch(store, /Nueva alerta de crisis: ' \+ a\.name/);
});
