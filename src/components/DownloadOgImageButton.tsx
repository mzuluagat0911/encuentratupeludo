"use client";

import { Download } from "lucide-react";

type Props = {
  reportId: string;
  className?: string;
};

/** Imagen 1200×630 lista para subir como creativo en Meta Ads. */
export function DownloadOgImageButton({ reportId, className = "" }: Props) {
  const href = `/reporte/${reportId}/opengraph-image?v=${reportId.slice(0, 8)}`;

  return (
    <a
      href={href}
      download={`ubica-tu-peludo-${reportId}.png`}
      target="_blank"
      rel="noopener noreferrer"
      className={`tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-white px-4 py-3.5 text-sm font-bold text-primary transition hover:bg-primary/5 active:scale-[0.99] ${className}`}
    >
      <Download className="h-5 w-5" aria-hidden />
      Descargar imagen para Meta Ads
    </a>
  );
}
