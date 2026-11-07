import { IngresoScreen } from "@/modules/ingreso/components/IngresoScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Ingresar", {
  index: true,
  description:
    "Ingreso a QUINTIA, plataforma de acompañamiento para personas mayores (Núcleo Care).",
});

export default function IngresoPage() {
  return <IngresoScreen />;
}
