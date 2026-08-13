import { COLOMBIA_CITIES } from "@/lib/cities";

export type GeoPoint = { lat: number; lng: number };

export type GeoPlace = GeoPoint & {
  name: string;
  /** Ciudad del selector, si aplica */
  city?: string;
  aliases: string[];
};

/** Radio por defecto: cubre área metropolitana (Yumbo–Cali, Villamaría–Manizales). */
export const NEAR_RADIUS_KM = 50;
export const NEAR_FALLBACK_KM = 120;

export type NearRadius = 3 | 5 | typeof NEAR_RADIUS_KM;

export function parseNearRadius(value?: string): NearRadius {
  if (value === "3") return 3;
  if (value === "5") return 5;
  return NEAR_RADIUS_KM;
}

export function normalizeGeoText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function place(
  name: string,
  lat: number,
  lng: number,
  city: string | undefined,
  aliases: string[],
): GeoPlace {
  const extra = [name, city].filter(Boolean) as string[];
  const uniq = [...new Set([...aliases, ...extra].map((a) => normalizeGeoText(a)).filter(Boolean))];
  return { name, lat, lng, city, aliases: uniq };
}

/** Cabeceras del selector + municipios/corregimientos que salen en barrios. */
export const GEO_PLACES: GeoPlace[] = [
  place("Bogotá", 4.711, -74.0721, "Bogotá", ["bogota", "bogota dc", "usaquen", "chapinero", "kennedy", "suba", "bosa", "engativa", "fontibon", "usme"]),
  place("Soacha", 4.5794, -74.2168, "Bogotá", ["soacha"]),
  place("Chía", 4.8614, -74.053, "Bogotá", ["chia"]),
  place("Medellín", 6.2442, -75.5812, "Medellín", ["medellin", "el poblado", "laureles", "belen", "castilla"]),
  place("Envigado", 6.1696, -75.583, "Medellín", ["envigado"]),
  place("Itagüí", 6.1846, -75.5992, "Medellín", ["itagui"]),
  place("Bello", 6.337, -75.558, "Medellín", ["bello"]),
  place("Sabaneta", 6.1515, -75.6165, "Medellín", ["sabaneta"]),
  place("Cali", 3.4516, -76.532, "Cali", ["cali", "san fernando", "melendez", "pance", "ciudad jardin", "granada", "san antonio"]),
  place("Yumbo", 3.5823, -76.4911, "Cali", ["yumbo", "guabinas"]),
  place("Jamundí", 3.2607, -76.54, "Cali", ["jamundi"]),
  place("Palmira", 3.5394, -76.3036, "Cali", ["palmira"]),
  place("Candelaria", 3.4064, -76.3511, "Cali", ["candelaria valle"]),
  place("Barranquilla", 10.9639, -74.7964, "Barranquilla", ["barranquilla", "soledad"]),
  place("Cartagena", 10.391, -75.4794, "Cartagena", ["cartagena"]),
  place("Bucaramanga", 7.1193, -73.1227, "Bucaramanga", ["bucaramanga", "floridablanca", "giron", "piedecuesta"]),
  place("Cúcuta", 7.8891, -72.4967, "Cúcuta", ["cucuta"]),
  place("Pereira", 4.8143, -75.6946, "Pereira", ["pereira", "cuba", "poblado pereira"]),
  place("Dosquebradas", 4.8394, -75.6673, "Pereira", ["dosquebradas", "milan", "alamos"]),
  place("Santa Rosa de Cabal", 4.8683, -75.6214, "Pereira", ["santa rosa de cabal"]),
  place("Manizales", 5.0703, -75.5138, "Manizales", ["manizales", "palermo", "la enea", "san marcel", "el bosque", "la florida"]),
  place("Fátima", 5.05255, -75.49648, "Manizales", ["fatima", "barrio fatima"]),
  place("Villamaría", 5.0456, -75.5153, "Manizales", ["villamaria", "urapanes", "ciudad jardin villamaria", "mirador de las lomas", "mirador de betania"]),
  place("Chinchiná", 4.9825, -75.6056, "Manizales", ["chinchina"]),
  place("Armenia", 4.535, -75.6757, "Armenia", ["armenia"]),
  place("Ibagué", 4.4389, -75.2322, "Ibagué", ["ibague"]),
  place("Neiva", 2.9273, -75.2819, "Neiva", ["neiva"]),
  place("Villavicencio", 4.142, -73.6266, "Villavicencio", ["villavicencio"]),
  place("Pasto", 1.2136, -77.2811, "Pasto", ["pasto"]),
  place("Santa Marta", 11.2408, -74.199, "Santa Marta", ["santa marta"]),
  place("Montería", 8.7479, -75.8814, "Montería", ["monteria"]),
  place("Valledupar", 10.4631, -73.2532, "Valledupar", ["valledupar"]),
  place("Popayán", 2.4448, -76.6147, "Popayán", ["popayan"]),
  place("Sincelejo", 9.3047, -75.3978, "Sincelejo", ["sincelejo"]),
  place("Tunja", 5.5353, -73.3678, "Tunja", ["tunja"]),
  place("Riohacha", 11.5444, -72.9072, "Riohacha", ["riohacha"]),
  place("Quibdó", 5.6947, -76.6611, "Quibdó", ["quibdo"]),
  place("Florencia", 1.6144, -75.6062, "Florencia", ["florencia"]),
  place("Yopal", 5.3378, -72.3959, "Yopal", ["yopal"]),
  place("Arauca", 7.0847, -70.7591, "Arauca", ["arauca"]),
  place("Leticia", -4.2153, -69.9406, "Leticia", ["leticia"]),
  place("San Andrés", 12.5847, -81.7006, "San Andrés", ["san andres"]),
];

const CITY_CENTROIDS = new Map<string, GeoPoint>();
for (const city of COLOMBIA_CITIES) {
  const p = GEO_PLACES.find((x) => x.name === city || x.city === city);
  if (p) CITY_CENTROIDS.set(city, { lat: p.lat, lng: p.lng });
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.max(100, Math.round(km * 1000))} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function aliasInText(alias: string, haystack: string): boolean {
  if (!alias || alias.length < 3) return false;
  if (haystack === alias) return true;
  return (
    haystack.startsWith(`${alias} `) ||
    haystack.endsWith(` ${alias}`) ||
    haystack.includes(` ${alias} `)
  );
}

/** Mejor lugar conocido a partir de ciudad + barrio (sin llamar APIs). */
export function estimateReportPoint(report: {
  city: string;
  neighborhood: string;
  lat?: number | null;
  lng?: number | null;
}): { point: GeoPoint; precision: "gps" | "place" | "city" } {
  if (
    typeof report.lat === "number" &&
    typeof report.lng === "number" &&
    Number.isFinite(report.lat) &&
    Number.isFinite(report.lng)
  ) {
    const city = CITY_CENTROIDS.get(report.city);
    const stored = { lat: report.lat, lng: report.lng };
    // Si es el centro de la ciudad, ignorar: hay que usar la zona.
    if (!city || haversineKm(stored, city) >= 0.8) {
      return { point: stored, precision: "gps" };
    }
  }

  const cityNorm = normalizeGeoText(report.city);
  const hay = normalizeGeoText(`${report.neighborhood} ${report.city}`);

  let best: { place: GeoPlace; aliasLen: number } | null = null;
  for (const p of GEO_PLACES) {
    const sameCity =
      !p.city || normalizeGeoText(p.city) === cityNorm || normalizeGeoText(p.name) === cityNorm;
    if (!sameCity) continue;
    for (const alias of p.aliases) {
      if (!aliasInText(alias, hay)) continue;
      // El nombre de la ciudad siempre está en el texto; no debe ganar al barrio.
      if (alias === cityNorm) continue;
      // Evitar que "cali" gane sobre "yumbo" si ambos aparecen
      const aliasLen = alias.length;
      if (!best || aliasLen > best.aliasLen) best = { place: p, aliasLen };
    }
  }

  if (best && best.place.name !== report.city && best.aliasLen >= 4) {
    return { point: { lat: best.place.lat, lng: best.place.lng }, precision: "place" };
  }

  const centroid = CITY_CENTROIDS.get(report.city as (typeof COLOMBIA_CITIES)[number]);
  if (centroid) return { point: centroid, precision: "city" };

  if (best) {
    return { point: { lat: best.place.lat, lng: best.place.lng }, precision: "city" };
  }

  return { point: { lat: 4.5709, lng: -74.2973 }, precision: "city" };
}

export function getCityPoint(city: string): GeoPoint | null {
  return CITY_CENTROIDS.get(city as (typeof COLOMBIA_CITIES)[number]) ?? null;
}

export function nearestCityName(origin: GeoPoint): string {
  let best: string = COLOMBIA_CITIES[0];
  let bestKm = Infinity;
  for (const city of COLOMBIA_CITIES) {
    const c = CITY_CENTROIDS.get(city);
    if (!c) continue;
    const km = haversineKm(origin, c);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  return best;
}

export function parseCoord(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -5 && lat <= 13.5 && lng >= -82 && lng <= -66;
}
