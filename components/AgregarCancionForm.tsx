"use client";

import { useState } from "react";
import { PlusCircle, History } from "lucide-react";
import { CancionSelect } from "@/components/CancionSelect";
import { TonoSelect } from "@/components/TonoSelect";
import { Button } from "@/components/Button";

interface Cancion {
  id_cancion: number;
  nombre:     string;
  artista:    string;
}

interface Props {
  canciones:      Cancion[];
  /** Último tono usado por canción (de listas EVENTO anteriores). */
  historialTonos: Record<number, string>;
  nextOrden:      number;
  onAgregar:      (formData: FormData) => Promise<void>;
}

/**
 * Form de "agregar canción" con sugerencia de tono: al elegir una canción,
 * si ya se tocó antes, pre-selecciona el último tono usado y muestra el hint
 * "Última vez en X". El usuario puede cambiarlo antes de agregar.
 */
export function AgregarCancionForm({ canciones, historialTonos, nextOrden, onAgregar }: Props) {
  const [tono, setTono]                 = useState("");
  const [tonoSugerido, setTonoSugerido] = useState<string | null>(null);

  function handleCancionChange(c: Cancion | null) {
    const sugerido = c ? historialTonos[c.id_cancion] ?? null : null;
    setTonoSugerido(sugerido);
    setTono(sugerido ?? "");
  }

  return (
    <form action={onAgregar} className="flex flex-col gap-3">
      <CancionSelect name="id_cancion" canciones={canciones} onChange={handleCancionChange} />

      <div className="flex gap-2">
        <div className="flex-1">
          <TonoSelect name="nota" value={tono} onChange={setTono} />
        </div>
        <input
          name="orden"
          type="number"
          min={1}
          defaultValue={nextOrden}
          required
          className="w-20 rounded-xl border border-mark bg-input px-3 py-3 text-center text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      {tonoSugerido && (
        <p className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400">
          <History size={11} className="shrink-0" />
          La última vez se tocó en <span className="font-bold">{tonoSugerido}</span>
          {tono === tonoSugerido ? " — tono pre-seleccionado." : "."}
        </p>
      )}

      <Button type="submit" shape="block" size="lg" fullWidth icon={<PlusCircle size={15} />}>
        Agregar
      </Button>
    </form>
  );
}
