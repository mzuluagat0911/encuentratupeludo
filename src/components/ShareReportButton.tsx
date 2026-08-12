"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import type { PetReport } from "@/lib/types";
import { reportPath } from "@/lib/site";
import { reportShareText } from "@/lib/reportCopy";

type Props = {
  report: PetReport;
  /** Estilo del botón */
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  label?: string;
};

export function ShareReportButton({
  report,
  variant = "secondary",
  className = "",
  label = "Compartir",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [absoluteUrl, setAbsoluteUrl] = useState(reportPath(report.id));

  useEffect(() => {
    setAbsoluteUrl(`${window.location.origin}${reportPath(report.id)}`);
  }, [report.id]);

  async function share() {
    const text = reportShareText(report);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: text.split("\n")[0],
          text,
          url: absoluteUrl,
        });
        return;
      }
    } catch (err) {
      // Usuario canceló o share falló → copiar
      if (err instanceof DOMException && err.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // último recurso: prompt
      window.prompt("Copia este link:", absoluteUrl);
    }
  }

  const base =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-dark"
      : variant === "ghost"
        ? "border border-line bg-white text-foreground hover:bg-white/80"
        : "border border-primary/25 bg-white text-primary hover:bg-primary/5";

  return (
    <button
      type="button"
      onClick={share}
      className={`tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition active:scale-[0.99] ${base} ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-5 w-5" aria-hidden />
          ¡Link copiado!
        </>
      ) : (
        <>
          <Share2 className="h-5 w-5" aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}
