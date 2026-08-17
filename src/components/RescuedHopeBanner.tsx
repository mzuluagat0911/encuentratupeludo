import Link from "next/link";

type Props = {
  rescued: number;
  lost: number;
  seen: number;
  adopt: number;
};

export function RescuedHopeBanner({ rescued, lost, seen, adopt }: Props) {
  const n = Math.max(0, rescued);
  const lostN = Math.max(0, lost);
  const seenN = Math.max(0, seen);
  const adoptN = Math.max(0, adopt);

  return (
    <nav
      aria-label="Cifras de reportes"
      className="border-t border-line/60 bg-white/70"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-4 divide-x divide-line/70">
        <Link
          href="/?tipo=rescatado"
          className="flex min-h-11 flex-col items-center justify-center px-1 py-1.5 text-center transition hover:bg-rescued-soft active:scale-[0.99]"
        >
          <span className="font-[family-name:var(--font-display)] text-base font-semibold leading-none text-rescued sm:text-lg">
            {n}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-rescued/80 sm:text-[10px]">
            Rescatados
          </span>
        </Link>
        <Link
          href="/?tipo=perdido"
          className="flex min-h-11 flex-col items-center justify-center px-1 py-1.5 text-center transition hover:bg-lost-soft active:scale-[0.99]"
        >
          <span className="font-[family-name:var(--font-display)] text-base font-semibold leading-none text-lost sm:text-lg">
            {lostN}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-lost/80 sm:text-[10px]">
            Perdidos
          </span>
        </Link>
        <Link
          href="/?tipo=encontrado"
          className="flex min-h-11 flex-col items-center justify-center px-1 py-1.5 text-center transition hover:bg-found-soft active:scale-[0.99]"
        >
          <span className="font-[family-name:var(--font-display)] text-base font-semibold leading-none text-found sm:text-lg">
            {seenN}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-found/80 sm:text-[10px]">
            Vistos
          </span>
        </Link>
        <Link
          href="/?tipo=adopcion"
          className="flex min-h-11 flex-col items-center justify-center px-1 py-1.5 text-center transition hover:bg-adopt-soft active:scale-[0.99]"
        >
          <span className="font-[family-name:var(--font-display)] text-base font-semibold leading-none text-adopt sm:text-lg">
            {adoptN}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-adopt/80 sm:text-[10px]">
            Adopción
          </span>
        </Link>
      </div>
    </nav>
  );
}
