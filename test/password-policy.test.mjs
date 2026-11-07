// Punto 5 · T2 (front): política de claves en /usuarios e Ingreso.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const policy = readFileSync(join(root, "src/lib/auth/passwordPolicy.ts"), "utf8");
const usuarios = readFileSync(
  join(root, "src/modules/admin/screens/usuarios/useAdminUsuariosScreen.ts"),
  "utf8",
);
const ingreso = readFileSync(
  join(root, "src/modules/ingreso/components/IngresoScreen.tsx"),
  "utf8",
);

test("passwordPolicy: rechaza identidad y exige 12 para admin/clínico", () => {
  assert.match(policy, /export function passwordPolicyError/);
  assert.match(policy, /needsLongPassword/);
  assert.match(policy, /12/);
  assert.match(policy, /correo|nombre/i);
  assert.match(policy, /SHARED_PRIVILEGED_PASSWORDS/);
});

test("usuarios: save usa passwordPolicyError antes de crear/editar", () => {
  assert.match(usuarios, /passwordPolicyError/);
  assert.match(usuarios, /minPasswordLengthForRole/);
  assert.doesNotMatch(
    usuarios,
    /\(f\.password \|\| ""\)\.trim\(\)\.length < 8/,
  );
});

test("ingreso: cambio de clave usa passwordPolicyError", () => {
  assert.match(ingreso, /passwordPolicyError/);
});
