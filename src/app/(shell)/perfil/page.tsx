import { Suspense } from "react";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { PerfilScreen } from "@/modules/perfil/PerfilScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Mi perfil");

export default function PerfilPage() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <PerfilScreen />
    </Suspense>
  );
}
