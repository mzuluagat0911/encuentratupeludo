import Link from "next/link";
import { HeartHandshake, Plus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-[#f7fbf8]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm transition group-hover:bg-primary-dark">
            <HeartHandshake className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-[family-name:var(--font-display)] text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
              Ubica tu Peludo
            </span>
            <span className="block truncate text-xs text-muted">
              Emergencia · Colombia
            </span>
          </span>
        </Link>

        <Link
          href="/publicar"
          className="tap-target inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.98] sm:px-4"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>Publicar</span>
        </Link>
      </div>
    </header>
  );
}
