"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Mic2, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";

interface TurnoItem {
  id_turno:       number;
  nombre_usuario: string;
  orden:          number;
  foto:           string | null;
}

interface Props {
  turnos:      TurnoItem[];
  onReordenar: (fd: FormData) => Promise<void>;
  onActivar:   (fd: FormData) => Promise<void>;
  onQuitar:    (fd: FormData) => Promise<void>;
}

export function ColaTurnos({ turnos, onReordenar, onActivar, onQuitar }: Props) {
  const [orden, setOrden] = useState<TurnoItem[]>(turnos);
  const [guardando, startTransition] = useTransition();
  const inicial = useRef<number[]>([]);

  const idsKey = turnos.map((t) => t.id_turno).join(",");
  useEffect(() => {
    setOrden(turnos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  function handleDragStart() {
    inicial.current = orden.map((t) => t.id_turno);
  }

  function guardarOrden(nuevo: TurnoItem[]) {
    const ordenes = turnos.map((t) => t.orden).sort((a, b) => a - b);
    const payload = nuevo.map((t, i) => ({ id_turno: t.id_turno, orden: ordenes[i] }));
    const fd = new FormData();
    fd.set("reordenamientos", JSON.stringify(payload));
    startTransition(async () => { await onReordenar(fd); });
  }

  function handleDragEnd() {
    const ids = orden.map((t) => t.id_turno);
    const cambio =
      ids.length !== inicial.current.length ||
      ids.some((id, i) => id !== inicial.current[i]);
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

  function accion(fn: (fd: FormData) => Promise<void>, id: number) {
    const fd = new FormData();
    fd.set("id_turno", String(id));
    startTransition(async () => { await fn(fd); });
  }

  if (orden.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-lo">
        La cola está vacía.
      </p>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={orden}
      onReorder={setOrden}
      className={`flex flex-col gap-2 ${guardando ? "pointer-events-none opacity-70" : ""}`}
    >
      {orden.map((t, idx) => (
        <Fila
          key={t.id_turno}
          turno={t}
          pos={idx + 1}
          esPrimero={idx === 0}
          esUltimo={idx === orden.length - 1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMover={(dir) => moverItem(idx, dir)}
          onActivar={() => accion(onActivar, t.id_turno)}
          onQuitar={() => accion(onQuitar, t.id_turno)}
        />
      ))}
    </Reorder.Group>
  );
}

interface FilaProps {
  turno:       TurnoItem;
  pos:         number;
  esPrimero:   boolean;
  esUltimo:    boolean;
  onDragStart: () => void;
  onDragEnd:   () => void;
  onMover:     (direccion: -1 | 1) => void;
  onActivar:   () => void;
  onQuitar:    () => void;
}

function Fila({ turno, pos, esPrimero, esUltimo, onDragStart, onDragEnd, onMover, onActivar, onQuitar }: FilaProps) {
  const controls = useDragControls();
  const [arrastrando, setArrastrando] = useState(false);

  return (
    <Reorder.Item
      value={turno}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => { setArrastrando(true); onDragStart(); }}
      onDragEnd={() => { setArrastrando(false); onDragEnd(); }}
      whileDrag={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 600, damping: 40 }}
      className={`flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 ${
        arrastrando ? "z-10 border-violet-500/50 shadow-xl shadow-black/25 dark:shadow-black/60" : "border-line"
      }`}
    >
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
        style={{ touchAction: "none" }}
        aria-label="Arrastrar para reordenar"
        className={`flex h-8 w-5 shrink-0 items-center justify-center text-gone transition-colors hover:text-mid ${
          arrastrando ? "cursor-grabbing text-violet-500" : "cursor-grab"
        }`}
      >
        <GripVertical size={16} />
      </button>

      {/* Alternativa accesible por teclado al drag-and-drop */}
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={() => onMover(-1)}
          disabled={esPrimero}
          aria-label="Mover arriba"
          className="flex h-4 w-5 items-center justify-center rounded-t text-gone transition-colors hover:bg-input hover:text-hi disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={() => onMover(1)}
          disabled={esUltimo}
          aria-label="Mover abajo"
          className="flex h-4 w-5 items-center justify-center rounded-b text-gone transition-colors hover:bg-input hover:text-hi disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-gone">{pos}</span>
      <Avatar foto={turno.foto} nombre={turno.nombre_usuario} size={32} />

      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-hi">{turno.nombre_usuario}</p>

      <Button type="button" size="sm" onClick={onActivar} icon={<Mic2 size={12} />} className="shrink-0">
        Al servicio
      </Button>

      <button
        type="button"
        onClick={onQuitar}
        aria-label="Quitar de la cola"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gone transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </Reorder.Item>
  );
}
