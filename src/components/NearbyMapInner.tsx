"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PetReport } from "@/lib/types";
import { formatDistanceKm } from "@/lib/geo";
import { reportTypeLabel } from "@/lib/reportCopy";
import { NearRadiusBar } from "@/components/NearRadiusBar";
import { focusReportCard } from "@/components/ReportCardShell";
import { reportPhotoSrc } from "@/lib/photoDisplay";

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

function safePhotoSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) return null;
  return escapeHtml(url);
}

function pinColor(type: PetReport["report_type"]): string {
  if (type === "perdido") return "#c2410c";
  if (type === "encontrado") return "#047857";
  if (type === "adopcion") return "#7c3aed";
  return "#1d4ed8";
}

function pinPopupHtml(report: PetReport): string {
  const title = `${report.pet_type === "gato" ? "Gato" : "Perro"} ${reportTypeLabel(report.report_type).toLowerCase()}`;
  const dist =
    typeof report.distance_km === "number"
      ? `a ~${formatDistanceKm(report.distance_km)}`
      : escapeHtml(report.neighborhood);
  const src = safePhotoSrc(reportPhotoSrc(report));
  const media = src
    ? `<img src="${src}" alt="" width="72" height="72" />`
    : `<span class="near-pin-ph">${report.pet_type === "gato" ? "🐱" : "🐶"}</span>`;

  return `<button type="button" class="near-pin" data-focus-report="${escapeHtml(report.id)}">
    ${media}
    <span class="near-pin-copy">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(dist)}</span>
      <span class="near-pin-ver">Ver</span>
    </span>
  </button>`;
}

export function NearbyMapInner({ origin, reports, radiusKm }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    const map = L.map(el, {
      scrollWheelZoom: false,
      zoomControl: true,
      // En celular un dedo debe scrollear la página, no atrapar el mapa.
      dragging: !coarse,
      touchZoom: true,
    });
    mapRef.current = map;
    if (coarse) map.dragging.disable();

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
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        color: "#ffffff",
        weight: 2,
        fillColor: pinColor(r.report_type),
        fillOpacity: 1,
      })
        .bindPopup(pinPopupHtml(r), {
          className: "near-pin-popup",
          maxWidth: 260,
          minWidth: 210,
          closeButton: true,
        })
        .addTo(map);

      marker.on("popupopen", (event) => {
        const popupEl = event.popup.getElement();
        const btn = popupEl?.querySelector<HTMLElement>("[data-focus-report]");
        if (!btn) return;
        L.DomEvent.disableClickPropagation(btn);
        const onClick = (ev: Event) => {
          ev.preventDefault();
          L.DomEvent.stop(ev);
          focusReportCard(r.id);
          map.closePopup();
        };
        btn.addEventListener("click", onClick, { once: true });
      });
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
      <div className="border-b border-line px-2.5 py-2">
        <NearRadiusBar />
      </div>
      <div
        ref={hostRef}
        className="near-map-host h-[min(42vh,280px)] w-full min-h-[220px] sm:h-80"
      />
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3 py-2 text-[11px] font-medium text-muted">
        <span className="font-bold text-foreground">
          {reports.length} en el mapa
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" /> Tú
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-lost" /> Perdido
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rescued" /> Rescatado
        </span>
      </p>
    </div>
  );
}
