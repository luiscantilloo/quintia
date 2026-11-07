"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { logIntegration } from "@/lib/observability/integration-log";

export type VisitMapMarker = {
  lat: number;
  lng: number;
  color: string;
  tip: string;
  alert?: boolean;
  kind: "place" | "visit";
};

type Props = {
  center: [number, number];
  markers: VisitMapMarker[];
  emptyLabel?: string;
  /** Clases del contenedor (por defecto altura fija 380px). */
  className?: string;
};

function circleIcon(color: string, alert: boolean, kind: "place" | "visit") {
  const size = kind === "place" ? 12 : alert ? 18 : 14;
  const ring = alert ? "box-shadow:0 0 0 4px #FDE7E4;" : "";
  const opacity = kind === "place" ? "0.55" : "1";
  const border = kind === "place" ? "1.5px solid #8A8278" : "2px solid #fff";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};opacity:${opacity};${ring}"></span>`,
  });
}

export default function VisitsMapInner({
  center,
  markers,
  emptyLabel,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      center,
      zoom: 13,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    });
    let osmLoggedOk = false;
    let osmLoggedErr = false;
    const osmStarted = Date.now();
    tiles.on("load", () => {
      if (osmLoggedOk) return;
      osmLoggedOk = true;
      logIntegration({
        service: "osm",
        ok: true,
        ms: Date.now() - osmStarted,
        op: "tileLayer",
      });
    });
    tiles.on("tileerror", () => {
      if (osmLoggedErr) return;
      osmLoggedErr = true;
      logIntegration({
        service: "osm",
        ok: false,
        ms: Date.now() - osmStarted,
        detail: "tileerror",
        op: "tileLayer",
      });
    });
    tiles.addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // Leaflet needs a second pass once the container has layout.
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // center only used on first mount; updates handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const map = mapRef.current;
    if (!wrap || !map || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: circleIcon(m.color, !!m.alert, m.kind),
        title: m.tip,
      });
      marker.bindPopup(
        `<div style="font-family: var(--font-texto), "Space Grotesk", system-ui, sans-serif;font-size:13px;line-height:1.4">${m.tip}</div>`,
      );
      marker.addTo(layer);
    });

    if (markers.length) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.25), { maxZoom: 14 });
    } else {
      map.setView(center, 13);
    }
  }, [markers, center]);

  return (
    <div
      ref={wrapRef}
      className={
        className ||
        "relative h-[380px] w-full overflow-hidden rounded-[10px] bg-nara-crema"
      }
    >
      <div ref={elRef} className="absolute inset-0 z-0 h-full w-full" />
      {emptyLabel ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg bg-nara-blanco/90 px-3 py-1.5 text-sm text-texto-secundario shadow-sm">
          {emptyLabel}
        </div>
      ) : null}
    </div>
  );
}
