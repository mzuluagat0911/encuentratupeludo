import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  CreateReportInput,
  PetReport,
  ReportFilters,
} from "@/lib/types";
import {
  encodeResponsibleInDescription,
  hydrateReport,
  matchesResponsibleName,
} from "@/lib/responsible";
import {
  estimateReportPoint,
  getCityPoint,
  haversineKm,
  isValidLatLng,
  NEAR_FALLBACK_KM,
  NEAR_RADIUS_KM,
} from "@/lib/geo";
import {
  geocodeReportZones,
  spreadOverlappingPins,
  storedCoordsAreCityOnly,
  zoneKey,
} from "@/lib/geocode";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

const SEED_REPORTS: PetReport[] = [
  {
    id: "seed-1",
    report_type: "perdido",
    pet_type: "perro",
    photo_url: null,
    city: "Bogotá",
    neighborhood: "Cerca al parque El Virrey",
    phone: "3001234567",
    responsible_name: "Ana Gómez",
    description: "Labrador color chocolate, collar rojo, responde al nombre Milo.",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "seed-2",
    report_type: "encontrado",
    pet_type: "gato",
    photo_url: null,
    city: "Medellín",
    neighborhood: "Laureles, cerca a la iglesia",
    phone: "3109876543",
    responsible_name: "Carlos Pérez",
    description: "Gato naranja con manchas blancas en el pecho. Muy sociable.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "seed-3",
    report_type: "perdido",
    pet_type: "gato",
    photo_url: null,
    city: "Cali",
    neighborhood: "San Antonio",
    phone: "3155551212",
    responsible_name: "Laura Restrepo",
    description: "Gata gris pequeña, ojos verdes, sin collar.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "seed-4",
    report_type: "encontrado",
    pet_type: "perro",
    photo_url: null,
    city: "Bucaramanga",
    neighborhood: "Cabecera del Llano",
    phone: "3204448899",
    responsible_name: "Diego Morales",
    description: "Perro mediano café, parece mestizo, asustado pero sin heridas visibles.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];

async function ensureLocalStore(): Promise<PetReport[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as PetReport[];
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(SEED_REPORTS, null, 2), "utf8");
    return [...SEED_REPORTS];
  }
}

async function writeLocalStore(reports: PetReport[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(reports, null, 2), "utf8");
}

function matchesBaseFilters(
  r: PetReport,
  filters: ReportFilters,
  origin: { lat: number; lng: number } | null,
): boolean {
  if (filters.reportType && filters.reportType !== "todas") {
    if (r.report_type !== filters.reportType) return false;
  }
  if (filters.petType && filters.petType !== "todos") {
    if (r.pet_type !== filters.petType) return false;
  }
  if (!origin && filters.city && filters.city !== "todas") {
    if (r.city !== filters.city) return false;
  }
  if (!matchesResponsibleName(r, filters.responsible)) return false;
  // Cerca de mí: solo perdidos / rescatados (no “vistos/encontrados”)
  if (origin && r.report_type === "encontrado") return false;
  return true;
}

async function applyFilters(
  reports: PetReport[],
  filters: ReportFilters,
): Promise<PetReport[]> {
  const origin =
    typeof filters.lat === "number" &&
    typeof filters.lng === "number" &&
    isValidLatLng(filters.lat, filters.lng)
      ? { lat: filters.lat, lng: filters.lng }
      : null;

  const filtered = reports.filter((r) => matchesBaseFilters(r, filters, origin));

  if (!origin) {
    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  // Solo geocodificar zonas del área (no todo el país).
  const metro = filtered.filter((r) => {
    const city = getCityPoint(r.city);
    if (!city) return true;
    return haversineKm(origin, city) <= NEAR_FALLBACK_KM;
  });

  // No bloquear “Permitir”: si Photon tarda, usamos ciudad/zona local.
  let zones = new Map<string, { lat: number; lng: number }>();
  try {
    zones = await Promise.race([
      geocodeReportZones(metro),
      new Promise<Map<string, { lat: number; lng: number }>>((resolve) => {
        setTimeout(() => resolve(new Map()), 2800);
      }),
    ]);
  } catch {
    zones = new Map();
  }

  const ranked = metro
    .map((r) => {
      const z = zones.get(zoneKey(r.city, r.neighborhood));
      const ignoreStored = storedCoordsAreCityOnly(r);
      const est = estimateReportPoint({
        ...r,
        lat: ignoreStored ? null : r.lat,
        lng: ignoreStored ? null : r.lng,
      });
      const point = z ?? est.point;
      return {
        ...r,
        lat: point.lat,
        lng: point.lng,
        distance_km: haversineKm(origin, point),
        geo_precision: ignoreStored
          ? z
            ? "place"
            : est.precision
          : "gps",
      } satisfies PetReport;
    })
    .sort((a, b) => {
      const da = a.distance_km ?? Infinity;
      const db = b.distance_km ?? Infinity;
      if (da !== db) return da - db;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  const radius = filters.radiusKm ?? NEAR_RADIUS_KM;
  const nearby = ranked.filter((r) => (r.distance_km ?? Infinity) <= radius);
  const strictRing = radius <= 5;
  const list = strictRing
    ? nearby
    : nearby.length > 0
      ? nearby
      : ranked.filter((r) => (r.distance_km ?? Infinity) <= NEAR_FALLBACK_KM);

  return spreadOverlappingPins(list);
}

async function listLocal(filters: ReportFilters): Promise<PetReport[]> {
  const reports = await ensureLocalStore();
  return await applyFilters(
    reports.map((row) => hydrateReport(row)),
    filters,
  );
}

async function createLocal(input: CreateReportInput): Promise<PetReport> {
  const reports = await ensureLocalStore();
  const report: PetReport = {
    id: randomUUID(),
    report_type: input.report_type,
    pet_type: input.pet_type,
    photo_url: input.photo_url ?? null,
    city: input.city,
    neighborhood: input.neighborhood.trim(),
    phone: input.phone,
    responsible_name: input.responsible_name?.trim() || null,
    description: input.description?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    created_at: new Date().toISOString(),
  };
  reports.unshift(report);
  await writeLocalStore(reports);
  return report;
}

async function listSupabase(filters: ReportFilters): Promise<PetReport[]> {
  const supabase = createServerClient();
  if (!supabase) return listLocal(filters);

  let query = supabase
    .from("pet_reports")
    .select("*")
    .neq("neighborhood", "__health_probe__")
    // No mostrar demos residuales (p. ej. si aún no se borraron en DB)
    .not("description", "like", "Ejemplo:%")
    .order("created_at", { ascending: false });

  if (filters.reportType && filters.reportType !== "todas") {
    query = query.eq("report_type", filters.reportType);
  }
  if (filters.petType && filters.petType !== "todos") {
    query = query.eq("pet_type", filters.petType);
  }
  const hasOrigin =
    typeof filters.lat === "number" &&
    typeof filters.lng === "number" &&
    isValidLatLng(filters.lat, filters.lng);
  if (!hasOrigin && filters.city && filters.city !== "todas") {
    query = query.eq("city", filters.city);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase list error:", error.message);
    throw new Error("No pudimos cargar los reportes. Intenta de nuevo.");
  }
  return await applyFilters(
    ((data ?? []) as PetReport[]).map((row) => hydrateReport(row)),
    filters,
  );
}

let responsibleColumnMissing = false;
let geoColumnsMissing = false;

async function createSupabase(input: CreateReportInput): Promise<PetReport> {
  const supabase = createServerClient();
  if (!supabase) return createLocal(input);

  const name = input.responsible_name?.trim() || null;
  const description = input.description?.trim() || null;
  const base = {
    report_type: input.report_type,
    pet_type: input.pet_type,
    photo_url: input.photo_url ?? null,
    city: input.city,
    neighborhood: input.neighborhood.trim(),
    phone: input.phone,
  };
  const geo =
    !geoColumnsMissing && input.lat != null && input.lng != null
      ? { lat: input.lat, lng: input.lng }
      : {};

  if (!responsibleColumnMissing) {
    const withColumn = await supabase
      .from("pet_reports")
      .insert({
        ...base,
        ...geo,
        responsible_name: name,
        description,
      })
      .select("*")
      .single();

    if (!withColumn.error && withColumn.data) {
      return hydrateReport(withColumn.data as PetReport);
    }

    const errMsg = withColumn.error?.message || "";
    if (/\blat\b|\blng\b/i.test(errMsg)) {
      geoColumnsMissing = true;
      const retry = await supabase
        .from("pet_reports")
        .insert({
          ...base,
          responsible_name: name,
          description,
        })
        .select("*")
        .single();
      if (!retry.error && retry.data) {
        return hydrateReport(retry.data as PetReport);
      }
    }

    const missingColumn = /responsible_name/i.test(errMsg);
    if (!missingColumn) {
      console.error("Supabase create error:", errMsg);
      throw new Error("No pudimos publicar el reporte. Intenta de nuevo.");
    }
    responsibleColumnMissing = true;
  }

  const { data, error } = await supabase
    .from("pet_reports")
    .insert({
      ...base,
      ...(!geoColumnsMissing ? geo : {}),
      description: name
        ? encodeResponsibleInDescription(name, description)
        : description,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Supabase create error:", error?.message);
    throw new Error("No pudimos publicar el reporte. Intenta de nuevo.");
  }
  return hydrateReport(data as PetReport);
}

export async function listReports(
  filters: ReportFilters = {},
): Promise<PetReport[]> {
  if (isSupabaseConfigured()) {
    return listSupabase(filters);
  }
  return listLocal(filters);
}

export async function createReport(
  input: CreateReportInput,
): Promise<PetReport> {
  if (isSupabaseConfigured()) {
    return createSupabase(input);
  }
  return createLocal(input);
}

export async function getReportById(id: string): Promise<PetReport | null> {
  if (!id?.trim()) return null;

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("pet_reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return hydrateReport(data as PetReport);
  }

  const reports = await ensureLocalStore();
  const found = reports.find((r) => r.id === id);
  return found ? hydrateReport(found) : null;
}

export async function markReportAsRescued(
  id: string,
): Promise<{ ok: boolean; report?: PetReport; message?: string }> {
  const current = await getReportById(id);
  if (!current) {
    return { ok: false, message: "No encontramos ese reporte." };
  }
  if (current.report_type === "rescatado") {
    return { ok: true, report: current, message: "Este reporte ya estaba como rescatado." };
  }

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    if (!supabase) {
      return { ok: false, message: "No se pudo conectar." };
    }
    const { data, error } = await supabase
      .from("pet_reports")
      .update({ report_type: "rescatado" })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) {
      return { ok: false, message: error?.message || "No pudimos actualizar." };
    }
    return { ok: true, report: hydrateReport(data as PetReport) };
  }

  const reports = await ensureLocalStore();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, message: "No encontramos ese reporte." };
  reports[idx] = { ...reports[idx], report_type: "rescatado" };
  await writeLocalStore(reports);
  return { ok: true, report: hydrateReport(reports[idx]) };
}

export function usingLocalStore(): boolean {
  return !isSupabaseConfigured();
}
