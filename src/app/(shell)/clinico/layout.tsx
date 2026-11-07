import type { ReactNode } from "react";
import { ClinicoRouteShell } from "./ClinicoRouteShell";

export default function ClinicoLayout({ children }: { children: ReactNode }) {
  return <ClinicoRouteShell>{children}</ClinicoRouteShell>;
}
