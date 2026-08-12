import Link from "next/link";
import { ArrowRight, HeartHandshake, Home, Stethoscope, Wallet } from "lucide-react";
import type { HubCity } from "@/lib/hubs";
import { hubTypeLabel } from "@/lib/hubs";

type Props = {
  hubs: HubCity[];
};

function HubCard({ hub }: { hub: HubCity }) {
  const place = hub.places[0];
  const previewNeeds = place?.needs.slice(0, 2) ?? [];
  const isVet = place?.type === "veterinaria";

  return (
    <article className="flex w-[min(85vw,20rem)] shrink-0 flex-col rounded-3xl border border-primary/20 bg-white/85 p-4 shadow-[0_10px_28px_-18px_rgba(15,118,110,0.55)] sm:w-auto sm:min-w-0 sm:flex-1">
      <p className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        <HeartHandshake className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {isVet ? "Atención vet" : "Donar · hogar"} · {hub.city}
      </p>

      <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
        {place ? place.name : `Ayuda en ${hub.city}`}
      </h2>
      <p className="mt-1.5 line-clamp-3 text-sm leading-snug text-muted">
        {place?.note ||
          (place?.seeksFosterHomes
            ? "Reciben insumos, donaciones y buscan más hogares de paso."
            : "Lugar de confianza para donar e insumos.")}
      </p>

      {place ? (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-primary/80">
          {hubTypeLabel(place.type)}
        </p>
      ) : null}

      {previewNeeds.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {previewNeeds.map((need) => (
            <li
              key={need}
              className="rounded-xl bg-found-soft px-2 py-1 text-[10px] font-semibold text-found"
            >
              {need}
            </li>
          ))}
          {place && place.needs.length > previewNeeds.length ? (
            <li className="rounded-xl bg-white px-2 py-1 text-[10px] font-semibold text-muted ring-1 ring-line">
              + más
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Link
          href={`/ayuda/${hub.slug}`}
          className="tap-target inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark active:scale-[0.98]"
        >
          {isVet ? (
            <>
              <Stethoscope className="h-4 w-4 shrink-0" aria-hidden />
              Ver atención
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 shrink-0" aria-hidden />
              Donar / insumos
            </>
          )}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        {place?.seeksFosterHomes ? (
          <Link
            href={`/ayuda/${hub.slug}`}
            className="tap-target inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-white px-3 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5 active:scale-[0.98]"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            Ser hogar de paso
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function CityHelpBanner({ hubs }: Props) {
  if (!hubs.length) return null;

  return (
    <section
      aria-label="Ayuda por ciudad"
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
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">
              Ayuda local
            </p>
            <p className="text-sm font-semibold text-foreground sm:text-base">
              {hubs.length === 1
                ? `Punto de ayuda en ${hubs[0].city}`
                : `${hubs.length} ciudades con lugares de ayuda`}
            </p>
          </div>
          <Link
            href="/ayuda"
            className="shrink-0 text-sm font-bold text-primary underline-offset-2 hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <div
          className={`flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible ${
            hubs.length === 1 ? "sm:block" : "sm:grid sm:grid-cols-2"
          }`}
        >
          {hubs.map((hub) => (
            <HubCard key={hub.slug} hub={hub} />
          ))}
        </div>
      </div>
    </section>
  );
}
