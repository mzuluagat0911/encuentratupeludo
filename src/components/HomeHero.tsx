import Link from "next/link";
import { ArrowRight, PawPrint } from "lucide-react";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-line/60">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f766e' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-8 sm:pb-10 sm:pt-10">
        <p className="animate-fade-up mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
          <PawPrint className="h-4 w-4 animate-soft-pulse" aria-hidden />
          Reencuentros urgentes
        </p>
        <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Ubica tu Peludo
        </h1>
        <p className="animate-fade-up-delay mt-3 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Plataforma de emergencia en Colombia para reunir mascotas tras un
          sismo. Sin cuentas: publica o busca en segundos. También puedes
          registrar peluditos en adopción.
        </p>
        <div className="animate-fade-up-delay mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/publicar"
            className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-primary-dark active:scale-[0.98]"
          >
            Reportar ahora
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <a
            href="#reportes"
            className="tap-target inline-flex items-center justify-center rounded-2xl border border-line bg-white/70 px-5 py-3.5 text-base font-semibold text-foreground transition hover:bg-white"
          >
            Qué hay de mi lado
          </a>
        </div>
      </div>
    </section>
  );
}
