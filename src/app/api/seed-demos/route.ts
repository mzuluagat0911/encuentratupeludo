import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DEMO_MARKER, DEMO_REPORTS } from "@/lib/demos";

export const dynamic = "force-dynamic";

/**
 * Carga reportes de ejemplo si aún no existen.
 * Seguro de llamar varias veces (no duplica).
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Supabase no configurado" },
      { status: 503 },
    );
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "No se pudo crear el cliente" },
      { status: 503 },
    );
  }

  const existing = await supabase
    .from("pet_reports")
    .select("id")
    .like("description", `${DEMO_MARKER}%`)
    .limit(1);

  if (existing.error) {
    return NextResponse.json(
      { ok: false, message: existing.error.message },
      { status: 500 },
    );
  }

  if ((existing.data?.length ?? 0) > 0) {
    const count = await supabase
      .from("pet_reports")
      .select("id", { count: "exact", head: true });
    return NextResponse.json({
      ok: true,
      seeded: false,
      message: "Los ejemplos ya estaban cargados",
      report_count: count.count ?? 0,
    });
  }

  const { data, error } = await supabase
    .from("pet_reports")
    .insert(DEMO_REPORTS)
    .select("id");

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    seeded: true,
    inserted: data?.length ?? 0,
    report_count: data?.length ?? 0,
  });
}

export async function GET() {
  return POST();
}
