"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Music2, ChevronDown, X } from "lucide-react";

interface Cancion {
  id_cancion: number;
  nombre:     string;
  artista:    string;
}

interface Props {
  name:         string;
  canciones:    Cancion[];
  placeholder?: string;
}

const PANEL_MAX_H = 300;

export function CancionSelect({ name, canciones, placeholder = "Elegí una canción…" }: Props) {
  const [selected, setSelected] = useState<Cancion | null>(null);
  const [open, setOpen]         = useState(false);
  const [q, setQ]               = useState("");
  const [style, setStyle]       = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  const filtradas = canciones.filter((c) =>
    !q.trim() ||
    `${c.nombre} ${c.artista}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const openUp = spaceAbove > spaceBelow && spaceBelow < 150;

      setStyle(
        openUp
          ? {
              position: "fixed",
              bottom:   window.innerHeight - rect.top + 4,
              left:     rect.left,
              width:    rect.width,
              maxHeight: Math.max(160, Math.min(PANEL_MAX_H, spaceAbove)),
              zIndex:   9999,
            }
          : {
              position: "fixed",
              top:      rect.bottom + 4,
              left:     rect.left,
              width:    rect.width,
              maxHeight: Math.max(160, Math.min(PANEL_MAX_H, spaceBelow)),
              zIndex:   9999,
            },
      );
    }

    function onMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
      setQ("");
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function elegir(c: Cancion) {
    setSelected(c);
    setOpen(false);
    setQ("");
  }

  const panel = open
    ? createPortal(
        <div
          ref={panelRef}
          style={style}
          className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-xl dark:shadow-black/40"
        >
          {/* Búsqueda */}
          <div className="relative shrink-0 border-b border-line">
            <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lo" />
            <input
              ref={searchRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full bg-transparent py-3 pl-9 pr-4 text-sm text-hi placeholder-gone outline-none"
            />
          </div>

          {/* Lista */}
          <div className="overflow-y-auto">
            {filtradas.length === 0 ? (
              <p className="px-4 py-4 text-sm text-lo">Sin resultados.</p>
            ) : (
              filtradas.map((c) => (
                <button
                  key={c.id_cancion}
                  type="button"
                  onClick={() => elegir(c)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-input ${
                    selected?.id_cancion === c.id_cancion
                      ? "bg-violet-500/10"
                      : ""
                  }`}
                >
                  <Music2
                    size={13}
                    className={`shrink-0 ${selected?.id_cancion === c.id_cancion ? "text-violet-500" : "text-gone"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${selected?.id_cancion === c.id_cancion ? "text-violet-600 dark:text-violet-400" : "text-hi"}`}>
                      {c.nombre}
                    </p>
                    <p className="truncate text-xs text-lo">{c.artista}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <input type="hidden" name={name} value={selected?.id_cancion ?? ""} />

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-mark bg-input px-3 py-3 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
      >
        <Music2 size={13} className="shrink-0 text-lo" />
        <span className={`flex-1 text-left ${selected ? "text-hi" : "text-gone"}`}>
          {selected ? `${selected.nombre} — ${selected.artista}` : placeholder}
        </span>
        {selected ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelected(null); }}
            aria-label="Quitar selección"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-lo transition-colors hover:text-hi"
          >
            <X size={11} />
          </button>
        ) : (
          <ChevronDown size={13} className={`shrink-0 text-lo transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {panel}
    </>
  );
}
