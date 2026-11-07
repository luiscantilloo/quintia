import { PacienteScreen } from "@/modules/paciente/app/PacienteScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Ánimo");

export default function Page() {
  return <PacienteScreen />;
}
