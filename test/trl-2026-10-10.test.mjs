// Pruebas de las correcciones del front del reporte TRL 2026-10-10 (H-001 y H-011).
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// La API simulada registra cada PUT de /api/app-state.
const puts = [];
globalThis.__apiFetch = async (path, init = {}) => {
  if (init.method === 'PUT') puts.push(JSON.parse(init.body));
  const body = init.method === 'PUT' ? { ok: true } : { ok: true, slices: { notes: [{ pid: 'x' }] } };
  return { ok: true, json: async () => body };
};
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === '@/lib/api/client') {
      return { url: 'data:text/javascript,export const apiFetch=(...a)=>globalThis.__apiFetch(...a)', shortCircuit: true };
    }
    if (spec === '@/lib/db/appState') {
      return { url: 'data:text/javascript,export const APP_STATE_SLICES=["notes","alerts"]', shortCircuit: true };
    }
    return next(spec, ctx);
  },
});

// Un navegador mínimo: session() y login() solo necesitan `window`.
globalThis.window = new EventTarget();
const S = (await import('../src/lib/store/store.js')).default;
const P = await import('../src/lib/store/persist.js');

test('H-001: la sesión se mantiene aunque /api/accounts no traiga la cuenta propia', () => {
  const yo = { id: 'c1', name: 'Clínico', role: 'Clínico', roleId: 'clinico', terr: 'Bucaramanga', status: 'Activo', email: '' };
  S.set((s) => { s.accounts = [yo]; });
  S.login('c1', yo);
  assert.equal(S.session()?.roleId, 'clinico');
  // La lista filtrada que recibe el clínico solo trae cuentas de sus pacientes.
  S.set((s) => { s.accounts = [{ id: 'p9', role: 'Paciente', roleId: 'paciente', status: 'Activo' }]; });
  const u = S.session();
  assert.ok(u, 'la sesión no debe quedar en null');
  assert.equal(u.id, 'c1');
  assert.equal(u.href, '/clinico');
});

test('H-001: una cuenta inactiva no tiene sesión', () => {
  const inactivo = { id: 'c2', role: 'Clínico', roleId: 'clinico', status: 'Inactivo' };
  S.set((s) => { s.accounts = []; });
  S.login('c2', inactivo);
  assert.equal(S.session(), null);
});

test('H-011: sin cambios después de cargar no hay PUT; con un cambio, uno solo', async () => {
  const yo = { id: 'e1', role: 'Experto de campo', roleId: 'experto', terr: 'Bucaramanga', status: 'Activo' };
  S.login('e1', yo);
  P.pausePersist(false);
  await P.hydrateAppState(S);
  puts.length = 0;
  await P.flushPersist(S);
  assert.equal(puts.length, 0, 'recién cargado no debe escribir');
  S.set((s) => { s.notes = [...(s.notes || []), { pid: 'y' }]; });
  await P.flushPersist(S);
  await P.flushPersist(S);
  assert.equal(puts.length, 1, 'un cambio produce un solo PUT');
});

test('H-011: un cambio hecho con store.set se guarda solo (guardado automático con la sesión)', async () => {
  S.login('e1', { id: 'e1', role: 'Experto de campo', roleId: 'experto', terr: 'Bucaramanga', status: 'Activo' });
  P.pausePersist(false);
  await P.hydrateAppState(S);
  puts.length = 0;
  S.set((s) => { s.notes = [...(s.notes || []), { pid: 'auto' }]; });
  await new Promise((r) => setTimeout(r, 700)); // el guardado automático espera 450 ms
  assert.equal(puts.length, 1, 'store.set debe disparar un PUT sin llamar flushPersist a mano');
});

test('H-011: el observador y la carga sin sesión nunca escriben', async () => {
  puts.length = 0;
  S.login('o1', { id: 'o1', role: 'Observador', roleId: 'observador', status: 'Activo' });
  S.set((s) => { s.notes = [{ pid: 'z' }]; });
  await P.flushPersist(S);
  S.login(null);
  S.set((s) => { s.notes = [{ pid: 'w' }]; });
  await P.flushPersist(S);
  assert.equal(puts.length, 0);
});

test('H-011: el paciente solo envía sus propias entradas y nada que la API rechazaría', async () => {
  S.login('u-p1', { id: 'u-p1', role: 'Paciente', roleId: 'paciente', status: 'Activo', patientId: 'sm-1' });
  P.pausePersist(false);
  await P.hydrateAppState(S);
  puts.length = 0;
  // Un cambio en una porción que el paciente no escribe (notes) no produce PUT
  S.set((s) => { s.notes = [{ pid: 'otro' }]; });
  await P.flushPersist(S);
  assert.equal(puts.length, 0, 'sin PUT por porciones ajenas');
  // Su alerta sí se envía, sin las de otros
  S.set((s) => { s.alerts = [{ id: 'a1', pid: 'sm-1' }, { id: 'a2', pid: 'sm-9' }]; });
  await P.flushPersist(S);
  assert.equal(puts.length, 1);
  assert.deepEqual(Object.keys(puts[0].slices), ['alerts']);
  assert.deepEqual(puts[0].slices.alerts, [{ id: 'a1', pid: 'sm-1' }]);
});
