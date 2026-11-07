import { AdminExpertoScreen } from "@/modules/admin/screens/experto/AdminExpertoScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Experto");

export default function Page() {
  return <AdminExpertoScreen />;
}
