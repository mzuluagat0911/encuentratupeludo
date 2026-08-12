/**
 * URL canónica del sitio (para Open Graph, Meta ads y compartir).
 * En Vercel usa VERCEL_URL si no hay NEXT_PUBLIC_SITE_URL.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

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
