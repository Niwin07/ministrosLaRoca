import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { ArrowLeft, Music2, PlusCircle, Copy, Tv2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { canciones, lista_canciones, playlists } from "@/db/schema";
import { ChartViewer } from "@/components/ChartViewer";
import { LyricViewer } from "@/components/LyricViewer";
import { SongActions } from "@/components/SongActions";
import { auth } from "@/auth";
import {
  agregarCancionALista,
  eliminarCancionDeLista,
  actualizarNotaCancion,
  reordenarLista,
} from "@/app/actions/listas";
import { clonarMazo, avanzarEstadoPlaylist } from "@/app/actions/playlists";
import { ESTADO_LABEL, ESTADO_DESC, ESTADO_NEXT_HINT } from "@/lib/estados";

// ── Queries ───────────────────────────────────────────────────────────────────

async function getPlaylistConCanciones(id: number) {
  return db
    .select({
      id_playlist:      playlists.id_playlist,
      id_usuario:       playlists.id_usuario,
      nombre_lista:     playlists.nombre,
      tipo:             playlists.tipo,
      estado:           playlists.estado,
      id_lista_cancion: lista_canciones.id_lista_cancion,
      orden:            lista_canciones.orden,
      nota:             lista_canciones.nota,
      id_cancion:       canciones.id_cancion,
      nombre_cancion:   canciones.nombre,
      artista:          canciones.artista,
      charts:           canciones.charts,
      letra:            canciones.letra,
    })
    .from(playlists)
    .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
    .leftJoin(canciones, eq(canciones.id_cancion, lista_canciones.id_cancion))
    .where(eq(playlists.id_playlist, id))
    .orderBy(lista_canciones.orden);
}

async function getCatalogoAprobado() {
  return db
    .select({ id_cancion: canciones.id_cancion, nombre: canciones.nombre, artista: canciones.artista })
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "APROBADA"))
    .orderBy(canciones.nombre);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type ReordenItem = { id_lista_cancion: number; orden: number };

function buildSwapPayload(items: ReordenItem[], fromIdx: number, toIdx: number): ReordenItem[] {
  return items.map((item, i) => {
    if (i === fromIdx) return { id_lista_cancion: item.id_lista_cancion, orden: items[toIdx].orden };
    if (i === toIdx)   return { id_lista_cancion: item.id_lista_cancion, orden: items[fromIdx].orden };
    return item;
  });
}

// ── Badges ────────────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  PREPARACION: "bg-lime-400/10 text-lime-400 border-lime-400/20",
  ENSAYO:      "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  DEFINITIVA:  "bg-blue-400/10 text-blue-400 border-blue-400/20",
  MAZO:        "bg-glass-elevated text-content-muted border-glass-highlight",
};

// ── Página ────────────────────────────────────────────────────────────────────

export default async function PlaylistDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [rows, catalogo] = await Promise.all([
    getPlaylistConCanciones(id),
    getCatalogoAprobado(),
  ]);

  if (rows.length === 0) notFound();

  const cabecera = {
    id_playlist: rows[0].id_playlist,
    id_usuario:  rows[0].id_usuario,
    nombre:      rows[0].nombre_lista,
    tipo:        rows[0].tipo,
    estado:      rows[0].estado,
  };

  const { rol, id_usuario } = session.user;
  const puedeEditar =
    id_usuario === cabecera.id_usuario ||
    rol === "ADMINISTRADOR" ||
    rol === "LIDER";

  const esMazo = cabecera.tipo === "EVENTO" && cabecera.estado === "MAZO";

  const ESTADOS_EVENTO = ["PREPARACION", "ENSAYO", "DEFINITIVA", "MAZO"] as const;
  const estadoActualIdx = ESTADOS_EVENTO.indexOf(
    (cabecera.estado ?? "") as (typeof ESTADOS_EVENTO)[number]
  );

  const items = rows
    .filter((row) => row.id_lista_cancion !== null)
    .map((row) => ({
      id_lista_cancion: row.id_lista_cancion!,
      orden:            row.orden!,
      nota:             row.nota,
      id_cancion:       row.id_cancion!,
      nombre:           row.nombre_cancion!,
      artista:          row.artista!,
      charts:           row.charts,
      letra:            row.letra,
    }));

  const nextOrden = items.length > 0 ? Math.max(...items.map((i) => i.orden)) + 1 : 1;

  const reordenBase: ReordenItem[] = items.map((i) => ({
    id_lista_cancion: i.id_lista_cancion,
    orden:            i.orden,
  }));

  const swapPayloads = items.map((_, idx) => ({
    arriba: idx > 0               ? buildSwapPayload(reordenBase, idx, idx - 1) : null,
    abajo:  idx < items.length - 1 ? buildSwapPayload(reordenBase, idx, idx + 1) : null,
  }));

  // ── Server Actions ────────────────────────────────────────────────────────

  async function handleAgregar(formData: FormData) {
    "use server";
    const id_cancion = Number(formData.get("id_cancion"));
    const orden      = Number(formData.get("orden"));
    const nota       = (formData.get("nota") as string).trim() || undefined;
    await agregarCancionALista(id, id_cancion, orden, nota);
    revalidatePath(`/playlists/${id}`);
  }

  async function handleEliminar(formData: FormData) {
    "use server";
    const idListaCancion = Number(formData.get("id_lista_cancion"));
    await eliminarCancionDeLista(idListaCancion);
    revalidatePath(`/playlists/${id}`);
  }

  async function handleActualizarNota(formData: FormData) {
    "use server";
    const idListaCancion = Number(formData.get("id_lista_cancion"));
    const nota           = (formData.get("nota") as string).trim();
    await actualizarNotaCancion(idListaCancion, nota);
    revalidatePath(`/playlists/${id}`);
  }

  async function handleReordenar(formData: FormData) {
    "use server";
    const raw             = formData.get("reordenamientos") as string;
    const reordenamientos = JSON.parse(raw) as ReordenItem[];
    await reordenarLista(id, reordenamientos);
    revalidatePath(`/playlists/${id}`);
  }

  async function handleClonar() {
    "use server";
    const { nuevaPlaylistId } = await clonarMazo(id, id_usuario);
    redirect(`/playlists/${nuevaPlaylistId}`);
  }

  async function handleAvanzarEstado(formData: FormData) {
    "use server";
    const nuevoEstado = formData.get("nuevoEstado") as string;
    await avanzarEstadoPlaylist(id, nuevoEstado);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">

      {/* ── Back ──────────────────────────────────────────────────────── */}
      <Link
        href="/playlists"
        className="flex w-fit items-center gap-1.5 text-xs text-content-secondary transition-colors hover:text-content-primary"
      >
        <ArrowLeft size={13} />
        Mis Listas
      </Link>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-5">

        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-content-secondary">
            {cabecera.tipo === "EVENTO" ? "Lista de evento" : cabecera.tipo === "PRESET" ? "Plantilla" : cabecera.tipo}
          </span>
          {cabecera.estado && (
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${ESTADO_BADGE[cabecera.estado] ?? "bg-glass-elevated text-content-muted border-glass-highlight"}`}>
              {ESTADO_LABEL[cabecera.estado] ?? cabecera.estado}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-white">{cabecera.nombre}</h1>
        <p className="mt-0.5 text-xs text-content-secondary">
          {items.length} {items.length === 1 ? "canción" : "canciones"}
          {cabecera.estado && (
            <span className="ml-1.5 text-content-muted">
              · {ESTADO_DESC[cabecera.estado]}
            </span>
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {items.length > 0 && (
            <Link
              href={`/escenario/mazo/${cabecera.id_playlist}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-400/10 px-3.5 py-2 text-xs font-semibold text-lime-400 transition-colors hover:bg-lime-400/20"
            >
              <Tv2 size={12} />
              Escenario
            </Link>
          )}
          {esMazo && puedeEditar && (
            <form action={handleClonar}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-glass-elevated bg-glass-base px-3.5 py-2 text-xs font-medium text-content-secondary transition-colors hover:border-glass-highlight hover:text-content-primary"
              >
                <Copy size={12} />
                Clonar
              </button>
            </form>
          )}
        </div>

        {/* Stepper — solo EVENTO + puede editar */}
        {cabecera.tipo === "EVENTO" && puedeEditar && (
          <div className="mt-4 border-t border-glass-base pt-4">
            <p className="mb-2.5 text-[10px] font-medium uppercase tracking-widest text-content-muted">
              Etapa del servicio
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS_EVENTO.map((estado, idx) => {
                const esCurrent = idx === estadoActualIdx;
                const esPasado  = idx < estadoActualIdx;
                if (esCurrent) {
                  return (
                    <span key={estado} className="rounded-full bg-lime-400 px-3 py-1 text-[10px] font-bold text-black">
                      {ESTADO_LABEL[estado] ?? estado}
                    </span>
                  );
                }
                if (esPasado) {
                  return (
                    <span key={estado} className="rounded-full bg-glass-elevated px-3 py-1 text-[10px] text-content-muted line-through">
                      {ESTADO_LABEL[estado] ?? estado}
                    </span>
                  );
                }
                return (
                  <form key={estado} action={handleAvanzarEstado}>
                    <input type="hidden" name="nuevoEstado" value={estado} />
                    <button
                      type="submit"
                      className="rounded-full border border-glass-elevated px-3 py-1 text-[10px] text-content-muted transition-colors hover:border-glass-highlight hover:text-content-primary"
                    >
                      {ESTADO_LABEL[estado] ?? estado} →
                    </button>
                  </form>
                );
              })}
            </div>
            {/* Hint contextual según etapa actual */}
            {cabecera.estado && ESTADO_NEXT_HINT[cabecera.estado] && (
              <p className="mt-3 text-[11px] leading-relaxed text-content-muted">
                {ESTADO_NEXT_HINT[cabecera.estado]}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Solo lectura ──────────────────────────────────────────────── */}
      {!puedeEditar && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
          Solo lectura — no sos el creador de esta lista.
        </div>
      )}

      {/* ── Lista de canciones ────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-14 text-center">
          <Music2 size={28} className="mx-auto mb-3 text-content-muted" />
          <p className="text-sm text-content-secondary">La lista está vacía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => {
            const { arriba, abajo } = swapPayloads[idx];
            return (
              <div key={item.id_lista_cancion} className="overflow-hidden rounded-2xl border border-glass-base bg-glass-subtle">

                {/* Fila principal */}
                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="w-5 shrink-0 text-right text-[11px] font-bold tabular-nums text-content-muted">
                    {String(item.orden).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-content-secondary">{item.artista}</p>
                  </div>
                  {item.nota && (
                    <span className="shrink-0 text-sm font-bold text-lime-400">{item.nota}</span>
                  )}
                  {puedeEditar && (
                    <SongActions
                      item={{ id_lista_cancion: item.id_lista_cancion, orden: item.orden, nota: item.nota }}
                      swapArriba={arriba}
                      swapAbajo={abajo}
                      onReordenar={handleReordenar}
                      onEliminar={handleEliminar}
                      onActualizarNota={handleActualizarNota}
                    />
                  )}
                </div>

                {/* Charts colapsable */}
                {item.charts && (
                  <details className="group border-t border-glass-base">
                    <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-content-muted transition-colors hover:text-content-secondary [&::-webkit-details-marker]:hidden">
                      <span>Acordes / Charts</span>
                      <ChevronDown size={12} className="transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-5 pt-1">
                      <ChartViewer charts={item.charts} />
                    </div>
                  </details>
                )}

                {/* Letra colapsable */}
                {item.letra && (
                  <details className="group border-t border-glass-base">
                    <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-content-muted transition-colors hover:text-content-secondary [&::-webkit-details-marker]:hidden">
                      <span>Letra</span>
                      <ChevronDown size={12} className="transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-5 pt-2">
                      <LyricViewer letra={item.letra} />
                    </div>
                  </details>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* ── Agregar canción ───────────────────────────────────────────── */}
      {puedeEditar && (
        <div className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-5">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle size={14} className="text-content-secondary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-content-muted">
              Agregar canción
            </h2>
          </div>

          {catalogo.length === 0 ? (
            <p className="text-xs text-content-muted">Sin canciones aprobadas en el catálogo.</p>
          ) : (
            <form action={handleAgregar} className="flex flex-col gap-3">
              <select
                name="id_cancion"
                required
                defaultValue=""
                className="w-full rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-glass-base"
              >
                <option value="" disabled>Elegí una canción…</option>
                {catalogo.map((c) => (
                  <option key={c.id_cancion} value={c.id_cancion}>
                    {c.nombre} — {c.artista}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  name="nota"
                  type="text"
                  placeholder="Tono (Am, G…)"
                  className="flex-1 rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary placeholder-content-muted outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  name="orden"
                  type="number"
                  min={1}
                  defaultValue={nextOrden}
                  required
                  className="w-20 rounded-xl border border-glass-elevated bg-glass-base px-3 py-3 text-center text-sm text-content-primary outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
              >
                Agregar
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
