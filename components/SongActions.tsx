"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, ChevronUp, ChevronDown, Trash2, Music2 } from "lucide-react";

type ReordenItem = { id_lista_cancion: number; orden: number };

interface SongActionsProps {
  item: { id_lista_cancion: number; orden: number; nota: string | null };
  swapArriba: ReordenItem[] | null;
  swapAbajo:  ReordenItem[] | null;
  onReordenar:      (formData: FormData) => Promise<void>;
  onEliminar:       (formData: FormData) => Promise<void>;
  onActualizarNota: (formData: FormData) => Promise<void>;
}

export function SongActions({
  item, swapArriba, swapAbajo,
  onReordenar, onEliminar, onActualizarNota,
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
        className="flex h-8 w-8 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-glass-elevated hover:text-content-secondary"
        aria-label="Acciones"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-glass-elevated bg-glass-elevated shadow-2xl shadow-black/60 backdrop-blur-xl">

          {swapArriba && (
            <form action={onReordenar} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="reordenamientos" value={JSON.stringify(swapArriba)} />
              <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content-primary hover:bg-glass-highlight">
                <ChevronUp size={13} className="text-content-muted" /> Subir
              </button>
            </form>
          )}

          {swapAbajo && (
            <form action={onReordenar} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="reordenamientos" value={JSON.stringify(swapAbajo)} />
              <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content-primary hover:bg-glass-highlight">
                <ChevronDown size={13} className="text-content-muted" /> Bajar
              </button>
            </form>
          )}

          {(swapArriba || swapAbajo) && <div className="mx-3 border-t border-glass-elevated" />}

          {!editNota ? (
            <button
              onClick={() => setEditNota(true)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content-primary hover:bg-glass-highlight"
            >
              <Music2 size={13} className="text-content-muted" /> Cambiar tono
            </button>
          ) : (
            <form
              action={onActualizarNota}
              onSubmit={() => { setEditNota(false); setOpen(false); }}
              className="px-3 py-3"
            >
              <input type="hidden" name="id_lista_cancion" value={item.id_lista_cancion} />
              <input
                name="nota"
                type="text"
                defaultValue={item.nota ?? ""}
                placeholder="Am, G, C#…"
                autoFocus
                className="mb-2 w-full rounded-lg border border-glass-elevated bg-glass-base px-3 py-1.5 text-sm text-content-primary placeholder-content-muted outline-none focus:ring-1 focus:ring-lime-500"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-lime-400 py-1.5 text-xs font-bold text-black"
              >
                Guardar
              </button>
            </form>
          )}

          <div className="mx-3 border-t border-glass-elevated" />

          <form action={onEliminar} onSubmit={() => setOpen(false)}>
            <input type="hidden" name="id_lista_cancion" value={item.id_lista_cancion} />
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={13} /> Quitar
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
