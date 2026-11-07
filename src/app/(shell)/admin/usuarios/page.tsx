import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/page-title";

export const metadata = pageTitle("Usuarios y permisos");

export default function Page() {
  redirect("/usuarios");
}
