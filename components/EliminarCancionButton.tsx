"use client";

import { eliminarCancion } from "@/app/actions/canciones";

export function EliminarCancionButton({ id, nombre }: { id: number; nombre: string }) {
  async function handleSubmit(formData: FormData) {
    if (!confirm(`¿Eliminar "${nombre}" del catálogo? Esta acción no se puede deshacer.`)) return;
    await eliminarCancion(formData);
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="id_cancion" value={id} />
      <button
        type="submit"
        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
      >
        Eliminar canción
      </button>
    </form>
  );
}
