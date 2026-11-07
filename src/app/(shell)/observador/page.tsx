import { ObservadorScreen } from "@/modules/observador/screens/ObservadorScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Observador");

export default function ObservadorPage() {
  return <ObservadorScreen />;
}
