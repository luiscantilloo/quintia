import type { ReactNode } from "react";
import { ExpertoRouteShell } from "./ExpertoRouteShell";

export default function ExpertoLayout({ children }: { children: ReactNode }) {
  return <ExpertoRouteShell>{children}</ExpertoRouteShell>;
}
