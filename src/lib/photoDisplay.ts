import { getSiteUrl } from "@/lib/site";

/**
 * Recortes manuales cuando la foto original es un flyer y tapa al peludo.
 * Ruta relativa en /public.
 */
const PHOTO_OVERRIDES: Record<string, string> = {
  // Pitbull café con blanco · Robledo Pilarica: recorte de la toma de abajo (cabeza)
  "5aab0690-2bf5-44cf-bbaf-f1af566f9b52":
    "/recrops/5aab0690-2bf5-44cf-bbaf-f1af566f9b52-v2.jpg",
};

export function photoOverridePath(id: string): string | null {
  return PHOTO_OVERRIDES[id] ?? null;
}

export function reportPhotoSrc(report: {
  id: string;
  photo_url: string | null | undefined;
}): string | null {
  const override = PHOTO_OVERRIDES[report.id];
  if (override) return override;
  return report.photo_url ?? null;
}

/** URL absoluta para OG, Meta y fetch del recorte. */
export function reportPhotoAbsoluteUrl(report: {
  id: string;
  photo_url: string | null | undefined;
}): string | null {
  const src = reportPhotoSrc(report);
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  return `${getSiteUrl()}${src}`;
}
