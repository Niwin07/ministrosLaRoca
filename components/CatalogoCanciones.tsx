"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, ChevronLeft, ChevronRight, X, Pencil, Loader2, Check, Plus } from "lucide-react";
import { IconoMarca } from "@/components/zarza/IconoMarca";
import { ChartViewerInteractivo } from "@/components/ChartViewerInteractivo";
import { LyricViewer } from "@/components/LyricViewer";
import { IconButton } from "@/components/ui/IconButton";
import { ESTILOS } from "@/lib/estilos";

interface Cancion {
  id_cancion: number;
  nombre:     string;
  artista:    string;
  bpm:        number | null;
  estilo:     string | null;
  tono:       string | null;
  letra:      string | null;
  charts:     string | null;
}

interface Filtros {
  q:       string;
  estilos: string[];
}

type Agregada =
  | { nombre: string; id_playlist: number; id_lista_cancion?: number; cuando: string }
  | { error: string };

interface CatalogoCancionesProps {
  /** Página actual ya resuelta por el servidor (búsqueda/filtros/paginación viven en la URL). */
  canciones:      Cancion[];
  /** Cuántas canciones matchean los filtros actuales. */
  total:          number;
  /** Total de canciones aprobadas sin filtrar. */
  totalAprobadas: number;
  pagina:         number;
  totalPaginas:   number;
  filtros:        Filtros;
  /** false mientras falte la migración de estilo/tono: se ocultan los filtros. */
  conEstilos?:    boolean;
  puedeEditar?:   boolean;
  /** Servicios/plantillas editables del usuario para "Agregar a…" */
  misListas?:     { id_playlist: number; nombre: string; cuando: string }[];
  onAgregarALista?: (fd: FormData) => Promise<{ ok: boolean; error?: string; id_lista_cancion?: number }>;
  onDeshacer?:      (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
}

/**
 * Repertorio (diseño "Repertorio" · Zarza): búsqueda + botón "Filtros" que
 * despliega los estilos como chips (varios a la vez), resumen "Mostrando…" con
 * "Limpiar filtros", y tarjetas con tono, estilo, BPM y "Agregar a…" con
 * "Deshacer".
 */
export function CatalogoCanciones({
  canciones,
  total,
  totalAprobadas,
  pagina,
  totalPaginas,
  filtros,
  conEstilos = true,
  puedeEditar = false,
  misListas = [],
  onAgregarALista,
  onDeshacer,
}: CatalogoCancionesProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [agregada, setAgregada] = useState<Record<number, Agregada>>({});
  const [agregando, startAgregar] = useTransition();

  // Los chips se abren solos si se llega con estilos ya elegidos (URL).
  const [mostrarFiltros, setMostrarFiltros] = useState(filtros.estilos.length > 0);
  // Estado local del input de búsqueda: se debounce antes de navegar, así
  // el usuario escribe fluido y no se dispara una navegación por tecla.
  const [qLocal, setQLocal] = useState(filtros.q);
  // Selección optimista de estilos: el chip cambia al toque, la lista llega después.
  const [seleccion, setSeleccion] = useState<string[]>(filtros.estilos);
  const clave = filtros.estilos.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSeleccion(filtros.estilos); }, [clave]);

  const n = seleccion.length;

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

  function alternarEstilo(e: string) {
    const nueva = seleccion.includes(e) ? seleccion.filter((x) => x !== e) : [...seleccion, e];
    // Se guarda en el orden del diseño para que la URL sea estable.
    const ordenada = ESTILOS.filter((x) => nueva.includes(x));
    setSeleccion(ordenada);
    navegar({ estilo: ordenada.length ? ordenada.join(",") : null });
  }

  function limpiarFiltros() {
    setSeleccion([]);
    navegar({ estilo: null });
  }

  function agregarA(c: Cancion, l: { id_playlist: number; nombre: string; cuando: string }) {
    if (!onAgregarALista) return;
    const fd = new FormData();
    fd.set("id_playlist", String(l.id_playlist));
    fd.set("id_cancion", String(c.id_cancion));
    setMenuAbierto(null);
    startAgregar(async () => {
      const r = await onAgregarALista(fd);
      setAgregada((a) => ({
        ...a,
        [c.id_cancion]: r.ok
          ? { nombre: l.nombre, id_playlist: l.id_playlist, id_lista_cancion: r.id_lista_cancion, cuando: l.cuando }
          : { error: r.error ?? "No se pudo agregar." },
      }));
    });
  }

  function deshacer(c: Cancion) {
    const estado = agregada[c.id_cancion];
    if (!onDeshacer || !estado || "error" in estado || !estado.id_lista_cancion) return;
    const fd = new FormData();
    fd.set("id_lista_cancion", String(estado.id_lista_cancion));
    fd.set("id_playlist", String(estado.id_playlist));
    startAgregar(async () => {
      const r = await onDeshacer(fd);
      setAgregada((a) => {
        const copia = { ...a };
        if (r.ok) delete copia[c.id_cancion];
        else copia[c.id_cancion] = { error: r.error ?? "No se pudo deshacer." };
        return copia;
      });
    });
  }

  const resumen = n
    ? `Mostrando ${total} ${total === 1 ? "canción" : "canciones"} · ${seleccion.join(", ")}`
    : filtros.q
      ? `Mostrando ${total} de ${totalAprobadas} canciones`
      : "Mostrando todas las canciones";

  return (
    <div className={`flex flex-col gap-4 transition-opacity ${pending ? "opacity-60" : ""}`}>
      {/* ── Búsqueda + Filtros ─────────────────────────────────────── */}
      <div className="flex gap-2">
        <label className="relative flex flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lo" aria-hidden />
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
        {conEstilos && (
          <button
            type="button"
            onClick={() => setMostrarFiltros((v) => !v)}
            aria-expanded={mostrarFiltros}
            className={`relative flex min-h-[46px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200 ${
              mostrarFiltros
                ? "border-fuego-600 bg-fuego-600 text-white"
                : n
                  ? "border-fuego-600 bg-fuego-600/10 text-fuego-600 dark:text-[#df8067]"
                  : "border-mark bg-[#fcf5eb] text-mid hover:text-hi dark:bg-card"
            }`}
          >
            {/* Ícono de filtro del diseño: tres líneas que se acortan. */}
            <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" />
            </svg>
            Filtros
            {n > 0 && (
              <span
                key={n}
                className={`animate-pop absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-fuego-600 px-1 text-[10px] font-bold ${
                  mostrarFiltros ? "bg-[#fcf5eb] text-fuego-600 dark:bg-card" : "bg-fuego-600 text-white"
                }`}
              >
                {n}
              </span>
            )}
          </button>
        )}
      </div>

      {conEstilos && mostrarFiltros && (
        <div
          role="group"
          aria-label="Filtrar por estilo"
          className="animate-desplegar -mx-4 flex snap-x snap-proximity flex-nowrap gap-2 overflow-x-auto px-4 pb-1 pt-0.5 no-scrollbar md:mx-0 md:px-0"
        >
          {ESTILOS.map((e) => {
            const on = seleccion.includes(e);
            return (
              <button
                key={e}
                type="button"
                aria-pressed={on}
                onClick={() => alternarEstilo(e)}
                className={`flex min-h-[36px] shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-200 ${
                  on ? "border-fuego-600 bg-fuego-600 text-white" : "border-mark bg-[#fcf5eb] text-mid hover:text-hi dark:bg-card"
                }`}
              >
                {on && <Check size={13} strokeWidth={2.5} aria-hidden className="animate-pop" />}
                {e}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex min-h-5 items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-lo">
          {pending && <Loader2 size={11} className="animate-spin" aria-hidden />}
          {resumen}
        </p>
        {n > 0 && (
          <button type="button" onClick={limpiarFiltros} className="text-xs font-medium text-fuego-600 hover:underline dark:text-[#df8067]">
            Limpiar filtros
          </button>
        )}
      </div>

      {canciones.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-mark bg-card/60 px-4 py-8 text-center text-sm text-lo">
          {n > 0 || filtros.q ? "Ninguna canción coincide con la búsqueda." : "Sin canciones aprobadas aún."}
        </p>
      ) : (
        <div className="escalonar grid items-start gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {canciones.map((c) => {
            const tieneDetalle = Boolean(c.letra || c.charts);
            const estado = agregada[c.id_cancion];
            const abierto = menuAbierto === c.id_cancion;
            const yaAgregada = !!estado && "nombre" in estado && !abierto;
            return (
              <article
                key={c.id_cancion}
                className={`tarjeta-viva flex min-w-0 flex-col gap-2.5 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(43,22,17,0.06),0_6px_18px_-8px_rgba(120,45,15,0.18)] dark:shadow-none ${abierto ? "border-fuego-600" : "border-line"}`}
              >
                <div className="flex items-center gap-3">
                  {c.tono ? (
                    <span aria-label={`Tono ${c.tono}`} className="flex h-[42px] w-[42px] shrink-0 flex-col items-center justify-center leading-none text-[#94402a] dark:text-[#d9846d]">
                      <span className="text-base font-extrabold">{c.tono}</span>
                      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-fuego-600 dark:text-[#df8067]">Tono</span>
                    </span>
                  ) : (
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center">
                      <IconoMarca nombre="canciones" size={26} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-hi">{c.nombre}</p>
                    <p className="mt-px truncate text-xs text-lo">{c.artista}</p>
                    {(c.estilo || c.bpm) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.estilo && <span className="rounded-full bg-input px-[7px] py-px text-[11px] font-medium text-mid">{c.estilo}</span>}
                        {c.bpm && <span className="rounded-full bg-input px-[7px] py-px text-[11px] font-medium text-mid">{c.bpm} BPM</span>}
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fuego-600 transition-colors hover:bg-fuego-600/10 dark:text-[#df8067]"
                    >
                      {yaAgregada ? <Check size={16} strokeWidth={2.5} aria-hidden className="animate-pop" /> : <Plus size={16} strokeWidth={2.2} aria-hidden />}
                    </button>
                  )}
                </div>

                {abierto && (
                  <div role="listbox" aria-label="Agregar a…" className="animate-desplegar flex flex-col gap-1 rounded-xl border border-[#f5cbb3] bg-[#fbf3e8] p-2 dark:border-line dark:bg-input">
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
                        <Plus size={14} strokeWidth={2.2} className="shrink-0 text-fuego-600" aria-hidden />
                      </button>
                    ))}
                  </div>
                )}

                {estado && !abierto && (
                  "nombre" in estado ? (
                    <div role="status" className="animate-desplegar flex items-center gap-2 rounded-[10px] bg-[#fde4d8] px-2.5 py-2 text-xs font-semibold text-[#94402a] dark:bg-[#1e1513] dark:text-[#d9846d]">
                      <Check size={13} strokeWidth={2.5} className="shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">
                        Agregada a <Link href={`/playlists/${estado.id_playlist}`} className="underline-offset-2 hover:underline">{estado.nombre}</Link> ({estado.cuando.toLowerCase()})
                      </span>
                      {onDeshacer && estado.id_lista_cancion && (
                        <button type="button" onClick={() => deshacer(c)} disabled={agregando} className="font-semibold underline underline-offset-2 disabled:opacity-50">
                          Deshacer
                        </button>
                      )}
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
