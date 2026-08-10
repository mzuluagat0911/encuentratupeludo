import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeHero } from "@/components/HomeHero";
import { FeedFilters } from "@/components/FeedFilters";
import { PetCard } from "@/components/PetCard";
import { EmptyState } from "@/components/EmptyState";
import { LocalModeBanner } from "@/components/LocalModeBanner";
import { PublishFab } from "@/components/PublishFab";
import { listReports, usingLocalStore } from "@/lib/reports";
import type { PetType, ReportType } from "@/lib/types";

function parseTipo(value?: string): ReportType | "todas" {
  if (value === "perdido" || value === "encontrado") return value;
  return "todas";
}

function parseAnimal(value?: string): PetType | "todos" {
  if (value === "perro" || value === "gato") return value;
  return "todos";
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const tipo = parseTipo(
    typeof params.tipo === "string" ? params.tipo : undefined,
  );
  const animal = parseAnimal(
    typeof params.animal === "string" ? params.animal : undefined,
  );
  const ciudad =
    typeof params.ciudad === "string" && params.ciudad
      ? params.ciudad
      : "todas";

  const reports = await listReports({
    reportType: tipo,
    petType: animal,
    city: ciudad,
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-24">
        <HomeHero />
        <section id="reportes" className="mx-auto max-w-3xl px-4 py-6">
          {usingLocalStore() ? <LocalModeBanner /> : null}

          <div className="mb-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
              Reportes recientes
            </h2>
            <p className="mt-1 text-sm text-muted">
              Filtra y contacta por WhatsApp sin crear cuenta.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-28 animate-pulse rounded-3xl bg-white/60" />
            }
          >
            <FeedFilters />
          </Suspense>

          <div className="mt-5 grid gap-4">
            {reports.length === 0 ? (
              <EmptyState />
            ) : (
              reports.map((report) => (
                <PetCard key={report.id} report={report} />
              ))
            )}
          </div>
        </section>
      </main>
      <PublishFab />
    </>
  );
}
