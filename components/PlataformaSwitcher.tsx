"use client";

import { useTransition } from "react";
import { setPlataforma } from "@/app/actions/plataforma";
import { nombrePlataforma, ordenarPlataformas } from "@/lib/plataforma";

interface Plataforma {
  id: number;
  nombre: string;
}

interface Props {
  plataformas: Plataforma[];
  activaId:    number;
}

export function PlataformaSwitcher({ plataformas, activaId }: Props) {
  const [pending, start] = useTransition();

  function cambiar(id: number) {
    if (id === activaId || pending) return;
    start(() => setPlataforma(id));
  }

  return (
    <div role="tablist" aria-label="Plataforma" className="flex w-fit max-w-full items-center gap-0.5 rounded-full border border-line bg-input p-[3px]">
      {ordenarPlataformas(plataformas).map((p) => {
        const activa = p.id === activaId;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => cambiar(p.id)}
            disabled={pending}
            className={`min-h-[38px] rounded-full px-[18px] text-[13px] font-semibold transition-all duration-150 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 ${
              activa
                ? "bg-fuego-600 text-white shadow-sm"
                : "text-mid hover:text-hi"
            }`}
          >
            {nombrePlataforma(p.nombre)}
          </button>
        );
      })}
    </div>
  );
}
