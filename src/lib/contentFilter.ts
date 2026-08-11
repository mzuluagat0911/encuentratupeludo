/**
 * Filtro liviano anti-spam político / mensajes fuera de tema.
 * No usa IA: lista de frases + normalización. Fácil de ampliar.
 */

const BLOCKED_PHRASES = [
  // Política / votos
  "voto por",
  "votaron por",
  "votar por",
  "vote por",
  "votemos",
  "campaña politica",
  "campaña política",
  "candidato",
  "candidata",
  "elecciones",
  "partido politico",
  "partido político",
  "uribismo",
  "uribista",
  "petrismo",
  "petrista",
  "castrochavismo",
  "izquierda radical",
  "derecha radical",
  "golpe de estado",
  "dictadura",
  // Conspiración / spam visto en la app
  "terremoto provocado",
  "sacrificaron un pueblo",
  "vender el territorio",
  "territorio barato",
  "a los gringos",
  "los gringos",
  // Insultos / odio genérico frecuente en spam
  "hijueputa",
  "gonorrea politico",
  "gonorrea político",
];

/** Normaliza para comparar: minúsculas, sin tildes, espacios simples. */
export function normalizeForFilter(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ContentFilterResult =
  | { blocked: false }
  | { blocked: true; reason: string };

/**
 * Revisa barrio + descripción. Si detecta política/spam, bloquea.
 */
export function checkPublishContent(input: {
  neighborhood: string;
  description?: string | null;
}): ContentFilterResult {
  const combined = normalizeForFilter(
    `${input.neighborhood} ${input.description || ""}`,
  );

  if (!combined) return { blocked: false };

  for (const phrase of BLOCKED_PHRASES) {
    const needle = normalizeForFilter(phrase);
    if (needle && combined.includes(needle)) {
      return {
        blocked: true,
        reason:
          "Este espacio es solo para reportes de mascotas. No se permiten mensajes políticos ni spam.",
      };
    }
  }

  // Patrones extra: "voto/votaron ... derecha|izquierda"
  if (
    /\bvoto(ron|emos|aria)?\b.{0,40}\b(derecha|izquierda)\b/.test(combined) ||
    /\b(derecha|izquierda)\b.{0,40}\bvoto(ron|emos|aria)?\b/.test(combined)
  ) {
    return {
      blocked: true,
      reason:
        "Este espacio es solo para reportes de mascotas. No se permiten mensajes políticos ni spam.",
    };
  }

  return { blocked: false };
}
