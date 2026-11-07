import { Montserrat, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";

/**
 * Tipografía QUINTIA (Presentación de marca 2026)
 * - Montserrat → titulares / wordmark (sustituto de Gotham en pantalla)
 * - Space Grotesk → lema, textos, web, apps y juegos (mín. 18 px en público)
 */

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/** @deprecated Preferir montserrat; alias para no romper imports. */
export const inter = montserrat;

/** DM Mono — voz, datos y acentos tipográficos */
export const dmMono = localFont({
  src: [
    {
      path: "../../public/quintia/fuentes/DM_Mono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/quintia/fuentes/DM_Mono-Medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-dm-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});
