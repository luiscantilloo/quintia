/**
 * Smoke: cola offline quintia.partidas.pending → flush → gameLogs + clear.
 * No depende de Next aliases; replica el contrato de flushPartidasPendientes.
 */
import assert from "node:assert/strict";

const mem = new Map();
const localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

function flushPartidasPendientes(store) {
  let q = [];
  try {
    q = JSON.parse(localStorage.getItem("quintia.partidas.pending") || "[]");
  } catch {
    q = [];
  }
  if (!q.length) return 0;
  const pids = new Set();
  store.set((s) => {
    s.gameLogs = s.gameLogs || {};
    for (const ev of q) {
      const pid = String(ev.pid);
      pids.add(pid);
      const prev = Array.isArray(s.gameLogs[pid]) ? s.gameLogs[pid].slice() : [];
      if (prev.some((x) => x && x.id === ev.id)) continue;
      prev.push({ ...ev, offline: false, sync: true });
      s.gameLogs[pid] = prev;
    }
  });
  localStorage.removeItem("quintia.partidas.pending");
  store._flushedPids = [...pids];
  return q.length;
}

const state = { gameLogs: {} };
const store = {
  get: () => state,
  set: (fn) => fn(state),
  _flushedPids: [],
};

const pending = [
  {
    id: "SIM-offline-1",
    pid: "sm-acc-umw6t2u01",
    game: "simon",
    valor: 4,
    offline: true,
    sync: false,
  },
  {
    id: "FRU-offline-1",
    pid: "sm-acc-umw6t2u01",
    game: "frutas",
    valor: 220,
    offline: true,
    sync: false,
  },
  {
    id: "SIM-offline-1",
    pid: "sm-acc-umw6t2u01",
    game: "simon",
    valor: 4,
    offline: true,
    sync: false,
  }, // duplicado: no debe duplicar en gameLogs
];

localStorage.setItem("quintia.partidas.pending", JSON.stringify(pending));
const n = flushPartidasPendientes(store);

assert.equal(n, 3, "debe reportar 3 items en cola");
assert.equal(localStorage.getItem("quintia.partidas.pending"), null, "cola vacía");
const logs = state.gameLogs["sm-acc-umw6t2u01"];
assert.equal(logs.length, 2, "dedupe por id");
assert.ok(logs.every((e) => e.offline === false && e.sync === true));
assert.deepEqual(store._flushedPids, ["sm-acc-umw6t2u01"]);

// Segunda pasada sin cola
assert.equal(flushPartidasPendientes(store), 0);

console.log("OK smoke offline partidas:", {
  flushed: n,
  logs: logs.map((e) => ({ id: e.id, game: e.game, valor: e.valor, sync: e.sync })),
});
