import Link from "next/link";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";

export function LandingHeader({ sticky = false }: { logoSrc?: string; sticky?: boolean }) {
  return (
    <header
      className={`${sticky ? "sticky" : "fixed"} inset-x-0 top-0 z-50 border-b border-pl-tinta/10 bg-pl-hueso/92 backdrop-blur-md`}
    >
      <div className="flex items-center justify-between gap-4 px-[clamp(16px,4vw,48px)] py-3">
        <QuintiaLogo href="/landing" />
        <Link
          href="/ingreso"
          className="inline-flex min-h-14 items-center justify-center rounded-md bg-pl-comunidad px-7 font-texto text-lg font-bold !text-pl-hueso transition hover:bg-[#1FA8C4]"
        >
          Ingresar
        </Link>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative z-10 snap-end border-t border-pl-comunidad/40 bg-pl-verde-raiz px-[clamp(16px,6vw,96px)] py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <QuintiaLogo href={null} tone="claro" />
          <p className="max-w-xl font-mono text-sm leading-snug !text-pl-menta">
            Ciencia · Tecnología · Experiencias · Comunidad. El bienestar se construye en conexión.
          </p>
        </div>
        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/landing/privacidad"
            className="inline-flex min-h-11 items-center font-texto text-base font-medium !text-pl-hueso underline-offset-4 hover:underline"
          >
            Política de privacidad
          </Link>
          <Link
            href="/landing/tratamiento-de-datos"
            className="inline-flex min-h-11 items-center font-texto text-base font-medium !text-pl-hueso underline-offset-4 hover:underline"
          >
            Tratamiento de datos
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function IngresarCta({
  className = "",
  tone = "conexion",
}: {
  className?: string;
  tone?: "conexion" | "profundidad" | "naranja" | "verde";
}) {
  const tones =
    tone === "profundidad" || tone === "verde"
      ? "bg-pl-verde-raiz hover:bg-pl-comunidad"
      : tone === "naranja"
        ? "bg-pl-experiencias hover:bg-[#a85f36]"
        : "bg-pl-comunidad hover:bg-[#1FA8C4]";
  return (
    <Link
      href="/ingreso"
      className={`inline-flex min-h-14 items-center justify-center rounded-md px-8 font-texto text-[19px] font-bold !text-pl-hueso transition ${tones} ${className}`}
    >
      Ingresar
    </Link>
  );
}
