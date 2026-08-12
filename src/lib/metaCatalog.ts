import type { PetReport, ReportType } from "@/lib/types";
import { listReports } from "@/lib/reports";
import {
  reportShareDescription,
  reportShareTitle,
  reportTypeLabel,
} from "@/lib/reportCopy";
import { getSiteUrl, reportAbsoluteUrl } from "@/lib/site";
import { isDemoReport } from "@/lib/demos";

export type MetaCatalogFilter = {
  reportType?: ReportType | "vistos";
};

function csvEscape(value: string): string {
  const s = value.replace(/\r?\n/g, " ").trim();
  if (/[",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** image_link estable y único por reporte (Meta no reutiliza la anterior). */
export function metaImageLink(report: PetReport): string {
  const bust = `${report.id.slice(0, 8)}-${Date.parse(report.created_at) || 0}`;
  return `${getSiteUrl()}/reporte/${report.id}/opengraph-image?v=${bust}`;
}

export async function loadCatalogReports(
  filter: MetaCatalogFilter = {},
): Promise<PetReport[]> {
  const type =
    filter.reportType === "vistos"
      ? "encontrado"
      : filter.reportType;

  const reports = await listReports(
    type ? { reportType: type } : {},
  );

  return reports.filter((r) => {
    if (!r.photo_url) return false;
    if (isDemoReport(r.description)) return false;
    if (r.report_type === "rescatado") return false;
    if (type && r.report_type !== type) return false;
    return true;
  });
}

/**
 * Feed CSV compatible con catálogo de Meta Commerce Manager.
 * custom_label_0 = ciudad → Product Sets por ciudad.
 */
export function reportsToMetaCatalogCsv(reports: PetReport[]): string {
  const header = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "product_type",
    "custom_label_0",
    "custom_label_1",
    "custom_label_2",
  ];

  const lines = [header.join(",")];

  for (const report of reports) {
    const kind = report.pet_type === "perro" ? "Perro" : "Gato";
    const status = reportTypeLabel(report.report_type);
    const title = `${kind} ${status.toLowerCase()} · ${report.neighborhood} · ${report.city}`.slice(
      0,
      150,
    );
    const description = reportShareDescription(report) || reportShareTitle(report);
    const productType =
      report.report_type === "encontrado" ? "Visto" : "Perdido";

    const row = [
      report.id,
      title,
      description,
      "in stock",
      "new",
      "1.00 COP",
      reportAbsoluteUrl(report.id),
      metaImageLink(report),
      "Ubica tu Peludo",
      productType,
      report.city,
      report.pet_type,
      productType,
    ].map(csvEscape);

    lines.push(row.join(","));
  }

  return `${lines.join("\n")}\n`;
}
