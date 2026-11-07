import { resolveHerramientaCard } from "./tools/registry";
import type { HerramientaItem } from "./types";

type Props = {
  items: HerramientaItem[];
  patientId: string;
};

/** Sección Herramientas: 6 cuadros iguales en una sola fila. */
export function HerramientasSection({ items, patientId }: Props) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-[20px] border border-linea bg-nara-blanco px-4 py-[18px] sm:px-5">
      <span className="font-texto text-base font-medium text-nara-tinta">
        Herramientas
      </span>
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => {
          const Card = resolveHerramientaCard(item.id);
          return (
            <div key={item.id} className="min-w-0">
              <Card item={item} patientId={patientId} />
            </div>
          );
        })}
      </div>
      {!items.length ? (
        <span className="text-sm text-texto-secundario">
          Sin servicios en la ruta de este paciente.
        </span>
      ) : null}
    </div>
  );
}
