import { AuthLayout } from "@/components/layouts/auth";

export default function AuthGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthLayout>{children}</AuthLayout>;
}
