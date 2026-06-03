"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Music2, ChevronDown, X, Pencil } from "lucide-react";
import { ChartViewerInteractivo } from "@/components/ChartViewerInteractivo";
import { LyricViewer } from "@/components/LyricViewer";

interface Cancion {
  id_cancion: number;
  nombre:     string;
  artista:    string;
  bpm:        number | null;
  metrica:    string | null;
  letra:      string | null;
  charts:     string | null;
}

export function CatalogoCanciones({
  canciones,
  puedeEditar = false,
}: {
  canciones: Cancion[];
  puedeEditar?: boolean;
}) {
  const [q, setQ] = useState("");

  const botonEditar = (id: number) =>
    puedeEditar ? (
      <Link
        href={`/admin/canciones/${id}`}
        onClick={(e) => e.stopPropagation()}
        title="Editar canción"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gone transition-colors hover:bg-input hover:text-violet-600"
      >
        <Pencil size={13} />
      </Link>
    ) : null;

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return canciones;
    return canciones.filter(
      (c) =>
        c.nombre.toLowerCase().includes(t) ||
        c.artista.toLowerCase().includes(t),
    );
  }, [q, canciones]);

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lo" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o artista…"
          className="w-full rounded-xl border border-mark bg-input pl-10 pr-10 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gone transition-colors hover:bg-card hover:text-mid"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <p className="rounded-xl border border-line bg-card px-4 py-6 text-center text-sm text-lo">
          {q ? `No hay canciones que coincidan con “${q}”.` : "Sin canciones aprobadas aún."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {filtradas.map((c) => {
            const tieneDetalle = Boolean(c.letra || c.charts);
            const meta = (
              <div className="flex shrink-0 items-center gap-1.5">
                {c.metrica && (
                  <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-mid">{c.metrica}</span>
                )}
                {c.bpm && (
                  <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-mid">{c.bpm} BPM</span>
                )}
              </div>
            );

            // Sin letra ni acordes: fila estática (no desplegable).
            if (!tieneDetalle) {
              return (
                <li
                  key={c.id_cancion}
                  className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3"
                >
                  <Music2 size={16} className="shrink-0 text-gone" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                  </div>
                  {meta}
                  {botonEditar(c.id_cancion)}
                </li>
              );
            }

            return (
              <li
                key={c.id_cancion}
                className="overflow-hidden rounded-xl border border-line bg-card"
              >
                <details className="group">
                  <summary className="flex cursor-pointer select-none list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <Music2 size={16} className="shrink-0 text-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                      <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                    </div>
                    {meta}
                    {botonEditar(c.id_cancion)}
                    <ChevronDown size={14} className="shrink-0 text-gone transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="space-y-4 border-t border-line px-4 py-4">
                    {c.charts && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">Acordes / Charts</p>
                        <ChartViewerInteractivo charts={c.charts} />
                      </div>
                    )}
                    {c.letra && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">Letra</p>
                        <LyricViewer letra={c.letra} />
                      </div>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
