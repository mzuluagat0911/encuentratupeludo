import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Cat,
  Dog,
  HeartHandshake,
  MapPin,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ShareReportButton } from "@/components/ShareReportButton";
import {
  BackToFeedLink,
  NearAwareFeedLink,
} from "@/components/BackToFeedLink";
import { getReportById } from "@/lib/reports";
import { reportPhotoSrc } from "@/lib/photoDisplay";
import {
  reportShareDescription,
  reportShareTitle,
  reportTypeBadgeClass,
  reportTypeLabel,
} from "@/lib/reportCopy";
import { getSiteUrl, reportAbsoluteUrl } from "@/lib/site";
import { formatRelativeDate } from "@/lib/format";
import { buildWhatsAppUrl, whatsappButtonLabel } from "@/lib/whatsapp";
import { feedHrefFromParams } from "@/lib/nearNav";

type PageParams = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) {
    return { title: "Reporte no encontrado | Ubica tu Peludo" };
  }

  const title = reportShareTitle(report);
  const description = reportShareDescription(report);
  const url = reportAbsoluteUrl(report.id);
  // Query único por reporte: Meta cachea fuerte y si no, reusa la foto del anuncio anterior
  const bust = `${report.id.slice(0, 8)}-${Date.parse(report.created_at) || 0}`;
  const ogImage = `${getSiteUrl()}/reporte/${report.id}/opengraph-image?v=${bust}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Ubica tu Peludo",
      locale: "es_CO",
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${report.pet_type} ${reportTypeLabel(report.report_type).toLowerCase()} en ${report.city}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ReportePage({
  params,
  searchParams,
}: PageParams) {
  const { id } = await params;
  const query = await searchParams;
  const report = await getReportById(id);
  if (!report) notFound();

  const isRescued = report.report_type === "rescatado";
  const PetIcon = report.pet_type === "perro" ? Dog : Cat;
  const wa = buildWhatsAppUrl(report);
  const photo = reportPhotoSrc(report);
  const feedHref = feedHrefFromParams({
    lat: typeof query.lat === "string" ? query.lat : undefined,
    lng: typeof query.lng === "string" ? query.lng : undefined,
    radio: typeof query.radio === "string" ? query.radio : undefined,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 pb-20">
        <BackToFeedLink href={feedHref} />

        <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_8px_24px_-16px_rgba(26,46,40,0.35)]">
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#e8f4ef] to-[#f3ebe3]">
            {photo ? (
              <>
                <Image
                  src={photo}
                  alt=""
                  fill
                  aria-hidden
                  className="scale-110 object-cover blur-2xl opacity-50"
                  sizes="(max-width: 768px) 100vw, 560px"
                  priority
                />
                <Image
                  src={photo}
                  alt={`${report.pet_type} ${reportTypeLabel(report.report_type).toLowerCase()} en ${report.city}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 560px"
                  priority
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

          <div className="space-y-4 p-4">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
              {report.pet_type === "perro" ? "Perro" : "Gato"}{" "}
              {reportTypeLabel(report.report_type).toLowerCase()}
            </h1>

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
              <p className="text-sm leading-relaxed text-muted">
                {report.description}
              </p>
            ) : null}

            <p className="text-xs font-medium text-muted/80">
              {formatRelativeDate(report.created_at)}
            </p>

            <div className="space-y-3 pt-1">
              {isRescued ? (
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
              <ShareReportButton
                report={report}
                variant="primary"
                label="Compartir este reporte"
              />
            </div>
          </div>
        </article>

        <p className="mt-6 text-center text-sm text-muted">
          ¿No es el tuyo?{" "}
          <Link
            href="/publicar"
            className="font-semibold text-primary hover:underline"
          >
            Publica el tuyo
          </Link>{" "}
          o{" "}
          <NearAwareFeedLink
            href={feedHref}
            className="font-semibold text-primary hover:underline"
          >
            sigue buscando
          </NearAwareFeedLink>
          .
        </p>
      </main>
    </>
  );
}
