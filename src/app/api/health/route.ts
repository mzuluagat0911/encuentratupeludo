import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/** PNG 1x1 transparente mínimo para probar upload. */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

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

  // getBucket() falla con anon/publishable aunque el bucket exista.
  // Probamos list + upload como lo hace la app real.
  const list = await supabase.storage.from("pet-photos").list("", { limit: 1 });

  const probeName = `__health_${Date.now()}.png`;
  const upload = await supabase.storage
    .from("pet-photos")
    .upload(probeName, TINY_PNG, {
      contentType: "image/png",
      upsert: true,
    });

  let uploadOk = !upload.error;
  let uploadDetail = upload.error?.message || "ok";

  if (uploadOk) {
    await supabase.storage.from("pet-photos").remove([probeName]);
  }

  const tableOk = !table.error;
  const listOk = !list.error;
  const storageOk = listOk || uploadOk;

  return NextResponse.json({
    ok: tableOk && uploadOk,
    mode: "supabase",
    checks: {
      table_pet_reports: tableOk ? "ok" : table.error?.message || "error",
      storage_list: listOk ? "ok" : list.error?.message || "error",
      storage_upload: uploadOk ? "ok" : uploadDetail,
      storage_ready: storageOk,
    },
  });
}
