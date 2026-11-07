import { PacientePlanScreen } from "@/modules/paciente/plan/PacientePlanScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Paciente · Plan impreso");

export default function PlanPage() {
  return <PacientePlanScreen />;
}
