"use client";

import { Check, Pencil, Plus } from "lucide-react";
import { cls } from "@/components/zarza/ui";

/** Botones "Agregar …" + "Editar / Listo" del encabezado de los módulos editables. */
export function BotonesEdicion({
  editando,
  setEditando,
  agregarTxt,
  onAgregar,
}: {
  editando: boolean;
  setEditando: (v: boolean) => void;
  agregarTxt: string;
  onAgregar: () => void;
}) {
  return (
    <>
      {editando && (
        <button type="button" onClick={onAgregar} className={cls.btnLlama}>
          <Plus size={16} strokeWidth={2.4} aria-hidden /> {agregarTxt}
        </button>
      )}
      <button type="button" onClick={() => setEditando(!editando)} aria-pressed={editando} className={cls.btnSec}>
        {editando ? <Check size={16} aria-hidden /> : <Pencil size={15} aria-hidden />}
        {editando ? "Listo" : "Editar"}
      </button>
    </>
  );
}

/** Control segmentado (pestañas) con el estilo del sistema. */
export function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
  label,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex w-fit max-w-full gap-0.5 rounded-full border border-line bg-input p-[3px]">
      {opciones.map((o) => {
        const on = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.valor)}
            className={`min-h-[38px] rounded-full px-[18px] text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 ${
              on ? "bg-fuego-600 text-white" : "text-mid hover:text-hi"
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}
