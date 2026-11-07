import { Suspense } from "react";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { AdminScreen } from "@/modules/admin";

/** Página de sección del admin (inicio, territorios, equipos, …). */
export function AdminSectionPage() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminScreen />
    </Suspense>
  );
}
