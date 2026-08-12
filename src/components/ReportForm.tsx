"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Cat,
  CheckCircle2,
  Dog,
  Loader2,
  MapPinned,
  Phone,
  UserRound,
} from "lucide-react";
import { COLOMBIA_CITIES } from "@/lib/cities";
import {
  publishReport,
  type PublishState,
} from "@/app/actions/reports";
import type { PetType, ReportType } from "@/lib/types";

const initialState: PublishState = { ok: false };

export function ReportForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    publishReport,
    initialState,
  );
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [petType, setPetType] = useState<PetType>("perro");
  const [preview, setPreview] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => router.push("/"), 900);
      return () => clearTimeout(t);
    }
  }, [state.ok, router]);

  const previewUrl = useMemo(() => preview, [preview]);

  function onPhotoChange(file: File | undefined) {
    if (!file) {
      setPreview(null);
      setHasPhoto(false);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setHasPhoto(true);
  }

  if (state.ok) {
    return (
      <div className="rounded-3xl border border-found/30 bg-found-soft px-6 py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-found" aria-hidden />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          ¡Publicado!
        </h2>
        <p className="mt-2 text-sm text-muted">
          {state.message ?? "Te llevamos al feed de reportes…"}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold uppercase tracking-wide text-muted">
          Tipo de reporte
        </legend>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setReportType("perdido")}
            className={`tap-target rounded-3xl border-2 px-4 py-4 text-left transition ${
              reportType === "perdido"
                ? "border-lost bg-lost-soft"
                : "border-line bg-white hover:border-lost/40"
            }`}
          >
            <span className="block text-base font-bold text-lost">
              Se me perdió mi mascota
            </span>
            <span className="mt-1 block text-sm text-muted">
              Busco a mi animalito
            </span>
          </button>
          <button
            type="button"
            onClick={() => setReportType("encontrado")}
            className={`tap-target rounded-3xl border-2 px-4 py-4 text-left transition ${
              reportType === "encontrado"
                ? "border-found bg-found-soft"
                : "border-line bg-white hover:border-found/40"
            }`}
          >
            <span className="block text-base font-bold text-found">
              Encontré / Vi una mascota
            </span>
            <span className="mt-1 block text-sm text-muted">
              Tengo un animalito o lo vi en la calle
            </span>
          </button>
        </div>
        <input type="hidden" name="report_type" value={reportType ?? ""} />
      </fieldset>

      <fieldset className="space-y-3" disabled={!reportType}>
        <legend className="text-sm font-bold uppercase tracking-wide text-muted">
          Tipo de mascota
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "perro", label: "Perro", Icon: Dog },
              { value: "gato", label: "Gato", Icon: Cat },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPetType(value)}
              className={`tap-target flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3.5 text-base font-semibold transition ${
                petType === value
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="pet_type" value={petType} />
      </fieldset>

      <div className={`space-y-5 ${!reportType ? "pointer-events-none opacity-40" : ""}`}>
        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-muted">
            Foto <span className="text-lost">*</span>
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`tap-target flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed bg-white px-4 py-8 text-center transition ${
              hasPhoto
                ? "border-found/50 hover:border-found"
                : "border-line hover:border-primary/40"
            }`}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa"
                className="h-44 w-full rounded-2xl object-cover"
              />
            ) : (
              <>
                <Camera className="h-8 w-8 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  Tomar o subir foto
                </span>
                <span className="text-xs text-muted">
                  Obligatoria · JPG/PNG/WEBP · máx. 4 MB
                </span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
            required
            className="sr-only"
            onChange={(e) => onPhotoChange(e.target.files?.[0])}
          />
        </div>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <MapPinned className="h-4 w-4" aria-hidden />
            Ciudad
          </span>
          <select
            name="city"
            required
            defaultValue=""
            className="tap-target w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none ring-primary focus:ring-2"
          >
            <option value="" disabled>
              Selecciona ciudad
            </option>
            {COLOMBIA_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-muted">
            Sector / Barrio / Lugar
          </span>
          <input
            name="neighborhood"
            required
            minLength={3}
            placeholder='Ej. "Cerca al parque El Virrey"'
            className="tap-target w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none ring-primary focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <UserRound className="h-4 w-4" aria-hidden />
            Nombre de quien publica
          </span>
          <input
            name="responsible_name"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            placeholder="Ej. María Gómez"
            className="tap-target w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none ring-primary focus:ring-2"
          />
          <span className="mt-1.5 block text-xs text-muted">
            Así otras personas pueden filtrar y encontrarte más fácil.
          </span>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <Phone className="h-4 w-4" aria-hidden />
            Teléfono / WhatsApp
          </span>
          <div className="flex overflow-hidden rounded-2xl border border-line bg-white focus-within:ring-2 focus-within:ring-primary">
            <span className="flex items-center bg-[#eef5f1] px-3 text-sm font-semibold text-muted">
              +57
            </span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              placeholder="300 123 4567"
              className="tap-target w-full px-3 py-3.5 text-base outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-muted">
            Detalle / Descripción{" "}
            <span className="font-medium normal-case tracking-normal text-muted/70">
              (opcional)
            </span>
          </span>
          <textarea
            name="description"
            rows={3}
            placeholder="Color, collar, estado físico, nombre…"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base outline-none ring-primary focus:ring-2"
          />
        </label>
      </div>

      {state.message && !state.ok ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!reportType || !hasPhoto || pending}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Publicando…
          </>
        ) : (
          "Publicar reporte"
        )}
      </button>
    </form>
  );
}
