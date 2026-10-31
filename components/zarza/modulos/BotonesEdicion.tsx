"use client";

import { useId } from "react";
import { LayoutGroup } from "framer-motion";
import { Check, Pencil, Plus } from "lucide-react";
import { PildoraActiva } from "@/components/zarza/PildoraActiva";
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
        <button type="button" onClick={onAgregar} className={`${cls.btnLlama} animate-pop`}>
          <Plus size={16} strokeWidth={2.4} aria-hidden /> {agregarTxt}
        </button>
      )}
      <button type="button" onClick={() => setEditando(!editando)} aria-pressed={editando} className={cls.btnSec}>
        {editando ? <Check key="ok" size={16} aria-hidden className="animate-girar-entra" /> : <Pencil key="ed" size={15} aria-hidden className="animate-girar-entra" />}
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
  const grupo = useId();
  return (
    <LayoutGroup id={grupo}>
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
            className={`relative min-h-[38px] rounded-full px-[18px] text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 ${
              on ? "text-white" : "text-mid hover:text-hi"
            }`}
          >
            {on && <PildoraActiva />}
            <span className="relative">{o.texto}</span>
          </button>
        );
      })}
    </div>
    </LayoutGroup>
  );
}
