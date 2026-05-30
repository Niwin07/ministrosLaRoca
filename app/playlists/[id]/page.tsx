import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  Trash2,
  Music2,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { canciones, lista_canciones, playlists } from "@/db/schema";
import { ChartViewer } from "@/components/ChartViewer";
import { auth } from "@/auth";
import {
  agregarCancionALista,
  eliminarCancionDeLista,
  actualizarNotaCancion,
  reordenarLista,
} from "@/app/actions/listas";
import { clonarMazo, avanzarEstadoPlaylist } from "@/app/actions/playlists";
import { promoverDefinitivasAMazo } from "@/lib/playlist-utils";

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
    })
    .from(playlists)
    .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
    .leftJoin(canciones, eq(canciones.id_cancion, lista_canciones.id_cancion))
    .where(eq(playlists.id_playlist, id))
    .orderBy(lista_canciones.orden);
}

async function getCatalogoAprobado() {
  return db
    .select({
      id_cancion: canciones.id_cancion,
      nombre:     canciones.nombre,
      artista:    canciones.artista,
    })
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "APROBADA"))
    .orderBy(canciones.nombre);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type ReordenItem = { id_lista_cancion: number; orden: number };

function buildSwapPayload(
  items: ReordenItem[],
  fromIdx: number,
  toIdx: number
): ReordenItem[] {
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
  MAZO:        "bg-zinc-700 text-zinc-400 border-zinc-600",
};

const TIPO_BADGE = "bg-purple-500/10 text-purple-300 border-purple-500/20";

// ── Página ────────────────────────────────────────────────────────────────────

export default async function PlaylistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const id = Number(params.id);
  if (isNaN(id)) notFound();

  // JIT: promover DEFINITIVA → MAZO si esta lista supera las 24 h
  await promoverDefinitivasAMazo(id);

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

  // Acceso: creador, LIDER o ADMINISTRADOR pueden editar; el resto ve solo lectura
  const { rol, id_usuario } = session.user;
  const puedeEditar =
    id_usuario === cabecera.id_usuario ||
    rol === "ADMINISTRADOR" ||
    rol === "LIDER";

  // El clonado solo aplica a listas en estado EVENTO/MAZO
  const esMazo = cabecera.tipo === "EVENTO" && cabecera.estado === "MAZO";

  // Stepper de estados — solo para EVENTO
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
    }));

  const nextOrden =
    items.length > 0 ? Math.max(...items.map((i) => i.orden)) + 1 : 1;

  // Payloads de swap precalculados: evita pasar lógica al cliente
  const reordenBase: ReordenItem[] = items.map((i) => ({
    id_lista_cancion: i.id_lista_cancion,
    orden:            i.orden,
  }));

  const swapPayloads = items.map((_, idx) => ({
    arriba: idx > 0             ? buildSwapPayload(reordenBase, idx, idx - 1) : null,
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
    const raw            = formData.get("reordenamientos") as string;
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
    <div className="flex flex-col gap-6 px-4 pt-8 pb-6">

      {/* ── Back link ─────────────────────────────────────────────────── */}
      <Link
        href="/playlists"
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-white"
      >
        <ArrowLeft size={15} />
        Mis Listas
      </Link>

      {/* ── Cabecera ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-zinc-900 px-5 py-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TIPO_BADGE}`}>
            {cabecera.tipo}
          </span>
          {cabecera.estado && (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                ESTADO_BADGE[cabecera.estado] ?? "bg-zinc-800 text-zinc-400 border-zinc-600"
              }`}
            >
              {cabecera.estado}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-white">{cabecera.nombre}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {items.length} {items.length === 1 ? "canción" : "canciones"}
        </p>

        {/* Botón Clonar — solo visible para EVENTO/MAZO */}
        {esMazo && (
          <form action={handleClonar} className="mt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/20 px-4 py-2 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-600/30 hover:text-purple-200 active:bg-purple-600/40"
            >
              <Copy size={13} />
              Clonar este Mazo
            </button>
          </form>
        )}

        {/* Stepper de estados — solo EVENTO + puedeEditar */}
        {cabecera.tipo === "EVENTO" && puedeEditar && (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="mb-2.5 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Estado de ejecución
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {ESTADOS_EVENTO.map((estado, idx) => {
                const esCurrent = idx === estadoActualIdx;
                const esPasado  = idx < estadoActualIdx;

                if (esCurrent) {
                  return (
                    <span
                      key={estado}
                      className="rounded-full bg-lime-400 px-3 py-1 text-[10px] font-bold text-black"
                    >
                      {estado}
                    </span>
                  );
                }

                if (esPasado) {
                  return (
                    <span
                      key={estado}
                      className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] text-zinc-600"
                    >
                      {estado}
                    </span>
                  );
                }

                // Estado futuro — clickable
                return (
                  <form key={estado} action={handleAvanzarEstado}>
                    <input type="hidden" name="nuevoEstado" value={estado} />
                    <button
                      type="submit"
                      className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] text-zinc-400 transition-colors hover:border-purple-500/50 hover:text-purple-400 active:bg-purple-500/10"
                    >
                      {estado}
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Banner solo lectura ───────────────────────────────────────── */}
      {!puedeEditar && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          Vista de solo lectura — no sos el creador de esta lista.
        </div>
      )}

      {/* ── Lista de canciones ────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900 px-5 py-10 text-center">
          <Music2 size={32} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-sm text-zinc-500">Esta lista no tiene canciones todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, idx) => {
            const { arriba, abajo } = swapPayloads[idx];

            return (
              <div
                key={item.id_lista_cancion}
                className="overflow-hidden rounded-2xl bg-zinc-900"
              >
                {/* ── Header canción ─────────────────────────────────── */}
                <div className="flex items-start gap-3 px-5 pt-5 pb-3">

                  {/* Controles de orden — solo en modo edición */}
                  {puedeEditar && (
                    <div className="mt-0.5 flex shrink-0 flex-col gap-0.5">
                      {arriba ? (
                        <form action={handleReordenar}>
                          <input type="hidden" name="reordenamientos" value={JSON.stringify(arriba)} />
                          <button
                            type="submit"
                            aria-label="Mover arriba"
                            className="flex items-center justify-center rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                          >
                            <ChevronUp size={15} />
                          </button>
                        </form>
                      ) : (
                        <span className="p-0.5 text-zinc-800">
                          <ChevronUp size={15} />
                        </span>
                      )}
                      {abajo ? (
                        <form action={handleReordenar}>
                          <input type="hidden" name="reordenamientos" value={JSON.stringify(abajo)} />
                          <button
                            type="submit"
                            aria-label="Mover abajo"
                            className="flex items-center justify-center rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </form>
                      ) : (
                        <span className="p-0.5 text-zinc-800">
                          <ChevronDown size={15} />
                        </span>
                      )}
                    </div>
                  )}

                  {/* Número de orden */}
                  <span className="mt-0.5 shrink-0 text-xs font-bold text-zinc-600">
                    {String(item.orden).padStart(2, "0")}
                  </span>

                  {/* Nombre + artista */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-white">
                      {item.nombre}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.artista}</p>
                  </div>

                  {/* Botón quitar */}
                  {puedeEditar && (
                    <form action={handleEliminar} className="shrink-0">
                      <input type="hidden" name="id_lista_cancion" value={item.id_lista_cancion} />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 size={13} />
                        Quitar
                      </button>
                    </form>
                  )}
                </div>

                {/* ── Nota / Tonalidad ────────────────────────────────── */}
                <div className="px-5 pb-4">
                  {puedeEditar ? (
                    <form action={handleActualizarNota} className="flex items-center gap-2">
                      <input type="hidden" name="id_lista_cancion" value={item.id_lista_cancion} />
                      <span className="shrink-0 text-xs text-zinc-500">Tono:</span>
                      <input
                        name="nota"
                        type="text"
                        defaultValue={item.nota ?? ""}
                        placeholder="Ej: Am, G, C#"
                        className="w-24 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                      >
                        Guardar
                      </button>
                    </form>
                  ) : item.nota ? (
                    <p className="text-xs text-zinc-500">
                      Tono:{" "}
                      <span className="font-semibold text-zinc-300">{item.nota}</span>
                    </p>
                  ) : null}
                </div>

                {/* ── ChartViewer ─────────────────────────────────────── */}
                {item.charts ? (
                  <div className="border-t border-zinc-800 px-5 py-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      Charts
                    </p>
                    <ChartViewer charts={item.charts} />
                  </div>
                ) : (
                  <div className="border-t border-zinc-800 px-5 py-3">
                    <p className="text-xs text-zinc-600">Sin charts cargados.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Agregar desde catálogo (solo si puede editar) ─────────────── */}
      {puedeEditar && (
        <div className="rounded-2xl bg-zinc-900 px-5 py-5">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Agregar canción</h2>
          </div>

          {catalogo.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No hay canciones aprobadas en el catálogo todavía.
            </p>
          ) : (
            <form action={handleAgregar} className="flex flex-col gap-3">

              <select
                name="id_cancion"
                required
                defaultValue=""
                className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-zinc-800"
              >
                <option value="" disabled>
                  Elegí una canción del catálogo…
                </option>
                {catalogo.map((c) => (
                  <option key={c.id_cancion} value={c.id_cancion}>
                    {c.nombre} — {c.artista}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Tono
                  </label>
                  <input
                    name="nota"
                    type="text"
                    placeholder="Ej: Am, G, C#"
                    className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex w-24 flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Orden
                  </label>
                  <input
                    name="orden"
                    type="number"
                    min={1}
                    defaultValue={nextOrden}
                    required
                    className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-1 w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
              >
                Agregar a la lista
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
