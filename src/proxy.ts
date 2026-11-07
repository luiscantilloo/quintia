import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "nara_sid";

/** Rutas de página públicas (sin cookie). */
const PUBLIC_PATHS = ["/", "/landing", "/ingreso"];

function programId() {
  return (
    process.env.NEXT_PUBLIC_PROGRAM_ID ||
    process.env.PROGRAM_ID ||
    "quintia"
  )
    .trim()
    .toLowerCase();
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
    return true;
  // La API vive en el gateway (rewrite). Auth y errores los resuelve Nest.
  if (pathname.startsWith("/api/")) return true;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image"
  ) {
    return true;
  }
  return false;
}

function hasSignedCookie(value: string | undefined) {
  if (!value) return false;
  // id puede traer puntos (p. ej. prueba.gestor). Formato: …exp[.programId].sig
  const parts = value.split(".");
  return parts.length >= 3 && parts.every((p) => p.length > 0);
}

function withProgramHeader(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-program-id", programId());
  return NextResponse.next({ request: { headers } });
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API: marcar programa de este front (antes vivía en middleware.ts).
  if (pathname.startsWith("/api/")) {
    return withProgramHeader(req);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!hasSignedCookie(cookie)) {
    const url = req.nextUrl.clone();
    url.pathname = "/ingreso";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
  ],
};
