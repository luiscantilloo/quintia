import { TratamientoDatosScreen } from "@/modules/landing/TratamientoDatosScreen";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Política de tratamiento de datos personales", {
  index: true,
  description:
    "Política de tratamiento de datos personales de QUINTIA conforme a la Ley 1581 de 2012.",
});

export default function TratamientoDatosPage() {
  return <TratamientoDatosScreen />;
}
