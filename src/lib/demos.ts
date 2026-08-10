import type { CreateReportInput } from "@/lib/types";

export const DEMO_MARKER = "Ejemplo:";

export const DEMO_REPORTS: CreateReportInput[] = [
  {
    report_type: "perdido",
    pet_type: "perro",
    photo_url: null,
    city: "Bogotá",
    neighborhood: "Cerca al parque El Virrey",
    phone: "3001234567",
    description:
      "Ejemplo: Labrador color chocolate, collar rojo, responde al nombre Milo.",
  },
  {
    report_type: "encontrado",
    pet_type: "gato",
    photo_url: null,
    city: "Medellín",
    neighborhood: "Laureles, cerca a la iglesia",
    phone: "3109876543",
    description:
      "Ejemplo: Gato naranja con manchas blancas en el pecho. Muy sociable.",
  },
  {
    report_type: "perdido",
    pet_type: "gato",
    photo_url: null,
    city: "Cali",
    neighborhood: "San Antonio",
    phone: "3155551212",
    description: "Ejemplo: Gata gris pequeña, ojos verdes, sin collar.",
  },
  {
    report_type: "encontrado",
    pet_type: "perro",
    photo_url: null,
    city: "Bucaramanga",
    neighborhood: "Cabecera del Llano",
    phone: "3204448899",
    description:
      "Ejemplo: Perro mediano café, parece mestizo, asustado pero sin heridas visibles.",
  },
];

export function isDemoReport(description: string | null | undefined): boolean {
  return Boolean(description?.trim().startsWith(DEMO_MARKER));
}
