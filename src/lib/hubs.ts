export type HubPlaceType = "veterinaria" | "albergue" | "acopio" | "hogar_de_paso";

export type HubPlace = {
  id: string;
  city: string;
  slug: string;
  name: string;
  type: HubPlaceType;
  neighborhood: string;
  address: string | null;
  phone: string | null;
  mapsUrl: string | null;
  instagramUrl: string | null;
  instagramHandle: string | null;
  hours: string | null;
  note: string;
  needs: string[];
  donate: string;
  nequi: string | null;
  seeksFosterHomes: boolean;
  detailsPending?: boolean;
};

export type HubCity = {
  city: string;
  slug: string;
  places: HubPlace[];
};

export function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hubTypeLabel(type: HubPlaceType): string {
  if (type === "veterinaria") return "Veterinaria";
  if (type === "albergue") return "Albergue";
  if (type === "hogar_de_paso") return "Hogar de paso";
  return "Punto de acopio";
}

/**
 * Plantilla para un hogar por ciudad.
 * Copia el objeto, cambia city / slug / id / contacto y agrégalo a PLACES.
 */
export const HUB_PLACE_TEMPLATE: HubPlace = {
  id: "ciudad-nombre-corto",
  city: "Pereira",
  slug: "pereira",
  name: "Nombre del hogar o veterinaria",
  type: "hogar_de_paso",
  neighborhood: "Barrio o sector",
  address: null,
  phone: null,
  mapsUrl: null,
  instagramUrl: null,
  instagramHandle: null,
  hours: null,
  note: "Qué hacen: atienden, son hogar de paso y reciben donaciones.",
  needs: [
    "Insumos médicos (gasas, suturas, lactato, guantes)",
    "Arena para gatos",
    "Alimento para perros y gatos",
    "Cocas / camas",
    "Areneros",
  ],
  donate: "Donaciones por Nequi o Llave. Coordinar insumos por WhatsApp o Instagram.",
  nequi: null,
  seeksFosterHomes: true,
};

const PLACES: HubPlace[] = [
  {
    id: "cali-royipets",
    city: "Cali",
    slug: "cali",
    name: "Royi Pets",
    type: "hogar_de_paso",
    neighborhood: "Cali",
    address: null,
    phone: "3054758235",
    mapsUrl: null,
    instagramUrl: "https://www.instagram.com/royipets/",
    instagramHandle: "@royipets",
    hours: "Hogar de paso · atienden peluditos y reciben donaciones",
    note: "Son hogar de paso en Cali: atienden animalitos y reciben insumos para seguir cuidándolos. También buscan más hogares de paso.",
    needs: [
      "Insumos médicos: gasas, suturas, lactato, guantes",
      "Arena para gatos",
      "Alimento para perros y gatos",
      "Cocas para los animalitos",
      "Areneros para gatos",
    ],
    donate:
      "Donaciones por Nequi o Llave al 3054758235. Insumos se coordinan por WhatsApp o Instagram.",
    nequi: "3054758235",
    seeksFosterHomes: true,
  },
  {
    id: "manizales-coliseo-ucaldas",
    city: "Manizales",
    slug: "manizales",
    name: "Coliseo Universidad de Caldas",
    type: "veterinaria",
    neighborhood: "Universidad de Caldas",
    address: "Coliseo de la Universidad de Caldas, Manizales",
    phone: null,
    mapsUrl: null,
    instagramUrl: null,
    instagramHandle: null,
    hours: "Atención veterinaria de emergencia",
    note: "En el coliseo de la Universidad de Caldas se está brindando atención veterinaria a peluditos afectados. Lleva a tu animalito si necesita revisión o cuidados urgentes.",
    needs: [
      "Insumos médicos (gasas, suturas, lactato, guantes)",
      "Alimento para perros y gatos",
      "Mantas y cobijas",
    ],
    donate:
      "Puedes apoyar llevando insumos médicos o alimento al coliseo. Si tienes un contacto o Nequi para donaciones, escríbenos para publicarlo aquí.",
    nequi: null,
    seeksFosterHomes: false,
  },
];

export function listHubCities(): HubCity[] {
  const bySlug = new Map<string, HubCity>();
  for (const place of PLACES) {
    const current = bySlug.get(place.slug);
    if (current) {
      current.places.push(place);
    } else {
      bySlug.set(place.slug, {
        city: place.city,
        slug: place.slug,
        places: [place],
      });
    }
  }
  return [...bySlug.values()];
}

export function getHubCityBySlug(slug: string): HubCity | null {
  return listHubCities().find((c) => c.slug === slug) ?? null;
}

export function getHubCityByName(city: string): HubCity | null {
  const slug = cityToSlug(city);
  return getHubCityBySlug(slug);
}

/** Banner del feed: ciudad filtrada, o la primera con ayuda si no hay filtro. */
export function hubCityForFeedFilter(cityFilter: string): HubCity | null {
  if (cityFilter && cityFilter !== "todas") {
    return getHubCityByName(cityFilter);
  }
  return listHubCities()[0] ?? null;
}

export function buildHubWhatsAppUrl(place: HubPlace): string | null {
  const raw = place.phone || place.nequi;
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  const local =
    digits.startsWith("57") && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length < 10) return null;
  const text = `Hola, vi a ${place.name} en Ubica tu Peludo. Quiero ayudar con donaciones o ser hogar de paso.`;
  return `https://wa.me/57${local}?text=${encodeURIComponent(text)}`;
}
