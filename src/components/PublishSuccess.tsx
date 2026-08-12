"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, HeartHandshake, Link2 } from "lucide-react";
import type { ReportType } from "@/lib/types";

type Props = {
  reportId: string;
  reportType: ReportType;
  message?: string;
};

export function PublishSuccess({ reportId, reportType, message }: Props) {
  const [copied, setCopied] = useState(false);
  const [closeUrl, setCloseUrl] = useState(`/cerrar/${reportId}`);
  const isRescued = reportType === "rescatado";

  useEffect(() => {
    setCloseUrl(`${window.location.origin}/cerrar/${reportId}`);
  }, [reportId]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(closeUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (isRescued) {
    return (
      <div className="rounded-3xl border border-rescued/30 bg-rescued-soft px-6 py-10 text-center">
        <HeartHandshake className="mx-auto h-12 w-12 text-rescued" aria-hidden />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          ¡Historia publicada!
        </h2>
        <p className="mt-2 text-sm text-muted">
          {message ??
            "Gracias por compartir esperanza. Ya aparece en Rescatados."}
        </p>
        <Link
          href="/?tipo=rescatado"
          className="tap-target mt-5 inline-flex items-center justify-center rounded-2xl bg-rescued px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Ver rescatados
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-found/30 bg-found-soft px-5 py-8">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-found" aria-hidden />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          ¡Publicado!
        </h2>
        <p className="mt-2 text-sm text-muted">
          {message ?? "Tu reporte ya está en el feed."}
        </p>
      </div>

      <div className="rounded-2xl border border-rescued/20 bg-white px-4 py-4 text-left">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rescued">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Guarda este link
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Cuando tu peludo se reúna con su familia, ábrelo y márcalo como{" "}
          <strong className="text-foreground">rescatado</strong>. Solo quien
          tenga el link puede cerrar el caso.
        </p>
        <p className="mt-3 break-all rounded-xl bg-[#f3f7f4] px-3 py-2 text-xs font-medium text-foreground">
          {closeUrl}
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="tap-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rescued px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          <Copy className="h-4 w-4" aria-hidden />
          {copied ? "¡Copiado!" : "Copiar link para cerrar el caso"}
        </button>
      </div>

      <Link
        href="/"
        className="tap-target flex w-full items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-foreground hover:bg-white/80"
      >
        Ir al feed
      </Link>
    </div>
  );
}
