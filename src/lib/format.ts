import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function formatRelativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
  } catch {
    return "";
  }
}
