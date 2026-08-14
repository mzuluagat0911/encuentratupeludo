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
 * 2) Fuerza IDs confirmados a mano (Alaska, Duna, perra blanca de Granada)
 * 3) Deduplica dejando la descripción de “ya se encontraron”
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

  // Solo mueve perdidos con barrio EXACTO (normalizado) + mismo tipo,
  // y solo si el rescatado tiene texto claro de reencuentro.
  const { data: rescued } = await supabase
    .from("pet_reports")
    .select("id, city, neighborhood, description, pet_type")
    .eq("report_type", "rescatado");

  const movedPerdidos: Row[] = [];
  const rescuedKeys = new Set<string>();

  for (const r of rescued || []) {
    if (!looksLikeRescuedDescription(r.description)) continue;
    const key = `${normalizeForFilter(r.city)}|${normalizeForFilter(r.neighborhood)}|${r.pet_type}`;
    if (rescuedKeys.has(key)) continue;
    rescuedKeys.add(key);

    const { data: perdidos } = await supabase
      .from("pet_reports")
      .select("id, report_type, city, neighborhood, description, pet_type")
      .eq("report_type", "perdido")
      .eq("city", r.city)
      .eq("pet_type", r.pet_type);

    const barrio = normalizeForFilter(r.neighborhood);
    const matches = ((perdidos || []) as Row[]).filter(
      (p) => normalizeForFilter(p.neighborhood) === barrio,
    );

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

  // Casos confirmados a mano (no traen frase de reencuentro en la descripción)
  const forceRescueIds = [
    "d0708ee6-f784-48ed-9cf7-713f8ede7dea", // perra blanca, Barrio Granada, Armenia
    "f131b01b-4667-422b-baf9-a590251a1abb", // Alaska, barrio Granada, Armenia
    "3f69e4e1-1ff1-4366-bb92-fdc0f6dd279e", // Duna, Conjunto Piamonte, Manizales
  ];
  const { data: forced } = await supabase
    .from("pet_reports")
    .update({ report_type: "rescatado" })
    .in("id", forceRescueIds)
    .neq("report_type", "rescatado")
    .select("id, report_type, city, neighborhood, description, pet_type");
  if (forced?.length) moved.push(...(forced as Row[]));

  // Corrección puntual: no eran reencuentros (match laxo de "Álamos")
  const falsePositiveIds = [
    "a0cc2722-eca6-49c3-af2c-af83d6273ef5", // MANOLO
    "094f28a8-7c5e-4a0e-992e-fd1526029fe1", // clínica / Alamos
  ];
  const { data: reverted } = await supabase
    .from("pet_reports")
    .update({ report_type: "perdido" })
    .in("id", falsePositiveIds)
    .eq("report_type", "rescatado")
    .select("id, report_type, city, neighborhood, description, pet_type");

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
    forced_ids: forced || [],
    reverted_false_positives: reverted || [],
    dedupe,
    rescatados_total: count ?? 0,
  });
}

export async function GET() {
  return POST();
}
