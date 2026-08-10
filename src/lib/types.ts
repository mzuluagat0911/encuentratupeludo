export type ReportType = "perdido" | "encontrado";
export type PetType = "perro" | "gato";

export type PetReport = {
  id: string;
  report_type: ReportType;
  pet_type: PetType;
  photo_url: string | null;
  city: string;
  neighborhood: string;
  phone: string;
  description: string | null;
  created_at: string;
};

export type CreateReportInput = {
  report_type: ReportType;
  pet_type: PetType;
  photo_url?: string | null;
  city: string;
  neighborhood: string;
  phone: string;
  description?: string | null;
};

export type ReportFilters = {
  reportType?: ReportType | "todas";
  petType?: PetType | "todos";
  city?: string;
};
