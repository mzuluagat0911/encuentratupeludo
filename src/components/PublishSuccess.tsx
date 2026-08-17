"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Download,
  HeartHandshake,
  Link2,
  Share2,
} from "lucide-react";
import type { ReportType } from "@/lib/types";
import { reportPath } from "@/lib/site";

type Props = {
  reportId: string;
  reportType: ReportType;
  message?: string;
};

export function PublishSuccess({ reportId, reportType, message }: Props) {
  const [copiedClose, setCopiedClose] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [closeUrl, setCloseUrl] = useState(`/cerrar/${reportId}`);
  const [shareUrl, setShareUrl] = useState(reportPath(reportId));
  const isRescued = reportType === "rescatado";
  const isAdopt = reportType === "adopcion";
  const ogHref = `${reportPath(reportId)}/opengraph-image`;

  useEffect(() => {
    const origin = window.location.origin;
    setCloseUrl(`${origin}/cerrar/${reportId}`);
    setShareUrl(`${origin}${reportPath(reportId)}`);
  }, [reportId]);

  async function copy(text: string, which: "close" | "share") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "close") {
        setCopiedClose(true);
        window.setTimeout(() => setCopiedClose(false), 2000);
      } else {
        setCopiedShare(true);
        window.setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch {
      window.prompt("Copia este link:", text);
    }
  }

  async function nativeShare() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "Ubica tu Peludo",
          text: isAdopt
            ? "Hay un peludito en adopción"
            : "Ayuda a encontrar a este peludo",
          url: shareUrl,
        });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    await copy(shareUrl, "share");
  }

  const metaBlock = (
    <div className="rounded-2xl border border-primary/20 bg-white px-4 py-4 text-left">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        Para pautar en Meta
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        1) Copia el link del reporte como destino. 2) Descarga la imagen y
        súbela como creativo del anuncio (Meta no arma el anuncio solo con el
        preview).
      </p>
      <p className="mt-3 break-all rounded-xl bg-[#f3f7f4] px-3 py-2 text-xs font-medium text-foreground">
        {shareUrl}
      </p>
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={nativeShare}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Compartir link
        </button>
        <button
          type="button"
          onClick={() => copy(shareUrl, "share")}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-foreground"
        >
          <Copy className="h-4 w-4" aria-hidden />
          {copiedShare ? "¡Copiado!" : "Copiar link"}
        </button>
        <a
          href={ogHref}
          download={`ubica-tu-peludo-${reportId}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-white px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5"
        >
          <Download className="h-4 w-4" aria-hidden />
          Descargar imagen del anuncio
        </a>
      </div>
      <Link
        href={reportPath(reportId)}
        className="mt-3 block text-center text-sm font-semibold text-primary hover:underline"
      >
        Ver página del reporte
      </Link>
    </div>
  );

  if (isRescued) {
    return (
      <div className="space-y-4 rounded-3xl border border-rescued/30 bg-rescued-soft px-5 py-8">
        <div className="text-center">
          <HeartHandshake
            className="mx-auto h-12 w-12 text-rescued"
            aria-hidden
          />
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
            ¡Historia publicada!
          </h2>
          <p className="mt-2 text-sm text-muted">
            {message ??
              "Gracias por compartir esperanza. Ya aparece en Rescatados."}
          </p>
        </div>

        {metaBlock}

        <Link
          href="/?tipo=rescatado"
          className="tap-target flex w-full items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-foreground hover:bg-white/80"
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

      {metaBlock}

      <div className="rounded-2xl border border-rescued/20 bg-white px-4 py-4 text-left">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rescued">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Guarda este link (privado)
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Cuando {isAdopt ? "encuentre un hogar" : "tu peludo se reúna con su familia"}, ábrelo y márcalo como{" "}
          <strong className="text-foreground">rescatado</strong>. Solo quien
          tenga el link puede cerrar el caso.
        </p>
        <p className="mt-3 break-all rounded-xl bg-[#f3f7f4] px-3 py-2 text-xs font-medium text-foreground">
          {closeUrl}
        </p>
        <button
          type="button"
          onClick={() => copy(closeUrl, "close")}
          className="tap-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rescued px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          <Copy className="h-4 w-4" aria-hidden />
          {copiedClose ? "¡Copiado!" : "Copiar link para cerrar el caso"}
        </button>
      </div>

      <Link
        href={isAdopt ? "/?tipo=adopcion" : "/"}
        className="tap-target flex w-full items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-foreground hover:bg-white/80"
      >
        {isAdopt ? "Ver en adopción" : "Ir al feed"}
      </Link>
    </div>
  );
}
