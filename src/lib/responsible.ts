import { normalizeForFilter } from "@/lib/contentFilter";
import type { PetReport } from "@/lib/types";

export const RESPONSIBLE_PREFIX = "Responsable:";
const PREFIX_RE = /^Responsable:\s*(.+?)(?:\n|$)/i;

export function sanitizeResponsibleName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 60) return null;
  if (!/^[\p{L}][\p{L}\s.'’-]*$/u.test(name)) return null;
  if (normalizeForFilter(name).replace(/\s/g, "").length < 2) return null;
  return name;
}

export function encodeResponsibleInDescription(
  name: string,
  description: string | null | undefined,
): string {
  const body = description?.trim() || "";
  const line = `${RESPONSIBLE_PREFIX} ${name.trim()}`;
  return body ? `${line}\n${body}` : line;
}

export function parseResponsible(input: {
  responsible_name?: string | null;
  description?: string | null;
}): { name: string | null; description: string | null } {
  const fromColumn = input.responsible_name?.trim() || null;
  const raw = input.description ?? null;
  if (!raw) return { name: fromColumn, description: null };

  const match = raw.match(PREFIX_RE);
  if (!match) return { name: fromColumn, description: raw };

  const fromText = match[1].trim() || null;
  const rest = raw.slice(match[0].length).trim() || null;
  return { name: fromColumn || fromText, description: rest };
}

export function hydrateReport<T extends PetReport>(row: T): T {
  const parsed = parseResponsible(row);
  return {
    ...row,
    responsible_name: parsed.name,
    description: parsed.description,
  };
}

export function matchesResponsibleName(
  report: PetReport,
  query?: string | null,
): boolean {
  if (!query?.trim()) return true;
  const name = report.responsible_name?.trim();
  if (!name) return false;
  return normalizeForFilter(name).includes(normalizeForFilter(query));
}
