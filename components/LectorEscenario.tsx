"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChartViewer } from "@/components/ChartViewer";
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
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black">

      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/95 px-4 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">
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
        className="fixed bottom-6 right-4 z-[110] rounded-full bg-glass-base px-4 py-2 text-xs text-content-muted backdrop-blur-sm transition-all hover:bg-glass-elevated hover:text-content-secondary"
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
    <div className="border-b border-white/5 px-4 py-6">

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-tight text-white">{cancion.nombre}</h2>
          <p className="mt-0.5 text-xs text-content-muted">{cancion.artista}</p>
          {cancion.nota && (
            <p className="mt-2 text-base font-bold text-lime-400">{cancion.nota}</p>
          )}
        </div>

        {tieneAmbos && (
          <button
            onClick={() => setModo(modo === "charts" ? "letra" : "charts")}
            className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-content-muted transition-colors hover:border-white/30 hover:text-content-primary"
          >
            {modo === "charts" ? "Letra" : "Charts"}
          </button>
        )}
      </div>

      {modo === "charts" && cancion.charts ? (
        <ChartViewer charts={cancion.charts} />
      ) : cancion.letra ? (
        <LyricViewer letra={cancion.letra} />
      ) : (
        <p className="text-xs text-content-muted">Sin contenido.</p>
      )}

    </div>
  );
}

