import { PacientePendienteScreen } from "@/modules/paciente/pendiente/PacientePendienteScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Pendiente de evaluación");

export default function PacientePendientePage() {
  return <PacientePendienteScreen />;
}
