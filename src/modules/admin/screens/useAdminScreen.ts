"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRouteLoading } from "@/components/shared/nara-loading/RouteLoadingProvider";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { ensureSession } from "@/lib/auth/ensureSession";
import { LIVE_ADMIN, useLiveProgramSync } from "@/lib/store/liveSync";
import { adminPathForView, adminViewForPath } from "../routes";
import { INITIAL_ADMIN_STATE, type AdminUiState } from "./adminConstants";
import { buildAdminModel, type AdminModelApi } from "./adminModel";

export function useAdminScreen() {
  const store = useNaraStore();
  const live = useNaraLive();
  useLiveProgramSync({ parts: LIVE_ADMIN });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { start: startRouteLoading } = useRouteLoading();
  const viewFromPath = adminViewForPath(pathname) || "home";
  const [state, setSt] = useState<AdminUiState>({ ...INITIAL_ADMIN_STATE, view: viewFromPath });
  /** Ids de pathRequests que estaban pending (para limpiar borrador al aprobar). */
  const pendingPathIdsRef = useRef<Set<string>>(new Set());
  /** Una sola limpieza de borradores al entrar a Rutas (no en cada live). */
  const clearedPathsDraftsRef = useRef(false);

  const setState = useCallback((patch: Partial<AdminUiState> | ((s: AdminUiState) => AdminUiState)) => {
    setSt((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);

  const go = useCallback(
    (view: string, extra?: Partial<AdminUiState>) => {
      setSt((prev) => ({ ...prev, view, ...extra }));
      const path = adminPathForView(view);
      if (path !== pathname) {
        startRouteLoading();
        router.push(path);
      }
      window.scrollTo(0, 0);
    },
    [pathname, router, startRouteLoading],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const u = await ensureSession(store);
      if (cancelled) return;
      if (!u || !/Admin/i.test(u.role || "")) {
        router.replace("/ingreso");
        return;
      }
      // Compat: /admin?view=team → /equipos
      const legacyView = searchParams.get("view");
      if (pathname === "/admin" && legacyView) {
        const target = adminPathForView(legacyView);
        const tab = searchParams.get("tab");
        router.replace(tab ? `${target}?tab=${tab}` : target);
        return;
      }
      setSt((prev) => ({
        ...prev,
        view: viewFromPath,
        ...(searchParams.get("tab") === "2" ? { pathTab: "2" } : {}),
        ...(viewFromPath !== "assets"
          ? { assetTerr: "", assetKind: undefined }
          : {}),
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [store, router, searchParams, pathname, viewFromPath]);

  // Territorio efectivo en Rutas (= el del selector). Sin esto, draftFn
  // resuelve sin terr y cae al default (p. ej. P05 Media → juegos ON).
  // Al entrar a Rutas se tiran borradores locales una vez (no en cada live).
  useEffect(() => {
    if (viewFromPath !== "paths") {
      clearedPathsDraftsRef.current = false;
      return;
    }
    const S0 = store.get();
    const names = (S0.territories || [])
      .map((t: { name?: string }) => t.name)
      .filter(Boolean) as string[];
    if (!names.length) return;
    setSt((prev) => {
      const next =
        prev.pathTerr && names.includes(prev.pathTerr)
          ? prev.pathTerr
          : names[0] || "";
      const clearDrafts = !clearedPathsDraftsRef.current;
      clearedPathsDraftsRef.current = true;
      if (prev.pathTerr === next && !clearDrafts) return prev;
      return {
        ...prev,
        pathTerr: next,
        scope: next || "all",
        ...(clearDrafts ? { drafts: {}, pathDraftDirty: {} } : {}),
      };
    });
  }, [viewFromPath, live, store]);

  // Al pasar un pathRequest de pending → approved/rejected: limpiar borrador
  // para que la matriz refleje el override (off / periodicidad nueva).
  useEffect(() => {
    const S0 = store.get();
    const reqs = Array.isArray(S0.pathRequests) ? S0.pathRequests : [];
    const nowPending = new Set<string>();
    const meta = new Map<string, { code: string; scope: string; status: string }>();
    reqs.forEach(
      (x: { id?: string; code?: string; scope?: string; status?: string; at?: number }) => {
        const code = String(x?.code || "");
        if (!code) return;
        const scope = String(x?.scope || "all");
        const status = String(x?.status || "pending").toLowerCase();
        const id = String(x?.id || `${code}|${scope}|${x?.at || ""}`);
        meta.set(id, { code, scope, status });
        if (status === "pending") nowPending.add(id);
      },
    );
    const prev = pendingPathIdsRef.current;
    const resolved: { code: string; scope: string }[] = [];
    prev.forEach((id) => {
      if (nowPending.has(id)) return;
      const m = meta.get(id);
      if (m && (m.status === "approved" || m.status === "rejected" || m.status === "superseded")) {
        resolved.push({ code: m.code, scope: m.scope });
      }
    });
    pendingPathIdsRef.current = nowPending;
    if (!resolved.length) return;
    setSt((prevSt) => {
      const drafts = { ...(prevSt.drafts || {}) };
      const dirty = { ...(prevSt.pathDraftDirty || {}) };
      let changed = false;
      resolved.forEach(({ code, scope }) => {
        const terrKey = scope && scope !== "all" ? `${scope}|${code}` : code;
        [terrKey, code].forEach((k) => {
          if (drafts[k]) {
            delete drafts[k];
            changed = true;
          }
          if (dirty[k]) {
            delete dirty[k];
            changed = true;
          }
        });
      });
      return changed ? { ...prevSt, drafts, pathDraftDirty: dirty } : prevSt;
    });
  }, [live, store]);

  const api = useMemo((): AdminModelApi => {
    const normS = (s: Record<string, string> | undefined) =>
      typeof store.normalizePathS === "function"
        ? (store.normalizePathS(s || {}) as Record<string, string>)
        : { ...(s || {}) };

    /** Mismo territorio que el selector de Rutas (fallback al primero). */
    const effectiveTerr = () => {
      const S0 = store.get();
      const names = (S0.territories || [])
        .map((t: { name?: string }) => t.name)
        .filter(Boolean) as string[];
      if (state.pathTerr && names.includes(state.pathTerr)) return state.pathTerr;
      return names[0] || "";
    };

    /** Vigente en territorio = misma fusión que paciente/clínico (pathServicesMap). */
    const liveMap = (
      code: string,
      override?: {
        s?: Record<string, string>;
        months?: number;
        inactiveMinutes?: number;
      } | null,
    ) => {
      const { r, d } = store.parseCode(code);
      const terr = effectiveTerr();
      if (typeof store.pathServicesMap === "function") {
        return store.pathServicesMap(r, d, override || null, {
          terr: terr || undefined,
        }) as {
          s: Record<string, string>;
          months: number;
          inactiveMinutes: number;
        };
      }
      const full = store.defaultPath(r, d);
      return {
        s: normS(full.s || {}),
        months: full.months,
        inactiveMinutes:
          full.inactiveMinutes != null ? full.inactiveMinutes : 1440,
      };
    };

    const draftFn = (code: string) => {
      const S0 = store.get();
      const terr = effectiveTerr();
      const draftKey = terr ? `${terr}|${code}` : code;

      const pendingReq = (
        Array.isArray(S0.pathRequests) ? S0.pathRequests : []
      ).find(
        (x: {
          code?: string;
          scope?: string;
          status?: string;
          draft?: {
            s?: Record<string, string>;
            months?: number;
            inactiveMinutes?: number;
          };
        }) =>
          String(x?.code || "") === String(code) &&
          String(x?.scope || "all") === String(terr || "all") &&
          String(x?.status || "pending").toLowerCase() === "pending",
      );
      const localDraft = state.drafts[draftKey] || state.drafts[code];
      const dirty =
        !!(state.pathDraftDirty && state.pathDraftDirty[draftKey]) ||
        !!(state.pathDraftDirty && state.pathDraftDirty[code]);

      // Con envío pendiente: la matriz muestra lo VIGENTE (aprobado), no el
      // borrador enviado. Si no, tras recargar parece ya activo sin aprobar.
      // El diff pendiente vive en clínico → Aprobaciones.
      if (pendingReq) {
        return liveMap(code, null);
      }

      // Edición local de esta sesión (aún no enviada).
      if (localDraft && dirty) {
        return liveMap(code, localDraft);
      }

      // Override aprobado / default — igual que paciente y clínico.
      return liveMap(code, null);
    };
    return {
      setState,
      go,
      draft: draftFn,
      setDraft: (code, fn) => {
        const S0 = store.get();
        const terr = effectiveTerr();
        const hasPending = (
          Array.isArray(S0.pathRequests) ? S0.pathRequests : []
        ).some(
          (x: { code?: string; scope?: string; status?: string }) =>
            String(x?.code || "") === String(code) &&
            String(x?.scope || "all") === String(terr || "all") &&
            String(x?.status || "").toLowerCase() === "pending",
        );
        // No editar encima de un envío pendiente: la matriz es solo lectura vigente.
        if (hasPending) return;

        const d = JSON.parse(JSON.stringify(draftFn(code)));
        fn(d);
        d.s = normS(d.s || {});
        const draftKey = terr ? `${terr}|${code}` : code;
        setSt((prev) => ({
          ...prev,
          pathTerr: terr || prev.pathTerr,
          scope: terr || prev.scope || "all",
          drafts: { ...(prev.drafts || {}), [draftKey]: d },
          pathDraftDirty: { ...(prev.pathDraftDirty || {}), [draftKey]: true },
        }));
      },
      router,
    };
  }, [go, router, setState, state.drafts, state.pathDraftDirty, state.pathTerr, store, live]);

  const v = useMemo(() => buildAdminModel(store, state, api), [api, state, store, live]);

  return { v, navGo: (key: string) => go(key, { msg: "" }) };
}
