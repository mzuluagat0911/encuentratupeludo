import type { PetReport, PetType, ReportType } from "@/lib/types";
import { listReports } from "@/lib/reports";

/** Tipo contrario para buscar posibles reencuentros (sin IA). */
export function oppositeReportType(
  type: ReportType,
): "perdido" | "encontrado" | null {
  if (type === "perdido") return "encontrado";
  if (type === "encontrado") return "perdido";
  return null;
}

function normalizePlace(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PLACE_STOPWORDS = new Set([
  "cerca",
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
  "sector",
  "barrio",
  "zona",
  "lugar",
]);

function placeTokens(value: string): Set<string> {
  const tokens = normalizePlace(value)
    .split(" ")
    .filter((t) => t.length >= 3 && !PLACE_STOPWORDS.has(t));
  return new Set(tokens);
}

/**
 * Puntúa cercanía de barrio/lugar sin IA.
 * Más alto = más relevante para mostrar primero.
 */
export function neighborhoodScore(a: string, b: string): number {
  const na = normalizePlace(a);
  const nb = normalizePlace(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 70;

  const ta = placeTokens(a);
  const tb = placeTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;

  let shared = 0;
  for (const t of ta) {
    if (tb.has(t)) shared += 1;
  }
  if (shared === 0) return 0;
  const overlap = shared / Math.min(ta.size, tb.size);
  return Math.round(overlap * 50);
}

export type MatchQuery = {
  reportType: ReportType;
  petType: PetType;
  city: string;
  neighborhood: string;
  /** Excluir el propio reporte si ya existe. */
  excludeId?: string;
  limit?: number;
};

export type RankedMatch = {
  report: PetReport;
  placeScore: number;
};

/**
 * Candidatos sin IA: misma ciudad, mismo animal, tipo contrario.
 * Orden: barrio parecido primero, luego más recientes.
 */
export async function findCandidateMatches(
  query: MatchQuery,
): Promise<RankedMatch[]> {
  const opposite = oppositeReportType(query.reportType);
  if (!opposite) return [];

  const limit = query.limit ?? 8;
  const reports = await listReports({
    reportType: opposite,
    petType: query.petType,
    city: query.city,
  });

  const ranked: RankedMatch[] = reports
    .filter((r) => r.id !== query.excludeId)
    .map((report) => ({
      report,
      placeScore: neighborhoodScore(query.neighborhood, report.neighborhood),
    }))
    .sort((a, b) => {
      if (b.placeScore !== a.placeScore) return b.placeScore - a.placeScore;
      return (
        new Date(b.report.created_at).getTime() -
        new Date(a.report.created_at).getTime()
      );
    })
    .slice(0, limit);

  return ranked;
}
