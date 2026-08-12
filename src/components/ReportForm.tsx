"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Cat,
  CheckCircle2,
  Dog,
  HeartHandshake,
  Loader2,
  MapPinned,
  Phone,
  UserRound,
} from "lucide-react";
import { COLOMBIA_CITIES } from "@/lib/cities";
import {
  previewMatches,
  publishReport,
  type PublishState,
} from "@/app/actions/reports";
import { PublishSuccess } from "@/components/PublishSuccess";
import { MatchReview } from "@/components/MatchReview";
import { smartCropPetPhoto } from "@/lib/smartCrop";
import type { PetReport, PetType, ReportType } from "@/lib/types";

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
  const [cropping, setCropping] = useState(false);
  const [cropNote, setCropNote] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "matches">("form");
  const [candidates, setCandidates] = useState<PetReport[]>([]);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [checkingMatches, startCheckTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const pendingPublishRef = useRef<FormData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function setPreviewUrl(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  }

  async function onPhotoChange(file: File | undefined) {
    if (!file) {
      setPreviewUrl(null);
      setHasPhoto(false);
      setCropNote(null);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setHasPhoto(false);
    setCropping(true);
    setCropNote("Encuadrando la carita…");

    try {
      const result = await smartCropPetPhoto(file);
      if (fileRef.current) {
        const dt = new DataTransfer();
        dt.items.add(result.file);
        fileRef.current.files = dt.files;
      }
      setPreviewUrl(URL.createObjectURL(result.file));
      setHasPhoto(true);
      setCropNote(
        result.detected
          ? `Encuadre listo · detectamos un ${result.label}`
          : "Encuadre listo · usamos el centro de la foto",
      );
    } catch {
      if (fileRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileRef.current.files = dt.files;
      }
      setHasPhoto(true);
      setCropNote("No pudimos optimizar el encuadre; usamos tu foto original.");
    } finally {
      setCropping(false);
    }
  }

  function submitPublish(fd?: FormData) {
    const data = fd ?? pendingPublishRef.current;
    if (!data) {
      const form = formRef.current;
      if (!form) return;
      formAction(new FormData(form));
      return;
    }
    formAction(data);
  }

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reportType || !hasPhoto || cropping || pending || checkingMatches) {
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    pendingPublishRef.current = fd;
    setMatchError(null);

    // Rescatados: publicar directo, sin revisión de coincidencias
    if (reportType === "rescatado") {
      submitPublish(fd);
      return;
    }

    startCheckTransition(async () => {
      const result = await previewMatches(fd);
      if (!result.ok) {
        setMatchError(result.message ?? "No pudimos buscar coincidencias.");
        return;
      }
      if (result.skipReview || !result.candidates?.length) {
        submitPublish(fd);
        return;
      }
      // Conservamos el FormData (incluye la foto) aunque el form se desmonte
      pendingPublishRef.current = fd;
      setCandidates(result.candidates);
      setStep("matches");
    });
  }

  if (state.ok && state.reportId && state.reportType) {
    return (
      <PublishSuccess
        reportId={state.reportId}
        reportType={state.reportType}
        message={state.message}
      />
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-3xl border border-found/30 bg-found-soft px-6 py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-found" aria-hidden />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          ¡Publicado!
        </h2>
        <p className="mt-2 text-sm text-muted">
          {state.message ?? "Tu reporte ya está en el feed."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="tap-target mt-5 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white"
        >
          Ir al feed
        </button>
      </div>
    );
  }

  if (step === "matches" && reportType) {
    return (
      <MatchReview
        candidates={candidates}
        yourType={reportType}
        checking={checkingMatches}
        publishing={pending}
        error={matchError ?? (state.message && !state.ok ? state.message : undefined)}
        onPublishAnyway={submitPublish}
        onBack={() => {
          setStep("form");
          setMatchError(null);
        }}
      />
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onFormSubmit}
      className="space-y-6"
    >
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
          <button
            type="button"
            onClick={() => setReportType("rescatado")}
            className={`tap-target rounded-3xl border-2 px-4 py-4 text-left transition ${
              reportType === "rescatado"
                ? "border-rescued bg-rescued-soft"
                : "border-line bg-white hover:border-rescued/40"
            }`}
          >
            <span className="flex items-center gap-2 text-base font-bold text-rescued">
              <HeartHandshake className="h-5 w-5" aria-hidden />
              Ya se reunió / Rescatado
            </span>
            <span className="mt-1 block text-sm text-muted">
              Apareció o ya está con su familia — comparte la esperanza
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
            disabled={cropping}
            className={`tap-target flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed bg-white px-4 py-8 text-center transition disabled:opacity-70 ${
              hasPhoto
                ? "border-found/50 hover:border-found"
                : "border-line hover:border-primary/40"
            }`}
          >
            {preview ? (
              <div className="relative w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Vista previa"
                  className="aspect-[4/3] h-auto w-full rounded-2xl object-cover"
                />
                {cropping ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Encuadrando…
                    </span>
                  </div>
                ) : null}
              </div>
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
          {cropNote ? (
            <p className="mt-2 text-xs font-medium text-muted">{cropNote}</p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Encuadramos automáticamente la carita del peludo para que se vea
              bien en el feed.
            </p>
          )}
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

      {(matchError || (state.message && !state.ok)) ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {matchError ?? state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!reportType || !hasPhoto || pending || cropping || checkingMatches}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Publicando…
          </>
        ) : checkingMatches ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Buscando coincidencias…
          </>
        ) : cropping ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Preparando foto…
          </>
        ) : reportType === "rescatado" ? (
          "Publicar reporte"
        ) : (
          "Revisar y publicar"
        )}
      </button>
    </form>
  );
}
