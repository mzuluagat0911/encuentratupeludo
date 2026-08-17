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
  nearestCityName,
  parseCoord,
  parseNearRadius,
} from "@/lib/geo";
import { nearSearchString } from "@/lib/nearNav";

function parseTipo(value?: string): ReportType | "todas" {
  if (
    value === "perdido" ||
    value === "encontrado" ||
    value === "rescatado" ||
    value === "adopcion"
  ) {
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
  const radiusKm = nearMe
    ? parseNearRadius(
        typeof params.radio === "string" ? params.radio : undefined,
      )
    : undefined;

  const reports = await listReports({
    reportType: nearMe ? "todas" : tipo,
    petType: animal,
    city: nearMe ? "todas" : ciudad,
    responsible: responsable || undefined,
    lat: nearMe?.lat,
    lng: nearMe?.lng,
    radiusKm,
  });
  const counts = await countFeedReports();
  const helpHubs = hubsForFeedBanner(nearMe && nearCity ? nearCity : ciudad);
  const nearQuery = nearMe
    ? nearSearchString({
        lat: nearMe.lat,
        lng: nearMe.lng,
        radio: radiusKm === 3 || radiusKm === 5 ? radiusKm : undefined,
      })
    : undefined;

  return (
    <>
      <SiteHeader
        rescued={counts.rescatado}
        lost={counts.perdido}
        seen={counts.encontrado}
        adopt={counts.adopcion}
      />
      <main className="flex-1 pb-24">
        {nearMe ? null : <HomeHero />}
        {nearMe ? null : <CityHelpBanner hubs={helpHubs} />}
        <section
          id="reportes"
          className={`mx-auto max-w-3xl px-3 sm:px-4 ${nearMe ? "py-3" : "py-6"}`}
        >
          {usingLocalStore() ? <LocalModeBanner /> : null}

          {nearMe ? (
            <div className="mb-2">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-foreground">
                De tu lado
                {nearCity ? (
                  <span className="font-[family-name:var(--font-body)] text-sm font-medium text-muted">
                    {" "}
                    · {nearCity}
                  </span>
                ) : null}
              </h2>
            </div>
          ) : (
            <div className="mb-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
                Reportes recientes
              </h2>
              <p className="mt-1 text-sm text-muted">
                Permite ubicación para ver qué hay de tu lado, o filtra por
                ciudad.
              </p>
            </div>
          )}

          {nearMe ? (
            <NearbyMap
              origin={nearMe}
              reports={reports}
              radiusKm={radiusKm}
            />
          ) : null}

          {nearMe ? null : (
            <Suspense
              fallback={
                <div className="h-16 animate-pulse rounded-2xl bg-white/60" />
              }
            >
              <FeedFilters />
            </Suspense>
          )}

          <div className={`grid gap-4 ${nearMe ? "mt-3" : "mt-5"}`}>
            {reports.length === 0 ? (
              <EmptyState near={Boolean(nearMe)} />
            ) : (
              reports.map((report) => (
                <PetCard
                  key={report.id}
                  report={report}
                  nearQuery={nearQuery}
                />
              ))
            )}
          </div>
        </section>
      </main>
      <PublishFab />
    </>
  );
}
