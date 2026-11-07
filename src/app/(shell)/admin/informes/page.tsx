import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Informes");

export default function Page() {
  redirect("/informes");
}
