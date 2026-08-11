"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { COLOMBIA_CITIES } from "@/lib/cities";

const TABS: {
  value: string;
  label: string;
  tone?: "lost" | "found" | "rescued";
}[] = [
  { value: "todas", label: "Todas" },
  { value: "perdido", label: "Perdidos", tone: "lost" },
  { value: "encontrado", label: "Encontrados / Vistos", tone: "found" },
  { value: "rescatado", label: "Rescatados", tone: "rescued" },
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

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (
      value === "todas" ||
      value === "todos" ||
      (key === "ciudad" && value === "todas")
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Tipo de reporte"
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
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
              className={`tap-target inline-flex shrink-0 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? tab.tone === "lost"
                    ? "bg-lost text-white"
                    : tab.tone === "found"
                      ? "bg-found text-white"
                      : tab.tone === "rescued"
                        ? "bg-rescued text-white"
                        : "bg-foreground text-white"
                  : "border border-line bg-white/80 text-foreground hover:bg-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Ciudad
          </span>
          <select
            value={ciudad}
            onChange={(e) => update("ciudad", e.target.value)}
            className="tap-target w-full rounded-2xl border border-line bg-white px-3 py-3 text-sm font-medium text-foreground outline-none ring-primary focus:ring-2"
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
