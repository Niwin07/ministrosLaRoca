import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SelectorZarza } from "@/components/zarza/SelectorZarza";
import { eq, sql } from "drizzle-orm";
import { ArrowLeft, Music2, Copy, ListMusic, Archive, Lock } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { canciones, lista_canciones, playlists } from "@/db/schema";
import { SortableSongList } from "@/components/SortableSongList";
import { ErrorBanner } from "@/components/ErrorBanner";
import { EtapasServicio } from "@/components/zarza/servicios/EtapasServicio";
import { AgregarCancion } from "@/components/zarza/servicios/AgregarCancion";
import { cls } from "@/components/zarza/ui";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { puedeVerLista } from "@/lib/playlist-visibility";
import { auth } from "@/auth";
import {
  agregarCancionALista,
  eliminarCancionDeLista,
  actualizarNotaCancion,
  reordenarLista,
} from "@/app/actions/listas";
import { clonarMazo, avanzarEstadoPlaylist, cambiarPlataformaPlaylist } from "@/app/actions/playlists";
import { ESTADO_LABEL } from "@/lib/estados";
import { nombrePlataforma, PLATAFORMAS_LIST, PLATAFORMA_LABELS } from "@/lib/plataforma";

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
      // Director con turno ACTIVO en la plataforma de la lista, en la misma
      // consulta (antes era otra ida y vuelta a la base después de ésta).
      director_activo:  sql<number | null>`(SELECT c.id_usuario FROM cronograma c WHERE c.estado_turno = 'ACTIVO' AND c.id_plataforma = ${playlists.id_plataforma} LIMIT 1)`,
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

// URL de retorno con un mensaje de error. Vive a nivel de módulo porque los
// Server Actions inline NO pueden capturar funciones del scope del componente
// (solo variables serializables como `id`).
function urlError(id: number, msg: string): string {
  return `/playlists/${id}?error=${encodeURIComponent(msg)}`;
}

// ── Badges ────────────────────────────────────────────────────────────────────

const ESTADO_TONE: Record<string, BadgeTone> = {
  PREPARACION: "success",
  ENSAYO:      "warning",
  DEFINITIVA:  "info",
  MAZO:        "neutral",
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

  // Las listas privadas (plantillas y eventos en preparación) solo las ve su
  // dueño o ADMINISTRADOR/LIDER — antes cualquier usuario autenticado podía
  // navegar a /playlists/{id} y ver el contenido de una lista ajena aunque no
  // pudiera editarla.
  if (!puedeVerLista(cabecera, session.user)) notFound();

  const directorActivoId = rows[0].director_activo != null ? Number(rows[0].director_activo) : null;

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
  // Si salió bien, la página se actualiza en el lugar (revalidatePath): no
  // vuelve arriba ni parpadea. Si falla, redirect con ?error=<mensaje>. Así un throw del action (p. ej. "no sos el
  // director de turno") se muestra como banner en vez de romper la página.

  async function handleAgregar(formData: FormData) {
    "use server";
    try {
      const id_cancion = Number(formData.get("id_cancion"));
      const ordenRaw   = Number(formData.get("orden"));
      const orden      = Number.isFinite(ordenRaw) ? ordenRaw : undefined;
      const nota       = (formData.get("nota") as string).trim() || undefined;
      await agregarCancionALista(id, id_cancion, orden, nota);
    } catch (e) {
      redirect(urlError(id, e instanceof Error ? e.message : "No se pudo agregar la canción."));
    }
    // Sin redirect: se actualiza en el lugar (no sube al principio ni
    // repite la animación de entrada de la pantalla).
    revalidatePath(`/playlists/${id}`);
  }

  async function handleEliminar(formData: FormData) {
    "use server";
    try {
      const idListaCancion = Number(formData.get("id_lista_cancion"));
      await eliminarCancionDeLista(idListaCancion);
    } catch (e) {
      redirect(urlError(id, e instanceof Error ? e.message : "No se pudo eliminar la canción."));
    }
    // Sin redirect: se actualiza en el lugar (no sube al principio ni
    // repite la animación de entrada de la pantalla).
    revalidatePath(`/playlists/${id}`);
  }

  async function handleActualizarNota(formData: FormData) {
    "use server";
    try {
      const idListaCancion = Number(formData.get("id_lista_cancion"));
      const nota           = (formData.get("nota") as string).trim();
      await actualizarNotaCancion(idListaCancion, nota);
    } catch (e) {
      redirect(urlError(id, e instanceof Error ? e.message : "No se pudo actualizar el tono."));
    }
    // Sin redirect: se actualiza en el lugar (no sube al principio ni
    // repite la animación de entrada de la pantalla).
    revalidatePath(`/playlists/${id}`);
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
      const { nuevaPlaylistId } = await clonarMazo(id);
      destino = `/playlists/${nuevaPlaylistId}`;
    } catch (e) {
      destino = urlError(id, e instanceof Error ? e.message : "No se pudo clonar la lista.");
    }
    redirect(destino);
  }

  async function handleAvanzarEstado(formData: FormData) {
    "use server";
    try {
      const nuevoEstado = formData.get("nuevoEstado") as string;
      await avanzarEstadoPlaylist(id, nuevoEstado);
    } catch (e) {
      redirect(urlError(id, e instanceof Error ? e.message : "No se pudo cambiar la etapa."));
    }
    // Sin redirect: se actualiza en el lugar (no sube al principio ni
    // repite la animación de entrada de la pantalla).
    revalidatePath(`/playlists/${id}`);
  }

  // Vía de rescate para listas mal etiquetadas por el bug de inferencia de
  // plataforma al crearlas — reasignarla acá no requiere recrear la lista.
  async function handleCambiarPlataforma(formData: FormData) {
    "use server";
    try {
      const nuevaPlataforma = Number(formData.get("id_plataforma"));
      await cambiarPlataformaPlaylist(id, nuevaPlataforma);
    } catch (e) {
      redirect(urlError(id, e instanceof Error ? e.message : "No se pudo cambiar la plataforma."));
    }
    // Sin redirect: se actualiza en el lugar (no sube al principio ni
    // repite la animación de entrada de la pantalla).
    revalidatePath(`/playlists/${id}`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const esEvento = cabecera.tipo === "EVENTO";
  const enCurso = esEvento && cabecera.estado !== "MAZO";
  const quienDirige = cabecera.id_usuario === id_usuario ? "Dirigís vos" : null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-6 md:px-0 md:pt-2">

      <Link href="/playlists" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-hi transition-opacity hover:opacity-75">
        <ArrowLeft size={15} aria-hidden /> Servicios
      </Link>

      <ErrorBanner message={errorMsg} />

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-6">
      <div className="flex min-w-0 flex-col gap-4">

      {/* ── Encabezado del servicio ───────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-card px-5 py-4 shadow-card dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 flex-[1_1_220px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-lo">
              {esEvento ? "Servicio" : "Plantilla"}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-bold leading-[1.08] tracking-[-0.02em] text-hi">{cabecera.nombre}</h1>
            <p className="mt-0.5 text-[13px] text-lo">
              {items.length} {items.length === 1 ? "canción" : "canciones"}
              {quienDirige ? ` · ${quienDirige}` : ""}
              {" · "}{PLATAFORMA_LABELS[cabecera.id_plataforma] ?? "Plataforma"}
            </p>
          </div>

          {enCurso && puedeEditar && cabecera.estado && (
            <EtapasServicio
              estado={cabecera.estado}
              puedePublicar={puedePublicar}
              motivoBloqueo={motivoBloqueo}
              onCambiar={handleAvanzarEstado}
            />
          )}
          {enCurso && !puedeEditar && cabecera.estado && (
            <Badge tone={ESTADO_TONE[cabecera.estado] ?? "neutral"}>{ESTADO_LABEL[cabecera.estado] ?? cabecera.estado}</Badge>
          )}

          {items.length > 0 && (
            <Link
              href={`/escenario/mazo/${cabecera.id_playlist}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#d4552a] px-5 text-sm font-semibold text-[#fff8ef] transition-[filter] hover:brightness-110"
            >
              <ListMusic size={16} aria-hidden /> Abrir lista
            </Link>
          )}
        </div>

        {esMazo && (
          <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line bg-[#f6ecdd] px-3.5 py-3 dark:bg-input">
            <Archive size={18} className="shrink-0 text-lo" aria-hidden />
            <p className="min-w-[160px] flex-1 text-sm font-semibold text-hi">Este servicio está en el historial</p>
            {puedeEditar && (
              <form action={handleAvanzarEstado}>
                <input type="hidden" name="nuevoEstado" value="DEFINITIVA" />
                <button type="submit" className={`${cls.btnSec} min-h-[40px] text-[13px]`}>Sacar del historial</button>
              </form>
            )}
            <form action={handleClonar}>
              <button type="submit" className={`${cls.btnLlama} min-h-[40px] text-[13px] shadow-none`}>
                <Copy size={14} aria-hidden /> Repetir
              </button>
            </form>
          </div>
        )}

        {/* Plataforma — sólo ADMINISTRADOR puede reasignarla (vía de rescate
            para listas mal etiquetadas). */}
        {rol === "ADMINISTRADOR" && (
          <form action={handleCambiarPlataforma} className="flex flex-wrap items-center gap-2 border-t border-[#f1e5d4] pt-3 dark:border-line">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lo">Plataforma</span>
            <SelectorZarza
              name="id_plataforma"
              label="Reasignar plataforma de la lista"
              ocultarLabel
              compacto
              sinVacio
              defaultValue={String(cabecera.id_plataforma)}
              opciones={PLATAFORMAS_LIST.map((pla) => ({ valor: String(pla.id), texto: nombrePlataforma(pla.nombre) }))}
            />
            <button type="submit" className="min-h-[36px] rounded-full border border-mark px-3 text-[13px] font-semibold text-mid hover:text-hi">Guardar</button>
          </form>
        )}
      </section>

      {!puedeEditar && (
        <div className="flex items-center gap-2.5 rounded-xl bg-input px-3.5 py-3 text-[13px] text-mid">
          <Lock size={15} aria-hidden /> Sólo lectura: esta lista la arma otra persona.
        </div>
      )}
      {puedeEditar && !esEditable && (
        <div className="flex items-center gap-2.5 rounded-xl bg-[#ffeccc] px-3.5 py-3 text-[13px] text-[#9a3c0a] dark:bg-[#251d11] dark:text-[#f8894f]">
          <Lock size={15} aria-hidden />
          Canciones bloqueadas. {esMazo ? "Sacalo del historial y volvé a Ensayo para cambiarlas." : "Volvé a Ensayo para cambiarlas."}
        </div>
      )}

      {/* ── Canciones ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold text-mid">Canciones</h2>
          {puedeEditarContenido && items.length > 1 && (
            <span className="text-xs text-lo">Arrastrá para cambiar el orden</span>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-mark bg-card/60 px-5 py-12 text-center">
            <Music2 size={26} className="text-gone" aria-hidden />
            <p className="text-sm text-lo">Todavía no hay canciones. {puedeEditarContenido ? "Agregalas desde el repertorio." : ""}</p>
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
      </section>

      </div>{/* fin columna izquierda */}

      {/* ── Agregar canción ───────────────────────────────────────────── */}
      {puedeEditarContenido && (
        catalogo.length === 0 ? (
          <p className="rounded-[20px] border border-line bg-card p-5 text-[13px] text-lo">Sin canciones aprobadas en el repertorio.</p>
        ) : (
          <AgregarCancion
            catalogo={catalogo}
            enLista={items.map((i) => i.id_cancion)}
            siguienteOrden={nextOrden}
            onAgregar={handleAgregar}
          />
        )
      )}

      </div>{/* fin grid */}
    </div>
  );
}
