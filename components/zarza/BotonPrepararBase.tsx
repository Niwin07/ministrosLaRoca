"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { prepararModulos } from "@/app/actions/migracion";

/** Botón del aviso de migración: crea las tablas de los módulos nuevos. */
export function BotonPrepararBase() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function preparar() {
    setError(null);
    start(async () => {
      const r = await prepararModulos();
      if (r.ok) router.refresh();
      else setError(r.error);
    });
  }

  return (
    <span className="mt-2 flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={preparar}
        disabled={pending}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#9a3c0a] px-4 text-[13px] font-semibold text-white disabled:opacity-60 dark:bg-[#f8894f] dark:text-[#251d11]"
      >
        {pending && <Loader2 size={14} className="animate-spin" aria-hidden />}
        {pending ? "Preparando…" : "Preparar base de datos"}
      </button>
      {error && <span role="alert" className="text-[12px]">{error}</span>}
    </span>
  );
}
