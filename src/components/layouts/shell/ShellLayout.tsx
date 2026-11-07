"use client";

import { useEffect, useState } from "react";

/**
 * Shell de roles: viewport bloqueado.
 * El documento no scrollea; cada pantalla define su propia zona de scroll bajo el topbar.
 * El loading de rutas vive en NaraProvider (cubre shell + paciente).
 */
export function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // H-015 (T-05): aviso cuando la guarda de rol devolvió al panel propio.
  const [denegado, setDenegado] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("acceso") === "denegado") setDenegado(true);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div
      data-shell-root
      className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-pl-hueso"
    >
      {denegado ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border-b border-pl-linea bg-pl-blanco px-4 py-2 font-texto text-sm text-pl-tinta"
        >
          <span>Acceso denegado: esa pantalla es de otro rol. Su sesión sigue abierta.</span>
          <button
            type="button"
            className="font-medium text-pl-teal underline underline-offset-2"
            onClick={() => setDenegado(false)}
          >
            Cerrar
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
}
