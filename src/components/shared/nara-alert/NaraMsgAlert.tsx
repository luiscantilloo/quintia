"use client";

import { useEffect, useRef } from "react";
import {
  naraAlert,
  type NaraAlertAction,
  type NaraAlertOptions,
} from "./naraAlert";

type Props = {
  msg?: string | null;
  actions?: NaraAlertAction[];
  onClear: () => void;
  options?: NaraAlertOptions;
};

/**
 * Muestra `msg` con SweetAlert2 y limpia el estado al cerrar.
 * Sustituye banners / textos de confirmación y error.
 */
export function NaraMsgAlert({
  msg,
  actions = [],
  onClear,
  options,
}: Props) {
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const text = (msg || "").trim();
    if (!text) {
      shown.current = null;
      return;
    }
    if (shown.current === text) return;
    shown.current = text;

    let cancelled = false;
    void naraAlert(text, actions, options).finally(() => {
      if (cancelled) return;
      shown.current = null;
      onClear();
    });

    return () => {
      cancelled = true;
    };
    // Solo reaccionar al texto; actions/options del disparo actual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg]);

  return null;
}
