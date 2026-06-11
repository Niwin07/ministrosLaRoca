"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Music2, ChevronDown, ChevronLeft, ChevronRight, X, Pencil, SlidersHorizontal } from "lucide-react";
import { ChartViewerInteractivo } from "@/components/ChartViewerInteractivo";
import { LyricViewer } from "@/components/LyricViewer";

interface Cancion {
  id_cancion: number;
  nombre:     string;
  artista:    string;
  bpm:        number | null;
  metrica:    string | null;
  letra:      string | null;
  charts:     string | null;
}

type FiltroContenido = "charts" | "letra" | null;

export function CatalogoCanciones({
  canciones,
  puedeEditar = false,
}: {
  canciones: Cancion[];
  puedeEditar?: boolean;
}) {
  const [q, setQ]                       = useState("");
  const [artista, setArtista]           = useState("");
  const [metrica, setMetrica]           = useState("");
  const [contenido, setContenido]       = useState<FiltroContenido>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina, setPagina]             = useState(1);
  const [seleccionada, setSeleccionada] = useState<Cancion | null>(null);
  const [modoPanel, setModoPanel]       = useState<"letra" | "charts">("letra");

  const POR_PAGINA = 15;

  const artistas = useMemo(
    () => [...new Set(canciones.map((c) => c.artista))].sort(),
    [canciones],
  );

  const metricas = useMemo(
    () => [...new Set(canciones.map((c) => c.metrica).filter(Boolean))].sort() as string[],
    [canciones],
  );

  const filtrosActivos = [q, artista, metrica, contenido].filter(Boolean).length;

  function limpiarFiltros() {
    setQ("");
    setArtista("");
    setMetrica("");
    setContenido(null);
  }

  const filtradas = useMemo(() => {
    let lista = canciones;

    const t = q.trim().toLowerCase();
    if (t) {
      lista = lista.filter(
        (c) => c.nombre.toLowerCase().includes(t) || c.artista.toLowerCase().includes(t),
      );
    }

    if (artista) lista = lista.filter((c) => c.artista === artista);
    if (metrica) lista = lista.filter((c) => c.metrica === metrica);

    if (contenido === "charts") lista = lista.filter((c) => !!c.charts);
    if (contenido === "letra")  lista = lista.filter((c) => !!c.letra);

    return lista;
  }, [canciones, q, artista, metrica, contenido]);

  // Resetear a página 1 cada vez que cambien los filtros
  useEffect(() => { setPagina(1); }, [q, artista, metrica, contenido]);

  // Cuando cambia la canción seleccionada, elegir el modo disponible
  useEffect(() => {
    if (!seleccionada) return;
    if (seleccionada.letra) setModoPanel("letra");
    else if (seleccionada.charts) setModoPanel("charts");
  }, [seleccionada]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas    = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const botonEditar = (id: number) =>
    puedeEditar ? (
      <Link
        href={`/admin/canciones/${id}`}
        onClick={(e) => e.stopPropagation()}
        title="Editar canción"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gone transition-colors hover:bg-input hover:text-violet-600"
      >
        <Pencil size={13} />
      </Link>
    ) : null;

  // ── Barra de búsqueda y filtros (shared) ────────────────────────
  const barraYFiltros = (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lo" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o artista…"
            className="w-full rounded-xl border border-mark bg-input pl-10 pr-10 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gone transition-colors hover:bg-card hover:text-mid"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMostrarFiltros((v) => !v)}
          className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-colors ${
            mostrarFiltros || filtrosActivos > 0
              ? "border-violet-500/40 bg-violet-500/10 text-violet-600"
              : "border-mark bg-input text-lo hover:border-line hover:text-mid"
          }`}
        >
          <SlidersHorizontal size={15} />
          {filtrosActivos > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
              {filtrosActivos}
            </span>
          )}
        </button>
      </div>

      {mostrarFiltros && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-3.5 shadow-card dark:shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-lo">Filtros</p>
            {filtrosActivos > 0 && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-[11px] text-violet-600 transition-colors hover:text-violet-700"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-lo">Artista</label>
            <select
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              className="rounded-lg border border-mark bg-input px-3 py-2 text-sm text-hi outline-none transition-colors focus:border-violet-500 [&>option]:bg-card"
            >
              <option value="">Todos</option>
              {artistas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {metricas.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-lo">Métrica</label>
              <select
                value={metrica}
                onChange={(e) => setMetrica(e.target.value)}
                className="rounded-lg border border-mark bg-input px-3 py-2 text-sm text-hi outline-none transition-colors focus:border-violet-500 [&>option]:bg-card"
              >
                <option value="">Todas</option>
                {metricas.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-lo">Contenido</label>
            <div className="flex gap-2">
              {(["charts", "letra"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setContenido(contenido === tipo ? null : tipo)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                    contenido === tipo
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-600"
                      : "border-mark bg-input text-mid hover:border-line hover:text-hi"
                  }`}
                >
                  {tipo === "charts" ? "Con charts" : "Con letra"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-lo">
          {filtradas.length === canciones.length
            ? `${canciones.length} canciones`
            : `${filtradas.length} de ${canciones.length}`}
        </p>
        {filtrosActivos > 0 && filtradas.length !== canciones.length && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-violet-600 transition-colors hover:text-violet-700"
          >
            <X size={11} /> Quitar filtros
          </button>
        )}
      </div>
    </>
  );

  // ── Lista de canciones (shared) ─────────────────────────────────
  const lista = (
    <>
      {filtradas.length === 0 ? (
        <p className="rounded-xl border border-line bg-card px-4 py-6 text-center text-sm text-lo">
          {filtrosActivos > 0
            ? "Ninguna canción coincide con los filtros aplicados."
            : "Sin canciones aprobadas aún."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {paginadas.map((c) => {
            const tieneDetalle = Boolean(c.letra || c.charts);

            const meta = (
              <div className="flex shrink-0 items-center gap-1.5">
                {c.metrica && (
                  <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-mid">
                    {c.metrica}
                  </span>
                )}
                {c.bpm && (
                  <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-mid">
                    {c.bpm} BPM
                  </span>
                )}
              </div>
            );

            // En desktop, todos los ítems son clickeables para el panel derecho
            const isActive = seleccionada?.id_cancion === c.id_cancion;

            if (!tieneDetalle) {
              return (
                <li key={c.id_cancion}>
                  {/* Mobile: fila simple sin detalle */}
                  <div className="md:hidden flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
                    <Music2 size={16} className="shrink-0 text-gone" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                      <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                    </div>
                    {meta}
                    {botonEditar(c.id_cancion)}
                  </div>
                  {/* Desktop: clickeable para panel */}
                  <button
                    type="button"
                    onClick={() => setSeleccionada(isActive ? null : c)}
                    className={`hidden md:flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-line bg-card hover:bg-input/60"
                    }`}
                  >
                    <Music2 size={16} className={`shrink-0 ${isActive ? "text-violet-500" : "text-gone"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                      <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                    </div>
                    {meta}
                    {botonEditar(c.id_cancion)}
                  </button>
                </li>
              );
            }

            return (
              <li key={c.id_cancion} className="overflow-hidden rounded-xl border border-line bg-card">
                {/* Mobile: details accordion */}
                <details className="group md:hidden">
                  <summary className="flex cursor-pointer select-none list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <Music2 size={16} className="shrink-0 text-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                      <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                    </div>
                    {meta}
                    {botonEditar(c.id_cancion)}
                    <ChevronDown size={14} className="shrink-0 text-gone transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="space-y-4 border-t border-line px-4 py-4">
                    {c.charts && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">Acordes / Charts</p>
                        <ChartViewerInteractivo charts={c.charts} />
                      </div>
                    )}
                    {c.letra && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">Letra</p>
                        <LyricViewer letra={c.letra} />
                      </div>
                    )}
                  </div>
                </details>

                {/* Desktop: fila clickeable para panel */}
                <button
                  type="button"
                  onClick={() => setSeleccionada(isActive ? null : c)}
                  className={`hidden md:flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-violet-500/10" : "hover:bg-input/60"
                  }`}
                >
                  <Music2 size={16} className={`shrink-0 ${isActive ? "text-violet-500" : "text-violet-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                  </div>
                  {meta}
                  {botonEditar(c.id_cancion)}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-lo transition-colors hover:border-mark hover:text-hi disabled:pointer-events-none disabled:opacity-30"
            aria-label="Página anterior"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs tabular-nums text-lo">
            {pagina} <span className="text-gone">/</span> {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-lo transition-colors hover:border-mark hover:text-hi disabled:pointer-events-none disabled:opacity-30"
            aria-label="Página siguiente"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile: layout vertical simple ─────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {barraYFiltros}
        {lista}
      </div>

      {/* ── Desktop: master-detail split ───────────────────────────────── */}
      <div className="hidden md:flex gap-0 rounded-2xl border border-line bg-card overflow-hidden" style={{ minHeight: "calc(100vh - 10rem)" }}>
        {/* Panel izquierdo — lista */}
        <div className="flex w-80 shrink-0 flex-col border-r border-line">
          <div className="flex flex-col gap-3 p-4 border-b border-line">
            {barraYFiltros}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {lista}
          </div>
        </div>

        {/* Panel derecho — detalle */}
        <div className="flex flex-1 flex-col">
          {seleccionada ? (
            <>
              {/* Header del panel */}
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-hi">{seleccionada.nombre}</h2>
                  <p className="mt-0.5 text-xs text-lo">{seleccionada.artista}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {seleccionada.letra && seleccionada.charts && (
                    <div className="inline-flex rounded-lg border border-line bg-input p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setModoPanel("letra")}
                        className={`rounded-md px-3 py-1.5 transition-colors ${modoPanel === "letra" ? "bg-card text-hi shadow-sm" : "text-lo hover:text-mid"}`}
                      >
                        Letra
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoPanel("charts")}
                        className={`rounded-md px-3 py-1.5 transition-colors ${modoPanel === "charts" ? "bg-card text-hi shadow-sm" : "text-lo hover:text-mid"}`}
                      >
                        Charts
                      </button>
                    </div>
                  )}
                  {puedeEditar && (
                    <Link
                      href={`/admin/canciones/${seleccionada.id_cancion}`}
                      className="flex items-center gap-1.5 rounded-xl border border-line bg-input px-3 py-1.5 text-xs font-medium text-lo transition-colors hover:text-hi"
                    >
                      <Pencil size={12} />
                      Editar
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5">
                    {seleccionada.metrica && (
                      <span className="rounded-md bg-input px-2 py-1 text-xs font-medium text-mid">
                        {seleccionada.metrica}
                      </span>
                    )}
                    {seleccionada.bpm && (
                      <span className="rounded-md bg-input px-2 py-1 text-xs font-medium text-mid">
                        {seleccionada.bpm} BPM
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {modoPanel === "letra" && seleccionada.letra && (
                  <LyricViewer letra={seleccionada.letra} />
                )}
                {modoPanel === "charts" && seleccionada.charts && (
                  <ChartViewerInteractivo charts={seleccionada.charts} />
                )}
                {modoPanel === "letra" && !seleccionada.letra && seleccionada.charts && (
                  <ChartViewerInteractivo charts={seleccionada.charts} />
                )}
                {!seleccionada.letra && !seleccionada.charts && (
                  <p className="text-sm text-lo">Esta canción no tiene letra ni charts.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                <Music2 size={24} className="text-violet-500" />
              </div>
              <p className="text-sm font-medium text-mid">Seleccioná una canción</p>
              <p className="text-xs text-lo max-w-xs">
                Hacé clic en cualquier canción de la lista para ver su letra y acordes aquí.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
