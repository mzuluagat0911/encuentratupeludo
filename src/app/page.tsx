import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeHero } from "@/components/HomeHero";
import { FeedFilters } from "@/components/FeedFilters";
import { PetCard } from "@/components/PetCard";
import { EmptyState } from "@/components/EmptyState";
import { LocalModeBanner } from "@/components/LocalModeBanner";
import { PublishFab } from "@/components/PublishFab";
import { listReports, usingLocalStore } from "@/lib/reports";
import { countFeedReports } from "@/lib/rescueOps";
import { hubsForFeedBanner } from "@/lib/hubs";
import { CityHelpBanner } from "@/components/CityHelpBanner";
import { NearbyMap } from "@/components/NearbyMap";
import type { PetType, ReportType } from "@/lib/types";
import {
  isValidLatLng,
  NEAR_RADIUS_KM,
  nearestCityName,
  parseCoord,
} from "@/lib/geo";

function parseTipo(value?: string): ReportType | "todas" {
  if (value === "perdido" || value === "encontrado" || value === "rescatado") {
    return value;
  }
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
  const responsable =
    typeof params.nombre === "string" ? params.nombre.trim() : "";
  const lat = parseCoord(typeof params.lat === "string" ? params.lat : undefined);
  const lng = parseCoord(typeof params.lng === "string" ? params.lng : undefined);
  const nearMe =
    lat != null && lng != null && isValidLatLng(lat, lng)
      ? { lat, lng }
      : null;
  const nearCity = nearMe ? nearestCityName(nearMe) : null;

  const reports = await listReports({
    reportType: tipo,
    petType: animal,
    city: nearMe ? "todas" : ciudad,
    responsible: responsable || undefined,
    lat: nearMe?.lat,
    lng: nearMe?.lng,
  });
  const counts = await countFeedReports();
  const helpHubs = hubsForFeedBanner(nearMe && nearCity ? nearCity : ciudad);

  return (
    <>
      <SiteHeader
        rescued={counts.rescatado}
        lost={counts.perdido}
        seen={counts.encontrado}
      />
      <main className="flex-1 pb-24">
        <HomeHero />
        <CityHelpBanner hubs={helpHubs} />
        <section id="reportes" className="mx-auto max-w-3xl px-4 py-6">
          {usingLocalStore() ? <LocalModeBanner /> : null}

          <div className="mb-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
              {nearMe ? "Potencialmente cerca de ti" : "Reportes recientes"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {nearMe
                ? `Lo que puede estar de tu lado (~${NEAR_RADIUS_KM} km). Zona: ${nearCity}. Distancia aproximada por ciudad y barrio.`
                : "Permite ubicación para ver qué hay de tu lado, o filtra por ciudad."}
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-28 animate-pulse rounded-3xl bg-white/60" />
            }
          >
            <FeedFilters />
          </Suspense>

          {nearMe && reports.length > 0 ? (
            <div className="mt-5">
              <NearbyMap origin={nearMe} reports={reports} />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            {reports.length === 0 ? (
              <EmptyState near={Boolean(nearMe)} />
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
