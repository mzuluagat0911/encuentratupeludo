export type ReportType = "perdido" | "encontrado" | "rescatado";
export type PetType = "perro" | "gato";

export type PetReport = {
  id: string;
  report_type: ReportType;
  pet_type: PetType;
  photo_url: string | null;
  city: string;
  neighborhood: string;
  phone: string;
  responsible_name: string | null;
  description: string | null;
  created_at: string;
  lat?: number | null;
  lng?: number | null;
  /** Distancia al usuario (solo en modo cerca de mí). */
  distance_km?: number;
  geo_precision?: "gps" | "place" | "city";
};

export type CreateReportInput = {
  report_type: ReportType;
  pet_type: PetType;
  photo_url?: string | null;
  city: string;
  neighborhood: string;
  phone: string;
  responsible_name?: string | null;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type ReportFilters = {
  reportType?: ReportType | "todas";
  petType?: PetType | "todos";
  city?: string;
  responsible?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};
