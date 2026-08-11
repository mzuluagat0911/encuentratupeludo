import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, message: "Supabase no configurado" }, { status: 503 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "No client" }, { status: 503 });
  }

  let body: { neighborhood?: string; city?: string; id?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const neighborhood = (body.neighborhood || "Voto por la derecha").trim();
  const city = (body.city || "Pereira").trim();
  const id = body.id?.trim();

  if (id) {
    const { data, error } = await supabase
      .from("pet_reports")
      .delete()
      .eq("id", id)
      .select("id, neighborhood, city, description");
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: data?.length ?? 0, rows: data });
  }

  const { data: found, error: findError } = await supabase
    .from("pet_reports")
    .select("id, neighborhood, city, description, created_at, photo_url")
    .or(
      `and(city.eq.${city},neighborhood.ilike.%${neighborhood}%),neighborhood.ilike.%Voto por la derecha%,description.ilike.%Votaron por la derecha%`,
    );

  if (findError) {
    // simpler fallback queries
    const q1 = await supabase
      .from("pet_reports")
      .select("id, neighborhood, city, description")
      .eq("city", city)
      .ilike("neighborhood", `%${neighborhood}%`);
    const q2 = await supabase
      .from("pet_reports")
      .select("id, neighborhood, city, description")
      .ilike("description", "%Votaron por la derecha%");
    const rows = [...(q1.data || []), ...(q2.data || [])];
    const uniq = Array.from(new Map(rows.map((r) => [r.id, r])).values());
    if (!uniq.length) {
      return NextResponse.json({ ok: true, deleted: 0, message: "No se encontró", findError: findError.message });
    }
    const { data, error } = await supabase
      .from("pet_reports")
      .delete()
      .in("id", uniq.map((r) => r.id))
      .select("id, neighborhood, city, description");
    if (error) return NextResponse.json({ ok: false, message: error.message, found: uniq }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: data?.length ?? 0, rows: data });
  }

  if (!found?.length) {
    return NextResponse.json({ ok: true, deleted: 0, message: "No se encontró la publicación" });
  }

  const { data, error } = await supabase
    .from("pet_reports")
    .delete()
    .in("id", found.map((r) => r.id))
    .select("id, neighborhood, city, description");

  if (error) {
    return NextResponse.json({ ok: false, message: error.message, found }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: data?.length ?? 0, rows: data });
}

export async function GET() {
  return POST(
    new Request("http://local", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ neighborhood: "Voto por la derecha", city: "Pereira" }),
    }),
  );
}
