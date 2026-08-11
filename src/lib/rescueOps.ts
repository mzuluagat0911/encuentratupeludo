import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { looksLikeRescuedDescription } from "@/lib/rescued";
import { normalizeForFilter } from "@/lib/contentFilter";

export type RescueRow = {
  id: string;
  city: string;
  neighborhood: string;
  pet_type: string;
  description: string | null;
  created_at: string;
  photo_url: string | null;
};

function normBarrio(s: string): string {
  return normalizeForFilter(s).replace(/\s+/g, " ");
}

/** Prioriza la publicación con mensaje de reencuentro real. */
export function rescueKeepScore(description: string | null | undefined): number {
  if (!description?.trim()) return 0;
  let score = 0;
  if (looksLikeRescuedDescription(description)) score += 20;
  const t = normalizeForFilter(description);
  if (/acabamos de encontr|acabo de encontr/.test(t)) score += 15;
  if (/con su(s)? duen|ya esta con|ya estan con/.test(t)) score += 15;
  if (/ya aparec|recuperad|reunid|ya volv|en casa|familia/.test(t)) score += 10;
  if (/gracias/.test(t)) score += 5;
  // "Encontrado" solo, sin más contexto, puntúa bajo
  if (t === "encontrado" || t === "encontrada") score -= 5;
  score += Math.min(description.trim().length, 180) / 40;
  return score;
}

export type FeedCounts = {
  rescatado: number;
  perdido: number;
  encontrado: number;
};

async function countByType(
  reportType: "rescatado" | "perdido" | "encontrado",
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = createServerClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("pet_reports")
    .select("id", { count: "exact", head: true })
    .eq("report_type", reportType)
    .neq("neighborhood", "__health_probe__")
    .not("description", "like", "Ejemplo:%");

  if (error) {
    console.error(`countByType(${reportType}):`, error.message);
    return 0;
  }
  return count ?? 0;
}

export async function countFeedReports(): Promise<FeedCounts> {
  const [rescatado, perdido, encontrado] = await Promise.all([
    countByType("rescatado"),
    countByType("perdido"),
    countByType("encontrado"),
  ]);
  return { rescatado, perdido, encontrado };
}

export async function countRescuedReports(): Promise<number> {
  return (await countFeedReports()).rescatado;
}

/**
 * Agrupa rescatados por ciudad+barrio+tipo y deja solo la mejor descripción.
 * Borra los duplicados.
 */
export async function dedupeRescuedReports(): Promise<{
  ok: boolean;
  kept: number;
  deleted: number;
  deletedRows: RescueRow[];
  message?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: false, kept: 0, deleted: 0, deletedRows: [], message: "no supabase" };
  }
  const supabase = createServerClient();
  if (!supabase) {
    return { ok: false, kept: 0, deleted: 0, deletedRows: [], message: "no client" };
  }

  const { data, error } = await supabase
    .from("pet_reports")
    .select("id, city, neighborhood, pet_type, description, created_at, photo_url")
    .eq("report_type", "rescatado")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      ok: false,
      kept: 0,
      deleted: 0,
      deletedRows: [],
      message: error?.message || "error",
    };
  }

  const groups = new Map<string, RescueRow[]>();
  for (const row of data as RescueRow[]) {
    const key = `${normalizeForFilter(row.city)}|${normBarrio(row.neighborhood)}|${row.pet_type}`;
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }

  const toDelete: string[] = [];
  const deletedRows: RescueRow[] = [];

  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    const ranked = [...rows].sort((a, b) => {
      const scoreDiff = rescueKeepScore(b.description) - rescueKeepScore(a.description);
      if (scoreDiff !== 0) return scoreDiff;
      // desempate: más reciente
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    const [, ...dupes] = ranked;
    for (const d of dupes) {
      toDelete.push(d.id);
      deletedRows.push(d);
    }
  }

  if (toDelete.length === 0) {
    return { ok: true, kept: data.length, deleted: 0, deletedRows: [] };
  }

  const { error: delErr } = await supabase
    .from("pet_reports")
    .delete()
    .in("id", toDelete);

  if (delErr) {
    return {
      ok: false,
      kept: data.length,
      deleted: 0,
      deletedRows: [],
      message: delErr.message,
    };
  }

  return {
    ok: true,
    kept: data.length - toDelete.length,
    deleted: toDelete.length,
    deletedRows,
  };
}
