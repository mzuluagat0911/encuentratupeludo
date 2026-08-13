"use server";

import { revalidatePath } from "next/cache";
import { createReport, usingLocalStore } from "@/lib/reports";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeColombianPhone } from "@/lib/whatsapp";
import type { PetReport, PetType, ReportType } from "@/lib/types";
import { COLOMBIA_CITIES } from "@/lib/cities";
import { checkPublishContent } from "@/lib/contentFilter";
import { looksLikeRescuedDescription } from "@/lib/rescued";
import { sanitizeResponsibleName } from "@/lib/responsible";
import { geocodeReportPlace } from "@/lib/geocode";
import { estimateReportPoint } from "@/lib/geo";
import {
  findCandidateMatches,
  oppositeReportType,
} from "@/lib/matches";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type PublishState = {
  ok: boolean;
  message?: string;
  reportId?: string;
  reportType?: ReportType;
};

export type PreviewMatchesState = {
  ok: boolean;
  message?: string;
  candidates?: PetReport[];
  /** true si no aplica revisión (rescatado) o no hubo candidatos */
  skipReview?: boolean;
};

function isValidReportType(
  v: FormDataEntryValue | null,
): v is ReportType {
  return v === "perdido" || v === "encontrado" || v === "rescatado";
}

function isValidPetType(v: FormDataEntryValue | null): v is PetType {
  return v === "perro" || v === "gato";
}

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  // iPhone a veces manda type vacío con HEIC/JPEG
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif"].includes(ext);
}

async function uploadPhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!looksLikeImage(file)) {
    throw new Error("El archivo debe ser una imagen (JPG, PNG o WEBP).");
  }
  // Vercel limita el body ~4.5 MB; dejamos margen
  if (file.size > 4 * 1024 * 1024) {
    throw new Error(
      "La imagen es muy pesada (máx. 4 MB). Comprímela o toma otra foto.",
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif"].includes(
    ext,
  )
    ? ext === "jpeg"
      ? "jpg"
      : ext
    : "jpg";
  const filename = `${randomUUID()}.${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType =
    file.type && file.type.startsWith("image/")
      ? file.type
      : safeExt === "png"
        ? "image/png"
        : safeExt === "webp"
          ? "image/webp"
          : "image/jpeg";

  if (isSupabaseConfigured()) {
    const supabase = createServerClient();
    if (!supabase) throw new Error("Supabase no está configurado.");

    const { error } = await supabase.storage
      .from("pet-photos")
      .upload(filename, bytes, {
        contentType,
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

/**
 * Busca posibles coincidencias sin IA (ciudad + animal + tipo contrario).
 * Si no hay ninguna, el cliente publica directo.
 */
export async function previewMatches(input: {
  reportType: string;
  petType: string;
  city: string;
  neighborhood: string;
}): Promise<PreviewMatchesState> {
  try {
    const reportType = input.reportType;
    const petType = input.petType;
    const city = input.city.trim();
    const neighborhood = input.neighborhood.trim();

    if (!isValidReportType(reportType)) {
      return { ok: false, message: "Elige el tipo de reporte." };
    }
    if (!oppositeReportType(reportType)) {
      return { ok: true, candidates: [], skipReview: true };
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

    const ranked = await findCandidateMatches({
      reportType,
      petType,
      city,
      neighborhood,
      limit: 8,
    });

    const candidates = ranked.map((r) => r.report);
    return {
      ok: true,
      candidates,
      skipReview: candidates.length === 0,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No pudimos buscar coincidencias.";
    return { ok: false, message };
  }
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
    const responsibleName = sanitizeResponsibleName(
      String(formData.get("responsible_name") || ""),
    );
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
    if (!responsibleName) {
      return {
        ok: false,
        message: "Escribe el nombre de quien publica (solo letras, 2 a 60 caracteres).",
      };
    }

    const contentCheck = checkPublishContent({
      neighborhood,
      description,
      responsibleName,
    });
    if (contentCheck.blocked) {
      return { ok: false, message: contentCheck.reason };
    }

    const phone = normalizeColombianPhone(phoneRaw);
    if (phone.length < 10) {
      return {
        ok: false,
        message: "Ingresa un celular colombiano válido (10 dígitos).",
      };
    }

    if (!(photo instanceof File) || photo.size === 0) {
      return {
        ok: false,
        message: "La foto es obligatoria para publicar el reporte.",
      };
    }

    const photoUrl = await uploadPhoto(photo);
    if (!photoUrl) {
      return {
        ok: false,
        message: "No pudimos guardar la foto. Intenta con otra imagen.",
      };
    }

    const finalType: ReportType =
      reportType === "rescatado" || looksLikeRescuedDescription(description)
        ? "rescatado"
        : reportType;

    const fallback = estimateReportPoint({ city, neighborhood }).point;
    let coords = fallback;
    try {
      coords = await Promise.race([
        geocodeReportPlace(city, neighborhood),
        new Promise<typeof fallback>((resolve) => {
          setTimeout(() => resolve(fallback), 2000);
        }),
      ]);
    } catch {
      coords = fallback;
    }

    const report = await createReport({
      report_type: finalType,
      pet_type: petType,
      photo_url: photoUrl,
      city,
      neighborhood,
      phone,
      responsible_name: responsibleName,
      description: description || null,
      lat: coords.lat,
      lng: coords.lng,
    });

    revalidatePath("/");
    return {
      ok: true,
      reportId: report.id,
      reportType: report.report_type,
      message:
        report.report_type === "rescatado"
          ? "¡Gracias por compartir una historia de esperanza!"
          : usingLocalStore()
            ? "¡Publicado! (modo local — configura Supabase para producción)"
            : "¡Reporte publicado!",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.";
    return { ok: false, message };
  }
}
