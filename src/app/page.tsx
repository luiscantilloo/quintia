import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/page-title";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata = pageTitle(SITE_NAME, {
  index: true,
  description: SITE_DESCRIPTION,
});

/** La portada pública vive en /landing/; el login en /ingreso. */
export default function Home() {
  redirect("/landing");
}
