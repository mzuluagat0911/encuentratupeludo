import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

type Body = {
  id?: string;
  city?: string;
  neighborhood?: string;
  descriptionContains?: string;
  note?: string;
  report_type?: "rescatado" | "perdido" | "encontrado";
};

/**
 * Marca uno o más reportes como rescatado (moderación manual).
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, message: "Supabase no configurado" }, { status: 503 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "No client" }, { status: 503 });
  }

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const id = body.id?.trim();
  const city = body.city?.trim();
  const neighborhood = body.neighborhood?.trim();
  const needle = body.descriptionContains?.trim();

  if (!id && !city && !neighborhood && !needle) {
    return NextResponse.json(
      { ok: false, message: "Indica id, city, neighborhood o descriptionContains" },
      { status: 400 },
    );
  }

  const targetType = body.report_type || "rescatado";

  let query = supabase
    .from("pet_reports")
    .select("id, report_type, city, neighborhood, description, pet_type, created_at");

  if (targetType !== "rescatado") {
    query = query.neq("report_type", targetType);
  } else {
    query = query.neq("report_type", "rescatado");
  }

  if (id) query = query.eq("id", id);
  if (city) query = query.eq("city", city);
  if (neighborhood) query = query.ilike("neighborhood", `%${neighborhood}%`);

  const { data: candidates, error: findErr } = await query;
  if (findErr) {
    return NextResponse.json({ ok: false, message: findErr.message }, { status: 500 });
  }

  let rows = candidates || [];
  if (needle) {
    const n = needle.toLowerCase();
    rows = rows.filter((r) => {
      const hay = `${r.neighborhood || ""} ${r.description || ""}`.toLowerCase();
      return hay.includes(n);
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: false, message: "No se encontró el reporte", candidates: 0 });
  }

  const note = body.note?.trim();
  const updates = rows.map((r) => {
    const patch: Record<string, string> = { report_type: targetType };
    if (note && !r.description?.includes(note)) {
      const base = r.description?.trim() || "";
      patch.description = base ? `${base}\n${note}` : note;
    }
    return { id: r.id, patch };
  });

  const updated = [];
  for (const { id: rowId, patch } of updates) {
    const { data, error } = await supabase
      .from("pet_reports")
      .update(patch)
      .eq("id", rowId)
      .select("id, report_type, city, neighborhood, description, pet_type, created_at");
    if (error) {
      return NextResponse.json({ ok: false, message: error.message, step: rowId }, { status: 500 });
    }
    if (data?.length) updated.push(...data);
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true, updated });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "POST con id, city, neighborhood y/o descriptionContains",
  });
}
