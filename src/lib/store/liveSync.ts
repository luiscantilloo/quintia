"use client";

import { useEffect } from "react";
import {
  hydrateProgramData,
  type HydratePart,
} from "@/lib/store/hydrateProgram";
import { useNaraStore } from "@/providers/nara-provider";

type Store = typeof import("@/lib/store/store").default;

const DEFAULT_INTERVAL_MS = 15_000;

export type LiveSyncOpts = {
  intervalMs?: number;
  /** Si se omite, hidrata lo que el rol permite. */
  parts?: HydratePart[];
};

/** Presets por pantalla (solo lo que esa UI necesita). */
export const LIVE_ADMIN: HydratePart[] = [
  "territories",
  "experts",
  "accounts",
  "staff",
  "appState",
];
export const LIVE_CLINICO: HydratePart[] = [
  "territories",
  "experts",
  "accounts",
  "staff",
  "appState",
];
export const LIVE_EXPERTO: HydratePart[] = [
  "territories",
  "experts",
  "staff",
  "appState",
];
export const LIVE_PACIENTE: HydratePart[] = ["patientSelf", "appState"];
export const LIVE_CUIDADOR: HydratePart[] = ["staff", "appState"];

/**
 * Polling mientras la pantalla que lo monta está activa.
 * No usar desde el provider global: solo desde hooks de pantalla.
 */
export function startLiveProgramSync(
  store: Store,
  opts?: LiveSyncOpts,
): () => void {
  const intervalMs = opts?.intervalMs ?? DEFAULT_INTERVAL_MS;
  const parts = opts?.parts;
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastRun = 0;
  let running = false;

  const refresh = () => {
    if (stopped || running) return;
    if (typeof document !== "undefined" && document.hidden) return;
    const session = store.session() as { id?: string } | null;
    if (!session?.id) return;
    running = true;
    lastRun = Date.now();
    void hydrateProgramData(store, { force: true, parts }).finally(() => {
      running = false;
    });
  };

  const onVisibleOrFocus = () => {
    if (typeof document !== "undefined" && document.hidden) return;
    refresh();
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") onVisibleOrFocus();
  };

  timer = setInterval(() => {
    if (Date.now() - lastRun < intervalMs * 0.85) return;
    refresh();
  }, intervalMs);

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onVisibleOrFocus);
  window.addEventListener("online", onVisibleOrFocus);

  const kick = setTimeout(refresh, 2_000);

  return () => {
    stopped = true;
    clearTimeout(kick);
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onVisibleOrFocus);
    window.removeEventListener("online", onVisibleOrFocus);
  };
}

/** Activa sync solo mientras el componente de pantalla está montado. */
export function useLiveProgramSync(opts?: LiveSyncOpts) {
  const store = useNaraStore();
  const partsKey = opts?.parts?.slice().sort().join(",") ?? "";
  const intervalMs = opts?.intervalMs;

  useEffect(() => {
    return startLiveProgramSync(store, {
      intervalMs,
      parts: opts?.parts,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, partsKey, intervalMs]);
}
