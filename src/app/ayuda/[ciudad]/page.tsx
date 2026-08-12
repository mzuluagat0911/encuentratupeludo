import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PawPrint } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { HubPlaceCard } from "@/components/HubPlaceCard";
import { getHubCityBySlug, listHubCities } from "@/lib/hubs";

export function generateStaticParams() {
  return listHubCities().map((hub) => ({ ciudad: hub.slug }));
}

type CiudadParams = {
  params: Promise<{ ciudad: string }>;
};

export async function generateMetadata({ params }: CiudadParams) {
  const { ciudad } = await params;
  const hub = getHubCityBySlug(ciudad);
  if (!hub) {
    return { title: "Ayuda | Ubica tu Peludo" };
  }
  return {
    title: `Ayuda en ${hub.city} | Ubica tu Peludo`,
    description: `Lugares de paso y donaciones para peluditos en ${hub.city}.`,
  };
}

export default async function AyudaCiudadPage({ params }: CiudadParams) {
  const { ciudad } = await params;
  const hub = getHubCityBySlug(ciudad);
  if (!hub) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16">
        <section className="relative overflow-hidden border-b border-line/60">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(700px 180px at 10% 0%, rgba(15,118,110,0.14), transparent 55%), linear-gradient(135deg, #f3f7f4 0%, #eef6f8 100%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 py-6 sm:py-8">
            <Link
              href="/ayuda"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Todas las ciudades
            </Link>
            <p className="mb-2 text-sm font-medium text-primary">
              {hub.city} · lugares de paso
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ayuda en {hub.city}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Veterinarias, albergues y puntos de acopio de confianza. Lleva
              donaciones o pregunta cómo apoyar.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {hub.places.map((place) => (
            <HubPlaceCard key={place.id} place={place} />
          ))}

          <Link
            href={`/?ciudad=${encodeURIComponent(hub.city)}`}
            className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-white transition hover:bg-primary-dark active:scale-[0.99]"
          >
            <PawPrint className="h-4 w-4" aria-hidden />
            Ver peludos perdidos en {hub.city}
          </Link>
        </section>
      </main>
    </>
  );
}
