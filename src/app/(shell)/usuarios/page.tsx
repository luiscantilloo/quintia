import { Suspense } from "react";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { AdminUsuariosScreen } from "@/modules/admin";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Usuarios y permisos");

export default function UsuariosPage() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminUsuariosScreen />
    </Suspense>
  );
}
