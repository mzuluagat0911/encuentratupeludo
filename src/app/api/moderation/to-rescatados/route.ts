import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { looksLikeRescuedDescription } from "@/lib/rescued";
import { dedupeRescuedReports } from "@/lib/rescueOps";
import { normalizeForFilter } from "@/lib/contentFilter";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  report_type: string;
  city: string;
  neighborhood: string;
  description: string | null;
  pet_type?: string;
};

/**
 * 1) Mueve a rescatado los casos de Manizales + frases de reencuentro
 * 2) Deduplica dejando la descripción de “ya se encontraron”
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, message: "Supabase no configurado" }, { status: 503 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "No client" }, { status: 503 });
  }

  const moved: Row[] = [];

  const targets = [
    { city: "Manizales", neighborhood: "Alta Leonora" },
    { city: "Manizales", neighborhood: "Conjunto la estación" },
    { city: "Manizales", neighborhood: "Conjunto la estacion" },
  ];

  for (const t of targets) {
    const { data, error } = await supabase
      .from("pet_reports")
      .update({ report_type: "rescatado" })
      .eq("city", t.city)
      .ilike("neighborhood", `%${t.neighborhood}%`)
      .neq("report_type", "rescatado")
      .select("id, report_type, city, neighborhood, description, pet_type");
    if (error) {
      return NextResponse.json({ ok: false, message: error.message, step: "targets" }, { status: 500 });
    }
    if (data?.length) moved.push(...(data as Row[]));
  }

  const { data: byDesc, error: descErr } = await supabase
    .from("pet_reports")
    .select("id, report_type, city, neighborhood, description, pet_type")
    .neq("report_type", "rescatado")
    .not("description", "is", null);

  if (descErr) {
    return NextResponse.json({ ok: false, message: descErr.message, step: "scan" }, { status: 500 });
  }

  const toRescue = ((byDesc || []) as Row[]).filter((r) =>
    looksLikeRescuedDescription(r.description),
  );

  if (toRescue.length) {
    const { data, error } = await supabase
      .from("pet_reports")
      .update({ report_type: "rescatado" })
      .in(
        "id",
        toRescue.map((r) => r.id),
      )
      .select("id, report_type, city, neighborhood, description, pet_type");
    if (error) {
      return NextResponse.json({ ok: false, message: error.message, step: "byDesc" }, { status: 500 });
    }
    if (data?.length) moved.push(...(data as Row[]));
  }

  // Perdidos con mismo barrio+ciudad que un rescatado
  const { data: rescued } = await supabase
    .from("pet_reports")
    .select("id, city, neighborhood, description, pet_type")
    .eq("report_type", "rescatado");

  const movedPerdidos: Row[] = [];
  for (const r of rescued || []) {
    const barrio = normalizeForFilter(r.neighborhood);
    const { data: perdidos } = await supabase
      .from("pet_reports")
      .select("id, report_type, city, neighborhood, description, pet_type")
      .eq("report_type", "perdido")
      .eq("city", r.city);

    const matches = ((perdidos || []) as Row[]).filter((p) => {
      const pb = normalizeForFilter(p.neighborhood);
      return pb === barrio || pb.includes(barrio) || barrio.includes(pb);
    });

    if (!matches.length) continue;
    const { data, error } = await supabase
      .from("pet_reports")
      .update({ report_type: "rescatado" })
      .in(
        "id",
        matches.map((m) => m.id),
      )
      .select("id, report_type, city, neighborhood, description, pet_type");
    if (error) {
      return NextResponse.json({ ok: false, message: error.message, step: "perdidos" }, { status: 500 });
    }
    if (data?.length) movedPerdidos.push(...(data as Row[]));
  }

  const dedupe = await dedupeRescuedReports();
  revalidatePath("/");

  const { count } = await supabase
    .from("pet_reports")
    .select("id", { count: "exact", head: true })
    .eq("report_type", "rescatado");

  return NextResponse.json({
    ok: dedupe.ok,
    moved,
    moved_from_perdidos: movedPerdidos,
    dedupe,
    rescatados_total: count ?? 0,
  });
}

export async function GET() {
  return POST();
}
