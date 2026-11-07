/** Cola IndexedDB para POST/PUT de experto sin red (TRL 5.16 / 6.26 / R-04). */

export type QueueKind =
  | "people"
  | "worklists"
  | "patients"
  | "flags"
  | "app-state";

export type QueueItem = {
  /** Id idempotente del recurso (mismo body.id o clave de slice). */
  id: string;
  kind: QueueKind;
  url: string;
  method: "POST" | "PUT";
  body: Record<string, unknown>;
  createdAt: number;
};

const DB_NAME = "nara-offline-v1";
const STORE = "queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("tx"));
    tx.onabort = () => reject(tx.error || new Error("abort"));
  });
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

async function putQueueItem(item: QueueItem): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(item);
  await txDone(tx);
  db.close();
}

export async function enqueueOffline(
  kind: QueueKind,
  body: Record<string, unknown>,
): Promise<void> {
  const resourceId = String(body.id || "").trim();
  if (!resourceId) throw new Error("Falta id idempotente para la cola offline.");
  await putQueueItem({
    id: `${kind}:${resourceId}`,
    kind,
    url: `/api/${kind}`,
    method: "POST",
    body: { ...body, id: resourceId },
    createdAt: Date.now(),
  });
}

/** Encola un PUT a /api/app-state (p. ej. consents de la visita). */
export async function enqueueAppState(
  slices: Record<string, unknown>,
  idempotentKey: string,
): Promise<void> {
  const key = String(idempotentKey || "").trim();
  if (!key) throw new Error("Falta clave idempotente para app-state offline.");
  await putQueueItem({
    id: `app-state:${key}`,
    kind: "app-state",
    url: "/api/app-state",
    method: "PUT",
    body: { slices },
    createdAt: Date.now(),
  });
}

export async function listOfflineQueue(): Promise<QueueItem[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).getAll();
  const rows = await new Promise<QueueItem[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result || []) as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return rows.map((row) => ({
    ...row,
    method: row.method === "PUT" ? "PUT" : "POST",
  }));
}

export async function pendingOfflineCount(): Promise<number> {
  const rows = await listOfflineQueue();
  return rows.length;
}

async function removeQueued(key: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(key);
  await txDone(tx);
  db.close();
}

function appStateAccepted(r: Response, j: { descartados?: { apartado: string }[] }) {
  if (!r.ok) return false;
  return !(j.descartados || []).some((d) => d.apartado === "consents");
}

/** Reintenta todos los pendientes. Upsert por id en el servidor evita duplicados. */
export async function flushOfflineQueue(): Promise<{
  ok: number;
  fail: number;
}> {
  if (!isBrowserOnline()) return { ok: 0, fail: 0 };
  const rows = await listOfflineQueue();
  let ok = 0;
  let fail = 0;
  for (const item of rows) {
    try {
      const r = await fetch(item.url, {
        credentials: "same-origin",
        method: item.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (item.kind === "app-state") {
        const j = (await r.json().catch(() => ({}))) as {
          descartados?: { apartado: string }[];
        };
        if (!appStateAccepted(r, j)) throw new Error(String(r.status));
      } else if (!r.ok) {
        throw new Error(String(r.status));
      }
      await removeQueued(item.id);
      ok += 1;
    } catch {
      fail += 1;
    }
  }
  return { ok, fail };
}

/**
 * POST inmediato; si no hay red o falla la petición, encola y devuelve `queued`.
 * No lanza: el llamador decide si navegar.
 */
export async function postOrQueue(
  kind: Exclude<QueueKind, "app-state">,
  body: Record<string, unknown>,
): Promise<"ok" | "queued" | "error"> {
  const resourceId = String(body.id || "").trim();
  if (!resourceId) return "error";
  const payload = { ...body, id: resourceId };

  if (!isBrowserOnline()) {
    try {
      await enqueueOffline(kind, payload);
      return "queued";
    } catch {
      return "error";
    }
  }

  try {
    const r = await fetch(`/api/${kind}`, {
      credentials: "same-origin",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) return "ok";
    // 4xx de validación: no encolar (el usuario debe corregir).
    if (r.status >= 400 && r.status < 500 && r.status !== 408) return "error";
    await enqueueOffline(kind, payload);
    return "queued";
  } catch {
    try {
      await enqueueOffline(kind, payload);
      return "queued";
    } catch {
      return "error";
    }
  }
}

/**
 * PUT /api/app-state; sin red o fallo de red → cola IndexedDB.
 * 4xx de política (p. ej. consentimiento descartado) → error sin encolar.
 */
export async function putAppStateOrQueue(
  slices: Record<string, unknown>,
  idempotentKey: string,
): Promise<"ok" | "queued" | "error"> {
  const key = String(idempotentKey || "").trim();
  if (!key) return "error";
  const body = { slices };

  if (!isBrowserOnline()) {
    try {
      await enqueueAppState(slices, key);
      return "queued";
    } catch {
      return "error";
    }
  }

  try {
    const r = await fetch("/api/app-state", {
      credentials: "same-origin",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as {
      descartados?: { apartado: string }[];
    };
    if (appStateAccepted(r, j)) return "ok";
    if (r.status >= 400 && r.status < 500 && r.status !== 408) return "error";
    await enqueueAppState(slices, key);
    return "queued";
  } catch {
    try {
      await enqueueAppState(slices, key);
      return "queued";
    } catch {
      return "error";
    }
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

/** Suscribe a online/offline y vacía la cola al volver la red. */
export function startOfflineQueueSync(onChange?: Listener): () => void {
  if (typeof window === "undefined") return () => {};
  if (onChange) listeners.add(onChange);

  const onOnline = () => {
    void flushOfflineQueue().finally(() => emit());
  };
  const onOffline = () => emit();

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  void flushOfflineQueue().finally(() => emit());

  return () => {
    if (onChange) listeners.delete(onChange);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
