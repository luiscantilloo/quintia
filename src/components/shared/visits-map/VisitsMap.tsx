"use client";

import dynamic from "next/dynamic";
import type { VisitMapMarker } from "./VisitsMapInner";

const VisitsMapInner = dynamic(() => import("./VisitsMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-nara-crema text-sm text-texto-secundario">
      Cargando mapa…
    </div>
  ),
});

type Props = {
  center: [number, number];
  markers: VisitMapMarker[];
  emptyLabel?: string;
  className?: string;
};

export function VisitsMap(props: Props) {
  return <VisitsMapInner {...props} />;
}
