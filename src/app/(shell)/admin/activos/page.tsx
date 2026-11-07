import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Activos");

export default function Page() {
  redirect("/activos");
}
