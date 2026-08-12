import Image from "next/image";
import Link from "next/link";
import { Cat, Dog, HeartHandshake, MapPin, MessageCircle, UserRound } from "lucide-react";
import type { PetReport } from "@/lib/types";
import { formatRelativeDate } from "@/lib/format";
import { buildWhatsAppUrl, whatsappButtonLabel } from "@/lib/whatsapp";
import { isDemoReport } from "@/lib/demos";

type Props = {
  report: PetReport;
};

function typeLabel(type: PetReport["report_type"]): string {
  if (type === "perdido") return "Perdido";
  if (type === "encontrado") return "Encontrado";
  return "Rescatado";
}

function typeBadgeClass(type: PetReport["report_type"]): string {
  if (type === "perdido") return "bg-lost";
  if (type === "encontrado") return "bg-found";
  return "bg-rescued";
}

export function PetCard({ report }: Props) {
  const isRescued = report.report_type === "rescatado";
  const isDemo = isDemoReport(report.description);
  const PetIcon = report.pet_type === "perro" ? Dog : Cat;
  const wa = buildWhatsAppUrl(report);

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_8px_24px_-16px_rgba(26,46,40,0.35)]">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#e8f4ef] to-[#f3ebe3]">
        {report.photo_url ? (
          <Image
            src={report.photo_url}
            alt={`${report.pet_type} ${typeLabel(report.report_type).toLowerCase()} en ${report.city}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
            <PetIcon className="h-14 w-14 opacity-50" aria-hidden />
            <span className="text-sm font-medium capitalize">
              {report.pet_type} · sin foto
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-xl px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white ${typeBadgeClass(report.report_type)}`}
          >
            {typeLabel(report.report_type)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-white/95 px-2.5 py-1 text-xs font-semibold capitalize text-foreground">
            <PetIcon className="h-3.5 w-3.5" aria-hidden />
            {report.pet_type}
          </span>
          {isDemo ? (
            <span className="rounded-xl bg-amber-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Ejemplo
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start gap-2 text-sm text-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold leading-snug">{report.neighborhood}</p>
            <p className="text-muted">{report.city}</p>
          </div>
        </div>

        {report.responsible_name ? (
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <UserRound className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{report.responsible_name}</span>
          </p>
        ) : null}

        {report.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {report.description}
          </p>
        ) : null}

        <p className="text-xs font-medium text-muted/80">
          {formatRelativeDate(report.created_at)}
        </p>

        {isDemo ? (
          <Link
            href="/publicar"
            className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-white transition hover:bg-primary-dark active:scale-[0.99]"
          >
            Publicar el mío de verdad
          </Link>
        ) : isRescued ? (
          <div className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-rescued-soft px-4 py-3.5 text-sm font-bold text-rescued">
            <HeartHandshake className="h-5 w-5" aria-hidden />
            ¡Ya está con su familia!
          </div>
        ) : (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#1ebe57] active:scale-[0.99]"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            {whatsappButtonLabel(report.report_type)}
          </a>
        )}
      </div>
    </article>
  );
}
