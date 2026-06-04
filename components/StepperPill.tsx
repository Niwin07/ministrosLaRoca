"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Pastilla de transición de etapa (stepper de `/playlists/[id]`). Mantiene el
 * tamaño compacto (text-[10px]) para que entren las 4 etapas en una fila en
 * mobile, pero agrega un mini-spinner mientras el Server Action corre, vía
 * useFormStatus (debe renderizarse dentro del <form> de la transición).
 */
export function StepperPill({ label, esPasado }: { label: string; esPasado: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={esPasado ? `Volver a ${label}` : `Pasar a ${label}`}
      className="inline-flex items-center gap-1 rounded-full border border-mark px-3 py-1 text-[10px] text-mid transition-colors hover:border-line hover:text-hi disabled:pointer-events-none disabled:opacity-60"
    >
      {pending && <Loader2 size={9} className="animate-spin" aria-hidden />}
      {esPasado ? `← ${label}` : `${label} →`}
    </button>
  );
}
