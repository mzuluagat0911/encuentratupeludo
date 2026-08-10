import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        mode: "local",
        message: "Faltan variables de Supabase en el entorno.",
      },
      { status: 503 },
    );
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, mode: "error", message: "No se pudo crear el cliente." },
      { status: 503 },
    );
  }

  const table = await supabase.from("pet_reports").select("id").limit(1);
  const bucket = await supabase.storage.getBucket("pet-photos");

  const tableOk = !table.error;
  const bucketOk = !bucket.error && Boolean(bucket.data);

  return NextResponse.json({
    ok: tableOk && bucketOk,
    mode: "supabase",
    checks: {
      table_pet_reports: tableOk
        ? "ok"
        : table.error?.message || "error",
      storage_pet_photos: bucketOk
        ? "ok"
        : bucket.error?.message || "bucket no encontrado",
    },
  });
}
