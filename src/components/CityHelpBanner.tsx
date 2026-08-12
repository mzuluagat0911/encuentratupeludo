import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import type { HubCity } from "@/lib/hubs";

type Props = {
  hub: HubCity;
};

export function CityHelpBanner({ hub }: Props) {
  const place = hub.places[0];

  return (
    <section
      aria-label={`Ayuda en ${hub.city}`}
      className="border-b border-primary/15 bg-primary/5"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">
            <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
            Ayuda en {hub.city}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-base">
            {place
              ? `${place.name} · hogar de paso y donaciones`
              : "Lugares de paso y donaciones"}
          </p>
        </div>
        <Link
          href={`/ayuda/${hub.slug}`}
          className="tap-target inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          Ver lugares
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
