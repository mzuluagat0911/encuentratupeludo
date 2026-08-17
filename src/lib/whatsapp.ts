import type { PetReport } from "@/lib/types";

/** Normaliza a dígitos colombianos sin + ni espacios (ej. 3001234567). */
export function normalizeColombianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length >= 12) {
    return digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return digits.slice(1);
  }
  return digits;
}

export function buildWhatsAppUrl(report: PetReport): string {
  const local = normalizeColombianPhone(report.phone);
  const full = `57${local}`;

  const who = report.responsible_name?.trim();
  const hi = who ? `Hola ${who}` : "Hola";

  let text: string;
  if (report.report_type === "perdido") {
    text = `${hi}, vi tu reporte en la app sobre tu mascota perdida en ${report.neighborhood}, ${report.city}. Creo que la vi/tengo información.`;
  } else if (report.report_type === "encontrado") {
    text = `${hi}, vi que reportaste una mascota encontrada en ${report.neighborhood}, ${report.city}. Creo que es la mía.`;
  } else if (report.report_type === "adopcion") {
    text = `${hi}, vi tu publicación de adopción en ${report.neighborhood}, ${report.city}. Me interesa darle un hogar a este peludito.`;
  } else {
    text = `${hi}, vi tu reporte de mascota rescatada en ${report.neighborhood}, ${report.city}.`;
  }

  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

export function whatsappButtonLabel(
  reportType: PetReport["report_type"],
): string {
  if (reportType === "perdido") return "¡Lo vi / Lo tengo! (WhatsApp)";
  if (reportType === "encontrado") return "¡Es mi mascota! (WhatsApp)";
  if (reportType === "adopcion") return "Quiero adoptarlo (WhatsApp)";
  return "Contactar (WhatsApp)";
}
