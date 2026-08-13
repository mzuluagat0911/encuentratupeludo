"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const OPTIONS = [
  { id: "todos", label: "Todos" },
  { id: "3", label: "3 km" },
  { id: "5", label: "5 km" },
] as const;

export function NearRadiusBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const radio = searchParams.get("radio") || "todos";

  function setRadio(next: "todos" | "3" | "5") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "todos") params.delete("radio");
    else params.set("radio", next);
    const qs = params.toString();
    window.location.assign(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearNear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    params.delete("radio");
    const qs = params.toString();
    window.location.assign(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-1">
        {OPTIONS.map((opt) => {
          const on =
            radio === opt.id ||
            (opt.id === "todos" && radio !== "3" && radio !== "5");
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRadio(opt.id)}
              className={`h-10 rounded-xl px-1 text-[13px] font-bold leading-none transition ${
                on
                  ? "bg-primary text-white"
                  : "bg-[#f3f7f4] text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={clearNear}
        aria-label="Salir de cerca de mí"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f7f4] text-foreground"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
