import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Music2, PlusCircle, Copy, Tv2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { canciones, cronograma, lista_canciones, playlists } from "@/db/schema";
import { SortableSongList } from "@/components/SortableSongList";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";
import { StepperPill } from "@/components/StepperPill";
import { TonoSelect } from "@/components/TonoSelect";
import { CancionSelect } from "@/components/CancionSelect";
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
      id_plataforma:    playlists.id_plataforma,
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

/** Id del ministro con el turno ACTIVO en la plataforma de esta lista (o null).
 *  Filtramos por id_plataforma para que un activo en Remanentes no interfiera
 *  con el activo en Plataforma General y viceversa. */
async function getDirectorActivo(id_plataforma: number): Promise<number | null> {
  const [activo] = await db
    .select({ id_usuario: cronograma.id_usuario })
    .from(cronograma)
    .where(and(
      eq(cronograma.estado_turno, "ACTIVO"),
      eq(cronograma.id_plataforma, id_plataforma),
    ))
    .limit(1);
  return activo?.id_usuario ?? null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type ReordenItem = { id_lista_cancion: number; orden: number };

// URL de retorno con un mensaje de error. Vive a nivel de módulo porque los
// Server Actions inline NO pueden capturar funciones del scope del componente
// (solo variables serializables como `id`).
function urlError(id: number, msg: string): string {
  return `/playlists/${id}?error=${encodeURIComponent(msg)}`;
}

// ── Badges ────────────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  PREPARACION: "bg-green-200 text-green-700 border-green-300 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
  ENSAYO:      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20",
  DEFINITIVA:  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20",
  MAZO:        "bg-input text-mid border-mark",
};

// ── Página ────────────────────────────────────────────────────────────────────

export default async function PlaylistDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

  // Primero traemos la playlist para conocer su id_plataforma, luego buscamos
  // el director activo en ESA plataforma (cada plataforma tiene el suyo).
  const [rows, catalogo] = await Promise.all([
    getPlaylistConCanciones(id),
    getCatalogoAprobado(),
  ]);

  if (rows.length === 0) notFound();

  const cabecera = {
    id_playlist:   rows[0].id_playlist,
    id_usuario:    rows[0].id_usuario,
    id_plataforma: rows[0].id_plataforma,
    nombre:        rows[0].nombre_lista,
    tipo:          rows[0].tipo,
    estado:        rows[0].estado,
  };

  const directorActivoId = await getDirectorActivo(cabecera.id_plataforma);

  const { rol, id_usuario } = session.user;
  const puedeEditar =
    id_usuario === cabecera.id_usuario ||
    rol === "ADMINISTRADOR" ||
    rol === "LIDER";

  const esMazo = cabecera.tipo === "EVENTO" && cabecera.estado === "MAZO";

  // El contenido (canciones, orden, notas) es mutable en PRESET (siempre) y en
  // EVENTO mientras esté en PREPARACION o ENSAYO (publicada pero aún editable).
  // En DEFINITIVA/MAZO queda bloqueada — hay que retroceder de etapa primero.
  // Refleja la misma regla que `estadoPermiteEdicion` en el server.
  const esEditable =
    cabecera.tipo === "PRESET" ||
    (cabecera.tipo === "EVENTO" &&
      (cabecera.estado === "PREPARACION" || cabecera.estado === "ENSAYO"));
  const puedeEditarContenido = puedeEditar && esEditable;

  const ESTADOS_EVENTO = ["PREPARACION", "ENSAYO", "DEFINITIVA", "MAZO"] as const;
  const estadoActualIdx = ESTADOS_EVENTO.indexOf(
    (cabecera.estado ?? "") as (typeof ESTADOS_EVENTO)[number]
  );

  // Publicar (pasar a ENSAYO o DEFINITIVA) solo es posible si el dueño de la
  // lista es el director con el turno activo esta semana. Refleja la regla del
  // server `avanzarEstadoPlaylist`, para deshabilitar esos botones de antemano.
  const puedePublicar = directorActivoId === cabecera.id_usuario;
  const motivoBloqueo =
    directorActivoId === null
      ? "No hay un director de turno activo esta semana."
      : "Solo el director con el turno activo puede publicar esta lista.";

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

  // ── Server Actions ────────────────────────────────────────────────────────
  // Toda mutación termina en un redirect: a la URL limpia si salió bien, o con
  // ?error=<mensaje> si falló. Así un throw del action (p. ej. "no sos el
  // director de turno") se muestra como banner en vez de romper la página.

  async function handleAgregar(formData: FormData) {
    "use server";
    let destino = `/playlists/${id}`;
    try {
      const id_cancion = Number(formData.get("id_cancion"));
      const ordenRaw   = Number(formData.get("orden"));
      const orden      = Number.isFinite(ordenRaw) ? ordenRaw : undefined;
      const nota       = (formData.get("nota") as string).trim() || undefined;
      await agregarCancionALista(id, id_cancion, orden, nota);
    } catch (e) {
      destino = urlError(id, e instanceof Error ? e.message : "No se pudo agregar la canción.");
    }
    redirect(destino);
  }

  async function handleEliminar(formData: FormData) {
    "use server";
    let destino = `/playlists/${id}`;
    try {
      const idListaCancion = Number(formData.get("id_lista_cancion"));
      await eliminarCancionDeLista(idListaCancion);
    } catch (e) {
      destino = urlError(id, e instanceof Error ? e.message : "No se pudo eliminar la canción.");
    }
    redirect(destino);
  }

  async function handleActualizarNota(formData: FormData) {
    "use server";
    let destino = `/playlists/${id}`;
    try {
      const idListaCancion = Number(formData.get("id_lista_cancion"));
      const nota           = (formData.get("nota") as string).trim();
      await actualizarNotaCancion(idListaCancion, nota);
    } catch (e) {
      destino = urlError(id, e instanceof Error ? e.message : "No se pudo actualizar el tono.");
    }
    redirect(destino);
  }

  async function handleReordenar(formData: FormData) {
    "use server";
    // En éxito NO redirigimos: el nuevo orden ya está en pantalla (optimista en
    // SortableSongList), así que recargar se sentía un parpadeo innecesario. La
    // página es dinámica y re-consulta en la próxima visita. Solo redirigimos si
    // algo falla, para mostrar el banner de error.
    try {
      const raw             = formData.get("reordenamientos") as string;
      const reordenamientos = JSON.parse(raw) as ReordenItem[];
      await reordenarLista(id, reordenamientos);
    } catch (e) {
      redirect(urlError(id, e instanceof Error ? e.message : "No se pudo reordenar la lista."));
    }
  }

  async function handleClonar() {
    "use server";
    let destino: string;
    try {
      const { nuevaPlaylistId } = await clonarMazo(id, id_usuario);
      destino = `/playlists/${nuevaPlaylistId}`;
    } catch (e) {
      destino = urlError(id, e instanceof Error ? e.message : "No se pudo clonar la lista.");
    }
    redirect(destino);
  }

  async function handleAvanzarEstado(formData: FormData) {
    "use server";
    let destino = `/playlists/${id}`;
    try {
      const nuevoEstado = formData.get("nuevoEstado") as string;
      await avanzarEstadoPlaylist(id, nuevoEstado);
    } catch (e) {
      destino = urlError(id, e instanceof Error ? e.message : "No se pudo cambiar la etapa.");
    }
    redirect(destino);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // ── Panel de info + stepper (sidebar derecha en desktop) ─────────────────
  const panelInfo = (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-card px-5 py-5 shadow-card dark:shadow-none">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-lo">
            {cabecera.tipo === "EVENTO" ? "Lista de evento" : cabecera.tipo === "PRESET" ? "Plantilla" : cabecera.tipo}
          </span>
          {cabecera.estado && (
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${ESTADO_BADGE[cabecera.estado] ?? "bg-input text-mid border-mark"}`}>
              {ESTADO_LABEL[cabecera.estado] ?? cabecera.estado}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-hi">{cabecera.nombre}</h1>
        <p className="mt-0.5 text-xs text-lo">
          {items.length} {items.length === 1 ? "canción" : "canciones"}
          {cabecera.estado && (
            <span className="ml-1.5 text-gone">· {ESTADO_DESC[cabecera.estado]}</span>
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {items.length > 0 && (
            <Link
              href={`/escenario/mazo/${cabecera.id_playlist}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-500/20"
            >
              <Tv2 size={12} />
              Escenario
            </Link>
          )}
          {esMazo && puedeEditar && (
            <form action={handleClonar}>
              <Button type="submit" variant="secondary" size="sm" icon={<Copy size={12} />}>
                Clonar
              </Button>
            </form>
          )}
        </div>

        {/* Stepper — solo EVENTO + puede editar */}
        {cabecera.tipo === "EVENTO" && puedeEditar && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2.5 text-[10px] font-medium uppercase tracking-widest text-gone">
              Etapa del servicio
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS_EVENTO.map((estado, idx) => {
                const esCurrent = idx === estadoActualIdx;
                const esPasado  = idx < estadoActualIdx;
                const label     = ESTADO_LABEL[estado] ?? estado;

                if (esCurrent) {
                  return (
                    <span key={estado} className="rounded-full bg-green-200 px-3 py-1 text-[10px] font-semibold text-green-700 dark:bg-violet-600 dark:text-white" aria-current="step">
                      {label}
                    </span>
                  );
                }

                const esPublicacion = estado === "ENSAYO" || estado === "DEFINITIVA";
                const bloqueado     = esPublicacion && !puedePublicar;

                if (bloqueado) {
                  return (
                    <button
                      key={estado}
                      type="button"
                      disabled
                      title={motivoBloqueo}
                      className="cursor-not-allowed rounded-full border border-dashed border-mark px-3 py-1 text-[10px] text-gone opacity-60"
                    >
                      {esPasado ? `← ${label}` : `${label} →`}
                    </button>
                  );
                }

                return (
                  <form key={estado} action={handleAvanzarEstado}>
                    <input type="hidden" name="nuevoEstado" value={estado} />
                    <StepperPill label={label} esPasado={esPasado} />
                  </form>
                );
              })}
            </div>
            {cabecera.estado && ESTADO_NEXT_HINT[cabecera.estado] && (
              <p className="mt-3 text-[11px] leading-relaxed text-gone">
                {ESTADO_NEXT_HINT[cabecera.estado]}
              </p>
            )}
            {!puedePublicar && (
              <p className="mt-2 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400/80">
                {motivoBloqueo} Las etapas de publicación quedan deshabilitadas.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Agregar canción — solo en desktop sidebar */}
      {puedeEditarContenido && catalogo.length > 0 && (
        <div className="hidden lg:block rounded-2xl border border-line bg-card px-5 py-5 shadow-card dark:shadow-none">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle size={14} className="text-lo" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-lo">Agregar canción</h2>
          </div>
          <form key={`add-desktop-${items.length}`} action={handleAgregar} className="flex flex-col gap-3">
            <CancionSelect name="id_cancion" canciones={catalogo} />
            <div className="flex gap-2">
              <div className="flex-1">
                <TonoSelect name="nota" />
              </div>
              <input
                name="orden"
                type="number"
                min={1}
                defaultValue={nextOrden}
                required
                className="w-20 rounded-xl border border-mark bg-input px-3 py-3 text-center text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <Button type="submit" shape="block" size="lg" fullWidth icon={<PlusCircle size={15} />}>
              Agregar
            </Button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">

      {/* ── Back ──────────────────────────────────────────────────────── */}
      <Link
        href="/playlists"
        className="flex w-fit items-center gap-1.5 text-xs text-lo transition-colors hover:text-hi"
      >
        <ArrowLeft size={13} />
        Mis Listas
      </Link>

      {/* ── Banner de error ───────────────────────────────────────────── */}
      <ErrorBanner message={errorMsg} />

      {/* ── Alertas de estado ─────────────────────────────────────────── */}
      {!puedeEditar && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
          Solo lectura — no sos el creador de esta lista.
        </div>
      )}
      {puedeEditar && !esEditable && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
          Lista {cabecera.estado === "MAZO" ? "archivada" : "marcada como definitiva"} — para
          modificar canciones, orden o tonos, volvé a
          <span className="font-semibold"> En ensayo</span> o
          <span className="font-semibold"> En preparación</span> con los botones de arriba.
        </div>
      )}

      {/* ── Layout principal ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">

        {/* Columna izquierda: canciones */}
        <div className="flex flex-col gap-4">
          {/* Header card — solo en mobile (en desktop va en la columna derecha) */}
          <div className="lg:hidden">{panelInfo}</div>

          {/* Lista de canciones */}
          {items.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card px-5 py-14 text-center shadow-card dark:shadow-none">
              <Music2 size={28} className="mx-auto mb-3 text-gone" />
              <p className="text-sm text-lo">La lista está vacía.</p>
            </div>
          ) : (
            <SortableSongList
              items={items}
              puedeEditar={puedeEditarContenido}
              onReordenar={handleReordenar}
              onEliminar={handleEliminar}
              onActualizarNota={handleActualizarNota}
            />
          )}

          {/* Agregar canción — solo en mobile (en desktop va en el sidebar) */}
          {puedeEditarContenido && (
            <div className="lg:hidden rounded-2xl border border-line bg-card px-5 py-5 shadow-card dark:shadow-none">
              <div className="mb-4 flex items-center gap-2">
                <PlusCircle size={14} className="text-lo" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-lo">
                  Agregar canción
                </h2>
              </div>
              {catalogo.length === 0 ? (
                <p className="text-xs text-lo">Sin canciones aprobadas en el catálogo.</p>
              ) : (
                <form key={`add-${items.length}`} action={handleAgregar} className="flex flex-col gap-3">
                  <CancionSelect name="id_cancion" canciones={catalogo} />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <TonoSelect name="nota" />
                    </div>
                    <input
                      name="orden"
                      type="number"
                      min={1}
                      defaultValue={nextOrden}
                      required
                      className="w-20 rounded-xl border border-mark bg-input px-3 py-3 text-center text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>
                  <Button type="submit" shape="block" size="lg" fullWidth icon={<PlusCircle size={15} />}>
                    Agregar
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha: info + stepper (solo desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-8">
          {panelInfo}
        </div>

      </div>
    </div>
  );
}
