"use client";

import Link from "next/link";

export type RoleNavItem = {
  key: string;
  label: string;
  active: boolean;
  href?: string;
  onClick?: () => void;
};

/** Clases de pestaña topbar: línea amarilla inferior cuando está activa. */
export function roleNavTabClass(active: boolean) {
  return [
    "relative flex h-full shrink-0 cursor-pointer items-center whitespace-nowrap bg-transparent px-2.5 font-texto text-[15px] font-medium text-nara-tinta sm:px-3.5",
    "border-0 outline-none",
    "after:pointer-events-none after:absolute after:right-2.5 after:bottom-0 after:left-2.5 after:h-[3px] after:content-['']",
    active ? "after:bg-pl-naranja" : "after:bg-transparent",
  ].join(" ");
}

/**
 * Pestañas de topbar compartidas por todos los roles.
 * Activo = línea amarilla inferior de 3px pegada al borde del header.
 */
export function RoleNav({ items }: { items: RoleNavItem[] }) {
  return (
    <nav className="flex h-full min-w-0 items-stretch overflow-x-auto font-texto text-[15px] font-medium text-nara-tinta">
      {items.map((item) => {
        const className = roleNavTabClass(item.active);
        if (item.href) {
          return (
            <Link key={item.key} href={item.href} className={className}>
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={className}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
