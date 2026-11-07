import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PacienteRouteShell } from "./PacienteRouteShell";

/** App paciente: privada, no indexar. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PacienteLayout({ children }: { children: ReactNode }) {
  return <PacienteRouteShell>{children}</PacienteRouteShell>;
}
