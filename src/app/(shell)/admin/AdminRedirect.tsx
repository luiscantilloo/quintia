"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { adminPathForView } from "@/modules/admin/routes";

/** Compat: /admin y /admin?view=team → rutas en español. */
export default function AdminRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const view = searchParams.get("view");
    const tab = searchParams.get("tab");
    if (view) {
      const path = adminPathForView(view);
      router.replace(tab ? `${path}?tab=${encodeURIComponent(tab)}` : path);
      return;
    }
    router.replace("/inicio");
  }, [router, searchParams]);

  return <NaraLoadingScreen />;
}
