import { HeartHandshake } from "lucide-react";
import Link from "next/link";

type Props = {
  count: number;
};

export function RescuedHopeBanner({ count }: Props) {
  const n = Math.max(0, count);

  return (
    <section
      aria-label="Animales rescatados"
      className="relative overflow-hidden border-b border-rescued/20"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(900px 280px at 15% 0%, rgba(29,78,216,0.18), transparent 55%), radial-gradient(700px 240px at 90% 30%, rgba(245,158,11,0.16), transparent 50%), linear-gradient(135deg, #eff6ff 0%, #f0fdf4 55%, #fff7ed 100%)",
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-8 text-center sm:py-10">
        <span className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-rescued shadow-sm">
          <HeartHandshake className="h-4 w-4" aria-hidden />
          Hay esperanza
        </span>
        <p className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-none tracking-tight text-rescued sm:text-6xl">
          {n}
        </p>
        <p className="max-w-md text-base font-semibold text-foreground sm:text-lg">
          {n === 1
            ? "animalito ya reunido con su familia"
            : "animalitos ya reunidos con sus familias"}
        </p>
        <p className="max-w-lg text-sm leading-relaxed text-muted">
          Cada número es un reencuentro. Gracias a quienes publican, buscan y
          no se rinden.
        </p>
        <Link
          href="/?tipo=rescatado"
          className="tap-target mt-1 inline-flex items-center justify-center rounded-2xl bg-rescued px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 active:scale-[0.98]"
        >
          Ver historias de rescatados
        </Link>
      </div>
    </section>
  );
}
