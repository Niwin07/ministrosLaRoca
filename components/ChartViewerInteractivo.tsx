"use client";

import { useState } from "react";
import { ChartViewer } from "@/components/ChartViewer";
import { nashvilleAAcordes } from "@/lib/nashville";
import { pareceNashville } from "@/lib/acordes";
import { NOTAS } from "@/lib/notas";

// Solo tonos mayores para la traducción de números.
const TONOS = NOTAS.slice(0, 12);

interface Props {
  charts: string;
  /** Tono de la canción en esta lista (lista_canciones.nota). Opcional. */
  notaInicial?: string | null;
}

export function ChartViewerInteractivo({ charts, notaInicial }: Props) {
  // Tono inicial: el de la lista si existe (sin el "m" de menor), sino G.
  const tonoBase = (notaInicial ?? "").replace("m", "").trim();
  const [modo, setModo] = useState<"numeros" | "acordes">("numeros");
  const [tono, setTono] = useState(TONOS.includes(tonoBase as (typeof TONOS)[number]) ? tonoBase : "G");

  // Con acordes reales (no Nashville) no hay nada que traducir: render directo.
  if (!pareceNashville(charts)) {
    return <ChartViewer charts={charts} />;
  }

  const contenido = modo === "acordes" ? nashvilleAAcordes(charts, tono) : charts;

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-mark bg-input p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setModo("numeros")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              modo === "numeros" ? "bg-violet-600 text-white" : "text-mid hover:text-hi"
            }`}
          >
            Números
          </button>
          <button
            type="button"
            onClick={() => setModo("acordes")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              modo === "acordes" ? "bg-violet-600 text-white" : "text-mid hover:text-hi"
            }`}
          >
            Acordes
          </button>
        </div>

        {modo === "acordes" && (
          <label className="flex items-center gap-1.5 text-[11px] text-lo">
            Tono
            <select
              value={tono}
              onChange={(e) => setTono(e.target.value)}
              className="rounded-md border border-mark bg-input px-2 py-1 text-xs text-hi outline-none focus:border-violet-500 [&>option]:bg-card"
            >
              {TONOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <ChartViewer charts={contenido} />
    </div>
  );
}
