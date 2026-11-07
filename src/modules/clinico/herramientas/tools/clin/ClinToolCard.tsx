"use client";
import { useCallback, useEffect, useState } from "react";
import { ToolCardShell } from "../../ToolCardShell";
import type { HerramientaCardProps } from "../../types";
import { listarAgenda } from "./acciones";
import { AgendaModal } from "./AgendaModal";
import { hora12, larga } from "./fechas";
import type { Cita } from "./tipos";

/** Psicólogo clínico — trabajar solo en `tools/clin/`. Botón que abre la agenda de citas. */
export function ClinToolCard({ item, patientId }: HerramientaCardProps) {
  const [abierta, setAbierta] = useState(false);
  const [prox, setProx] = useState<Cita | null | undefined>(undefined);

  const cargar = useCallback(() => {
    listarAgenda().then((r) => {
      if (!r.ok) return setProx(null);
      const propias = r.data.citas.filter((c) => c.patientId === patientId).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
      setProx(propias.find((c) => !c.hecha && c.fecha >= r.data.hoy) || null);
    });
  }, [patientId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <>
      <ToolCardShell
        onClick={() => setAbierta(true)}
        iconId="clin"
        title={item.name}
      >
        <span className="first-letter:uppercase">
          {prox === undefined
            ? "Cargando…"
            : prox
              ? `${larga(prox.fecha)} · ${hora12(prox.hora)}`
              : "Sin cita"}
        </span>
      </ToolCardShell>
      {abierta ? (
        <AgendaModal
          patientId={patientId}
          onCerrar={() => {
            setAbierta(false);
            cargar();
          }}
        />
      ) : null}
    </>
  );
}
