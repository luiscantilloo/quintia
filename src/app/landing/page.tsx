import { LandingScreen } from "@/modules/landing/LandingScreen";
import { pageTitle } from "@/lib/page-title";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata = pageTitle("Acompañamiento para personas mayores", {
  index: true,
  description: SITE_DESCRIPTION,
});

export default function LandingPage() {
  return <LandingScreen />;
}
