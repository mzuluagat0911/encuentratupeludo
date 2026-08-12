import Link from "next/link";
import { ArrowLeft, Download, Megaphone, Layers3 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteUrl } from "@/lib/site";
import { loadCatalogReports } from "@/lib/metaCatalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pauta en Meta | Ubica tu Peludo",
  description:
    "Catálogo listo para Meta Ads: un feed, muchos peludos, sin subir foto por foto.",
  robots: { index: false, follow: false },
};

export default async function PautaPage() {
  const site = getSiteUrl();
  const vistos = await loadCatalogReports({ reportType: "vistos" });
  const perdidos = await loadCatalogReports({ reportType: "perdido" });
  const feedVistos = `${site}/api/meta/catalog.csv?tipo=vistos`;
  const feedPerdidos = `${site}/api/meta/catalog.csv?tipo=perdido`;

  const byCity = new Map<string, number>();
  for (const r of vistos) {
    byCity.set(r.city, (byCity.get(r.city) || 0) + 1);
  }
  const cities = [...byCity.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "es"),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-20">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al feed
        </Link>

        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
          <Megaphone className="h-3.5 w-3.5" aria-hidden />
          Meta Ads sin dolor
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
          Un catálogo, muchos anuncios
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          No subas 30 fotos a mano. Conecta este feed a un{" "}
          <strong className="text-foreground">catálogo de Meta</strong> y arma{" "}
          <strong className="text-foreground">1 campaña dinámica</strong> (o
          una por ciudad). Meta rota solo link + imagen de cada peludo.
        </p>

        <section className="mt-6 space-y-3 rounded-3xl border border-primary/20 bg-white px-5 py-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Layers3 className="h-5 w-5 text-primary" aria-hidden />
            Feeds listos
          </h2>
          <p className="text-sm text-muted">
            Ahora mismo: <strong>{vistos.length} vistos</strong> ·{" "}
            <strong>{perdidos.length} perdidos</strong>
          </p>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Vistos / encontrados (recomendado)
            </span>
            <p className="mt-1 break-all rounded-xl bg-[#f3f7f4] px-3 py-2 text-xs font-medium text-foreground">
              {feedVistos}
            </p>
            <a
              href="/api/meta/catalog.csv?tipo=vistos"
              className="tap-target mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <Download className="h-4 w-4" aria-hidden />
              Descargar CSV vistos
            </a>
          </label>

          <label className="block pt-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Perdidos
            </span>
            <p className="mt-1 break-all rounded-xl bg-[#f3f7f4] px-3 py-2 text-xs font-medium text-foreground">
              {feedPerdidos}
            </p>
            <a
              href="/api/meta/catalog.csv?tipo=perdido"
              className="tap-target mt-2 inline-flex items-center gap-2 rounded-2xl border border-primary/25 bg-white px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5"
            >
              <Download className="h-4 w-4" aria-hidden />
              Descargar CSV perdidos
            </a>
          </label>
        </section>

        <section className="mt-6 space-y-3 rounded-3xl border border-line bg-card px-5 py-5">
          <h2 className="text-base font-bold text-foreground">
            Cómo montarlo (una vez)
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>
              En Meta:{" "}
              <strong className="text-foreground">
                Commerce Manager → Catálogos → Agregar artículos → Feed de datos
              </strong>
              .
            </li>
            <li>
              Pega la URL del feed de <strong className="text-foreground">vistos</strong>{" "}
              y programa actualización cada hora (o diaria).
            </li>
            <li>
              Cuando el catálogo esté listo, crea{" "}
              <strong className="text-foreground">conjuntos de productos</strong>{" "}
              filtrando por{" "}
              <code className="rounded bg-[#f3f7f4] px-1 text-xs">custom_label_0</code>{" "}
              = ciudad (Manizales, Cali, etc.).
            </li>
            <li>
              En Ads Manager: campaña de{" "}
              <strong className="text-foreground">Ventas / Tráfico con catálogo</strong>{" "}
              (Advantage+ catálogo) → elige el conjunto de esa ciudad.
            </li>
            <li>
              Un solo anuncio dinámico muestra todos los peludos del conjunto.
              No hace falta creativo manual por mascota.
            </li>
          </ol>
        </section>

        {cities.length > 0 ? (
          <section className="mt-6 rounded-3xl border border-line bg-white px-5 py-5">
            <h2 className="text-base font-bold text-foreground">
              Vistos por ciudad (para product sets)
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {cities.map(([city, n]) => (
                <li key={city} className="flex justify-between gap-3">
                  <span className="font-medium text-foreground">{city}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              En el feed, la ciudad va en <code>custom_label_0</code>.
            </p>
          </section>
        ) : null}

        <p className="mt-8 text-center text-sm text-muted">
          Tip: si Commerce Manager pide precio, el feed ya manda{" "}
          <code>1.00 COP</code> (no es venta real; solo cumple el formato).
        </p>
      </main>
    </>
  );
}
