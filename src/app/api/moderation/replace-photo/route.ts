import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { photoOverridePath, reportPhotoAbsoluteUrl } from "@/lib/photoDisplay";

export const dynamic = "force-dynamic";

const PILARICA_ID = "5aab0690-2bf5-44cf-bbaf-f1af566f9b52";

async function loadOverrideBytes(id: string): Promise<Buffer | null> {
  const rel = photoOverridePath(id);
  if (!rel) return null;
  try {
    return await readFile(path.join(process.cwd(), "public", rel.replace(/^\//, "")));
  } catch {
    const url = reportPhotoAbsoluteUrl({ id, photo_url: null });
    if (!url) return null;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
}

/**
 * Sube el recorte manual al storage y actualiza photo_url.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, message: "Supabase no configurado" }, { status: 503 });
  }
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "No client" }, { status: 503 });
  }

  let id = PILARICA_ID;
  try {
    const body = (await request.json()) as { id?: string };
    if (body.id?.trim()) id = body.id.trim();
  } catch {
    // GET-style POST sin body: recorte de Pilarica
  }

  if (!photoOverridePath(id)) {
    return NextResponse.json({ ok: false, message: "No hay recorte para ese reporte" }, { status: 400 });
  }

  const bytes = await loadOverrideBytes(id);
  if (!bytes?.length) {
    return NextResponse.json({ ok: false, message: "No se pudo leer el recorte" }, { status: 500 });
  }

  const filename = `${id}-encuadre-${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage.from("pet-photos").upload(filename, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upErr) {
    return NextResponse.json({ ok: false, message: upErr.message, step: "upload" }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("pet-photos").getPublicUrl(filename);
  const { data, error } = await supabase
    .from("pet_reports")
    .update({ photo_url: pub.publicUrl })
    .eq("id", id)
    .select("id, photo_url, city, neighborhood");

  if (error) {
    return NextResponse.json({ ok: false, message: error.message, step: "update" }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath(`/reporte/${id}`);
  return NextResponse.json({ ok: true, updated: data });
}

export async function GET(request: Request) {
  return POST(request);
}
