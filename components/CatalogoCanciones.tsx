"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Music2, ChevronDown, ChevronLeft, ChevronRight, X, Pencil, SlidersHorizontal, Loader2 } from "lucide-react";
import { ChartViewerInteractivo } from "@/components/ChartViewerInteractivo";
import { LyricViewer } from "@/components/LyricViewer";
import { IconButton } from "@/components/ui/IconButton";

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

interface Filtros {
  q:         string;
  artista:   string;
  metrica:   string;
  contenido: FiltroContenido;
}

interface CatalogoCancionesProps {
  /** Página actual ya resuelta por el servidor (búsqueda/filtros/paginación viven en la URL). */
  canciones:      Cancion[];
  /** Cuántas canciones matchean los filtros actuales (para "X de Y"). */
  total:          number;
  /** Total de canciones aprobadas sin filtrar. */
  totalAprobadas: number;
  /** Todos los artistas/métricas del catálogo completo (para los dropdowns). */
  artistas:       string[];
  metricas:       string[];
  pagina:         number;
  totalPaginas:   number;
  filtros:        Filtros;
  puedeEditar?:   boolean;
}

export function CatalogoCanciones({
  canciones,
  total,
  totalAprobadas,
  artistas,
  metricas,
  pagina,
  totalPaginas,
  filtros,
  puedeEditar = false,
}: CatalogoCancionesProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Estado local del input de búsqueda: se debounce antes de navegar, así
  // el usuario escribe fluido y no se dispara una navegación por tecla.
  const [qLocal, setQLocal] = useState(filtros.q);

  const filtrosActivos = [filtros.q, filtros.artista, filtros.metrica, filtros.contenido].filter(Boolean).length;

  function navegar(cambios: Record<string, string | null>, resetPagina = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(cambios)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (resetPagina) params.delete("pagina");
    // Los banners de "sugerida"/"editada"/error son de un solo uso — no
    // tiene sentido que sigan apareciendo mientras el usuario busca/filtra.
    params.delete("sugerida");
    params.delete("editada");
    params.delete("error");
    startTransition(() => {
      router.push(`${pathname}${params.toString() ? `?${params}` : ""}`, { scroll: false });
    });
  }

  // Debounce de la búsqueda — navega 350ms después de que el usuario deja de tipear.
  useEffect(() => {
    if (qLocal === filtros.q) return;
    const t = setTimeout(() => navegar({ q: qLocal || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

  function limpiarFiltros() {
    setQLocal("");
    navegar({ q: null, artista: null, metrica: null, contenido: null });
  }

  const botonEditar = (id: number) =>
    puedeEditar ? (
      <Link
        href={`/admin/canciones/${id}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Editar canción"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gone transition-colors hover:bg-input hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        <Pencil size={13} />
      </Link>
    ) : null;

  return (
    <div className={`flex flex-col gap-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      {/* ── Barra de búsqueda + toggle filtros ─────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lo" />
          <input
            type="text"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            placeholder="Buscar por nombre o artista…"
            className="w-full rounded-xl border border-mark bg-input pl-10 pr-10 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          />
          {qLocal && (
            <button
              type="button"
              onClick={() => { setQLocal(""); navegar({ q: null }); }}
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

      {/* ── Panel de filtros ────────────────────────────────────────── */}
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

          {/* Artista */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-lo">Artista</label>
            <select
              value={filtros.artista}
              onChange={(e) => navegar({ artista: e.target.value || null })}
              className="rounded-lg border border-mark bg-input px-3 py-2 text-sm text-hi outline-none transition-colors focus:border-violet-500 [&>option]:bg-card"
            >
              <option value="">Todos</option>
              {artistas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Métrica */}
          {metricas.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-lo">Métrica</label>
              <select
                value={filtros.metrica}
                onChange={(e) => navegar({ metrica: e.target.value || null })}
                className="rounded-lg border border-mark bg-input px-3 py-2 text-sm text-hi outline-none transition-colors focus:border-violet-500 [&>option]:bg-card"
              >
                <option value="">Todas</option>
                {metricas.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Contenido */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-lo">Contenido</label>
            <div className="flex gap-2">
              {(["charts", "letra"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => navegar({ contenido: filtros.contenido === tipo ? null : tipo })}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                    filtros.contenido === tipo
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

      {/* ── Contador de resultados ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-lo">
          {pending && <Loader2 size={11} className="animate-spin" />}
          {total === totalAprobadas ? `${totalAprobadas} canciones` : `${total} de ${totalAprobadas}`}
        </p>
        {filtrosActivos > 0 && total !== totalAprobadas && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-violet-600 transition-colors hover:text-violet-700"
          >
            <X size={11} /> Quitar filtros
          </button>
        )}
      </div>

      {/* ── Lista ───────────────────────────────────────────────────── */}
      {canciones.length === 0 ? (
        <p className="rounded-xl border border-line bg-card px-4 py-6 text-center text-sm text-lo">
          {filtrosActivos > 0
            ? "Ninguna canción coincide con los filtros aplicados."
            : "Sin canciones aprobadas aún."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {canciones.map((c) => {
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

            if (!tieneDetalle) {
              return (
                <li
                  key={c.id_cancion}
                  className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3"
                >
                  <Music2 size={16} className="shrink-0 text-gone" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-hi">{c.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                  </div>
                  {meta}
                  {botonEditar(c.id_cancion)}
                </li>
              );
            }

            return (
              <li
                key={c.id_cancion}
                className="overflow-hidden rounded-xl border border-line bg-card"
              >
                <details className="group">
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
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">
                          Acordes / Charts
                        </p>
                        <ChartViewerInteractivo charts={c.charts} />
                      </div>
                    )}
                    {c.letra && (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">
                          Letra
                        </p>
                        <LyricViewer letra={c.letra} />
                      </div>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Paginación ──────────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <IconButton
            disabled={pagina <= 1}
            onClick={() => navegar({ pagina: String(pagina - 1) }, false)}
            icon={<ChevronLeft size={15} />}
            label="Página anterior"
            className="border border-line bg-card hover:bg-card hover:border-mark disabled:pointer-events-none disabled:opacity-30"
          />
          <span className="text-xs tabular-nums text-lo">
            {pagina} <span className="text-gone">/</span> {totalPaginas}
          </span>
          <IconButton
            disabled={pagina >= totalPaginas}
            onClick={() => navegar({ pagina: String(pagina + 1) }, false)}
            icon={<ChevronRight size={15} />}
            label="Página siguiente"
            className="border border-line bg-card hover:bg-card hover:border-mark disabled:pointer-events-none disabled:opacity-30"
          />
        </div>
      )}
    </div>
  );
}
