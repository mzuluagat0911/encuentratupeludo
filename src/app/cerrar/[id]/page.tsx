import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Cat, Dog, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { CloseCaseForm } from "@/components/CloseCaseForm";
import { getReportById } from "@/lib/reports";
import { reportPhotoSrc } from "@/lib/photoDisplay";

type PageParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageParams) {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) return { title: "Cerrar caso | Ubica tu Peludo" };
  return {
    title: `Cerrar caso · ${report.city} | Ubica tu Peludo`,
    robots: { index: false, follow: false },
  };
}

export default async function CerrarCasoPage({ params }: PageParams) {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) notFound();

  const PetIcon = report.pet_type === "perro" ? Dog : Cat;
  const photo = reportPhotoSrc(report);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 pb-16">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al feed
        </Link>

        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
          {report.report_type === "adopcion"
            ? "¿Ya encontró un hogar?"
            : "¿Ya se reunieron?"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Este link es privado para quien publicó el reporte. Úsalo solo cuando
          {report.report_type === "adopcion"
            ? " el animalito ya tenga familia."
            : " el animalito ya esté con su familia."}
        </p>

        <article className="mt-6 overflow-hidden rounded-3xl border border-line bg-card">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#e8f4ef] to-[#f3ebe3]">
            {photo ? (
              <Image
                src={photo}
                alt={`${report.pet_type} en ${report.city}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <PetIcon className="h-14 w-14 opacity-50" aria-hidden />
              </div>
            )}
          </div>
          <div className="space-y-2 p-4">
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-semibold">{report.neighborhood}</span>
                <span className="mt-0.5 block text-muted">{report.city}</span>
              </span>
            </p>
            {report.description ? (
              <p className="text-sm text-muted">{report.description}</p>
            ) : null}
          </div>
        </article>

        <div className="mt-4">
          <CloseCaseForm report={report} />
        </div>
      </main>
    </>
  );
}
