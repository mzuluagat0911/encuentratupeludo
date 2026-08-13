"use client";

import dynamic from "next/dynamic";
import type { PetReport } from "@/lib/types";

const Inner = dynamic(
  () => import("@/components/NearbyMapInner").then((m) => m.NearbyMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 animate-pulse rounded-3xl border border-line bg-white/70 sm:h-96" />
    ),
  },
);

type Props = {
  origin: { lat: number; lng: number };
  reports: PetReport[];
};

export function NearbyMap({ origin, reports }: Props) {
  return <Inner origin={origin} reports={reports} />;
}
