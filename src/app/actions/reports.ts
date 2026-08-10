"use server";

import { revalidatePath } from "next/cache";
import { createReport, usingLocalStore } from "@/lib/reports";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeColombianPhone } from "@/lib/whatsapp";
import type { PetType, ReportType } from "@/lib/types";
import { COLOMBIA_CITIES } from "@/lib/cities";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type PublishState = {
  ok: boolean;
  message?: string;
  reportId?: string;
};

function isValidReportType(v: FormDataEntryValue | null): v is ReportType {
  return v === "perdido" || v === "encontrado";
}

function isValidPetType(v: FormDataEntryValue | null): v is PetType {
  return v === "perro" || v === "gato";
}

async function uploadPhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede superar 5 MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext)
    ? ext
    : "jpg";
  const filename = `${randomUUID()}.${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    if (!supabase) throw new Error("Supabase no está configurado.");

    const { error } = await supabase.storage
      .from("pet-photos")
      .upload(filename, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error.message);
      throw new Error("No pudimos subir la foto. Intenta de nuevo.");
    }

    const { data } = supabase.storage.from("pet-photos").getPublicUrl(filename);
    return data.publicUrl;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), bytes);
  return `/uploads/${filename}`;
}

export async function publishReport(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  try {
    const reportType = formData.get("report_type");
    const petType = formData.get("pet_type");
    const city = String(formData.get("city") || "").trim();
    const neighborhood = String(formData.get("neighborhood") || "").trim();
    const phoneRaw = String(formData.get("phone") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const photo = formData.get("photo");

    if (!isValidReportType(reportType)) {
      return { ok: false, message: "Elige el tipo de reporte." };
    }
    if (!isValidPetType(petType)) {
      return { ok: false, message: "Elige si es perro o gato." };
    }
    if (!city || !(COLOMBIA_CITIES as readonly string[]).includes(city)) {
      return { ok: false, message: "Selecciona una ciudad válida." };
    }
    if (neighborhood.length < 3) {
      return {
        ok: false,
        message: "Indica el sector, barrio o lugar (mínimo 3 caracteres).",
      };
    }

    const phone = normalizeColombianPhone(phoneRaw);
    if (phone.length < 10) {
      return {
        ok: false,
        message: "Ingresa un celular colombiano válido (10 dígitos).",
      };
    }

    let photoUrl: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      photoUrl = await uploadPhoto(photo);
    }

    const report = await createReport({
      report_type: reportType,
      pet_type: petType,
      photo_url: photoUrl,
      city,
      neighborhood,
      phone,
      description: description || null,
    });

    revalidatePath("/");
    return {
      ok: true,
      reportId: report.id,
      message: usingLocalStore()
        ? "¡Publicado! (modo local — configura Supabase para producción)"
        : "¡Reporte publicado!",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.";
    return { ok: false, message };
  }
}
