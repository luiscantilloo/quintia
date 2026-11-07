/** Medios de la landing QUINTIA. */
import { brandAsset } from "@/lib/brand";

const A = "/landing/assets";
const Q = "/quintia";
const M = "/consiente";

export const landingAssets = {
  logo: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoClaro: `${Q}/logo/quintia-horizontal-claro.svg`,
  logoSobreVerde: `${Q}/logo/quintia-horizontal-claro.svg`,
  logoSobreCrema: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoSobreNaranja: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoVertical: `${Q}/logo/quintia-horizontal-oscuro.svg`,
  logoVerticalSobreVerde: `${Q}/logo/quintia-horizontal-claro.svg`,
  favicon: `${Q}/favicon.svg`,
  simbolo: `${Q}/logo/quintia-fuerzas.svg`,
  simboloLima: `${Q}/logo/quintia-fuerzas.svg`,
  simboloHueso: `${Q}/logo/quintia-fuerzas.svg`,
  tejiva: brandAsset.tejiva,
  /** @deprecated → landingAssets.tejiva */
  aurelia: brandAsset.tejiva,
  aureliaVerde: brandAsset.tejiva,
  heroWebp: `${A}/951e5ac2-7818-4892-9a76-cf6364c63061.webp`,
  heroJpg: `${A}/e9a86c2d-acc9-4e38-ae8b-4dfa9e0da5ba.jpg`,
  canal1Webp: `${A}/55c82448-3dec-4678-8ea1-6bc7c28a6b6f.webp`,
  canal1Jpg: `${A}/0f8dcb4c-ff65-4a93-8bc5-5ba4336a4050.jpg`,
  canal2Webp: `${A}/2af6e61c-a2bd-46d8-bef5-8e531d2330aa.webp`,
  canal2Jpg: `${A}/2688fc6e-ee21-4867-ae91-ab3b682a37be.jpg`,
  canal3Webp: `${A}/b0983756-fba5-4b1f-8594-532e23d76464.webp`,
  canal3Jpg: `${A}/2d176a9f-8c34-4825-a114-2373c4210844.jpg`,
  cierreWebp: `${A}/1958d976-d319-404d-a5c0-b3e6e9ebea05.webp`,
  cierreJpg: `${A}/33fed17c-b45a-4adb-9e26-17cdb99e2339.jpg`,
  video: `${A}/90d02e6b-69f5-485c-ae14-0839d5a582de.mp4`,
  videoPoster: `${A}/eede2ae8-ed57-4dd2-ab8d-d4f197de46c0.jpg`,
} as const;
