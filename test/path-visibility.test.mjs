import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filtrarModulosSinJuegos,
  filtrarRutaSinJuegos,
  roleOcultaJuegos,
} from "../src/lib/nara-services/pathVisibility.js";

const RUTA = [
  { id: "mood", name: "Ánimo" },
  { id: "juegos", name: "Juegos" },
];

test("experto y cuidador no ven juegos en la ruta", () => {
  assert.equal(roleOcultaJuegos("experto"), true);
  assert.equal(roleOcultaJuegos("cuidador"), true);
  assert.deepEqual(filtrarRutaSinJuegos(RUTA, "experto"), [RUTA[0]]);
  assert.deepEqual(filtrarModulosSinJuegos(["mood", "juegos"], "cuidador"), ["mood"]);
});

test("clínico y paciente siguen viendo juegos si están en la ruta", () => {
  assert.equal(roleOcultaJuegos("clinico"), false);
  assert.equal(roleOcultaJuegos("paciente"), false);
  assert.deepEqual(filtrarRutaSinJuegos(RUTA, "clinico"), RUTA);
});
