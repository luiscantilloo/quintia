import { Suspense } from "react";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { AdminInformesScreen } from "@/modules/admin";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Informes");

export default function InformesPage() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminInformesScreen />
    </Suspense>
  );
}
