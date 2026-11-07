import { AdminPersonaScreen } from "@/modules/admin/screens/persona/AdminPersonaScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Persona");

export default function Page() {
  return <AdminPersonaScreen />;
}
