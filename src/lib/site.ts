function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^https?:\/\//, "")}`;
}

/**
 * URL canónica del sitio (para Open Graph, Meta ads y compartir).
 * Prioridad: NEXT_PUBLIC_SITE_URL → dominio de producción Vercel → deployment.
 * Nunca uses el hostname de preview (…-xxx.vercel.app) al pautar.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalizeOrigin(explicit);

  // Dominio estable de producción (no el URL único del deployment)
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return normalizeOrigin(production);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return normalizeOrigin(vercel);

  return "http://localhost:3000";
}

export function reportPath(id: string): string {
  return `/reporte/${id}`;
}

export function reportAbsoluteUrl(id: string): string {
  return `${getSiteUrl()}${reportPath(id)}`;
}

export function absoluteAssetUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}
