"use client";

import { useState } from "react";
import { VisitsMap } from "@/components/shared/visits-map/VisitsMap";
import {
  formatCrisisLocUntil,
  isCrisisLocActive,
  type CrisisLoc,
} from "@/lib/crisis/crisisLocation";

type Props = {
  loc: CrisisLoc | null | undefined;
  patientName?: string;
  /** Colombia centro aproximado si aún no hay GPS. */
  fallbackCenter?: [number, number];
};

const CO_CENTER: [number, number] = [4.57, -74.3];

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function locationText(lat: number, lng: number, name?: string) {
  const who = name?.trim() || "Paciente";
  return `${who} · ubicación en crisis\n${lat.toFixed(6)}, ${lng.toFixed(6)}\n${mapsUrl(lat, lng)}`;
}

export function CrisisLiveMap({
  loc,
  patientName,
  fallbackCenter = CO_CENTER,
}: Props) {
  const now = Date.now();
  const active = isCrisisLocActive(loc, now);
  const lat = active ? Number(loc!.lat) : fallbackCenter[0];
  const lng = active ? Number(loc!.lng) : fallbackCenter[1];
  const agoSec = active ? Math.max(0, Math.round((now - Number(loc!.at)) / 1000)) : 0;
  const agoLabel =
    agoSec < 60
      ? `hace ${agoSec}s`
      : agoSec < 3600
        ? `hace ${Math.floor(agoSec / 60)} min`
        : `hace ${Math.floor(agoSec / 3600)} h`;

  const [copyLabel, setCopyLabel] = useState("Copiar");

  const copyLocation = async () => {
    if (!active) return;
    const text = locationText(lat, lng, patientName);
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copiado");
      window.setTimeout(() => setCopyLabel("Copiar"), 1800);
    } catch {
      try {
        window.prompt("Copie la ubicación:", text);
      } catch {
        /* ignore */
      }
    }
  };

  const sendLocation = async () => {
    if (!active) return;
    const text = locationText(lat, lng, patientName);
    const url = mapsUrl(lat, lng);
    const title = `Ubicación · ${patientName || "crisis"}`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      /* canceló o no disponible → WhatsApp */
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D5] bg-[#F7F5EF] px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#31C6E6]">
            Ubicación en vivo
          </p>
          {active ? (
            <span className="font-mono text-[11px] text-[#0F2D3B]">
              {agoLabel} · {formatCrisisLocUntil(Number(loc!.until), now)} rest.
            </span>
          ) : (
            <span className="font-mono text-[11px] text-[#6B7280]">Sin señal</span>
          )}
        </div>
        {active ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => void copyLocation()}
              className="h-9 cursor-pointer border-[1.5px] border-[#0F2D3B] bg-white px-3 font-texto text-[12px] font-semibold text-[#0F2D3B] transition hover:bg-[#E5E0D5]/40"
            >
              {copyLabel}
            </button>
            <button
              type="button"
              onClick={() => void sendLocation()}
              className="h-9 cursor-pointer border-0 bg-[#0F2D3B] px-3 font-texto text-[12px] font-semibold text-[#F7F5EF] transition hover:opacity-95"
            >
              Enviar
            </button>
            <a
              href={mapsUrl(lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center border border-[#E5E0D5] bg-white px-3 font-texto text-[12px] font-semibold text-[#0F2D3B] no-underline transition hover:border-[#0F2D3B]"
            >
              Abrir mapa
            </a>
          </div>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        {active ? (
          <VisitsMap
            center={[lat, lng]}
            className="absolute inset-0 h-full w-full overflow-hidden rounded-none bg-nara-crema"
            markers={[
              {
                lat,
                lng,
                color: "#31C6E6",
                tip: patientName || "Paciente en crisis",
                alert: true,
                kind: "visit",
              },
            ]}
          />
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 bg-[#F7F5EF] px-6 py-12 text-center">
            <p className="m-0 font-titulos text-base font-semibold text-[#0F2D3B]">
              Esperando ubicación
            </p>
            <p className="m-0 max-w-xs text-sm leading-snug text-[#6B7280]">
              Cuando el paciente acepte compartir, su posición aparecerá aquí en
              tiempo real (hasta 24 h).
            </p>
          </div>
        )}
      </div>

      {active ? (
        <p className="m-0 shrink-0 border-t border-[#E5E0D5] bg-white px-4 py-2 font-mono text-[11px] text-[#6B7280]">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : null}
    </div>
  );
}
