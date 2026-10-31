"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Clock, Loader2 } from "lucide-react";
import { cls } from "@/components/zarza/ui";
import { SelectorZarza } from "@/components/zarza/SelectorZarza";
import { CargarCancion } from "@/components/CargarCancion";
import { ESTILOS, TONOS_CANCION } from "@/lib/estilos";

export type EstadoSugerir = { ok: boolean; error?: string; nombre?: string; vez: number } | null;

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${cls.btnLlama} min-h-[46px] self-start px-5`}>
      {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {pending ? "Enviando…" : "Enviar sugerencia"}
    </button>
  );
}

/**
 * Formulario "Sugerir canción" (diseño Repertorio). Se envía sin salir de la
 * página: al terminar muestra "¡Sugerencia enviada!" en el lugar, sin volver
 * arriba ni recargar.
 */
export function FormSugerir({
  accion,
  conEstilos,
}: {
  accion: (prev: EstadoSugerir, fd: FormData) => Promise<EstadoSugerir>;
  conEstilos: boolean;
}) {
  const [estado, enviar] = useActionState(accion, null);
  const [verForm, setVerForm] = useState(true);

  useEffect(() => {
    if (estado?.ok) setVerForm(false);
  }, [estado]);

  if (!verForm && estado?.ok) {
    return (
      <div role="status" className="animate-desplegar flex flex-col items-center gap-3 px-5 py-7 text-center">
        <span className="animate-pop flex h-14 w-14 items-center justify-center rounded-full bg-[#fde4d8] text-[#94402a] dark:bg-[#1e1513] dark:text-[#d9846d]">
          <Check size={26} strokeWidth={2.5} aria-hidden />
        </span>
        <p className="font-display text-[17px] font-bold text-hi">¡Sugerencia enviada!</p>
        <p className="max-w-[280px] text-[13px] leading-relaxed text-mid">
          Un líder la va a revisar. Te avisamos cuando esté aprobada y aparezca en el repertorio.
        </p>
        <p className="mt-1 flex items-center gap-2 rounded-xl bg-[#ffeccc] px-3.5 py-2.5 text-xs font-semibold text-[#9a3c0a] dark:bg-[#251d11] dark:text-[#f8894f]">
          <Clock size={13} aria-hidden /> {estado.nombre} · Pendiente
        </p>
        <button type="button" onClick={() => setVerForm(true)} className={`${cls.btnTexto} mt-1`}>
          Sugerir otra
        </button>
      </div>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-3 px-5 pb-5 pt-4">
      {estado && !estado.ok && (
        <p role="alert" className="animate-desplegar rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-700 dark:text-red-400">{estado.error}</p>
      )}
      <label className={cls.etiqueta}>
        Nombre de la canción
        <input name="nombre" required className={cls.campo} />
      </label>
      <label className={cls.etiqueta}>
        Artista
        <input name="artista" required className={cls.campo} />
      </label>
      {conEstilos && <SelectorZarza name="estilo" label="Estilo" opciones={ESTILOS} />}
      <div className="flex items-end gap-2">
        {conEstilos && <SelectorZarza name="tono" label="Tono" opciones={TONOS_CANCION} className="flex-1" />}
        <label className={`${cls.etiqueta} ${conEstilos ? "w-24" : "w-full"}`}>
          BPM
          <input name="bpm" type="number" min={1} max={300} inputMode="numeric" className={`${cls.campo} px-2 text-center`} />
        </label>
      </div>
      <CargarCancion />
      <p className="text-[11px] text-lo">Queda pendiente hasta que un líder la apruebe.</p>
      <Enviar />
    </form>
  );
}
