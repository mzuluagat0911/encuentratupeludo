"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PetReport } from "@/lib/types";
import { formatDistanceKm } from "@/lib/geo";
import { reportTypeLabel } from "@/lib/reportCopy";

type Origin = { lat: number; lng: number };

type Props = {
  origin: Origin;
  reports: PetReport[];
  radiusKm?: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pinColor(type: PetReport["report_type"]): string {
  if (type === "perdido") return "#c2410c";
  if (type === "encontrado") return "#047857";
  return "#1d4ed8";
}

export function NearbyMapInner({ origin, reports, radiusKm }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const map = L.map(el, { scrollWheelZoom: false, zoomControl: true });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    const bounds = L.latLngBounds([[origin.lat, origin.lng]]);

    if (radiusKm && radiusKm <= 5) {
      L.circle([origin.lat, origin.lng], {
        radius: radiusKm * 1000,
        color: "#0f766e",
        weight: 2,
        fillColor: "#0f766e",
        fillOpacity: 0.08,
      }).addTo(map);
      bounds.extend([origin.lat + radiusKm / 111, origin.lng]);
      bounds.extend([origin.lat - radiusKm / 111, origin.lng]);
    }

    L.circleMarker([origin.lat, origin.lng], {
      radius: 11,
      color: "#0f766e",
      weight: 3,
      fillColor: "#5eead4",
      fillOpacity: 1,
    })
      .bindPopup("<strong>Tú estás aquí</strong>")
      .addTo(map);

    const pins = reports.filter(
      (r) => typeof r.lat === "number" && typeof r.lng === "number",
    );

    for (const r of pins) {
      const lat = r.lat as number;
      const lng = r.lng as number;
      bounds.extend([lat, lng]);
      const dist =
        typeof r.distance_km === "number"
          ? ` · a ~${formatDistanceKm(r.distance_km)}`
          : "";
      const title = `${r.pet_type === "gato" ? "Gato" : "Perro"} ${reportTypeLabel(r.report_type).toLowerCase()}`;
      L.circleMarker([lat, lng], {
        radius: 10,
        color: "#ffffff",
        weight: 2,
        fillColor: pinColor(r.report_type),
        fillOpacity: 1,
      })
        .bindPopup(
          `<strong>${escapeHtml(title)}</strong><br/>${escapeHtml(r.neighborhood)} · ${escapeHtml(r.city)}${escapeHtml(dist)}<br/><a href="#reporte-${r.id}">Ver ficha</a>`,
        )
        .addTo(map);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.18), { maxZoom: 13 });
    } else {
      map.setView([origin.lat, origin.lng], 12);
    }

    const onResize = () => map.invalidateSize();
    window.setTimeout(onResize, 80);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, [origin.lat, origin.lng, reports, radiusKm]);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_8px_24px_-16px_rgba(26,46,40,0.35)]">
      <div ref={hostRef} className="h-72 w-full sm:h-96" />
      <p className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2.5 text-[11px] font-medium text-muted">
        <span className="font-bold text-foreground">
          {reports.length} peludos en el mapa
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Tú
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lost" /> Perdido
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-found" /> Visto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rescued" /> Rescatado
        </span>
        <span className="w-full text-muted/80">
          Cada punto es la zona/barrio del reporte, no el GPS del celular
        </span>
      </p>
    </div>
  );
}
