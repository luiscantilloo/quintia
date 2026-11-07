/**
 * Cliente HTTP hacia el núcleo.
 * Preferir: import { apiJson } from '@nucleo/client'
 */
export {
  apiFetch,
  apiJson,
  getProgram,
  getHealth,
  type ApiJson,
  type PublicProgram,
} from "@/lib/nucleo/client";
