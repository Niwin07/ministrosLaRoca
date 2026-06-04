"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";

interface ListaPrepItemProps {
  id_playlist: number;
  nombre:      string;
  onEliminar:  (formData: FormData) => Promise<void>;
}

export function ListaPrepItem({ id_playlist, nombre, onEliminar }: ListaPrepItemProps) {
  const [confirmar, setConfirmar] = useState(false);

  // ── Confirmar borrado ──────────────────────────────────────────────────────
  if (confirmar) {
    return (
      <div className="flex items-center gap-2 rounded-xl border-l-2 border-l-red-500 bg-red-500/[0.06] px-4 py-2.5">
        <p className="min-w-0 flex-1 text-sm text-hi">
          ¿Borrar <span className="font-semibold">{nombre}</span>?
        </p>
        <form action={onEliminar} className="shrink-0">
          <input type="hidden" name="id_playlist" value={id_playlist} />
          <Button type="submit" variant="danger" size="sm" icon={<Trash2 size={13} />}>
            Borrar
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-mid transition-colors hover:text-hi"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ── Vista normal ───────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2 rounded-xl border-l-2 border-l-violet-500 bg-card px-4 py-3 transition-all duration-200 hover:bg-input">
      <Link href={`/playlists/${id_playlist}`} className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-hi">{nombre}</p>
          <p className="mt-0.5 text-[11px] text-violet-600/80">Seguí armándola</p>
        </div>
        <ChevronRight size={13} className="shrink-0 text-gone" />
      </Link>
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        aria-label="Borrar lista en preparación"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gone transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
