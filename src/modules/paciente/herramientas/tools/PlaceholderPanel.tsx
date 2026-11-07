import type { PacienteHerramientaMeta } from "../types";

/** Panel genérico mientras se desarrolla la herramienta. */
export function PlaceholderPanel({
  meta,
}: {
  meta: PacienteHerramientaMeta;
  patientId?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-6 font-texto text-nara-tinta">
      <h2 className="m-0 font-titulos text-xl font-semibold">{meta.name}</h2>
      <p className="m-0 text-[15px] text-texto-secundario">
        Aquí irá el contenido de esta herramienta en la app del paciente.
      </p>
    </div>
  );
}
