"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useNaraStore } from "@/providers/nara-provider";

type Props = {
  /** @deprecated Las notificaciones del topbar se quitaron; se ignora. */
  notifKey?: string;
  compact?: boolean;
};

export function UserMenu({ compact }: Props) {
  const store = useNaraStore();
  const [menu, setMenu] = useState(false);
  const [width, setWidth] = useState(1500);

  useEffect(() => {
    const onR = () => setWidth(window.innerWidth);
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (menu && !t?.closest?.("[data-um]")) setMenu(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menu) setMenu(false);
    };
    onR();
    window.addEventListener("resize", onR);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("resize", onR);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menu]);

  const u = store.session() || { name: "", role: "", terr: "", nk: null };
  const full = !compact && width >= 1100;
  const initials = u.name
    .replace(/^Dra?\. /, "")
    .split(" ")
    .filter((w: string) => /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("");

  return (
    <div
      data-um="1"
      className="relative flex items-center gap-3 font-texto text-nara-tinta sm:gap-3.5"
    >
      <div className="relative">
        <button
          type="button"
          aria-expanded={menu}
          aria-haspopup="menu"
          onClick={() => setMenu(!menu)}
          className={[
            "flex h-11 cursor-pointer items-center gap-2.5 rounded-full border bg-nara-blanco font-texto text-nara-tinta transition-colors",
            menu
              ? "border-nara-tinta"
              : "border-linea hover:border-nara-tinta/40",
            full ? "py-1 pr-3 pl-1" : "p-1",
          ].join(" ")}
        >
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6C04C9] to-[#31C6E6] text-sm font-semibold text-white">
            {initials}
          </span>
          {full ? (
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span className="max-w-[160px] truncate text-sm font-semibold">
                {u.name}
              </span>
              <span className="max-w-[160px] truncate text-xs text-texto-secundario">
                {u.role}
              </span>
            </span>
          ) : null}
          {full ? (
            <span
              className={[
                "text-[10px] text-texto-secundario transition-transform",
                menu ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            >
              ▾
            </span>
          ) : null}
        </button>

        {menu ? (
          <div
            role="menu"
            className="absolute top-[calc(100%+6px)] right-0 z-50 w-[260px] overflow-hidden rounded-2xl border border-linea bg-nara-blanco shadow-[0_12px_30px_rgba(22,20,19,.15)]"
          >
            <div
              className="pointer-events-none absolute -top-[7px] right-5 h-3.5 w-3.5 rotate-45 border-t border-l border-linea bg-nara-blanco"
              aria-hidden
            />

            <Link
              href="/perfil"
              role="menuitem"
              onClick={() => setMenu(false)}
              className="group relative flex items-start gap-3 px-3.5 py-3.5 text-nara-tinta no-underline transition-colors hover:bg-nara-crema"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6C04C9] to-[#31C6E6] text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                <span className="truncate text-[15px] font-semibold underline-offset-2 group-hover:underline">
                  {u.name}
                </span>
                <span className="text-[13px] leading-snug text-texto-secundario">
                  {u.role}
                  {u.terr ? ` · ${u.terr}` : ""}
                </span>
                <span className="pt-1 text-xs font-medium text-nara-tinta">
                  Ver y editar perfil
                </span>
              </span>
            </Link>

            <div className="border-t border-[#E5E0D5]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => store.logout()}
              className="w-full cursor-pointer border-none bg-transparent px-3.5 py-3 text-left font-texto text-[15px] text-nara-tinta transition-colors hover:bg-nara-crema"
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
