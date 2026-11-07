import { AdminSectionPage } from "@/modules/admin/screens/AdminSectionPage";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Inicio");

export default function Page() {
  return <AdminSectionPage />;
}
