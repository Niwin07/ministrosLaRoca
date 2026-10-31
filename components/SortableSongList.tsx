"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, ChevronDown, ChevronUp, ChevronsUpDown, Trash2, X } from "lucide-react";
import { NOTAS } from "@/lib/notas";
import { ChartViewerInteractivo } from "@/components/ChartViewerInteractivo";
import { LyricViewer } from "@/components/LyricViewer";

interface SongItem {
  id_lista_cancion: number;
  orden: number;
  nota: string | null;
  id_cancion: number;
  nombre: string;
  artista: string;
  charts: string | null;
  letra: string | null;
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

  function guardarOrden(nuevo: SongItem[]) {
    // Preserva el multiset de valores de `orden` (UNIQUE(id_playlist, orden)):
    // toma los órdenes originales ascendentes y los asigna por posición nueva.
    const ordenes = items.map((i) => i.orden).sort((a, b) => a - b);
    const payload = nuevo.map((it, idx) => ({
      id_lista_cancion: it.id_lista_cancion,
      orden: ordenes[idx],
    }));

    const fd = new FormData();
    fd.set("reordenamientos", JSON.stringify(payload));
    startTransition(async () => {
      await onReordenar(fd);
    });
  }

  function handleDragEnd() {
    const idsActuales = orden.map((i) => i.id_lista_cancion);
    const cambio =
      idsActuales.length !== ordenInicial.current.length ||
      idsActuales.some((id, i) => id !== ordenInicial.current[i]);

    if (!cambio) return;
    guardarOrden(orden);
  }

  // Alternativa accesible por teclado al drag-and-drop (que es pointer/touch-only).
  function moverItem(idx: number, direccion: -1 | 1) {
    const destino = idx + direccion;
    if (destino < 0 || destino >= orden.length) return;
    const nuevo = [...orden];
    [nuevo[idx], nuevo[destino]] = [nuevo[destino], nuevo[idx]];
    setOrden(nuevo);
    guardarOrden(nuevo);
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
          esPrimero={idx === 0}
          esUltimo={idx === orden.length - 1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMover={(dir) => moverItem(idx, dir)}
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
  esPrimero: boolean;
  esUltimo: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMover: (direccion: -1 | 1) => void;
  onEliminar:       (formData: FormData) => Promise<void>;
  onActualizarNota: (formData: FormData) => Promise<void>;
}

function TonoPopover({
  item,
  bloqueado,
  onActualizarNota,
}: {
  item: SongItem;
  bloqueado: boolean;
  onActualizarNota: (formData: FormData) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [abierto]);

  function elegir(nota: string) {
    const fd = new FormData();
    fd.set("id_lista_cancion", String(item.id_lista_cancion));
    fd.set("nota", nota);
    setAbierto(false);
    start(async () => { await onActualizarNota(fd); });
  }

  const tono = item.nota || "—";

  if (bloqueado) {
    return (
      <span className="inline-flex min-h-[40px] min-w-[44px] items-center justify-center px-1.5 text-[17px] font-extrabold text-fuego-600 dark:text-[#df8067]" aria-label={`Tono: ${item.nota ?? "sin tono"}`}>
        {tono}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={pending}
        aria-label={`Tono: ${item.nota ?? "sin tono"}. Cambiar tono`}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="inline-flex min-h-[40px] min-w-[44px] items-center justify-center gap-[3px] px-1.5 text-[17px] font-extrabold text-fuego-600 disabled:opacity-60 dark:text-[#df8067]"
      >
        <span className={`border-b-2 border-dashed pb-px leading-[1.1] ${abierto ? "border-fuego-600" : "border-fuego-600/35"}`}>{tono}</span>
        <ChevronsUpDown size={12} strokeWidth={2.4} aria-hidden />
      </button>
      {abierto && (
        <div role="listbox" aria-label="Elegir tono" className="absolute right-0 top-[calc(100%-4px)] z-30 w-[232px] rounded-[14px] border border-line bg-card p-2.5 shadow-[0_12px_32px_-8px_rgba(120,45,15,0.35)] dark:shadow-black/60">
          {[{ t: "Mayores", n: NOTAS.slice(0, 12) }, { t: "Menores", n: NOTAS.slice(12) }].map((g) => (
            <div key={g.t} className="mb-2">
              <p className="mb-1.5 ml-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-lo">{g.t}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {g.n.map((n) => {
                  const on = n === item.nota;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => elegir(n)}
                      className={`min-h-[40px] rounded-full border text-[13px] font-bold ${on ? "border-fuego-600 bg-fuego-600 text-white" : "border-line bg-[#fffaf3] text-hi hover:border-fuego-300 dark:bg-input"}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => elegir("")} className="mt-0.5 min-h-[38px] w-full rounded-full border border-dashed border-mark text-[13px] text-mid hover:text-hi">
            Sin tono
          </button>
        </div>
      )}
    </div>
  );
}

function SortableRow({
  item,
  posicion,
  puedeEditar,
  esPrimero,
  esUltimo,
  onDragStart,
  onDragEnd,
  onMover,
  onEliminar,
  onActualizarNota,
}: SortableRowProps) {
  const controls = useDragControls();
  const [arrastrando, setArrastrando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const tieneContenido = !!(item.charts || item.letra);

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
      className={`relative rounded-2xl border bg-card transition-shadow ${
        arrastrando ? "z-10 border-fuego-500/50 shadow-xl shadow-black/20" : "border-line"
      }`}
    >
      <div className="flex items-center gap-2.5 py-3 pl-2 pr-2.5">
        {puedeEditar && (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                controls.start(e);
              }}
              style={{ touchAction: "none" }}
              className={`flex h-8 w-5 touch-none items-center justify-center text-[#b9998a] ${arrastrando ? "cursor-grabbing" : "cursor-grab"}`}
              aria-label="Arrastrar para reordenar"
            >
              <GripVertical size={16} />
            </button>
            <div className="flex flex-col">
              <button type="button" onClick={() => onMover(-1)} disabled={esPrimero} aria-label="Mover arriba" className="flex h-4 w-5 items-center justify-center text-gone hover:text-hi disabled:opacity-30">
                <ChevronUp size={12} />
              </button>
              <button type="button" onClick={() => onMover(1)} disabled={esUltimo} aria-label="Mover abajo" className="flex h-4 w-5 items-center justify-center text-gone hover:text-hi disabled:opacity-30">
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
        )}
        <span aria-label={`Canción ${posicion}`} className={`min-w-[15px] shrink-0 self-start pt-px text-right text-sm font-bold leading-5 tabular-nums text-fuego-600 dark:text-[#df8067] ${puedeEditar ? "" : "ml-2"}`}>
          {posicion}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-hi">{item.nombre}</p>
          <p className="mt-0.5 truncate text-xs text-lo">{item.artista}</p>
        </div>
        <TonoPopover item={item} bloqueado={!puedeEditar} onActualizarNota={onActualizarNota} />
        {puedeEditar && (
          confirmar ? (
            <form action={onEliminar} className="flex shrink-0 items-center gap-1">
              <input type="hidden" name="id_lista_cancion" value={item.id_lista_cancion} />
              <button type="submit" className="min-h-[36px] rounded-full bg-red-600 px-3 text-xs font-semibold text-white">Quitar</button>
              <button type="button" onClick={() => setConfirmar(false)} aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-full text-gone hover:text-hi"><X size={16} /></button>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirmar(true)} aria-label="Quitar del servicio" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#b9998a] hover:bg-red-500/10 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          )
        )}
      </div>

      {tieneContenido && (
        <details className="group border-t border-[#f1e5d4] dark:border-line">
          <summary className="flex cursor-pointer select-none list-none items-center justify-between rounded-b-2xl px-4 py-2.5 text-xs font-medium text-lo hover:text-hi [&::-webkit-details-marker]:hidden">
            <span>Letra y acordes</span>
            <ChevronDown size={14} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-5 px-4 pb-5 pt-1">
            {item.charts && <ChartViewerInteractivo charts={item.charts} notaInicial={item.nota} />}
            {item.letra && <LyricViewer letra={item.letra} />}
          </div>
        </details>
      )}
    </Reorder.Item>
  );
}
