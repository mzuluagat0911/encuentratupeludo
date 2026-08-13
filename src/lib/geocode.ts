import {
  estimateReportPoint,
  getCityPoint,
  haversineKm,
  normalizeGeoText,
  type GeoPoint,
} from "@/lib/geo";
import type { PetReport } from "@/lib/types";

const PHOTON = "https://photon.komoot.io/api";
const NOMINATIM =
  "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=co";

const DEPT: Record<string, string> = {
  Bogotá: "Cundinamarca",
  Medellín: "Antioquia",
  Cali: "Valle del Cauca",
  Barranquilla: "Atlántico",
  Cartagena: "Bolívar",
  Bucaramanga: "Santander",
  Cúcuta: "Norte de Santander",
  Pereira: "Risaralda",
  Manizales: "Caldas",
  Armenia: "Quindío",
  Ibagué: "Tolima",
  Neiva: "Huila",
  Villavicencio: "Meta",
  Pasto: "Nariño",
  "Santa Marta": "Magdalena",
  Montería: "Córdoba",
  Valledupar: "Cesar",
  Popayán: "Cauca",
  Sincelejo: "Sucre",
  Tunja: "Boyacá",
  Riohacha: "La Guajira",
  Quibdó: "Chocó",
  Florencia: "Caquetá",
  Yopal: "Casanare",
  Arauca: "Arauca",
  Leticia: "Amazonas",
  "San Andrés": "San Andrés",
};

const ZONE_STOP = new Set([
  "cerca",
  "frente",
  "despues",
  "antes",
  "sobre",
  "entre",
  "al",
  "la",
  "el",
  "de",
  "del",
  "los",
  "las",
  "en",
  "un",
  "una",
  "por",
  "y",
  "a",
  "o",
  "con",
  "sector",
  "barrio",
  "zona",
  "lugar",
  "ciudad",
  "urbanizacion",
  "conjunto",
  "edificio",
  "manzana",
  "calle",
  "carrera",
  "cra",
  "cll",
  "cl",
  "kr",
  "numero",
  "nro",
  "no",
]);

const memory = new Map<string, GeoPoint>();

export function zoneKey(city: string, neighborhood: string): string {
  return `${normalizeGeoText(city)}|${normalizeGeoText(neighborhood)}`;
}

/** Quita muletillas y deja la zona buscable (barrio, vereda, municipio). */
export function zoneSearchText(neighborhood: string): string {
  const cleaned = neighborhood
    .replace(
      /\b(cerca( de)?|frente a|por (la|el|los|las)?|despues de|antes de|al lado de)\b/gi,
      " ",
    )
    .replace(/[#0-9]+/g, " ");
  const tokens = normalizeGeoText(cleaned)
    .split(" ")
    .filter((t) => t.length >= 3 && !ZONE_STOP.has(t));
  return tokens.join(" ").trim();
}

function isNearCity(point: GeoPoint, city: string, maxKm = 55): boolean {
  const c = getCityPoint(city);
  if (!c) return isFinite(point.lat);
  return haversineKm(point, c) <= maxKm;
}

/** Coords guardadas que son solo el centro de la ciudad: no sirven como zona. */
export function storedCoordsAreCityOnly(report: {
  city: string;
  lat?: number | null;
  lng?: number | null;
}): boolean {
  if (typeof report.lat !== "number" || typeof report.lng !== "number") {
    return true;
  }
  const city = getCityPoint(report.city);
  if (!city) return false;
  return haversineKm({ lat: report.lat, lng: report.lng }, city) < 0.8;
}

async function photonSearch(
  query: string,
  bias: GeoPoint | null,
): Promise<GeoPoint | null> {
  const url = new URL(PHOTON);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "3");
  if (bias) {
    url.searchParams.set("lat", String(bias.lat));
    url.searchParams.set("lon", String(bias.lng));
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2800);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent":
          "UbicaTuPeludo/1.0 (https://encuentratupeludo.vercel.app)",
      },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{ geometry?: { coordinates?: number[] } }>;
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function nominatimSearch(query: string): Promise<GeoPoint | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${NOMINATIM}&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent":
          "UbicaTuPeludo/1.0 (https://encuentratupeludo.vercel.app)",
      },
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = data[0];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Geocodifica la ZONA (barrio/vereda/municipio) + ciudad.
 * No usa el GPS de quien mira ni el de quien publica.
 */
export async function geocodeReportPlace(
  city: string,
  neighborhood: string,
): Promise<GeoPoint> {
  const key = zoneKey(city, neighborhood);
  const cached = memory.get(key);
  if (cached) return cached;

  const estimated = estimateReportPoint({ city, neighborhood });
  const cityPoint = getCityPoint(city) ?? estimated.point;
  const zone = zoneSearchText(neighborhood);
  const dept = DEPT[city] || "Colombia";

  const queries = [
    zone ? `${zone}, ${city}, ${dept}, Colombia` : "",
    zone ? `${zone}, ${city}, Colombia` : "",
    `${neighborhood}, ${city}, Colombia`,
  ].filter((q, i, arr) => q.length >= 8 && arr.indexOf(q) === i);

  for (const q of queries) {
    const hit =
      (await photonSearch(q, cityPoint)) || (await nominatimSearch(q));
    if (hit && isNearCity(hit, city)) {
      memory.set(key, hit);
      return hit;
    }
  }

  memory.set(key, estimated.point);
  return estimated.point;
}

async function mapPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  }
  const n = Math.min(limit, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
}

/** Resuelve lat/lng por zona para un lote de reportes (deduplica barrio+ciudad). */
export async function geocodeReportZones(
  reports: PetReport[],
): Promise<Map<string, GeoPoint>> {
  const unique = new Map<string, { city: string; neighborhood: string }>();
  for (const r of reports) {
    const key = zoneKey(r.city, r.neighborhood);
    if (!unique.has(key)) {
      unique.set(key, { city: r.city, neighborhood: r.neighborhood });
    }
  }

  const resolved = new Map<string, GeoPoint>();
  await mapPool([...unique.entries()], 6, async ([key, z]) => {
    const point = await geocodeReportPlace(z.city, z.neighborhood);
    resolved.set(key, point);
  });
  return resolved;
}

/** Separa pines que cayeron en el mismo punto para que se vean todos. */
export function spreadOverlappingPins(reports: PetReport[]): PetReport[] {
  const groups = new Map<string, number[]>();
  reports.forEach((r, i) => {
    if (typeof r.lat !== "number" || typeof r.lng !== "number") return;
    const k = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`;
    const list = groups.get(k) || [];
    list.push(i);
    groups.set(k, list);
  });

  const next = reports.map((r) => ({ ...r }));
  for (const idxs of groups.values()) {
    if (idxs.length < 2) continue;
    const base = next[idxs[0]];
    const lat0 = base.lat as number;
    const lng0 = base.lng as number;
    const ring = 0.0011; // ~120 m
    idxs.forEach((idx, n) => {
      const angle = (2 * Math.PI * n) / idxs.length;
      const radius = ring * (1 + Math.floor(n / 8) * 0.35);
      next[idx] = {
        ...next[idx],
        lat: lat0 + Math.cos(angle) * radius,
        lng: lng0 + Math.sin(angle) * radius,
      };
    });
  }
  return next;
}
