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
/** Un barrio no puede quedar a más de esto del centro (Murillo ~40 km). */
export const MAX_ZONE_KM = 28;

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
  place("Manizales", 5.0703, -75.5138, "Manizales", ["manizales"]),
  place("Fátima", 5.05255, -75.49648, "Manizales", ["fatima", "barrio fatima"]),
  place("Palermo", 5.05144, -75.48864, "Manizales", ["palermo", "bajo palermo"]),
  place("Palogrande", 5.05213, -75.48744, "Manizales", ["palogrande"]),
  place("Universitaria", 5.05025, -75.50182, "Manizales", ["universitaria", "comuna universitaria"]),
  place("La Enea", 5.03182, -75.46306, "Manizales", ["la enea", "enea"]),
  place("San Marcel", 5.03566, -75.46963, "Manizales", ["san marcel"]),
  place("El Bosque", 5.06409, -75.52287, "Manizales", ["el bosque"]),
  place("La Fuente", 5.06017, -75.50966, "Manizales", ["la fuente"]),
  place("La Macarena", 5.06084, -75.52257, "Manizales", ["la macarena"]),
  place("San José", 5.07363, -75.51386, "Manizales", ["san jose"]),
  place("Cerro de Oro", 5.05857, -75.47594, "Manizales", ["cerro de oro"]),
  place("Betania", 5.05538, -75.49744, "Manizales", ["betania"]),
  place("Milán", 5.0459, -75.47986, "Manizales", ["milan"]),
  place("Los Alcázares", 5.06711, -75.52676, "Manizales", ["alcazares", "los alcazares"]),
  place("Chipre", 5.07584, -75.52544, "Manizales", ["chipre"]),
  place("La Estrella", 5.05944, -75.48941, "Manizales", ["la estrella"]),
  place("El Cable", 5.05634, -75.48642, "Manizales", ["el cable"]),
  place("Versalles", 5.06315, -75.49881, "Manizales", ["versalles"]),
  place("La Sultana", 5.06108, -75.47277, "Manizales", ["la sultana"]),
  place("Avanzada", 5.07674, -75.51377, "Manizales", ["la avanzada", "avanzada"]),
  place("Nuevo Horizonte", 5.07135, -75.48771, "Manizales", ["nuevo horizonte"]),
  place("Cervantes", 5.06341, -75.50948, "Manizales", ["cervantes"]),
  place("Cumanday", 5.06762, -75.51497, "Manizales", ["cumanday"]),
  place("La Carola", 5.06619, -75.48766, "Manizales", ["la carola"]),
  place("El Nevado", 5.06015, -75.51446, "Manizales", ["el nevado"]),
  place("Los Rosales", 5.06209, -75.48975, "Manizales", ["los rosales"]),
  place("Minitas", 5.06338, -75.47564, "Manizales", ["minitas"]),
  place("San Jorge", 5.06583, -75.49946, "Manizales", ["san jorge"]),
  place("La Francia", 5.06829, -75.53268, "Manizales", ["la francia"]),
  place("Tesorito", 5.03591, -75.45055, "Manizales", ["tesorito"]),
  place("La Linda", 5.09178, -75.54614, "Manizales", ["la linda"]),
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
  const p =
    GEO_PLACES.find((x) => x.name === city) ??
    GEO_PLACES.find((x) => x.city === city);
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

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mismo barrio → mismo punto alrededor de la ciudad. Sin APIs. */
export function stableNeighborhoodPoint(
  city: string,
  neighborhood: string,
): GeoPoint | null {
  const centroid = CITY_CENTROIDS.get(city);
  if (!centroid) return null;
  const zone = normalizeGeoText(neighborhood);
  if (!zone) return centroid;
  const h = hashString(zone);
  const angle = ((h % 360) * Math.PI) / 180;
  const ringKm = 0.75 + (h % 110) / 100;
  const dLat = (ringKm / 111.32) * Math.cos(angle);
  const dLng =
    (ringKm / (111.32 * Math.cos((centroid.lat * Math.PI) / 180))) *
    Math.sin(angle);
  return { lat: centroid.lat + dLat, lng: centroid.lng + dLng };
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
    const km = city ? haversineKm(stored, city) : 0;
    // Centro de ciudad o otro municipio: no usar.
    if (!city || (km >= 0.8 && km <= MAX_ZONE_KM)) {
      return { point: stored, precision: "gps" };
    }
  }

  const cityNorm = normalizeGeoText(report.city);
  const hay = normalizeGeoText(`${report.neighborhood} ${report.city}`);

  let best: { place: GeoPlace; aliasLen: number } | null = null;
  for (const p of GEO_PLACES) {
    const sameCity =
      !p.city ||
      normalizeGeoText(p.city) === cityNorm ||
      normalizeGeoText(p.name) === cityNorm;
    if (!sameCity) continue;
    for (const alias of p.aliases) {
      if (!aliasInText(alias, hay)) continue;
      // El nombre de la ciudad siempre está en el texto; no debe ganar al barrio.
      if (alias === cityNorm) continue;
      const aliasLen = alias.length;
      if (!best || aliasLen > best.aliasLen) best = { place: p, aliasLen };
    }
  }

  if (best && best.place.name !== report.city && best.aliasLen >= 4) {
    return {
      point: { lat: best.place.lat, lng: best.place.lng },
      precision: "place",
    };
  }

  const hashed = stableNeighborhoodPoint(report.city, report.neighborhood);
  if (hashed) return { point: hashed, precision: "place" };

  if (best) {
    return {
      point: { lat: best.place.lat, lng: best.place.lng },
      precision: "city",
    };
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
