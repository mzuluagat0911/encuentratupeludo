import { Info } from "lucide-react";

export function LocalModeBanner() {
  return (
    <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-semibold">Modo local:</strong> los datos se
        guardan en este equipo. Para producción, configura Supabase (ver README)
        y reinicia la app.
      </p>
    </div>
  );
}
