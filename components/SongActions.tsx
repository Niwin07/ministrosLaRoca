"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2, Music2 } from "lucide-react";
import { NOTAS } from "@/lib/notas";

interface SongActionsProps {
  item: { id_lista_cancion: number; nota: string | null };
  onEliminar:       (formData: FormData) => Promise<void>;
  onActualizarNota: (formData: FormData) => Promise<void>;
}

export function SongActions({
  item,
  onEliminar, onActualizarNota,
}: SongActionsProps) {
  const [open, setOpen]         = useState(false);
  const [editNota, setEditNota] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditNota(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gone transition-colors hover:bg-input hover:text-mid"
        aria-label="Acciones"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-line bg-card shadow-xl shadow-black/10 dark:shadow-black/60">

          {!editNota ? (
            <button
              onClick={() => setEditNota(true)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-hi transition-colors hover:bg-input"
            >
              <Music2 size={13} className="text-lo" /> Cambiar tono
            </button>
          ) : (
            <form
              action={onActualizarNota}
              onSubmit={() => { setEditNota(false); setOpen(false); }}
              className="px-3 py-3"
            >
              <input type="hidden" name="id_lista_cancion" value={item.id_lista_cancion} />
              <select
                name="nota"
                defaultValue={item.nota ?? ""}
                autoFocus
                className="mb-2 w-full rounded-lg border border-mark bg-input px-3 py-1.5 text-sm text-hi outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 [&>option]:bg-card"
              >
                <option value="">Sin tono</option>
                {NOTAS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-lg bg-violet-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Guardar
              </button>
            </form>
          )}

          <div className="mx-3 border-t border-line" />

          <form action={onEliminar} onSubmit={() => setOpen(false)}>
            <input type="hidden" name="id_lista_cancion" value={item.id_lista_cancion} />
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <Trash2 size={13} /> Quitar
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
