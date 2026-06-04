"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/Button";

interface PlantillaItemProps {
  id_playlist: number;
  nombre:      string;
  onUsar:      (formData: FormData) => Promise<void>;
  onRenombrar: (formData: FormData) => Promise<void>;
  onEliminar:  (formData: FormData) => Promise<void>;
}

const iconBtn =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gone transition-colors hover:bg-input hover:text-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40";

export function PlantillaItem({
  id_playlist,
  nombre,
  onUsar,
  onRenombrar,
  onEliminar,
}: PlantillaItemProps) {
  const [modo, setModo] = useState<"ver" | "editar" | "confirmar">("ver");

  // ── Renombrar ──────────────────────────────────────────────────────────────
  if (modo === "editar") {
    return (
      <form
        action={onRenombrar}
        onSubmit={() => setModo("ver")}
        className="flex items-center gap-2 rounded-xl border-l-2 border-l-violet-500 bg-card px-3 py-2.5"
      >
        <input type="hidden" name="id_playlist" value={id_playlist} />
        <input
          name="nombre"
          defaultValue={nombre}
          autoFocus
          required
          aria-label="Nuevo nombre de la plantilla"
          className="min-w-0 flex-1 rounded-lg border border-mark bg-input px-3 py-2 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
        <Button type="submit" size="sm" icon={<Check size={13} />} className="shrink-0">
          Guardar
        </Button>
        <button
          type="button"
          onClick={() => setModo("ver")}
          aria-label="Cancelar"
          className={iconBtn}
        >
          <X size={15} />
        </button>
      </form>
    );
  }

  // ── Confirmar borrado ──────────────────────────────────────────────────────
  if (modo === "confirmar") {
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
          onClick={() => setModo("ver")}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-mid transition-colors hover:text-hi"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ── Vista normal ───────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2 rounded-xl border-l-2 border-l-line bg-card px-4 py-3 transition-all duration-200 hover:bg-input">
      <Link href={`/playlists/${id_playlist}`} className="flex min-w-0 flex-1 items-center gap-2">
        <p className="truncate text-sm font-medium text-hi">{nombre}</p>
        <ChevronRight size={13} className="shrink-0 text-gone" />
      </Link>

      <div className="flex shrink-0 items-center gap-1">
        <form action={onUsar}>
          <input type="hidden" name="id_preset" value={id_playlist} />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            title="Armar un servicio a partir de esta plantilla"
          >
            Usar
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setModo("editar")}
          aria-label="Renombrar plantilla"
          className={iconBtn}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => setModo("confirmar")}
          aria-label="Borrar plantilla"
          className={`${iconBtn} hover:bg-red-500/10 hover:text-red-500`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
