import { Suspense } from "react";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import AdminRedirectPage from "./AdminRedirect";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Administrador");

export default function AdminPage() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <AdminRedirectPage />
    </Suspense>
  );
}
