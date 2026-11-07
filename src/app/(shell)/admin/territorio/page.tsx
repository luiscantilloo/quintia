import { AdminTerritorioScreen } from "@/modules/admin/screens/territorio/AdminTerritorioScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Territorio");

export default function TerritorioPage() {
  return <AdminTerritorioScreen />;
}
