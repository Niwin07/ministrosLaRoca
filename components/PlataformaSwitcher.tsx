"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { LayoutGroup } from "framer-motion";
import { setPlataforma } from "@/app/actions/plataforma";
import { nombrePlataforma, ordenarPlataformas } from "@/lib/plataforma";
import { PildoraActiva } from "@/components/zarza/PildoraActiva";

interface Plataforma {
  id: number;
  nombre: string;
}

interface Props {
  plataformas: Plataforma[];
  activaId:    number;
}

/**
 * Pestañas General / Remanentes. La pastilla se desliza al instante a la
 * pestaña tocada (selección optimista) mientras el servidor recarga la
 * pantalla con la plataforma nueva.
 */
export function PlataformaSwitcher({ plataformas, activaId }: Props) {
  const [pending, start] = useTransition();
  const [sel, setSel] = useState(activaId);
  const grupo = useId();

  useEffect(() => { setSel(activaId); }, [activaId]);

  function cambiar(id: number) {
    if (id === sel || pending) return;
    setSel(id);
    start(() => setPlataforma(id));
  }

  return (
    <LayoutGroup id={grupo}>
      <div role="tablist" aria-label="Plataforma" aria-busy={pending} className="flex w-fit max-w-full items-center gap-0.5 rounded-full border border-line bg-input p-[3px]">
        {ordenarPlataformas(plataformas).map((p) => {
          const activa = p.id === sel;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => cambiar(p.id)}
              className={`relative min-h-[38px] rounded-full px-[18px] text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 ${
                activa ? "text-white" : "text-mid hover:text-hi"
              }`}
            >
              {activa && <PildoraActiva />}
              <span className="relative">{nombrePlataforma(p.nombre)}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
