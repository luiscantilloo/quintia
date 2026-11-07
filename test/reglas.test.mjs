// Pruebas de las reglas clínicas de src/lib/store/store.js (matriz v2) — SPEC-10 FR-10.1.
// Se prueba el store real; solo persist.js (que depende de alias de Next) se reemplaza por un módulo vacío.
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === './persist.js') return { url: 'data:text/javascript,export const schedulePersist=()=>{}', shortCircuit: true };
    return next(spec, ctx);
  },
});
const S = (await import('../src/lib/store/store.js')).default;

test('cortes de riesgo del PHQ-9 (0–4, 5–9, 10–14, 15–19, 20–27)', () => {
  const casos = [[0, 0], [4, 0], [5, 1], [9, 1], [10, 2], [14, 2], [15, 3], [19, 3], [20, 4], [27, 4]];
  for (const [total, r] of casos) assert.equal(S.riskIdx(total), r, `PHQ ${total}`);
});

test('cortes de capacidad digital (0–4 Baja, 5–8 Media, 9–11 Alta)', () => {
  const casos = [[0, 0], [4, 0], [5, 1], [8, 1], [9, 2], [11, 2]];
  for (const [total, d] of casos) assert.equal(S.digIdx(total), d, `digital ${total}`);
});

test('perfil = riesgo × 3 + digital + 1 → P01 a P15', () => {
  assert.equal(S.code(0, 0), 'P01');
  assert.equal(S.code(2, 1), 'P08');
  assert.equal(S.code(4, 2), 'P15');
  const todos = new Set();
  for (let r = 0; r < 5; r++) for (let d = 0; d < 3; d++) todos.add(S.code(r, d));
  assert.equal(todos.size, 15);
});

test('duración de la ruta por riesgo: 3, 3, 6, 12, 12 meses', () => {
  const meses = [0, 1, 2, 3, 4].map((r) => S.defaultPath(r, 2).months);
  assert.deepEqual(meses, [3, 3, 6, 12, 12]);
});

test('psicólogo clínico: Mensual en Moderado, Quincenal en Moderado-severo, Semanal en Severo', () => {
  assert.equal(S.defaultPath(2, 0).s.clin, 'Mensual');
  assert.equal(S.defaultPath(3, 0).s.clin, 'Quincenal');
  assert.equal(S.defaultPath(4, 0).s.clin, 'Semanal');
});

test('estado de ánimo en la app solo con capacidad Alta', () => {
  for (let r = 0; r < 5; r++) {
    assert.equal(S.defaultPath(r, 2).s.mood, 'Diario', `riesgo ${r} Alta`);
    assert.equal(S.defaultPath(r, 0).s.mood, undefined, `riesgo ${r} Baja`);
  }
});

test('la pregunta 9 tiene redacción fija', () => {
  assert.match(String(S.Q9_EXACT), /mejor muert/);
});

test('rutas de 3 servicios por perfil (matriz v2 + decisión del 2026-10-09)', () => {
  const esperado = {
    P01: { clin: 'Mensual' }, P02: { ia: 'Acceso libre' }, P03: { mood: 'Diario', ia: 'Acceso libre' },
    P04: { clin: 'Mensual' }, P05: { ia: 'Acceso libre' }, P06: { mood: 'Diario', ia: 'Acceso libre' },
    P07: { clin: 'Mensual' }, P08: { clin: 'Mensual', ia: 'Entre sesiones' }, P09: { mood: 'Diario', clin: 'Mensual', ia: 'Entre sesiones' },
    P10: { clin: 'Quincenal' }, P11: { clin: 'Quincenal', ia: 'Entre sesiones' }, P12: { mood: 'Diario', clin: 'Quincenal', ia: 'Entre sesiones' },
    P13: { clin: 'Semanal' }, P14: { clin: 'Semanal' }, P15: { mood: 'Diario', clin: 'Semanal' },
  };
  for (let r = 0; r < 5; r++) for (let d = 0; d < 3; d++) {
    const c = S.code(r, d);
    assert.deepEqual(S.defaultPath(r, d).s, esperado[c], c);
  }
});
