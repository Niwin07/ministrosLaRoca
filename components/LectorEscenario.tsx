"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChartViewerInteractivo } from "@/components/ChartViewerInteractivo";
import { LyricViewer } from "@/components/LyricViewer";

interface Cancion {
  id_lista_cancion: number;
  orden: number;
  nota: string | null;
  nombre: string;
  artista: string;
  letra: string | null;
  charts: string | null;
}

interface LectorEscenarioProps {
  nombre_lista: string;
  canciones: Cancion[];
}

export function LectorEscenario({ nombre_lista, canciones }: LectorEscenarioProps) {
  const router = useRouter();

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    return () => { lock?.release(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-base">

      <div className="sticky top-0 z-10 border-b border-line bg-base/95 px-4 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-lo">
          {nombre_lista}
        </p>
      </div>

      <div className="pb-20">
        {canciones.map((cancion) => (
          <CancionEscenario key={cancion.id_lista_cancion} cancion={cancion} />
        ))}
      </div>

      <button
        onClick={() => router.back()}
        className="fixed bottom-6 right-4 z-[110] rounded-full border border-line bg-card px-4 py-2 text-xs text-lo shadow-card backdrop-blur-sm transition-all hover:bg-input hover:text-mid dark:shadow-none"
      >
        ← Volver
      </button>

    </div>
  );
}

function CancionEscenario({ cancion }: { cancion: Cancion }) {
  const tieneAmbos = !!(cancion.charts && cancion.letra);
  const [modo, setModo] = useState<"charts" | "letra">(cancion.charts ? "charts" : "letra");

  return (
    <div className="border-b border-line px-4 py-6">

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-tight text-hi">{cancion.nombre}</h2>
          <p className="mt-0.5 text-xs text-lo">{cancion.artista}</p>
          {cancion.nota && (
            <p className="mt-2 text-base font-bold text-violet-600 dark:text-violet-400">{cancion.nota}</p>
          )}
        </div>

        {tieneAmbos && (
          <button
            onClick={() => setModo(modo === "charts" ? "letra" : "charts")}
            className="shrink-0 rounded-full border border-mark px-3 py-1.5 text-xs text-lo transition-colors hover:border-line hover:text-hi"
          >
            {modo === "charts" ? "Letra" : "Charts"}
          </button>
        )}
      </div>

      {modo === "charts" && cancion.charts ? (
        <ChartViewerInteractivo charts={cancion.charts} notaInicial={cancion.nota} />
      ) : cancion.letra ? (
        <LyricViewer letra={cancion.letra} />
      ) : (
        <p className="text-xs text-lo">Sin contenido.</p>
      )}

    </div>
  );
}

