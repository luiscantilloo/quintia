/**
 * Datos del prototipo Consciente-entrega (consciente-data.js) en QUINTIA.
 * Fuente canónica también en nucleo-api/programs/quintia/prototype-data.mjs
 */
// @ts-expect-error ESM .mjs sin tipos
import {
  buildPrototypeCohort,
  prototypeSnapshot,
  featuredPeopleFromPrototype,
} from "./prototype-data.mjs";

export { buildPrototypeCohort, prototypeSnapshot, featuredPeopleFromPrototype };

export type QuintiaDemoSnapshot = ReturnType<typeof prototypeSnapshot>;
