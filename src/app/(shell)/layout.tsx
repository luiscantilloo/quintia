import type { Metadata } from "next";
import { ShellLayout } from "@/components/layouts/shell";

/** Toda la app autenticada: no indexar. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function ShellGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ShellLayout>{children}</ShellLayout>;
}
