"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export const FOCUS_REPORT_EVENT = "ubicatupeludo:focus-report";

export function focusReportCard(id: string) {
  window.dispatchEvent(
    new CustomEvent(FOCUS_REPORT_EVENT, { detail: id }),
  );
}

type Props = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function ReportCardShell({ id, children, className = "" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    let clearTimer = 0;

    function activate(reportId: string) {
      if (reportId !== id) {
        setFocused(false);
        return;
      }
      setFocused(true);
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => setFocused(false), 2800);
    }

    function fromHash() {
      const hash = window.location.hash;
      const prefix = "#reporte-";
      if (hash.startsWith(prefix)) activate(hash.slice(prefix.length));
    }

    function onFocusEvent(event: Event) {
      const reportId = (event as CustomEvent<string>).detail;
      if (typeof reportId === "string") activate(reportId);
    }

    fromHash();
    window.addEventListener(FOCUS_REPORT_EVENT, onFocusEvent);
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener(FOCUS_REPORT_EVENT, onFocusEvent);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [id]);

  return (
    <article
      ref={ref}
      id={`reporte-${id}`}
      className={`scroll-mt-24 ${className}${focused ? " report-card-focus" : ""}`}
    >
      {children}
    </article>
  );
}
