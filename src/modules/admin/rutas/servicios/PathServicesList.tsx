"use client";

import { PathServiceRow } from "./PathServiceRow";
import type { PathServiceRowModel } from "./types";

/** Lista de interruptores de servicios en Rutas (orden del catálogo). */
export function PathServicesList({
  rows,
}: {
  rows: PathServiceRowModel[] | undefined;
}) {
  if (!rows?.length) return null;
  return (
    <>
      {rows.map((s) => (
        <PathServiceRow key={s.id} s={s} />
      ))}
    </>
  );
}
