import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DEMO_MARKER } from "@/lib/demos";

export const dynamic = "force-dynamic";

/** Elimina reportes de ejemplo para no confundir a usuarios reales. */
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

  const { data, error } = await supabase
    .from("pet_reports")
    .delete()
    .like("description", `${DEMO_MARKER}%`)
    .select("id");

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  const count = await supabase
    .from("pet_reports")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    ok: true,
    deleted: data?.length ?? 0,
    report_count: count.count ?? 0,
  });
}

export async function GET() {
  return POST();
}
