"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { eliminarCancion } from "@/app/actions/canciones";
import { Button } from "@/components/Button";

/**
 * Confirmación de borrado inline (no window.confirm) — mismo patrón que
 * ListaPrepItem/PlantillaItem, para que las dos confirmaciones de "borrar"
 * de la app se vean y se sientan iguales.
 */
export function EliminarCancionButton({ id, nombre }: { id: number; nombre: string }) {
  const [confirmar, setConfirmar] = useState(false);

  if (confirmar) {
    return (
      <div className="mt-3 flex flex-col gap-2 rounded-xl border-l-2 border-l-red-500 bg-red-500/[0.06] px-4 py-3 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 text-sm text-hi">
          ¿Eliminar <span className="font-semibold">{nombre}</span> del catálogo? Esta acción no se puede deshacer.
        </p>
        <div className="flex shrink-0 gap-2">
          <form action={eliminarCancion}>
            <input type="hidden" name="id_cancion" value={id} />
            <Button type="submit" variant="danger" size="sm" icon={<Trash2 size={13} />}>
              Eliminar
            </Button>
          </form>
          <Button type="button" variant="ghost" size="sm" icon={<X size={13} />} onClick={() => setConfirmar(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="mt-3 border-red-500/30 bg-red-500/10 text-red-600 hover:border-red-500/50 hover:bg-red-500/20 dark:text-red-400"
      icon={<Trash2 size={13} />}
      onClick={() => setConfirmar(true)}
    >
      Eliminar canción
    </Button>
  );
}
