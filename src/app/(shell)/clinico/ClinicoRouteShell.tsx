"use client";

import type { ReactNode } from "react";
import { ClinicoScreen } from "@/modules/clinico";

/**
 * Un solo ClinicoScreen para inicio, aprobaciones, pacientes y ficha.
 * Evita remount al cambiar de ruta dentro del rol clínico.
 */
export function ClinicoRouteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ClinicoScreen />
      {children}
    </>
  );
}
