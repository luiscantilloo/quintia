import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Cabecero de página fijo bajo el topbar (título, tabs, acciones). */
export function PageHead({ children, className = "" }: Props) {
  return (
    <div className={`nara-page-head ${className}`.trim()}>
      {children}
    </div>
  );
}
