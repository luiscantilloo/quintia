"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PacienteScreen } from "@/modules/paciente/app/PacienteScreen";

/**
 * Un solo PacienteScreen para las pestañas de la app.
 * Pendiente / plan siguen siendo pantallas distintas (ciclo de vida).
 */
export function PacienteRouteShell({ children }: { children: ReactNode }) {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/paciente";
  const lifecycle =
    pathname.startsWith("/paciente/pendiente") ||
    pathname.startsWith("/paciente/plan");

  if (lifecycle) return <>{children}</>;

  return (
    <>
      <PacienteScreen />
      {children}
    </>
  );
}
