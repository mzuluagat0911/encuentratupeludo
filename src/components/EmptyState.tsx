import { SearchX } from "lucide-react";
import Link from "next/link";

type Props = {
  near?: boolean;
};

export function EmptyState({ near = false }: Props) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <SearchX className="mx-auto h-10 w-10 text-muted" aria-hidden />
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
        {near
          ? "No encontramos peludos cerca de ti"
          : "No hay reportes con estos filtros"}
      </h3>
      <p className="mt-2 text-sm text-muted">
        {near
          ? "Prueba quitar “Cerca de mí” o cambia de ciudad. También puedes publicar el tuyo."
          : "Prueba otro nombre, ciudad o tipo de animal, o sé la primera persona en publicar."}
      </p>
      <Link
        href="/publicar"
        className="tap-target mt-5 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Publicar reporte
      </Link>
    </div>
  );
}
