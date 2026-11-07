/** Técnicas guiadas — solo `tools/tech/`. */
export function TechPanel({ patientId }: { patientId: string }) {
  void patientId;
  return (
    <div className="flex flex-1 flex-col gap-3 px-4 py-6 font-texto text-nara-tinta">
      <h2 className="m-0 font-titulos text-xl font-semibold">Técnicas guiadas</h2>
      <p className="m-0 text-[15px] text-texto-secundario">
        Esqueleto: técnicas y audios del paciente.
      </p>
    </div>
  );
}
