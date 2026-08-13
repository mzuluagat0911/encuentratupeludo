"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";

const COORDS_KEY = "ubicatupeludo.near";
const SKIP_KEY = "ubicatupeludo.near.skip";

function geoErrorMessage(err: GeolocationPositionError): string {
  if (err.code === err.PERMISSION_DENIED) {
    return "El navegador bloqueó la ubicación. En Safari/Chrome: Ajustes → Sitios → Ubicación → Permitir, y recarga.";
  }
  if (err.code === err.TIMEOUT) {
    return "Tardó demasiado en ubicar. Activa el GPS y vuelve a tocar Permitir.";
  }
  return "No pudimos leer tu ubicación. Revisa que el GPS esté activo e intenta de nuevo.";
}

export function NearMeButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const askedRef = useRef(false);

  const active = Boolean(searchParams.get("lat") && searchParams.get("lng"));

  function goToNear(lat: number, lng: number) {
    try {
      localStorage.setItem(COORDS_KEY, JSON.stringify({ lat, lng }));
      sessionStorage.removeItem(SKIP_KEY);
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("lat", lat.toFixed(5));
    params.set("lng", lng.toFixed(5));
    params.delete("ciudad");
    const qs = params.toString();
    // Navegación completa: más fiable que router.push tras el prompt de GPS
    window.location.assign(qs ? `${pathname}?${qs}` : pathname);
  }

  function locate() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Este navegador no permite ubicación. Ábrelo en Safari o Chrome.");
      return;
    }

    setError(null);
    setBusy(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        goToNear(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED) setSkipped(true);
        setError(geoErrorMessage(err));
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
    );
  }

  function skip() {
    setSkipped(true);
    setError(null);
    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (active || askedRef.current) return;
    askedRef.current = true;
    try {
      if (sessionStorage.getItem(SKIP_KEY) === "1") setSkipped(true);
    } catch {
      /* ignore */
    }
  }, [active]);

  if (active) {
    return null;
  }

  return (
    <div className="space-y-2">
      {!skipped ? (
        <div className="rounded-3xl border-2 border-primary/25 bg-white px-4 py-4 shadow-sm">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            Al entrar
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
            ¿Qué hay de tu lado?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Toca Permitir y acepta el aviso del navegador (arriba o abajo). Así
            vemos peludos potencialmente cerca. No guardamos tu GPS.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={locate}
              disabled={busy}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-70"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4" aria-hidden />
              )}
              {busy ? "Espera el aviso…" : "Permitir"}
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={busy}
              className="tap-target rounded-2xl border border-line px-3 py-3 text-sm font-bold text-foreground hover:bg-[#f3f7f4]"
            >
              Ahora no
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={locate}
          disabled={busy}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-white px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-70"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden />
          )}
          {busy ? "Espera el aviso…" : "Ver lo de mi lado"}
        </button>
      )}
      {error ? (
        <p role="alert" className="text-xs leading-relaxed text-lost">
          {error}
        </p>
      ) : null}
    </div>
  );
}
