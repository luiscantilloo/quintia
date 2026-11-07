"use client";

import type { ReactNode } from "react";
import { ExpertoScreen } from "@/modules/experto/screens/ExpertoScreen";

/**
 * Un solo ExpertoScreen para /experto, /experto/nueva y visitas.
 * Evita remount (y pérdida del formulario) al sincronizar la URL.
 */
export function ExpertoRouteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ExpertoScreen />
      {children}
    </>
  );
}
