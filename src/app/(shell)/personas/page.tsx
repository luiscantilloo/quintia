import { AdminSectionPage } from "@/modules/admin/screens/AdminSectionPage";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Personas");

export default function Page() {
  return <AdminSectionPage />;
}
