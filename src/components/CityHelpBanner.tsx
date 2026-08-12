import Link from "next/link";
import { ArrowRight, HeartHandshake, Home, Wallet } from "lucide-react";
import type { HubCity } from "@/lib/hubs";

type Props = {
  hub: HubCity;
};

export function CityHelpBanner({ hub }: Props) {
  const place = hub.places[0];
  const previewNeeds = place?.needs.slice(0, 3) ?? [];

  return (
    <section
      aria-label={`Donar y hogares de paso en ${hub.city}`}
      className="relative overflow-hidden border-b border-primary/20"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(640px 180px at 8% 0%, rgba(15,118,110,0.18), transparent 55%), radial-gradient(520px 160px at 95% 80%, rgba(245,158,11,0.18), transparent 50%), linear-gradient(135deg, #ecfdf5 0%, #fff7ed 100%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-4 sm:py-5">
        <div className="rounded-3xl border border-primary/20 bg-white/80 p-4 shadow-[0_10px_28px_-18px_rgba(15,118,110,0.55)] sm:p-5">
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">
            <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
            Donar · hogar de paso · {hub.city}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            {place ? place.name : `Ayuda en ${hub.city}`}
          </h2>
          <p className="mt-1.5 max-w-lg text-sm leading-snug text-muted sm:text-base">
            {place?.seeksFosterHomes
              ? "Reciben insumos, donaciones y buscan más hogares de paso. Tú puedes marcar la diferencia hoy."
              : "Lugares de confianza para donar e insumos en tu ciudad."}
          </p>

          {previewNeeds.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {previewNeeds.map((need) => (
                <li
                  key={need}
                  className="rounded-xl bg-found-soft px-2.5 py-1 text-[11px] font-semibold text-found"
                >
                  {need}
                </li>
              ))}
              {place && place.needs.length > previewNeeds.length ? (
                <li className="rounded-xl bg-white px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-line">
                  + más
                </li>
              ) : null}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/ayuda/${hub.slug}`}
              className="tap-target inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-dark active:scale-[0.98]"
            >
              <Wallet className="h-4 w-4" aria-hidden />
              Donar o llevar insumos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {place?.seeksFosterHomes ? (
              <Link
                href={`/ayuda/${hub.slug}`}
                className="tap-target inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/5 active:scale-[0.98] sm:flex-1"
              >
                <Home className="h-4 w-4" aria-hidden />
                Ser hogar de paso
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
