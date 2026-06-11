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
    <VistaLista
      nombre_lista={nombre_lista}
      canciones={canciones}
      onPresentar={entrarPresentador}
      onVolver={() => router.back()}
    />
  );
}

/* ─── Vista lista ──────────────────────────────────────────────────────────── */

function VistaLista({
  nombre_lista,
  canciones,
  onPresentar,
  onVolver,
}: {
  nombre_lista: string;
  canciones: Cancion[];
  onPresentar: (i: number) => void;
  onVolver: () => void;
}) {
  const [seleccionado, setSeleccionado] = useState(0);
  const cancion = canciones[seleccionado];
  const [modo, setModo] = useState<"charts" | "letra">(cancion?.letra ? "letra" : "charts");
  const tieneAmbos = !!(cancion?.charts && cancion?.letra);

  useEffect(() => {
    setModo(cancion?.letra ? "letra" : "charts");
  }, [seleccionado, cancion?.letra]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-base">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-base/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-lo transition-colors hover:bg-input hover:text-hi"
          >
            ← Volver
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-lo">{nombre_lista}</p>
            <p className="text-[11px] text-lo">{canciones.length} canciones</p>
          </div>
        </div>
        <button
          onClick={() => onPresentar(seleccionado)}
          className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 active:scale-[0.97]"
        >
          <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16">
            <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
          </svg>
          Presentar
        </button>
      </div>

      {/* Body: mobile = lista vertical scrollable | desktop = master-detail */}
      <div className="flex flex-1 overflow-hidden">

        {/* Song index list */}
        <div className="w-full overflow-y-auto md:w-72 md:shrink-0 md:border-r md:border-line lg:w-80">
          {canciones.map((c, i) => (
            <button
              key={c.id_lista_cancion}
              onClick={() => setSeleccionado(i)}
              className={`flex w-full items-center gap-3 border-b border-line/60 px-4 py-4 text-left transition-colors hover:bg-input md:py-3 ${
                i === seleccionado ? "bg-violet-500/10 md:border-l-2 md:border-l-violet-500" : ""
              }`}
            >
              <span className={`w-5 shrink-0 text-right text-sm font-bold tabular-nums ${
                i === seleccionado ? "text-violet-500" : "text-lo"
              }`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                <p className="truncate text-[11px] text-lo">{c.artista}</p>
              </div>
              {c.nota && (
                <span className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-600 dark:text-violet-400">
                  {c.nota}
                </span>
              )}
              {/* En mobile, botón presentar inline */}
              <button
                onClick={(e) => { e.stopPropagation(); onPresentar(i); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300 text-violet-600 transition-colors hover:bg-violet-50 active:scale-[0.97] dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950 md:hidden"
              >
                <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16">
                  <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
                </svg>
              </button>
            </button>
          ))}
        </div>

        {/* Content panel — solo desktop */}
        <div className="hidden flex-1 flex-col overflow-hidden md:flex">
          {cancion ? (
            <>
              <div className="shrink-0 border-b border-line px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold leading-tight text-hi">{cancion.nombre}</h2>
                    <p className="mt-0.5 text-sm text-lo">{cancion.artista}</p>
                    {cancion.nota && (
                      <p className="mt-2 text-lg font-bold text-violet-600 dark:text-violet-400">{cancion.nota}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {tieneAmbos && (
                      <div className="inline-flex rounded-lg border border-line bg-input p-0.5 text-xs font-semibold">
                        <button
                          onClick={() => setModo("letra")}
                          className={`rounded-md px-3 py-1.5 transition-colors ${modo === "letra" ? "bg-card text-hi shadow-sm" : "text-lo hover:text-mid"}`}
                        >
                          Letra
                        </button>
                        <button
                          onClick={() => setModo("charts")}
                          className={`rounded-md px-3 py-1.5 transition-colors ${modo === "charts" ? "bg-card text-hi shadow-sm" : "text-lo hover:text-mid"}`}
                        >
                          Charts
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => onPresentar(seleccionado)}
                      className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
                    >
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16">
                        <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
                      </svg>
                      Presentar esta
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
                {modo === "charts" && cancion.charts ? (
                  <ChartViewerInteractivo charts={cancion.charts} notaInicial={cancion.nota} />
                ) : cancion.letra ? (
                  <LyricViewer letra={cancion.letra} />
                ) : (
                  <p className="text-sm text-lo">Sin contenido cargado.</p>
                )}
              </div>
            </>
          ) : (
            <p className="p-8 text-sm text-lo">Seleccioná una canción.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modo Presentador ─────────────────────────────────────────────────────── */

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
  const listaRef = useRef<HTMLDivElement>(null);

  const [modoContenido, setModoContenido] = useState<"charts" | "letra">(
    cancion.letra ? "letra" : "charts"
  );
  const tieneAmbos = !!(cancion.charts && cancion.letra);

  useEffect(() => {
    setModoContenido(cancion.letra ? "letra" : "charts");
  }, [indice, cancion.letra]);

  // Mantener la canción activa visible en la lista lateral
  useEffect(() => {
    const el = listaRef.current?.querySelector(`[data-idx="${indice}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [indice]);

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
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-card md:flex-row"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── PANEL IZQUIERDO: contenido ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tabular-nums text-violet-600">{indice + 1}</span>
            <span className="text-sm text-lo">/ {total}</span>
          </div>
          <p className="max-w-[140px] truncate text-[10px] font-bold uppercase tracking-widest text-lo md:hidden">
            {nombre_lista}
          </p>
          <div className="flex items-center gap-2">
            {tieneAmbos && (
              <div className="inline-flex rounded-lg border border-line bg-input p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setModoContenido("letra")}
                  className={`rounded-md px-3 py-1.5 transition-colors ${modoContenido === "letra" ? "bg-card text-hi shadow-sm" : "text-lo hover:text-mid"}`}
                >
                  Letra
                </button>
                <button
                  onClick={() => setModoContenido("charts")}
                  className={`rounded-md px-3 py-1.5 transition-colors ${modoContenido === "charts" ? "bg-card text-hi shadow-sm" : "text-lo hover:text-mid"}`}
                >
                  Charts
                </button>
              </div>
            )}
            <button
              onClick={onSalir}
              className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-500/20 dark:text-violet-400"
            >
              ✕ Lista
            </button>
          </div>
        </div>

        {/* Song header */}
        <div className="shrink-0 border-b border-line px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black leading-tight text-hi md:text-3xl">{cancion.nombre}</h1>
              <p className="mt-0.5 text-sm text-lo">{cancion.artista}</p>
            </div>
            {cancion.nota && (
              <span className="shrink-0 rounded-lg bg-violet-100 px-3 py-1.5 text-lg font-black text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {cancion.nota}
              </span>
            )}
          </div>
        </div>

        {/* Content — scrollable */}
        <div key={indice} className="flex-1 overflow-y-auto px-5 py-5 md:px-10 md:py-8">
          {modoContenido === "charts" && cancion.charts ? (
            <ChartViewerInteractivo charts={cancion.charts} notaInicial={cancion.nota} />
          ) : cancion.letra ? (
            <LyricViewer letra={cancion.letra} />
          ) : (
            <p className="text-sm text-lo">Sin contenido.</p>
          )}
        </div>

        {/* Bottom nav — solo móvil */}
        <div className="shrink-0 border-t border-line bg-base/95 px-4 py-3 backdrop-blur-sm md:hidden">
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
              <span className="text-xs font-medium text-lo">{indice + 1} / {total}</span>
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

      {/* ── PANEL DERECHO: lista de canciones — solo desktop ── */}
      <div
        ref={listaRef}
        className="hidden w-72 shrink-0 flex-col border-l border-line bg-base md:flex lg:w-80"
      >
        <div className="shrink-0 border-b border-line px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-lo">{nombre_lista}</p>
          <p className="mt-0.5 text-xs text-lo">{total} canciones</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {canciones.map((c, i) => (
            <button
              key={c.id_lista_cancion}
              data-idx={i}
              onClick={() => setIndice(i)}
              className={`flex w-full items-center gap-3 border-b border-line/40 px-4 py-3 text-left transition-colors hover:bg-input ${
                i === indice ? "bg-violet-500/10 border-l-2 border-l-violet-500" : ""
              }`}
            >
              <span className={`w-4 shrink-0 text-right text-sm font-bold tabular-nums ${
                i === indice ? "text-violet-500" : "text-gone"
              }`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-medium ${i === indice ? "text-hi" : "text-mid"}`}>
                  {c.nombre}
                </p>
                <p className="truncate text-[10px] text-lo">{c.artista}</p>
              </div>
              {c.nota && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                  {c.nota}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Prev/Next desktop */}
        <div className="flex shrink-0 gap-2 border-t border-line px-4 py-3">
          <button
            onClick={() => setIndice((i) => Math.max(i - 1, 0))}
            disabled={indice === 0}
            className="flex-1 rounded-xl border border-line py-2 text-xs font-medium text-mid transition-colors hover:bg-input hover:text-hi disabled:pointer-events-none disabled:opacity-30"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setIndice((i) => Math.min(i + 1, total - 1))}
            disabled={indice === total - 1}
            className="flex-1 rounded-xl border border-line py-2 text-xs font-medium text-mid transition-colors hover:bg-input hover:text-hi disabled:pointer-events-none disabled:opacity-30"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
