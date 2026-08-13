import {
  estimateReportPoint,
  GEO_PLACES,
  getCityPoint,
  haversineKm,
  MAX_ZONE_KM,
  normalizeGeoText,
  type GeoPoint,
} from "@/lib/geo";
import type { PetReport } from "@/lib/types";

const PHOTON = "https://photon.komoot.io/api";
const NOMINATIM =
  "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&countrycodes=co";

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

/** Palabras que solas enganchan otro municipio (Tres Esquinas → Murillo). */
const WEAK_ZONE = new Set([
  "tres",
  "cuatro",
  "norte",
  "sur",
  "este",
  "oeste",
  "alto",
  "baja",
  "bajo",
  "centro",
  "nuevo",
  "nueva",
  "esquina",
  "esquinas",
  "parte",
  "lado",
]);

const NEIGHBORHOOD_KINDS = new Set([
  "neighbourhood",
  "neighborhood",
  "suburb",
  "quarter",
  "locality",
  "district",
  "hamlet",
  "village",
]);

const STREET_KINDS = new Set([
  "street",
  "highway",
  "primary",
  "secondary",
  "residential",
  "unclassified",
  "road",
]);

const memory = new Map<string, GeoPoint>();

type GeocodeHit = GeoPoint & {
  name?: string;
  city?: string;
  state?: string;
  kind?: string;
};

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

function isNearCity(point: GeoPoint, city: string, maxKm = MAX_ZONE_KM): boolean {
  const c = getCityPoint(city);
  if (!c) return Number.isFinite(point.lat);
  return haversineKm(point, c) <= maxKm;
}

function cityMatches(hitCity: string | undefined, requested: string): boolean {
  if (!hitCity) return false;
  const a = normalizeGeoText(hitCity);
  const b = normalizeGeoText(requested);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return GEO_PLACES.some(
    (p) =>
      Boolean(p.city) &&
      normalizeGeoText(p.name) === a &&
      normalizeGeoText(p.city as string) === b,
  );
}

function stateMatches(hitState: string | undefined, requestedCity: string): boolean {
  if (!hitState) return true;
  const want = normalizeGeoText(DEPT[requestedCity] || "");
  if (!want) return true;
  const got = normalizeGeoText(hitState);
  return got.includes(want) || want.includes(got);
}

function acceptHit(hit: GeocodeHit, city: string): boolean {
  if (!isNearCity(hit, city)) return false;
  if (hit.state && !stateMatches(hit.state, city) && !cityMatches(hit.city, city)) {
    return false;
  }
  if (hit.city && !cityMatches(hit.city, city)) return false;
  return true;
}

function scoreHit(hit: GeocodeHit, city: string): number | null {
  if (!acceptHit(hit, city)) return null;
  let score = 0;
  if (cityMatches(hit.city, city)) score += 50;
  if (stateMatches(hit.state, city)) score += 15;
  const kind = normalizeGeoText(hit.kind || "");
  if (NEIGHBORHOOD_KINDS.has(kind)) score += 25;
  if (STREET_KINDS.has(kind)) score -= 25;
  const cityPt = getCityPoint(city);
  if (cityPt) score += Math.max(0, 18 - haversineKm(hit, cityPt));
  return score;
}

function pickBest(hits: GeocodeHit[], city: string): GeoPoint | null {
  let best: { hit: GeocodeHit; score: number } | null = null;
  for (const hit of hits) {
    const score = scoreHit(hit, city);
    if (score == null) continue;
    if (!best || score > best.score) best = { hit, score };
  }
  return best ? { lat: best.hit.lat, lng: best.hit.lng } : null;
}

/** Coords guardadas que no sirven: centro de ciudad o otro municipio. */
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
  const km = haversineKm({ lat: report.lat, lng: report.lng }, city);
  return km < 0.8 || km > MAX_ZONE_KM;
}

async function photonSearch(query: string, bias: GeoPoint | null): Promise<GeocodeHit[]> {
  const url = new URL(PHOTON);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
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
    if (!res.ok) return [];
    const data = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates?: number[] };
        properties?: {
          name?: string;
          city?: string;
          locality?: string;
          county?: string;
          state?: string;
          osm_value?: string;
          type?: string;
        };
      }>;
    };
    const hits: GeocodeHit[] = [];
    for (const feature of data.features || []) {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const props = feature.properties || {};
      hits.push({
        lat,
        lng,
        name: props.name,
        city: props.city || props.locality || props.county,
        state: props.state,
        kind: props.osm_value || props.type,
      });
    }
    return hits;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function nominatimSearch(query: string): Promise<GeocodeHit[]> {
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
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      name?: string;
      type?: string;
      class?: string;
      address?: {
        city?: string;
        town?: string;
        municipality?: string;
        village?: string;
        neighbourhood?: string;
        suburb?: string;
        state?: string;
      };
    }>;
    const hits: GeocodeHit[] = [];
    for (const row of data) {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const addr = row.address || {};
      hits.push({
        lat,
        lng,
        name: row.name,
        city:
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.village ||
          addr.suburb,
        state: addr.state,
        kind: row.type || row.class,
      });
    }
    return hits;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function zoneQueries(city: string, neighborhood: string, dept: string): string[] {
  const zone = zoneSearchText(neighborhood);
  const tokens = zone.split(" ").filter(Boolean);
  const distinctive = tokens.filter((t) => t.length >= 5 && !WEAK_ZONE.has(t));
  const queries: string[] = [];

  for (const token of distinctive) {
    queries.push(`${token}, ${city}, ${dept}, Colombia`);
    queries.push(`barrio ${token}, ${city}, Colombia`);
  }
  if (zone) {
    queries.push(`${zone}, ${city}, ${dept}, Colombia`);
    queries.push(`${zone}, ${city}, Colombia`);
  }
  queries.push(`${neighborhood}, ${city}, Colombia`);

  return queries.filter(
    (q, i, arr) => q.replace(/\s+/g, " ").trim().length >= 8 && arr.indexOf(q) === i,
  );
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
  const dept = DEPT[city] || "Colombia";

  for (const q of zoneQueries(city, neighborhood, dept)) {
    const hit =
      pickBest(await photonSearch(q, cityPoint), city) ||
      pickBest(await nominatimSearch(q), city);
    if (hit) {
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

/** Separa pines apilados. El ángulo depende del id, no del orden del feed. */
export function spreadOverlappingPins(reports: PetReport[]): PetReport[] {
  const next = reports.map((r) => ({ ...r }));
  const used = new Set<number>();
  const mergeKm = 0.2;
  const ring = 0.0026;

  for (let i = 0; i < next.length; i++) {
    const a = next[i];
    if (used.has(i) || typeof a.lat !== "number" || typeof a.lng !== "number") {
      continue;
    }
    const group = [i];
    used.add(i);
    for (let j = i + 1; j < next.length; j++) {
      const b = next[j];
      if (used.has(j) || typeof b.lat !== "number" || typeof b.lng !== "number") {
        continue;
      }
      if (
        haversineKm(
          { lat: a.lat, lng: a.lng },
          { lat: b.lat, lng: b.lng },
        ) <= mergeKm
      ) {
        group.push(j);
        used.add(j);
      }
    }
    if (group.length < 2) continue;
    group.sort((x, y) => next[x].id.localeCompare(next[y].id));
    const lat0 =
      group.reduce((sum, idx) => sum + (next[idx].lat as number), 0) /
      group.length;
    const lng0 =
      group.reduce((sum, idx) => sum + (next[idx].lng as number), 0) /
      group.length;
    group.forEach((idx, n) => {
      const angle = (2 * Math.PI * n) / group.length;
      next[idx] = {
        ...next[idx],
        lat: lat0 + Math.cos(angle) * ring,
        lng: lng0 + Math.sin(angle) * ring,
      };
    });
  }
  return next;
}
