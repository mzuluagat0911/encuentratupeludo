import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

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

  const tableRead = await supabase
    .from("pet_reports")
    .select("id")
    .neq("neighborhood", "__health_probe__")
    .limit(5);

  const countRes = await supabase
    .from("pet_reports")
    .select("id", { count: "exact", head: true })
    .neq("neighborhood", "__health_probe__");

  const list = await supabase.storage.from("pet-photos").list("", { limit: 1 });

  const probeName = `__health_${Date.now()}.png`;
  const upload = await supabase.storage
    .from("pet-photos")
    .upload(probeName, TINY_PNG, {
      contentType: "image/png",
      upsert: true,
    });

  const uploadOk = !upload.error;
  if (uploadOk) {
    await supabase.storage.from("pet-photos").remove([probeName]);
  }

  const insert = await supabase
    .from("pet_reports")
    .insert({
      report_type: "encontrado",
      pet_type: "perro",
      photo_url: null,
      city: "Bogotá",
      neighborhood: "__health_probe__",
      phone: "3000000000",
      description: "Probe automático",
    })
    .select("id")
    .single();

  const insertOk = !insert.error && Boolean(insert.data?.id);
  const insertDetail = insert.error?.message || "ok";

  if (insert.data?.id) {
    await supabase.from("pet_reports").delete().eq("id", insert.data.id);
  }

  const readOk = !tableRead.error;

  return NextResponse.json({
    ok: readOk && insertOk && uploadOk,
    mode: "supabase",
    report_count: countRes.count ?? 0,
    checks: {
      table_read: readOk ? "ok" : tableRead.error?.message || "error",
      table_insert: insertOk ? "ok" : insertDetail,
      storage_list: !list.error ? "ok" : list.error?.message || "error",
      storage_upload: uploadOk ? "ok" : upload.error?.message || "error",
    },
  });
}
