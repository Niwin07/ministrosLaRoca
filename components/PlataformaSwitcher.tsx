"use client";

import { useTransition } from "react";
import { setPlataforma } from "@/app/actions/plataforma";

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
    <div className="flex items-center rounded-full border border-line bg-input p-0.5 gap-0.5">
      {plataformas.map((p) => {
        const activa = p.id === activaId;
        return (
          <button
            key={p.id}
            onClick={() => cambiar(p.id)}
            disabled={pending}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-150 disabled:opacity-60 ${
              activa
                ? "bg-violet-600 text-white shadow-sm"
                : "text-mid hover:text-hi"
            }`}
          >
            {p.nombre}
          </button>
        );
      })}
    </div>
  );
}
