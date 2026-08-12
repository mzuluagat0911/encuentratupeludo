import Link from "next/link";
import { ArrowLeft, ArrowRight, HeartHandshake, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { listHubCities } from "@/lib/hubs";

export const metadata = {
  title: "Ayuda en tu ciudad | Ubica tu Peludo",
  description:
    "Lugares de paso, veterinarias y puntos de donación para peluditos en Colombia.",
};

export default function AyudaIndexPage() {
  const cities = listHubCities();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16">
        <section className="border-b border-line/60">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al feed
            </Link>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <HeartHandshake className="h-4 w-4" aria-hidden />
              Donar · atender · acoger
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ayuda en tu ciudad
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Hogares de paso de confianza: atienden peluditos y reciben
              donaciones. Empezamos con Royi Pets en Cali. Cada ciudad puede
              tener el suyo.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {cities.map((hub, index) => {
            const featured = index === 0;
            return (
              <Link
                key={hub.slug}
                href={`/ayuda/${hub.slug}`}
                className={`block rounded-3xl border p-4 transition active:scale-[0.99] sm:p-5 ${
                  featured
                    ? "border-primary/30 bg-white shadow-[0_8px_24px_-16px_rgba(26,46,40,0.35)]"
                    : "border-line bg-white/80 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {featured ? (
                      <span className="mb-2 inline-block rounded-xl bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Destacada
                      </span>
                    ) : null}
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
                      {hub.city}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {hub.places.length === 1
                        ? "1 lugar de paso"
                        : `${hub.places.length} lugares de paso`}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {hub.places[0]?.note}
                    </p>
                  </div>
                  <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
