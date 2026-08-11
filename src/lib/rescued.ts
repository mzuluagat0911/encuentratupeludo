import { normalizeForFilter } from "@/lib/contentFilter";

/**
 * Frases típicas de “ya reunieron / ya apareció”.
 * Usado para reclasificar a rescatado.
 */
const RESCUED_PHRASES = [
  "ya aparecio",
  "ya apareció",
  "ya aparecieron",
  "ya aparecio",
  "ya esta con su dueno",
  "ya esta con su dueño",
  "ya estan con sus duenos",
  "ya estan con sus dueños",
  "ya está con su dueño",
  "ya están con sus dueños",
  "con su dueno",
  "con su dueño",
  "con sus duenos",
  "con sus dueños",
  "ya lo encontre",
  "ya lo encontré",
  "ya la encontre",
  "ya la encontré",
  "ya los encontraron",
  "ya las encontraron",
  "recuperado",
  "recuperada",
  "recuperados",
  "recuperadas",
  "ya volvio",
  "ya volvió",
  "ya regresó",
  "ya regreso",
  "reunido con",
  "reunida con",
  "ya lo entregue",
  "ya lo entregué",
  "ya la entregue",
  "ya la entregué",
  "ya fue entregado",
  "ya fue entregada",
  "encontro a su dueno",
  "encontró a su dueño",
  "encontraron a su dueno",
  "encontraron a su dueño",
  "ya esta en casa",
  "ya está en casa",
  "ya estan en casa",
  "ya están en casa",
  "caso cerrado",
  "ya tiene dueno",
  "ya tiene dueño",
  "ya tiene familia",
];

export function looksLikeRescuedDescription(
  description: string | null | undefined,
): boolean {
  if (!description?.trim()) return false;
  const text = normalizeForFilter(description);

  for (const phrase of RESCUED_PHRASES) {
    const needle = normalizeForFilter(phrase);
    if (needle && text.includes(needle)) return true;
  }

  // Patrones flexibles
  if (
    /\bya\s+aparec/.test(text) ||
    /\bcon\s+su(s)?\s+duen/.test(text) ||
    /\bya\s+(lo|la|los|las)\s+encontr/.test(text) ||
    /\breuperad[oa]s?\b/.test(text) ||
    /\bya\s+volv/.test(text) ||
    /\bentregad[oa]\b/.test(text)
  ) {
    return true;
  }

  return false;
}
