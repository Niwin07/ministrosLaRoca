"use client";

import { useState } from "react";
import { EditorContenido } from "@/components/EditorContenido";
import { ImportadorCancion } from "@/components/ImportadorCancion";
import type { CancionImportada } from "@/lib/importar-cancion";

interface Props {
  defaultLetra?:  string;
  defaultCharts?: string;
}

/**
 * Une el importador (pegar / archivo / PDF) con los dos editores guiados.
 * Los <textarea> internos llevan name="letra" y name="charts", así el form
 * server-side recibe el contenido al enviar.
 */
export function CargarCancion({ defaultLetra = "", defaultCharts = "" }: Props) {
  const [letra, setLetra]   = useState(defaultLetra);
  const [charts, setCharts] = useState(defaultCharts);

  function handleImport(r: CancionImportada) {
    if (r.letra)  setLetra(r.letra);
    if (r.charts) setCharts(r.charts);
  }

  return (
    <div className="flex flex-col gap-4">
      <ImportadorCancion onImport={handleImport} />

      <EditorContenido
        name="letra"
        tipo="letra"
        label="Letra"
        value={letra}
        onChange={setLetra}
        placeholder="Pegá o escribí la letra. Usá los botones para marcar las secciones…"
      />
      <EditorContenido
        name="charts"
        tipo="charts"
        label="Acordes / charts"
        value={charts}
        onChange={setCharts}
        placeholder="Cifra Nashville: 1  4  5  6m …"
      />
    </div>
  );
}
