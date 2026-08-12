import {
  Clock3,
  HeartHandshake,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Wallet,
} from "lucide-react";
import type { HubPlace } from "@/lib/hubs";
import { buildHubWhatsAppUrl, hubTypeLabel } from "@/lib/hubs";

type Props = {
  place: HubPlace;
};

export function HubPlaceCard({ place }: Props) {
  const wa = buildHubWhatsAppUrl(place);

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_8px_24px_-16px_rgba(26,46,40,0.35)]">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {hubTypeLabel(place.type)}
          </span>
          {place.detailsPending ? (
            <span className="rounded-xl bg-accent/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
              Datos en confirmación
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
            {place.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{place.note}</p>
        </div>

        <div className="space-y-2 text-sm">
          {place.address ? (
            <p className="flex items-start gap-2 text-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-semibold">{place.address}</span>
                <span className="mt-0.5 block text-muted">
                  {place.neighborhood}
                </span>
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2 text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                {place.neighborhood} · coordinar entrega por WhatsApp o Instagram
              </span>
            </p>
          )}
          {place.hours ? (
            <p className="flex items-start gap-2 text-muted">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{place.hours}</span>
            </p>
          ) : null}
        </div>

        {place.needs.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Qué necesitan
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {place.needs.map((need) => (
                <li
                  key={need}
                  className="rounded-xl bg-found-soft px-2.5 py-1 text-xs font-semibold text-found"
                >
                  {need}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {place.nequi ? (
          <div className="rounded-2xl bg-primary/5 px-3.5 py-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <Wallet className="h-3.5 w-3.5" aria-hidden />
              Nequi o Llave
            </p>
            <p className="mt-1.5 select-all font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
              {place.nequi}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {place.donate}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-primary/5 px-3.5 py-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
              Cómo donar
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">
              {place.donate}
            </p>
          </div>
        )}

        {place.seeksFosterHomes ? (
          <div className="rounded-2xl border border-accent/30 bg-amber-50 px-3.5 py-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">
              <Home className="h-3.5 w-3.5" aria-hidden />
              Buscan hogares de paso
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-950/80">
              Si puedes acoger un animalito un tiempo, escríbeles. Cada casa
              cuenta.
            </p>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1ebe57] active:scale-[0.99]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          ) : null}
          {place.instagramUrl ? (
            <a
              href={place.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99]"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
              {place.instagramHandle || "Instagram"}
            </a>
          ) : null}
          {place.mapsUrl ? (
            <a
              href={place.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-foreground transition hover:bg-primary/5 active:scale-[0.99] sm:col-span-2"
            >
              <Navigation className="h-4 w-4 text-primary" aria-hidden />
              Cómo llegar
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
