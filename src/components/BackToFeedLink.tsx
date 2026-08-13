"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { feedHrefFromNear, readStoredNear } from "@/lib/nearNav";

function useFeedHref(href: string) {
  const [resolved, setResolved] = useState(href);

  useEffect(() => {
    if (href !== "/") {
      setResolved(href);
      return;
    }
    setResolved(feedHrefFromNear(readStoredNear()));
  }, [href]);

  return resolved;
}

export function NearAwareFeedLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const resolved = useFeedHref(href);
  return (
    <Link href={resolved} className={className}>
      {children}
    </Link>
  );
}

type Props = {
  href: string;
  label?: string;
};

export function BackToFeedLink({ href, label = "Volver al feed" }: Props) {
  return (
    <NearAwareFeedLink
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </NearAwareFeedLink>
  );
}
