"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin, X } from "lucide-react";

const COORDS_KEY = "ubicatupeludo.near";
const SKIP_KEY = "ubicatupeludo.near.skip";

export function NearMeButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const askedRef = useRef(false);

  const active = Boolean(searchParams.get("lat") && searchParams.get("lng"));
  const showAsk = !active && !skipped && !busy;

  function pushWith(lat: number, lng: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lat", lat.toFixed(5));
    params.set("lng", lng.toFixed(5));
    params.delete("ciudad");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function saveCoords(lat: number, lng: number) {
    try {
      localStorage.setItem(COORDS_KEY, JSON.stringify({ lat, lng }));
      sessionStorage.removeItem(SKIP_KEY);
    } catch {
      /* ignore */
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite ubicación.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        saveCoords(lat, lng);
        pushWith(lat, lng);
        setBusy(false);
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED) {
          setSkipped(true);
          setError("Sin ubicación no podemos ordenar por cercanía. Puedes activarla cuando quieras.");
        } else {
          setError("No pudimos leer tu ubicación. Intenta de nuevo.");
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 180000 },
    );
  }

  function skip() {
    setSkipped(true);
    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function clearNear() {
    try {
      localStorage.removeItem(COORDS_KEY);
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setSkipped(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (active || askedRef.current) return;
    askedRef.current = true;

    try {
      if (sessionStorage.getItem(SKIP_KEY) === "1") {
        setSkipped(true);
        return;
      }
    } catch {
      /* ignore */
    }

    try {
      const raw = localStorage.getItem(COORDS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { lat?: number; lng?: number };
        if (typeof saved.lat === "number" && typeof saved.lng === "number") {
          pushWith(saved.lat, saved.lng);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    // Si el navegador ya había dado permiso, aplicar sin tocar de nuevo.
    const permissions = navigator.permissions;
    if (permissions?.query) {
      permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (status.state === "granted") locate();
        })
        .catch(() => {
          /* el aviso de Permitir queda visible */
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (active) {
    return (
      <button
        type="button"
        onClick={clearNear}
        className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark"
      >
        <X className="h-4 w-4" aria-hidden />
        Ver todos los reportes
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {showAsk ? (
        <div className="rounded-3xl border-2 border-primary/25 bg-white px-4 py-4 shadow-sm">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            Al entrar
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
            ¿Qué hay de tu lado?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Permite la ubicación para ver peludos <strong>potencialmente cerca
            de ti</strong>. No la guardamos en el servidor. Cada reporte se
            ubica por ciudad y zona, no es un pin exacto.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={locate}
              disabled={busy}
              className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {busy ? "Ubicándote…" : "Permitir"}
            </button>
            <button
              type="button"
              onClick={skip}
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
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-white px-4 py-3 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden />
          )}
          {busy ? "Ubicándote…" : "Ver lo de mi lado"}
        </button>
      )}
      {error ? <p className="text-xs text-lost">{error}</p> : null}
    </div>
  );
}
