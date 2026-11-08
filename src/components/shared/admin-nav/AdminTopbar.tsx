"use client";

import { useEffect, useRef, useState } from "react";
import { AdminNav, isAdminNavCompact } from "@/components/shared/admin-nav/AdminNav";
import { QuintiaLogo } from "@/components/shared/brand/QuintiaLogo";
import { IconoTejiva } from "@/components/shared/brand/QuintiaIconos";
import { UserMenu } from "@/components/shared/user-menu/UserMenu";

type Props = {
  active: string;
  onOpenAgent: () => void;
  screenCode?: string;
  agentOpen?: boolean;
};

export function AdminTopbar({ active, onOpenAgent, screenCode, agentOpen = false }: Props) {
  const headerRef = useRef<HTMLElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setBarWidth(w);
    });
    ro.observe(el);
    setBarWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const forceCompact = agentOpen && barWidth > 0 && barWidth < 1280;
  const compact = isAdminNavCompact(barWidth, forceCompact);

  return (
    <header
      ref={headerRef}
      className="nara-topbar gap-2 px-3 sm:gap-3 sm:px-5 md:px-6"
    >
      <div className="flex h-full min-w-0 items-stretch gap-2 sm:gap-3 md:gap-4">
        {!compact ? <QuintiaLogo href="/inicio" /> : <QuintiaLogo href="/inicio" markOnly />}
        <AdminNav active={active} barWidth={barWidth} forceCompact={forceCompact} />
      </div>
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        {screenCode ? (
          <span className="hidden rounded-md border border-pl-linea bg-pl-menta/60 px-1.5 py-0.5 font-mono text-[11px] text-pl-texto2 xl:inline">
            {screenCode}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onOpenAgent}
          aria-label="Abrir TEJIVA"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[#E5E0D5] bg-[#F1ECF9] px-2.5 font-texto text-sm font-medium text-nara-tinta transition hover:brightness-[0.98] sm:h-11 sm:px-3.5 sm:text-[15px]"
        >
          <IconoTejiva className="block h-7 w-7 sm:-ml-0.5 sm:h-8 sm:w-8" />
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span className="font-semibold">TEJIVA</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-texto-secundario">
              asistente
            </span>
          </span>
        </button>
        <UserMenu notifKey="admin" />
      </div>
    </header>
  );
}
