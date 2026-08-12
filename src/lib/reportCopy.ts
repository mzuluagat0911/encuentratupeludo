import type { PetReport } from "@/lib/types";

export function reportTypeLabel(type: PetReport["report_type"]): string {
  if (type === "perdido") return "Perdido";
  if (type === "encontrado") return "Encontrado";
  return "Rescatado";
}

export function reportTypeBadgeClass(type: PetReport["report_type"]): string {
  if (type === "perdido") return "bg-lost";
  if (type === "encontrado") return "bg-found";
  return "bg-rescued";
}

/** Título corto para OG / Meta ads / compartir. */
export function reportShareTitle(report: PetReport): string {
  const kind = report.pet_type === "perro" ? "Perro" : "Gato";
  const status = reportTypeLabel(report.report_type).toLowerCase();
  return `${kind} ${status} en ${report.city} · Ubica tu Peludo`;
}

/** Descripción para preview en Facebook / WhatsApp / ads. */
export function reportShareDescription(report: PetReport): string {
  const bits = [
    report.neighborhood,
    report.city,
    report.description?.trim() || null,
  ].filter(Boolean);
  const base = bits.join(" · ");
  if (report.report_type === "perdido") {
    return `Se busca ${report.pet_type}. ${base}`.slice(0, 200);
  }
  if (report.report_type === "encontrado") {
    return `${report.pet_type} visto/encontrado. ${base}`.slice(0, 200);
  }
  return `Historia de reencuentro. ${base}`.slice(0, 200);
}

export function reportShareText(report: PetReport): string {
  return `${reportShareTitle(report)}\n${reportShareDescription(report)}`;
}
