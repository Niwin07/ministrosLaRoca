"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
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
  indiceInicial?: number;
}

export function LectorEscenario({ nombre_lista, canciones, indiceInicial }: LectorEscenarioProps) {
  const router = useRouter();
  const [presentando, setPresentando] = useState(indiceInicial !== undefined);
  const [indice, setIndice] = useState(indiceInicial ?? 0);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    return () => { lock?.release(); };
  }, []);

  useEffect(() => {
    if (!presentando) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        setIndice((i) => Math.min(i + 1, canciones.length - 1));
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        setIndice((i) => Math.max(i - 1, 0));
      else if (e.key === "Escape")
        setPresentando(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presentando, canciones.length]);

  function entrarPresentador(i: number) {
    setIndice(i);
    setPresentando(true);
  }

  if (presentando) {
    return (
      <PresentadorMode
        canciones={canciones}
        nombre_lista={nombre_lista}
        indice={indice}
        setIndice={setIndice}
        onSalir={() => setPresentando(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-base">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-base/95 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-lo">
            {nombre_lista}
          </p>
          <p className="text-[11px] text-lo">{canciones.length} canciones</p>
        </div>
        <button
          onClick={() => entrarPresentador(0)}
          className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 active:scale-[0.97]"
        >
          <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16">
            <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
          </svg>
          Presentar
        </button>
      </div>

      <div className="pb-20">
        {canciones.map((cancion, i) => (
          <CancionEscenario
            key={cancion.id_lista_cancion}
            cancion={cancion}
            numero={i + 1}
            onPresentar={() => entrarPresentador(i)}
          />
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

function CancionEscenario({
  cancion,
  numero,
  onPresentar,
}: {
  cancion: Cancion;
  numero: number;
  onPresentar: () => void;
}) {
  const tieneAmbos = !!(cancion.charts && cancion.letra);
  const [modo, setModo] = useState<"charts" | "letra">(cancion.charts ? "charts" : "letra");

  return (
    <div className="border-b border-line px-4 py-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 w-5 shrink-0 text-right text-sm font-bold tabular-nums text-violet-500">
            {numero}
          </span>
          <div>
            <h2 className="text-xl font-bold leading-tight text-hi">{cancion.nombre}</h2>
            <p className="mt-0.5 text-xs text-lo">{cancion.artista}</p>
            {cancion.nota && (
              <p className="mt-2 text-base font-bold text-violet-600 dark:text-violet-400">
                {cancion.nota}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {tieneAmbos && (
            <button
              onClick={() => setModo(modo === "charts" ? "letra" : "charts")}
              className="rounded-full border border-mark px-3 py-1.5 text-xs text-lo transition-colors hover:border-line hover:text-hi"
            >
              {modo === "charts" ? "Letra" : "Charts"}
            </button>
          )}
          <button
            onClick={onPresentar}
            title="Abrir en modo presentador"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-300 text-violet-600 transition-colors hover:bg-violet-50 active:scale-[0.97] dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
          >
            <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16">
              <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
            </svg>
          </button>
        </div>
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

function PresentadorMode({
  canciones,
  nombre_lista,
  indice,
  setIndice,
  onSalir,
}: {
  canciones: Cancion[];
  nombre_lista: string;
  indice: number;
  setIndice: Dispatch<SetStateAction<number>>;
  onSalir: () => void;
}) {
  const cancion = canciones[indice];
  const total = canciones.length;
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const [modoContenido, setModoContenido] = useState<"charts" | "letra">(
    cancion.charts ? "charts" : "letra"
  );
  const tieneAmbos = !!(cancion.charts && cancion.letra);

  // Reset content mode when song changes
  useEffect(() => {
    setModoContenido(cancion.charts ? "charts" : "letra");
  }, [indice, cancion.charts]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0) setIndice((i) => Math.min(i + 1, total - 1));
    else setIndice((i) => Math.max(i - 1, 0));
  }

  const mostrarDots = total <= 10;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-card"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tabular-nums text-violet-600">{indice + 1}</span>
          <span className="text-sm text-lo">/ {total}</span>
        </div>
        <p className="max-w-[140px] truncate text-[10px] font-bold uppercase tracking-widest text-lo">
          {nombre_lista}
        </p>
        <button
          onClick={onSalir}
          className="rounded-full border border-line px-3 py-1.5 text-xs text-lo transition-colors hover:bg-input hover:text-hi"
        >
          ✕ Lista
        </button>
      </div>

      {/* Song header */}
      <div className="shrink-0 border-b border-line px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black leading-tight text-hi">{cancion.nombre}</h1>
            <p className="mt-0.5 text-sm text-lo">{cancion.artista}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {cancion.nota && (
              <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-lg font-black text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {cancion.nota}
              </span>
            )}
            {tieneAmbos && (
              <button
                onClick={() =>
                  setModoContenido((c) => (c === "charts" ? "letra" : "charts"))
                }
                className="rounded-full border border-mark px-3 py-1.5 text-xs text-lo transition-colors hover:border-line hover:text-hi"
              >
                {modoContenido === "charts" ? "Letra" : "Charts"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content — scrollable */}
      <div key={indice} className="flex-1 overflow-y-auto px-5 py-5">
        {modoContenido === "charts" && cancion.charts ? (
          <ChartViewerInteractivo charts={cancion.charts} notaInicial={cancion.nota} />
        ) : cancion.letra ? (
          <LyricViewer letra={cancion.letra} />
        ) : (
          <p className="text-sm text-lo">Sin contenido.</p>
        )}
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-line bg-base/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIndice((i) => Math.max(i - 1, 0))}
            disabled={indice === 0}
            className="flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-input hover:text-hi disabled:pointer-events-none disabled:opacity-30"
          >
            ← Anterior
          </button>

          {mostrarDots ? (
            <div className="flex gap-1.5">
              {canciones.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndice(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === indice ? "w-5 bg-violet-600" : "w-2 bg-mark hover:bg-lo"
                  }`}
                />
              ))}
            </div>
          ) : (
            <span className="text-xs font-medium text-lo">
              {indice + 1} / {total}
            </span>
          )}

          <button
            onClick={() => setIndice((i) => Math.min(i + 1, total - 1))}
            disabled={indice === total - 1}
            className="flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-mid transition-colors hover:bg-input hover:text-hi disabled:pointer-events-none disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
