import { PrivacidadScreen } from "@/modules/landing/PrivacidadScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Política de privacidad", {
  index: true,
  description:
    "Política de privacidad de QUINTIA: qué datos usamos, para qué, quién puede verlos y sus derechos.",
});

export default function PrivacidadPage() {
  return <PrivacidadScreen />;
}
