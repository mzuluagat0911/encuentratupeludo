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
            "radial-gradient(700px 180px at 12% 0%, rgba(29,78,216,0.16), transparent 55%), radial-gradient(520px 160px at 92% 40%, rgba(245,158,11,0.14), transparent 50%), linear-gradient(135deg, #eff6ff 0%, #f0fdf4 55%, #fff7ed 100%)",
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-1.5 px-4 py-4 text-center sm:gap-2 sm:py-5">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rescued shadow-sm sm:text-xs">
          <HeartHandshake className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Hay esperanza
        </span>

        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <p className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-none tracking-tight text-rescued sm:text-5xl">
            {n}
          </p>
          <p className="max-w-[20rem] text-sm font-semibold leading-snug text-foreground sm:max-w-md sm:text-base">
            {n === 1
              ? "animalito ya reunido con su familia"
              : "animalitos ya reunidos con sus familias"}
          </p>
        </div>

        <p className="max-w-md text-xs leading-snug text-muted sm:text-sm sm:leading-relaxed">
          Cada número es un reencuentro. Gracias a quienes publican, buscan y
          no se rinden.
        </p>

        <Link
          href="/?tipo=rescatado"
          className="tap-target mt-0.5 inline-flex min-h-11 items-center justify-center rounded-xl bg-rescued px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 active:scale-[0.98] sm:rounded-2xl sm:px-5"
        >
          Ver historias de rescatados
        </Link>
      </div>
    </section>
  );
}
