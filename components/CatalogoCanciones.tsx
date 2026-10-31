"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, ChevronLeft, ChevronRight, X, Pencil, SlidersHorizontal, Loader2, Check, Plus } from "lucide-react";
import { IconoMarca } from "@/components/zarza/IconoMarca";
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
  /** Servicios/plantillas editables del usuario para "Agregar a…" */
  misListas?:     { id_playlist: number; nombre: string; cuando: string }[];
  onAgregarALista?: (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
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
  misListas = [],
  onAgregarALista,
}: CatalogoCancionesProps) {
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [agregada, setAgregada] = useState<Record<number, { nombre: string; id: number } | { error: string }>>({});
  const [agregando, startAgregar] = useTransition();

  function agregarA(c: { id_cancion: number }, l: { id_playlist: number; nombre: string }) {
    if (!onAgregarALista) return;
    const fd = new FormData();
    fd.set("id_playlist", String(l.id_playlist));
    fd.set("id_cancion", String(c.id_cancion));
    setMenuAbierto(null);
    startAgregar(async () => {
      const r = await onAgregarALista(fd);
      setAgregada((a) => ({ ...a, [c.id_cancion]: r.ok ? { nombre: l.nombre, id: l.id_playlist } : { error: r.error ?? "No se pudo agregar." } }));
    });
  }
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

  const chip = (on: boolean) =>
    `flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
      on ? "border-fuego-600 bg-fuego-600 text-white" : "border-line bg-card text-mid hover:border-mark hover:text-hi"
    }`;

  return (
    <div className={`flex flex-col gap-4 transition-opacity ${pending ? "opacity-60" : ""}`}>
      {/* ── Búsqueda + Filtros ─────────────────────────────────────── */}
      <div className="flex gap-2">
        <label className="relative flex flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lo" aria-hidden />
          <input
            type="search"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            aria-label="Buscar canción"
            placeholder="Buscar por nombre o artista"
            className="min-h-[46px] w-full rounded-full border border-mark bg-input py-3 pl-10 pr-10 text-sm text-hi placeholder:text-gone outline-none focus:border-fuego-500 focus:ring-2 focus:ring-fuego-500/30"
          />
          {qLocal && (
            <button type="button" onClick={() => { setQLocal(""); navegar({ q: null }); }} aria-label="Limpiar búsqueda" className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gone hover:text-hi">
              <X size={14} />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => setMostrarFiltros((v) => !v)}
          aria-expanded={mostrarFiltros}
          className={`relative flex min-h-[46px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
            mostrarFiltros || filtrosActivos > 0 ? "border-fuego-600 bg-fuego-600/10 text-fuego-600 dark:text-[#df8067]" : "border-mark bg-card text-mid hover:text-hi"
          }`}
        >
          <SlidersHorizontal size={15} aria-hidden /> Filtros
          {filtrosActivos > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-fuego-600 bg-card px-1 text-[10px] font-bold text-fuego-600">
              {filtrosActivos}
            </span>
          )}
        </button>
      </div>

      {mostrarFiltros && (
        <div className="flex flex-col gap-2.5">
          <div role="group" aria-label="Filtrar" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0">
            {(["charts", "letra"] as const).map((tipo) => {
              const on = filtros.contenido === tipo;
              return (
                <button key={tipo} type="button" aria-pressed={on} onClick={() => navegar({ contenido: on ? null : tipo })} className={chip(on)}>
                  {on && <Check size={13} aria-hidden />}
                  {tipo === "charts" ? "Con acordes" : "Con letra"}
                </button>
              );
            })}
            {metricas.map((m) => {
              const on = filtros.metrica === m;
              return (
                <button key={m} type="button" aria-pressed={on} onClick={() => navegar({ metrica: on ? null : m })} className={chip(on)}>
                  {on && <Check size={13} aria-hidden />}
                  {m}
                </button>
              );
            })}
          </div>
          <label className="flex max-w-xs flex-col gap-1.5 text-[13px] font-medium text-mid">
            Artista
            <select
              value={filtros.artista}
              onChange={(e) => navegar({ artista: e.target.value || null })}
              className="min-h-[42px] rounded-full border border-mark bg-input px-4 text-sm text-hi outline-none focus:border-fuego-500 [&>option]:bg-card"
            >
              <option value="">Todos</option>
              {artistas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="flex min-h-5 items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-lo">
          {pending && <Loader2 size={11} className="animate-spin" aria-hidden />}
          {total === totalAprobadas ? `${totalAprobadas} canciones` : `${total} de ${totalAprobadas} canciones`}
        </p>
        {filtrosActivos > 0 && (
          <button type="button" onClick={limpiarFiltros} className="text-xs font-medium text-fuego-600 hover:underline dark:text-[#df8067]">
            Limpiar filtros
          </button>
        )}
      </div>

      {canciones.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-mark bg-card/60 px-4 py-8 text-center text-sm text-lo">
          {filtrosActivos > 0 ? "Ninguna canción coincide con la búsqueda." : "Sin canciones aprobadas aún."}
        </p>
      ) : (
        <div className="grid items-start gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {canciones.map((c) => {
            const tieneDetalle = Boolean(c.letra || c.charts);
            const estado = agregada[c.id_cancion];
            const abierto = menuAbierto === c.id_cancion;
            return (
              <article
                key={c.id_cancion}
                className={`flex min-w-0 flex-col gap-2.5 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(43,22,17,0.06),0_6px_18px_-8px_rgba(120,45,15,0.18)] dark:shadow-none ${abierto ? "border-fuego-600" : "border-line"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center">
                    <IconoMarca nombre="canciones" size={26} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-hi">{c.nombre}</p>
                    <p className="mt-px truncate text-xs text-lo">{c.artista}</p>
                    {(c.metrica || c.bpm) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.metrica && <span className="rounded-full bg-input px-2 py-px text-[11px] font-medium text-mid">{c.metrica}</span>}
                        {c.bpm && <span className="rounded-full bg-input px-2 py-px text-[11px] font-medium text-mid">{c.bpm} BPM</span>}
                      </div>
                    )}
                  </div>
                  {puedeEditar && (
                    <Link href={`/admin/canciones/${c.id_cancion}`} aria-label={`Editar ${c.nombre}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gone hover:bg-fuego-600/10 hover:text-fuego-600">
                      <Pencil size={14} />
                    </Link>
                  )}
                  {onAgregarALista && misListas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMenuAbierto(abierto ? null : c.id_cancion)}
                      aria-expanded={abierto}
                      aria-label={`Agregar ${c.nombre} a un servicio`}
                      title="Agregar a un servicio"
                      disabled={agregando}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        estado && "nombre" in estado ? "border-transparent bg-fuego-600/10 text-fuego-600" : "border-fuego-600/40 text-fuego-600 hover:bg-fuego-600 hover:text-white dark:text-[#df8067]"
                      }`}
                    >
                      {estado && "nombre" in estado ? <Check size={16} aria-hidden /> : <Plus size={17} aria-hidden />}
                    </button>
                  )}
                </div>

                {abierto && (
                  <div role="listbox" aria-label="Agregar a…" className="flex flex-col gap-1 rounded-xl border border-[#f5cbb3] bg-[#fbf3e8] p-2 dark:border-line dark:bg-input">
                    <p className="mx-1 mb-1 mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-lo">Agregar a…</p>
                    {misListas.map((l) => (
                      <button
                        key={l.id_playlist}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => agregarA(c, l)}
                        className="flex min-h-[44px] items-center justify-between gap-2 rounded-[10px] bg-card px-2.5 py-1.5 text-left hover:bg-fuego-600/5"
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] text-lo">{l.cuando}</span>
                          <span className="block truncate text-[13px] font-semibold text-hi">{l.nombre}</span>
                        </span>
                        <Plus size={15} className="shrink-0 text-fuego-600" aria-hidden />
                      </button>
                    ))}
                  </div>
                )}

                {estado && (
                  "nombre" in estado ? (
                    <div role="status" className="flex items-center gap-2 rounded-[10px] bg-[#fde4d8] px-2.5 py-2 text-xs font-semibold text-[#94402a] dark:bg-[#1e1513] dark:text-[#d9846d]">
                      <Check size={14} aria-hidden />
                      <span className="min-w-0 flex-1">Agregada a {estado.nombre}</span>
                      <Link href={`/playlists/${estado.id}`} className="underline underline-offset-2">Ver</Link>
                    </div>
                  ) : (
                    <p role="alert" className="rounded-[10px] bg-red-500/10 px-2.5 py-2 text-xs text-red-700 dark:text-red-400">{estado.error}</p>
                  )
                )}

                {tieneDetalle && (
                  <details className="group -mx-3 -mb-3 border-t border-[#f1e5d4] dark:border-line">
                    <summary className="flex cursor-pointer select-none list-none items-center justify-between px-3.5 py-2.5 text-xs font-medium text-lo hover:text-hi [&::-webkit-details-marker]:hidden">
                      Letra y acordes
                      <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="flex flex-col gap-5 px-3.5 pb-4 pt-1">
                      {c.charts && <ChartViewerInteractivo charts={c.charts} />}
                      {c.letra && <LyricViewer letra={c.letra} />}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <IconButton
            disabled={pagina <= 1}
            onClick={() => navegar({ pagina: String(pagina - 1) }, false)}
            icon={<ChevronLeft size={15} />}
            label="Página anterior"
            className="border border-line bg-card hover:border-mark disabled:pointer-events-none disabled:opacity-30"
          />
          <span className="text-xs tabular-nums text-lo">
            {pagina} <span className="text-gone">/</span> {totalPaginas}
          </span>
          <IconButton
            disabled={pagina >= totalPaginas}
            onClick={() => navegar({ pagina: String(pagina + 1) }, false)}
            icon={<ChevronRight size={15} />}
            label="Página siguiente"
            className="border border-line bg-card hover:border-mark disabled:pointer-events-none disabled:opacity-30"
          />
        </div>
      )}
    </div>
  );
}
