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

function applyFilters(reports: PetReport[], filters: ReportFilters): PetReport[] {
  return reports
    .filter((r) => {
      if (filters.reportType && filters.reportType !== "todas") {
        if (r.report_type !== filters.reportType) return false;
      }
      if (filters.petType && filters.petType !== "todos") {
        if (r.pet_type !== filters.petType) return false;
      }
      if (filters.city && filters.city !== "todas") {
        if (r.city !== filters.city) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

async function listLocal(filters: ReportFilters): Promise<PetReport[]> {
  const reports = await ensureLocalStore();
  return applyFilters(reports, filters);
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
    description: input.description?.trim() || null,
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
  if (filters.city && filters.city !== "todas") {
    query = query.eq("city", filters.city);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase list error:", error.message);
    throw new Error("No pudimos cargar los reportes. Intenta de nuevo.");
  }
  return (data ?? []) as PetReport[];
}

async function createSupabase(input: CreateReportInput): Promise<PetReport> {
  const supabase = createServerClient();
  if (!supabase) return createLocal(input);

  const { data, error } = await supabase
    .from("pet_reports")
    .insert({
      report_type: input.report_type,
      pet_type: input.pet_type,
      photo_url: input.photo_url ?? null,
      city: input.city,
      neighborhood: input.neighborhood.trim(),
      phone: input.phone,
      description: input.description?.trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Supabase create error:", error?.message);
    throw new Error("No pudimos publicar el reporte. Intenta de nuevo.");
  }
  return data as PetReport;
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

export function usingLocalStore(): boolean {
  return !isSupabaseConfigured();
}
