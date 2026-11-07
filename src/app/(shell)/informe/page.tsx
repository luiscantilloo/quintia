import { Suspense } from "react";
import type { Metadata } from "next";
import { NaraLoadingScreen } from "@/components/shared/nara-loading/NaraLoadingScreen";
import { InformeScreen } from "@/modules/informe/InformeScreen";
import { informeTitleFromParams } from "@/modules/informe/informeTitle";

export async function generateMetadata({
  searchParams,
}: PageProps<"/informe">): Promise<Metadata> {
  const sp = await searchParams;
  return { title: informeTitleFromParams(sp) };
}

export default function InformePage() {
  return (
    <Suspense fallback={<NaraLoadingScreen />}>
      <InformeScreen />
    </Suspense>
  );
}
