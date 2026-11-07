"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { NaraLoadingScreen } from "./NaraLoadingScreen";

type RouteLoadingApi = {
  /** Muestra la carga solo en navegación real de sección (antes de router.push / Link). */
  start: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingApi>({ start: () => {} });

export function useRouteLoading() {
  return useContext(RouteLoadingContext);
}

function sameDestination(href: string) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return true;
    return (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  } catch {
    return true;
  }
}

const MIN_VISIBLE_MS = 420;

/**
 * Loading a pantalla completa solo cuando se pide con `start()` (p. ej. nav de rol)
 * o al clic en un <Link>/<a> a otra sección.
 * No se dispara solo por sync de URL de modales / tabs / pasos de visita.
 * `start()` pinta el overlay síncrono (flushSync) para que no se vea la ruta nueva antes.
 */
export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const pathKey = `${pathname}?${searchParams?.toString() || ""}`;
  const pathKeyRef = useRef(pathKey);
  /** true solo tras start() o clic en link; evita loading en router.push de formularios. */
  const armedRef = useRef(false);

  const clearHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const start = useCallback(() => {
    clearHide();
    armedRef.current = true;
    startedAt.current = Date.now();
    // Forzar paint del overlay antes de que el click cambie la vista/URL.
    flushSync(() => {
      setLoading(true);
    });
    // Si la ruta no cambia (error / misma vista), no dejar el overlay colgado.
    hideTimer.current = setTimeout(() => {
      setLoading(false);
      armedRef.current = false;
      hideTimer.current = null;
    }, 2500);
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    const elapsed = Date.now() - (startedAt.current || Date.now());
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimer.current = setTimeout(() => {
      setLoading(false);
      armedRef.current = false;
      hideTimer.current = null;
    }, wait);
  }, []);

  // Clics en links internos (barra de navegación y resto de la app).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      const a = el as HTMLAnchorElement;
      if (a.target && a.target !== "_self") return;
      const href = a.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      if (
        /^https?:\/\//i.test(href) &&
        !href.startsWith(window.location.origin)
      ) {
        return;
      }
      if (sameDestination(href)) return;
      // Links de nav de sección (RoleNav). router.push de modales/tabs no pasa por aquí.
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  // Cuando la ruta cambia: si había loading armado, ocultarlo; si no, no inventar loading.
  useEffect(() => {
    if (pathKeyRef.current === pathKey) return;
    pathKeyRef.current = pathKey;
    if (armedRef.current || loading) {
      scheduleHide();
    }
  }, [pathKey, loading, scheduleHide]);

  useEffect(() => () => clearHide(), []);

  return (
    <RouteLoadingContext.Provider value={{ start }}>
      {children}
      {loading ? <NaraLoadingScreen /> : null}
    </RouteLoadingContext.Provider>
  );
}
