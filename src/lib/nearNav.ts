import { isValidLatLng, parseCoord, parseNearRadius } from "@/lib/geo";
import { reportPath } from "@/lib/site";

export const NEAR_COORDS_KEY = "ubicatupeludo.near";

export type NearQuery = {
  lat: number;
  lng: number;
  radio?: number;
};

export function nearSearchString(near: NearQuery): string {
  const params = new URLSearchParams();
  params.set("lat", near.lat.toFixed(5));
  params.set("lng", near.lng.toFixed(5));
  if (near.radio === 3 || near.radio === 5) {
    params.set("radio", String(near.radio));
  }
  return params.toString();
}

export function feedHrefFromNear(near: NearQuery | null): string {
  if (!near) return "/";
  return `/?${nearSearchString(near)}`;
}

export function feedHrefFromParams(params: {
  lat?: string | null;
  lng?: string | null;
  radio?: string | null;
}): string {
  const lat = parseCoord(
    typeof params.lat === "string" ? params.lat : undefined,
  );
  const lng = parseCoord(
    typeof params.lng === "string" ? params.lng : undefined,
  );
  if (lat == null || lng == null || !isValidLatLng(lat, lng)) return "/";
  const radio = parseNearRadius(
    typeof params.radio === "string" ? params.radio : undefined,
  );
  return feedHrefFromNear({
    lat,
    lng,
    radio: radio === 3 || radio === 5 ? radio : undefined,
  });
}

export function reportHrefWithNear(id: string, nearQuery?: string): string {
  const path = reportPath(id);
  return nearQuery ? `${path}?${nearQuery}` : path;
}

export function readStoredNear(): NearQuery | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(NEAR_COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      lat?: number;
      lng?: number;
      radio?: number;
    };
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      !isValidLatLng(parsed.lat, parsed.lng)
    ) {
      return null;
    }
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      radio: parsed.radio === 3 || parsed.radio === 5 ? parsed.radio : undefined,
    };
  } catch {
    return null;
  }
}

export function writeStoredNear(near: NearQuery) {
  try {
    localStorage.setItem(NEAR_COORDS_KEY, JSON.stringify(near));
  } catch {
    /* ignore */
  }
}

export function clearStoredNear() {
  try {
    localStorage.removeItem(NEAR_COORDS_KEY);
  } catch {
    /* ignore */
  }
}
