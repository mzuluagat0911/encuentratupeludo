"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, HeartHandshake, Loader2 } from "lucide-react";
import { closeCaseAsRescued } from "@/app/actions/closeCase";
import type { PetReport } from "@/lib/types";

type Props = {
  report: PetReport;
};

export function CloseCaseForm({ report }: Props) {
  const [done, setDone] = useState(report.report_type === "rescatado");
  const [already, setAlready] = useState(report.report_type === "rescatado");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await closeCaseAsRescued(report.id);
      if (!result.ok) {
        setError(result.message || "No se pudo actualizar.");
        return;
      }
      setAlready(Boolean(result.already));
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-rescued/25 bg-rescued-soft px-5 py-8 text-center">
        <HeartHandshake className="mx-auto h-12 w-12 text-rescued" aria-hidden />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          {already ? "Ya estaba rescatado" : "¡Ya está con su familia!"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Gracias. Esta historia ahora suma esperanza en el feed de Rescatados.
        </p>
        <Link
          href="/?tipo=rescatado"
          className="tap-target mt-5 inline-flex items-center justify-center rounded-2xl bg-rescued px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Ver rescatados
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-line bg-white p-5">
      <p className="text-sm leading-relaxed text-muted">
        Confirma solo si este peludo <strong className="text-foreground">ya se reunió</strong>{" "}
        con su familia. Pasará de {report.report_type === "perdido" ? "Perdidos" : "Encontrados"} a{" "}
        <strong className="text-rescued">Rescatados</strong>.
      </p>

      {error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onConfirm}
        disabled={pending}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-rescued px-4 py-4 text-base font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Guardando…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            Sí, ya está con su familia
          </>
        )}
      </button>
    </div>
  );
}
