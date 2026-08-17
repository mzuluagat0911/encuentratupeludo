"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { COLOMBIA_CITIES } from "@/lib/cities";
import { NearMeButton } from "@/components/NearMeButton";

const TABS: {
  value: string;
  label: string;
  shortLabel?: string;
  tone?: "lost" | "found" | "rescued" | "adopt";
}[] = [
  { value: "todas", label: "Todas" },
  { value: "perdido", label: "Perdidos", tone: "lost" },
  {
    value: "encontrado",
    label: "Encontrados / Vistos",
    shortLabel: "Vistos",
    tone: "found",
  },
  { value: "rescatado", label: "Rescatados", tone: "rescued" },
  { value: "adopcion", label: "En adopción", shortLabel: "Adopción", tone: "adopt" },
];

const PET_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
] as const;

export function FeedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tipo = searchParams.get("tipo") || "todas";
  const animal = searchParams.get("animal") || "todos";
  const ciudad = searchParams.get("ciudad") || "todas";
  const nearMe = Boolean(searchParams.get("lat") && searchParams.get("lng"));
  const nombreParam = searchParams.get("nombre") || "";
  const [nombre, setNombre] = useState(nombreParam);
  const searchParamsRef = useRef(searchParams);
  const tablistRef = useRef<HTMLDivElement>(null);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    setNombre(nombreParam);
  }, [nombreParam]);

  useEffect(() => {
    const active = tablistRef.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    active?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tipo]);

  function pushParams(params: URLSearchParams) {
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value.trim() || value === "todas" || value === "todos") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    pushParams(params);
  }

  useEffect(() => {
    const trimmed = nombre.trim();
    if (trimmed === nombreParam.trim()) return;
    const t = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (!trimmed) params.delete("nombre");
      else params.set("nombre", trimmed);
      pushParams(params);
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce only on local input
  }, [nombre, nombreParam]);

  if (nearMe) return null;

  return (
    <div className="space-y-3">
      <NearMeButton />

      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Tipo de reporte"
        className="relative -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#f7fbf8] to-transparent"
        />
        {TABS.filter((tab) => !(nearMe && tab.value === "encontrado")).map((tab) => {
          const active = tipo === tab.value;
          const hrefParams = new URLSearchParams(searchParams.toString());
          if (tab.value === "todas") hrefParams.delete("tipo");
          else hrefParams.set("tipo", tab.value);
          const href = hrefParams.toString()
            ? `${pathname}?${hrefParams}`
            : pathname;

          return (
            <Link
              key={tab.value}
              href={href}
              scroll={false}
              role="tab"
              aria-selected={active}
              className={`tap-target inline-flex shrink-0 snap-start items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? tab.tone === "lost"
                    ? "bg-lost text-white"
                    : tab.tone === "found"
                      ? "bg-found text-white"
                      : tab.tone === "rescued"
                        ? "bg-rescued text-white"
                        : tab.tone === "adopt"
                          ? "bg-adopt text-white"
                          : "bg-foreground text-white"
                  : "border border-line bg-white/80 text-foreground hover:bg-white"
              }`}
            >
              {tab.shortLabel ? (
                <>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
            </Link>
          );
        })}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Nombre del responsable
        </span>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. María Gómez"
            autoComplete="off"
            enterKeyHint="search"
            className="tap-target w-full rounded-2xl border border-line bg-white py-3 pl-10 pr-3 text-sm font-medium text-foreground outline-none ring-primary focus:ring-2"
          />
        </div>
        <span className="mt-1 block text-[11px] text-muted">
          Busca por quien publicó. Los reportes viejos pueden no tener nombre.
        </span>
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Ciudad
          </span>
          <select
            value={nearMe ? "todas" : ciudad}
            disabled={nearMe}
            onChange={(e) => update("ciudad", e.target.value)}
            className="tap-target w-full rounded-2xl border border-line bg-white px-3 py-3 text-sm font-medium text-foreground outline-none ring-primary focus:ring-2 disabled:opacity-50"
          >
            <option value="todas">Todas las ciudades</option>
            {COLOMBIA_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Animal
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PET_OPTIONS.map((opt) => {
              const active = animal === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("animal", opt.value)}
                  className={`tap-target rounded-2xl px-2 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-primary text-white"
                      : "border border-line bg-white/80 text-foreground hover:bg-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </label>
      </div>
    </div>
  );
}
