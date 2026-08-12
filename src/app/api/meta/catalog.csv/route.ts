import { NextResponse } from "next/server";
import {
  loadCatalogReports,
  reportsToMetaCatalogCsv,
  type MetaCatalogFilter,
} from "@/lib/metaCatalog";
import type { ReportType } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseTipo(raw: string | null): MetaCatalogFilter["reportType"] {
  if (!raw || raw === "vistos" || raw === "encontrado") return "vistos";
  if (raw === "perdido") return "perdido";
  if (raw === "todos") return undefined;
  return "vistos";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = parseTipo(searchParams.get("tipo"));
    const reports = await loadCatalogReports({
      reportType: reportType as ReportType | "vistos" | undefined,
    });
    const csv = reportsToMetaCatalogCsv(reports);
    const name =
      reportType === "perdido"
        ? "ubicatupeludo-perdidos.csv"
        : reportType === undefined
          ? "ubicatupeludo-todos.csv"
          : "ubicatupeludo-vistos.csv";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generando catálogo";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
