"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, ChevronDown, Play } from "lucide-react";
import { ChartViewerInteractivo } from "@/components/ChartViewerInteractivo";
import { LyricViewer } from "@/components/LyricViewer";
import { SongActions } from "@/components/SongActions";

interface SongItem {
  id_lista_cancion: number;
  orden: number;
  nota: string | null;
  id_cancion: number;
  nombre: string;
  artista: string;
  charts: string | null;
  letra: string | null;
  link_referencia?: string | null;
}

interface SortableSongListProps {
  items: SongItem[];
  puedeEditar: boolean;
  onReordenar:      (formData: FormData) => Promise<void>;
  onEliminar:       (formData: FormData) => Promise<void>;
  onActualizarNota: (formData: FormData) => Promise<void>;
}

export function SortableSongList({
  items,
  puedeEditar,
  onReordenar,
  onEliminar,
  onActualizarNota,
}: SortableSongListProps) {
  const [orden, setOrden] = useState<SongItem[]>(items);
  const [guardando, startTransition] = useTransition();
  // Snapshot de ids al iniciar el arrastre, para detectar si hubo cambio al soltar.
  const ordenInicial = useRef<number[]>([]);

  // Sincroniza con el servidor cuando cambia el conjunto de canciones (agregar,
  // quitar) o el tono de alguna (cambiar tono). La firma incluye id + nota para
  // que un cambio de tono se refleje al instante. No incluye `orden` para no
  // pisar el reordenamiento en vivo durante un arrastre (el prop `items` solo
  // cambia tras un refresh del server, nunca a mitad del drag).
  const syncKey = items.map((i) => `${i.id_lista_cancion}:${i.nota ?? ""}`).join(",");
  useEffect(() => {
    setOrden(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  function handleDragStart() {
    ordenInicial.current = orden.map((i) => i.id_lista_cancion);
  }

  function handleDragEnd() {
    const idsActuales = orden.map((i) => i.id_lista_cancion);
    const cambio =
      idsActuales.length !== ordenInicial.current.length ||
      idsActuales.some((id, i) => id !== ordenInicial.current[i]);

    if (!cambio) return;

    // Preservar el multiset de valores de `orden` (UNIQUE(id_playlist, orden)):
    // tomamos los órdenes originales ascendentes y los asignamos por posición nueva.
    const ordenes = items.map((i) => i.orden).sort((a, b) => a - b);
    const payload = orden.map((it, idx) => ({
      id_lista_cancion: it.id_lista_cancion,
      orden: ordenes[idx],
    }));

    const fd = new FormData();
    fd.set("reordenamientos", JSON.stringify(payload));
    startTransition(async () => {
      await onReordenar(fd);
    });
  }

  return (
    <Reorder.Group
      axis="y"
      values={orden}
      onReorder={setOrden}
      className={`flex flex-col gap-2 ${guardando ? "pointer-events-none opacity-70" : ""}`}
    >
      {orden.map((item, idx) => (
        <SortableRow
          key={item.id_lista_cancion}
          item={item}
          posicion={idx + 1}
          puedeEditar={puedeEditar}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onEliminar={onEliminar}
          onActualizarNota={onActualizarNota}
        />
      ))}
    </Reorder.Group>
  );
}

interface SortableRowProps {
  item: SongItem;
  posicion: number;
  puedeEditar: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEliminar:       (formData: FormData) => Promise<void>;
  onActualizarNota: (formData: FormData) => Promise<void>;
}

function SortableRow({
  item,
  posicion,
  puedeEditar,
  onDragStart,
  onDragEnd,
  onEliminar,
  onActualizarNota,
}: SortableRowProps) {
  const controls = useDragControls();
  const [arrastrando, setArrastrando] = useState(false);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => {
        setArrastrando(true);
        onDragStart();
      }}
      onDragEnd={() => {
        setArrastrando(false);
        onDragEnd();
      }}
      whileDrag={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 600, damping: 40 }}
      className={`overflow-hidden rounded-2xl border bg-card transition-shadow ${
        arrastrando
          ? "z-10 border-violet-500/50 shadow-xl shadow-black/25 dark:shadow-black/60"
          : "border-line border-l-[3px] border-l-violet-500/35 shadow-card dark:shadow-none"
      }`}
    >
      {/* Fila principal */}
      <div className="flex items-center gap-2 px-3 py-4 sm:gap-3 sm:px-4">
        {puedeEditar && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              controls.start(e);
            }}
            style={{ touchAction: "none" }}
            className={`flex h-8 w-6 shrink-0 touch-none items-center justify-center text-gone transition-colors hover:text-mid ${
              arrastrando ? "cursor-grabbing text-violet-500" : "cursor-grab"
            }`}
            aria-label="Arrastrar para reordenar"
          >
            <GripVertical size={16} />
          </button>
        )}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/[.12] text-[10px] font-bold text-violet-600 dark:text-violet-400">
          {String(posicion).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-hi">{item.nombre}</p>
          <p className="mt-0.5 truncate text-xs text-lo">{item.artista}</p>
        </div>
        {item.nota && (
          <span className="shrink-0 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold tracking-wide text-violet-600 dark:text-violet-400">
            {item.nota}
          </span>
        )}
        {item.link_referencia && (
          <a
            href={item.link_referencia}
            target="_blank"
            rel="noopener noreferrer"
            title="Escuchar referencia"
            aria-label={`Escuchar referencia de ${item.nombre}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gone transition-colors hover:bg-input hover:text-violet-600"
          >
            <Play size={13} />
          </a>
        )}
        {puedeEditar && (
          <SongActions
            item={{ id_lista_cancion: item.id_lista_cancion, nota: item.nota }}
            onEliminar={onEliminar}
            onActualizarNota={onActualizarNota}
          />
        )}
      </div>

      {/* Charts colapsable */}
      {item.charts && (
        <details className="group border-t border-line">
          <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gone transition-colors hover:text-mid [&::-webkit-details-marker]:hidden">
            <span>Acordes / Charts</span>
            <ChevronDown size={12} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-5 pt-1">
            <ChartViewerInteractivo charts={item.charts} notaInicial={item.nota} />
          </div>
        </details>
      )}

      {/* Letra colapsable */}
      {item.letra && (
        <details className="group border-t border-line">
          <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gone transition-colors hover:text-mid [&::-webkit-details-marker]:hidden">
            <span>Letra</span>
            <ChevronDown size={12} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-5 pt-2">
            <LyricViewer letra={item.letra} />
          </div>
        </details>
      )}
    </Reorder.Item>
  );
}
