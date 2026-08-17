"use client";

import Image from "next/image";
import {
  Cat,
  Dog,
  MapPin,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react";
import type { PetReport, ReportType } from "@/lib/types";
import { formatRelativeDate } from "@/lib/format";
import { buildWhatsAppUrl, whatsappButtonLabel } from "@/lib/whatsapp";
import { reportPhotoSrc } from "@/lib/photoDisplay";
import { reportTypeBadgeClass, reportTypeLabel } from "@/lib/reportCopy";

type Props = {
  candidates: PetReport[];
  yourType: ReportType;
  checking: boolean;
  publishing: boolean;
  onPublishAnyway: () => void;
  onBack: () => void;
  error?: string;
};

function introCopy(yourType: ReportType, count: number): string {
  const n = count === 1 ? "1 reporte" : `${count} reportes`;
  if (yourType === "perdido") {
    return `Hay ${n} de mascotas vistas/encontradas en tu ciudad con el mismo tipo de animal. Revisa si alguno es el tuyo antes de publicar.`;
  }
  return `Hay ${n} de mascotas perdidas en tu ciudad con el mismo tipo de animal. Revisa si alguno es el que encontraste antes de publicar.`;
}

export function MatchReview({
  candidates,
  yourType,
  checking,
  publishing,
  onPublishAnyway,
  onBack,
  error,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-primary/20 bg-white px-5 py-5">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
          <Search className="h-3.5 w-3.5" aria-hidden />
          Posibles coincidencias
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
          ¿Alguno se parece?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {introCopy(yourType, candidates.length)} Filtramos por ciudad y tipo
          de animal; tú decides mirando las fotos. Si ninguno encaja, publica
          igual.
        </p>
      </div>

      <ul className="space-y-4">
        {candidates.map((report) => {
          const PetIcon = report.pet_type === "perro" ? Dog : Cat;
          const wa = buildWhatsAppUrl(report);
          const photo = reportPhotoSrc(report);
          return (
            <li
              key={report.id}
              className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_8px_24px_-16px_rgba(26,46,40,0.35)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#e8f4ef] to-[#f3ebe3]">
                {photo ? (
                  <>
                    <Image
                      src={photo}
                      alt=""
                      fill
                      aria-hidden
                      className="scale-110 object-cover blur-2xl opacity-50"
                      sizes="(max-width: 768px) 100vw, 480px"
                    />
                    <Image
                      src={photo}
                      alt={`${report.pet_type} ${reportTypeLabel(report.report_type).toLowerCase()} en ${report.city}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 480px"
                    />
                  </>
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
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white ${reportTypeBadgeClass(report.report_type)}`}
                  >
                    {reportTypeLabel(report.report_type)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-white/95 px-2.5 py-1 text-xs font-semibold capitalize text-foreground">
                    <PetIcon className="h-3.5 w-3.5" aria-hidden />
                    {report.pet_type}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold leading-snug">
                      {report.neighborhood}
                    </p>
                    <p className="text-muted">{report.city}</p>
                  </div>
                </div>

                {report.responsible_name ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <UserRound
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
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

                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#1ebe57] active:scale-[0.99]"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  {whatsappButtonLabel(report.report_type)}
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={onPublishAnyway}
          disabled={checking || publishing}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishing
            ? "Publicando…"
            : "Ninguno se parece — publicar igual"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={checking || publishing}
          className="tap-target flex w-full items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-foreground hover:bg-white/80 disabled:opacity-50"
        >
          Volver al formulario
        </button>
      </div>
    </div>
  );
}
