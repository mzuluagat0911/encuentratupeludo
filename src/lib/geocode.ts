import {
  estimateReportPoint,
  getCityPoint,
  haversineKm,
  type GeoPoint,
} from "@/lib/geo";

const NOMINATIM =
  "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=co";

async function nominatimSearch(query: string): Promise<GeoPoint | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2200);
  try {
    const res = await fetch(`${NOMINATIM}&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent":
          "UbicaTuPeludo/1.0 (https://encuentratupeludo.vercel.app)",
      },
      cache: "no-store",
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
 * Coordenadas del reporte = ciudad + zona/barrio.
 * No usamos el GPS de quien publica.
 */
export async function geocodeReportPlace(
  city: string,
  neighborhood: string,
): Promise<GeoPoint> {
  const estimated = estimateReportPoint({ city, neighborhood }).point;
  const cityPoint = getCityPoint(city) ?? estimated;

  const zone = await nominatimSearch(`${neighborhood}, ${city}, Colombia`);
  if (zone && haversineKm(zone, cityPoint) <= 80) {
    return zone;
  }

  return estimated;
}
