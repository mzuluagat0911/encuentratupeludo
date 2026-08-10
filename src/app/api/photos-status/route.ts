import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/** Diagnóstico: cuántos reportes tienen foto y cuántos no. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, mode: "local" }, { status: 503 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("pet_reports")
    .select("id, city, neighborhood, photo_url, created_at, description")
    .neq("neighborhood", "__health_probe__")
    .not("description", "like", "Ejemplo:%")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const reports = (data ?? []).map((r) => ({
    id: r.id,
    city: r.city,
    neighborhood: r.neighborhood,
    created_at: r.created_at,
    has_photo: Boolean(r.photo_url),
    photo_url: r.photo_url,
  }));

  const withPhoto = reports.filter((r) => r.has_photo).length;
  const withoutPhoto = reports.filter((r) => !r.has_photo).length;

  const storage = await supabase.storage.from("pet-photos").list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  return NextResponse.json({
    ok: true,
    totals: {
      reports: reports.length,
      with_photo: withPhoto,
      without_photo: withoutPhoto,
      storage_files: storage.data?.length ?? null,
      storage_error: storage.error?.message ?? null,
    },
    reports,
    storage_files: (storage.data ?? [])
      .filter((f) => f.name && !f.name.startsWith("__health"))
      .map((f) => ({
        name: f.name,
        size: f.metadata?.size ?? null,
        created_at: f.created_at,
      })),
  });
}
