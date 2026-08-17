import Link from "next/link";
import { Plus } from "lucide-react";

export function PublishFab() {
  return (
    <Link
      href="/publicar"
      aria-label="Publicar reporte"
      className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_-8px_rgba(15,118,110,0.55)] transition hover:bg-primary-dark active:scale-95 sm:hidden mb-[max(0px,env(safe-area-inset-bottom))]"
    >
      <Plus className="h-7 w-7" aria-hidden />
    </Link>
  );
}
