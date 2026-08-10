/** Prefijo usado en descripciones de reportes de demostración. */
export const DEMO_MARKER = "Ejemplo:";

export function isDemoReport(description: string | null | undefined): boolean {
  return Boolean(description?.trim().startsWith(DEMO_MARKER));
}
