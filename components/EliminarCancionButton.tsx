"use client";

import { Trash2 } from "lucide-react";
import { eliminarCancion } from "@/app/actions/canciones";
import { BotonConfirmado } from "@/components/zarza/Confirmacion";

/** Botón "Eliminar canción" con la confirmación del sistema Zarza. */
export function EliminarCancionButton({ id, nombre }: { id: number; nombre: string }) {
  return (
    <form action={eliminarCancion} className="mt-3">
      <input type="hidden" name="id_cancion" value={id} />
      <BotonConfirmado
        confirmacion={{
          titulo: "¿Eliminar del repertorio?",
          mensaje: <><strong className="font-semibold text-hi">{nombre}</strong> se borra del catálogo para todo el equipo. Esta acción no se puede deshacer.</>,
        }}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-sm font-semibold text-red-700 transition-colors hover:border-red-500/50 hover:bg-red-500/20 dark:text-red-400"
      >
        <Trash2 size={14} aria-hidden /> Eliminar canción
      </BotonConfirmado>
    </form>
  );
}
