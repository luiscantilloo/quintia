export {
  NARA_SERVICES,
  NARA_SERVICE_BY_ID,
} from "./catalog.js";

export {
  ANALIZADOR_SERVICE,
  GAME_AND_ANALIZADOR_IDS,
  GAME_FREQS,
  GAME_IDS,
  GAME_SERVICES,
  LEGACY_JUEGOS_ID,
  anyGameOnInPathS,
  collapsePathListForHub,
  expandLegacyJuegosInModuleIds,
  expandLegacyJuegosInPathS,
  isGameServiceId,
} from "./gamesCatalog.js";

export type NaraServiceId =
  | "mood"
  | "clin"
  | "ia"
  | "frutas"
  | "simon"
  | "duelo"
  | "sudoku"
  | "analizador"
  | "juegos";

export type NaraServiceDef = {
  id: NaraServiceId | string;
  name: string;
  navLabel: string;
  note: string;
  freqs: string[];
  hasLibraryBtn?: boolean;
};
