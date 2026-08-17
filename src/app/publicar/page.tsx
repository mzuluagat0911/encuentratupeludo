import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReportForm } from "@/components/ReportForm";
import { LocalModeBanner } from "@/components/LocalModeBanner";
import { usingLocalStore } from "@/lib/reports";
import { isReportType } from "@/lib/types";

export const metadata = {
  title: "Publicar reporte | Ubica tu Peludo",
  description:
    "Reporta una mascota perdida, vista, rescatada o en adopción en Colombia. Sin registro.",
};

export default async function PublicarPage({
  searchParams,
}: PageProps<"/publicar">) {
  const params = await searchParams;
  const rawTipo = typeof params.tipo === "string" ? params.tipo : undefined;
  const initialType = isReportType(rawTipo) ? rawTipo : null;

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
          Publicar reporte
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Elige el tipo de situación y completa lo esencial. Tu número solo se
          usa para WhatsApp. También puedes publicar un peludito en adopción.
        </p>

        <div className="mt-6">
          {usingLocalStore() ? <LocalModeBanner /> : null}
          <ReportForm initialType={initialType} />
        </div>
      </main>
    </>
  );
}
