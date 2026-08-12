"use server";

import { revalidatePath } from "next/cache";
import { markReportAsRescued } from "@/lib/reports";

export type CloseCaseState = {
  ok: boolean;
  message?: string;
  already?: boolean;
};

export async function closeCaseAsRescued(
  reportId: string,
): Promise<CloseCaseState> {
  if (!reportId?.trim()) {
    return { ok: false, message: "Link inválido." };
  }

  const result = await markReportAsRescued(reportId.trim());
  if (!result.ok) {
    return { ok: false, message: result.message || "No se pudo cerrar el caso." };
  }

  revalidatePath("/");
  revalidatePath(`/cerrar/${reportId}`);

  const already = result.message?.includes("ya estaba") ?? false;
  return {
    ok: true,
    already,
    message: already
      ? "Este peludo ya estaba marcado como rescatado."
      : "¡Listo! Ya aparece en Rescatados.",
  };
}
