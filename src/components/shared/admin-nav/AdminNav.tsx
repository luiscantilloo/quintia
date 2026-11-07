"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { IconMenu, IconX } from "@/components/shared/icons";
import { roleNavTabClass } from "@/components/shared/role-nav/RoleNav";
import { ADMIN_NAV_ITEMS, ADMIN_ROUTES, type AdminNavKey } from "@/modules/admin/routes";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const MS = 480;

type Props = {
  active?: string;
  /** Ancho útil del topbar (no el de la ventana). Si TEJIVA empuja, baja. */
  barWidth?: number;
  /** Forzar menú compacto (p. ej. TEJIVA abierto en overlay). */
  forceCompact?: boolean;
};

export function isAdminNavCompact(barWidth: number, forceCompact = false) {
  return forceCompact || barWidth === 0 || barWidth < 1100;
}

export function AdminNav({ active = "", barWidth = 0, forceCompact = false }: Props) {
  const [more, setMore] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hamburger = isAdminNavCompact(barWidth, forceCompact);
  const n = hamburger ? 0 : barWidth < 1280 ? 4 : ADMIN_NAV_ITEMS.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hamburger) setMobileOpen(false);
  }, [hamburger]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (more && !t?.closest?.("[data-an]")) setMore(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMore(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [more]);

  const mk = ([k, label]: [AdminNavKey, string]) => ({
    k,
    label,
    href: ADMIN_ROUTES[k],
    active: k === active,
  });
  const items = ADMIN_NAV_ITEMS.slice(0, n).map(mk);
  const moreItems = ADMIN_NAV_ITEMS.slice(n).map(mk);
  const moreActive = moreItems.some((x) => x.active);

  if (hamburger) {
    const drawer =
      mounted ? (
        createPortal(
          <div
            aria-hidden={!mobileOpen}
            className="fixed inset-0 z-50"
            style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 border-none bg-[rgba(22,20,19,.45)] transition-opacity duration-300"
              style={{ opacity: mobileOpen ? 1 : 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <aside
              role="dialog"
              aria-label="Menú de navegación"
              data-an="1"
              className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] max-w-full flex-col bg-nara-blanco shadow-[10px_0_30px_rgba(22,20,19,.18)] will-change-transform"
              style={{
                transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
                transition: `transform ${MS}ms ${EASE}`,
              }}
            >
              <div className="box-border flex h-16 shrink-0 items-center justify-between gap-3 border-b border-linea px-4">
                <span onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center">
                  <QuintiaLogo href="/inicio" />
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar"
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-linea bg-nara-blanco text-nara-tinta"
                >
                  <IconX size={22} aria-hidden />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
                {ADMIN_NAV_ITEMS.map(([k, label]) => (
                  <Link
                    key={k}
                    href={ADMIN_ROUTES[k]}
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-12 items-center rounded-xl px-3.5 font-texto text-[15px] text-nara-tinta ${
                      k === active
                        ? "bg-pl-menta font-semibold"
                        : "bg-transparent font-medium hover:bg-pl-crema-sol/60"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </aside>
          </div>,
          document.body,
        )
      ) : null;

    return (
      <nav data-an="1" className="relative flex h-full items-center">
        <button
          type="button"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-linea bg-nara-blanco text-nara-tinta"
        >
          {mobileOpen ? <IconX size={22} /> : <IconMenu size={22} />}
        </button>
        {drawer}
      </nav>
    );
  }

  return (
    <nav
      data-an="1"
      className="relative flex h-full min-w-0 shrink items-stretch font-texto text-[15px] font-medium text-nara-tinta"
    >
      {items.map((item) => (
        <Link
          key={item.k}
          href={item.href}
          onClick={() => setMore(false)}
          className={roleNavTabClass(item.active)}
        >
          {item.label}
        </Link>
      ))}
      {moreItems.length > 0 ? (
        <button
          type="button"
          onClick={() => setMore(!more)}
          aria-expanded={more}
          className={roleNavTabClass(moreActive)}
        >
          Más ▾
        </button>
      ) : null}
      {more && moreItems.length > 0 ? (
        <div className="absolute top-[60px] left-0 z-50 flex min-w-[220px] flex-col rounded-[14px] border border-linea bg-nara-blanco p-1.5 shadow-[0_12px_30px_rgba(22,20,19,.15)]">
          {moreItems.map((item) => (
            <Link
              key={item.k}
              href={item.href}
              onClick={() => setMore(false)}
              className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-nara-tinta ${
                item.active ? "bg-[#E7FAF5] font-semibold" : "bg-nara-blanco font-medium"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
