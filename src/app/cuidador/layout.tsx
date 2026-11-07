import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ShellLayout } from "@/components/layouts/shell";

/** App cuidadora: privada, no indexar. Shell = topbar fijo + scroll solo abajo. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function CuidadorLayout({ children }: { children: ReactNode }) {
  return <ShellLayout>{children}</ShellLayout>;
}
