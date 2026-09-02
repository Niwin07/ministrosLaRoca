"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cronograma, lista_canciones, playlists, usuario_plataforma, plataformas } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { resolverPlataforma, PLATAFORMAS_LIST } from "@/lib/plataforma";
import { getPlataformaEfectivaId } from "@/lib/get-plataforma-activa";
import { getMisPlataformas } from "@/lib/usuario-request-cache";
import { crearNotificacionMasiva } from "@/lib/notif";

/**
 * Resuelve la plataforma para una lista nueva. Preferimos el valor explícito
 * del form (el selector en /playlists, visible cuando el usuario tiene 2+
 * plataformas) por sobre inferirlo de la cookie: la cookie depende de que el
 * switcher haya alcanzado a persistir el Set-Cookie antes de este submit, y
 * en la práctica esa inferencia venía fallando (listas creadas con el
 * switcher en Remanentes terminaban etiquetadas General). Un valor explícito
 * en el form no tiene ese problema de timing — pero igual lo validamos
 * contra las plataformas reales del usuario para que nadie pueda forzar por
 * formData una plataforma a la que no pertenece.
 */
async function resolverPlataformaParaCrear(
  formData: FormData,
  id_usuario: number,
  rol: string,
): Promise<number> {
  const elegida = resolverPlataforma(formData.get("id_plataforma") as string | undefined);
  if (elegida === undefined) return getPlataformaEfectivaId(id_usuario);

  if (rol === "ADMINISTRADOR") return elegida;

  const propias = await getMisPlataformas(id_usuario);
  const esPropia = propias.some((p) => p.id_plataforma === elegida);
  return esPropia ? elegida : getPlataformaEfectivaId(id_usuario);
}

// ── Guard de gestión (dueño o admin/líder) ────────────────────────────────────

/** Exige sesión y que el usuario sea dueño de la lista (o ADMIN/LÍDER). */
async function assertPuedeGestionar(id_playlist: number): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const [pl] = await db
    .select({ id_usuario: playlists.id_usuario })
    .from(playlists)
    .where(eq(playlists.id_playlist, id_playlist));

  if (!pl) throw new Error(`Playlist ${id_playlist} no encontrada.`);

  const { rol, id_usuario } = session.user;
  if (id_usuario !== pl.id_usuario && rol !== "ADMINISTRADOR" && rol !== "LIDER") {
    throw new Error("No tenés permisos para gestionar esta lista.");
  }
}

// ── crearPlaylist ─────────────────────────────────────────────────────────────

export async function crearPlaylist(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const nombre = (formData.get("nombre") as string | null)?.trim();
  if (!nombre) throw new Error("El nombre de la lista es obligatorio.");

  const id_plataforma = await resolverPlataformaParaCrear(
    formData,
    session.user.id_usuario,
    session.user.rol,
  );

  const [inserted] = await db
    .insert(playlists)
    .values({
      id_usuario:       session.user.id_usuario,
      id_plataforma,
      nombre,
      tipo:             "PRESET",
      estado:           null,
      fecha_programada: null,
    })
    .$returningId();

  redirect(`/playlists/${inserted.id_playlist}`);
}

// ── avanzarEstadoPlaylist ─────────────────────────────────────────────────────

const ESTADOS_VALIDOS = ["PREPARACION", "ENSAYO", "DEFINITIVA", "MAZO"] as const;
type EstadoEvento = (typeof ESTADOS_VALIDOS)[number];

export async function avanzarEstadoPlaylist(
  id_playlist: number,
  nuevoEstado: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  if (!ESTADOS_VALIDOS.includes(nuevoEstado as EstadoEvento)) {
    throw new Error(`Estado inválido: ${nuevoEstado}`);
  }

  const [playlist] = await db
    .select({ id_usuario: playlists.id_usuario, tipo: playlists.tipo, id_plataforma: playlists.id_plataforma, estado: playlists.estado, nombre: playlists.nombre })
    .from(playlists)
    .where(eq(playlists.id_playlist, id_playlist));

  if (!playlist) throw new Error(`Playlist ${id_playlist} no encontrada.`);
  if (playlist.tipo !== "EVENTO") {
    throw new Error("Solo los EVENTOs tienen estado de ejecución.");
  }

  const { rol, id_usuario } = session.user;
  const puedeEditar =
    id_usuario === playlist.id_usuario ||
    rol === "ADMINISTRADOR" ||
    rol === "LIDER";

  if (!puedeEditar) throw new Error("Sin permisos para modificar esta playlist.");

  // Una lista solo puede PUBLICARSE (ENSAYO o DEFINITIVA = el set de la semana)
  // si su dueño es quien dirige esta semana (turno ACTIVO en el cronograma).
  // Evita que se acumule más de una lista "activa" de distintos ministros.
  // Volver hacia atrás (PREPARACION) o archivar (MAZO) no está restringido, así
  // el ministro siempre puede corregir una lista que publicó por error.
  if (nuevoEstado === "ENSAYO" || nuevoEstado === "DEFINITIVA") {
    // El director activo se busca dentro de la misma plataforma de la lista,
    // para no cruzar la restricción entre Remanentes y Plataforma General.
    const [directorActivo] = await db
      .select({ id_usuario: cronograma.id_usuario })
      .from(cronograma)
      .where(and(
        eq(cronograma.estado_turno, "ACTIVO"),
        eq(cronograma.id_plataforma, playlist.id_plataforma),
      ))
      .limit(1);

    if (!directorActivo) {
      throw new Error("No hay un director de turno activo esta semana.");
    }
    if (directorActivo.id_usuario !== playlist.id_usuario) {
      throw new Error(
        "Solo el director con el turno activo puede poner su lista en ensayo."
      );
    }
  }

  await db
    .update(playlists)
    .set({ estado: nuevoEstado as EstadoEvento })
    .where(eq(playlists.id_playlist, id_playlist));

  revalidatePath(`/playlists/${id_playlist}`);
  revalidatePath("/playlists");

  // Notificar a todos los usuarios de la plataforma cuando la lista se publica.
  // Un solo INSERT batcheado + un solo SELECT de suscripciones (crearNotificacionMasiva)
  // en vez de un round-trip de DB por miembro (antes N+1 vía crearNotificacion en .map()).
  if (nuevoEstado === "ENSAYO" || nuevoEstado === "DEFINITIVA") {
    const [playlistNombre, plataformaNombre, miembros] = await Promise.all([
      db.select({ nombre: playlists.nombre }).from(playlists).where(eq(playlists.id_playlist, id_playlist)).limit(1).then((r) => r[0]?.nombre ?? ""),
      db.select({ nombre: plataformas.nombre }).from(plataformas).where(eq(plataformas.id_plataforma, playlist.id_plataforma)).limit(1).then((r) => r[0]?.nombre ?? ""),
      db.select({ id_usuario: usuario_plataforma.id_usuario }).from(usuario_plataforma).where(eq(usuario_plataforma.id_plataforma, playlist.id_plataforma)),
    ]);

    const etiqueta = nuevoEstado === "ENSAYO" ? "en ensayo" : "definitiva";
    const destinatarios = miembros.map((u) => u.id_usuario).filter((id) => id !== session.user.id_usuario);

    crearNotificacionMasiva(
      destinatarios,
      "LISTA_PUBLICADA",
      `Lista ${etiqueta} — ${plataformaNombre}`,
      `"${playlistNombre}" ya está disponible.`,
    ).catch((err) => console.error("avanzarEstadoPlaylist: fallo notificando publicación:", err));
  }

  // Notificar al equipo cuando la lista vuelve a preparación desde un estado público
  if (nuevoEstado === "PREPARACION" && (playlist.estado === "ENSAYO" || playlist.estado === "DEFINITIVA")) {
    const [plataformaNombre, miembros] = await Promise.all([
      db.select({ nombre: plataformas.nombre }).from(plataformas).where(eq(plataformas.id_plataforma, playlist.id_plataforma)).limit(1).then((r) => r[0]?.nombre ?? ""),
      db.select({ id_usuario: usuario_plataforma.id_usuario }).from(usuario_plataforma).where(eq(usuario_plataforma.id_plataforma, playlist.id_plataforma)),
    ]);

    const destinatarios = miembros.map((u) => u.id_usuario).filter((id) => id !== session.user.id_usuario);

    crearNotificacionMasiva(
      destinatarios,
      "LISTA_RETIRADA",
      `Lista en preparación — ${plataformaNombre}`,
      `"${playlist.nombre}" volvió a preparación.`,
    ).catch((err) => console.error("avanzarEstadoPlaylist: fallo notificando retiro:", err));
  }
}

// ── cambiarPlataformaPlaylist ─────────────────────────────────────────────────
// Vía de rescate para listas que quedaron mal etiquetadas por el bug de
// inferencia de plataforma al crearlas (ver resolverPlataformaParaCrear):
// como hoy no hay otra forma de corregirlo salvo recrear la lista, permitimos
// que un ADMINISTRADOR reasigne la plataforma de una lista existente. Solo
// ADMINISTRADOR — coincide con "CRUD Completo siempre" de la matriz de roles
// (arquitectura.md); un LIDER/MINISTRO no debería poder mover una lista
// entre plataformas por su cuenta.

export async function cambiarPlataformaPlaylist(
  id_playlist: number,
  id_plataforma: number,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (session.user.rol !== "ADMINISTRADOR") {
    throw new Error("Solo un administrador puede reasignar la plataforma de una lista.");
  }

  const idsValidos = new Set(PLATAFORMAS_LIST.map((p) => p.id));
  if (!idsValidos.has(id_plataforma as 1 | 2)) {
    throw new Error("Plataforma inválida.");
  }

  const [playlist] = await db
    .select({ id_playlist: playlists.id_playlist })
    .from(playlists)
    .where(eq(playlists.id_playlist, id_playlist));
  if (!playlist) throw new Error(`Playlist ${id_playlist} no encontrada.`);

  await db
    .update(playlists)
    .set({ id_plataforma })
    .where(eq(playlists.id_playlist, id_playlist));

  revalidatePath(`/playlists/${id_playlist}`);
  revalidatePath("/playlists");
}

// ── renombrarPlaylist ─────────────────────────────────────────────────────────

export async function renombrarPlaylist(
  id_playlist: number,
  nombre: string
): Promise<void> {
  await assertPuedeGestionar(id_playlist);

  const limpio = nombre.trim();
  if (!limpio) throw new Error("El nombre no puede quedar vacío.");

  await db
    .update(playlists)
    .set({ nombre: limpio })
    .where(eq(playlists.id_playlist, id_playlist));

  revalidatePath("/playlists");
  revalidatePath(`/playlists/${id_playlist}`);
}

// ── eliminarPlaylist ──────────────────────────────────────────────────────────

export async function eliminarPlaylist(id_playlist: number): Promise<void> {
  await assertPuedeGestionar(id_playlist);

  // Borramos primero las canciones de la lista (no hay ON DELETE CASCADE en el
  // schema) y luego la cabecera, todo en una transacción.
  await db.transaction(async (tx) => {
    await tx.delete(lista_canciones).where(eq(lista_canciones.id_playlist, id_playlist));
    await tx.delete(playlists).where(eq(playlists.id_playlist, id_playlist));
  });

  revalidatePath("/playlists");
}

// ── instanciarPreset ──────────────────────────────────────────────────────────

export async function instanciarPreset(id_preset: number): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  // La transacción devuelve el id; el redirect va fuera para que Next.js
  // no lo confunda con un error de rollback.
  const nuevaId = await db.transaction(async (tx) => {
    const [preset] = await tx
      .select()
      .from(playlists)
      .where(eq(playlists.id_playlist, id_preset));

    if (!preset) throw new Error(`Preset ${id_preset} no encontrado.`);
    if (preset.tipo !== "PRESET") {
      throw new Error("Solo se puede instanciar una lista de tipo PRESET.");
    }

    const canciones = await tx
      .select({
        id_cancion: lista_canciones.id_cancion,
        orden:      lista_canciones.orden,
        nota:       lista_canciones.nota,
      })
      .from(lista_canciones)
      .where(eq(lista_canciones.id_playlist, id_preset));

    const [nueva] = await tx
      .insert(playlists)
      .values({
        id_usuario:       session.user.id_usuario,
        id_plataforma:    preset.id_plataforma,
        nombre:           `Servicio - ${preset.nombre}`,
        tipo:             "EVENTO",
        estado:           "PREPARACION",
        fecha_programada: null,
      })
      .$returningId();

    if (canciones.length > 0) {
      await tx.insert(lista_canciones).values(
        canciones.map(({ id_cancion, orden, nota }) => ({
          id_playlist: nueva.id_playlist,
          id_cancion,
          orden,
          nota,
        }))
      );
    }

    return nueva.id_playlist;
  });

  revalidatePath("/playlists");
  redirect(`/playlists/${nuevaId}`);
}

// ── clonarMazo ────────────────────────────────────────────────────────────────

// El ejecutor se toma SIEMPRE de la sesión, nunca de un parámetro — antes
// `id_usuario_ejecutor` venía del caller sin validar, así que un Server
// Action invocado directamente (bypaseando la página) podía clonar una lista
// ajena y atribuírsela a cualquier id_usuario arbitrario.
export async function clonarMazo(id_playlist: number): Promise<{ nuevaPlaylistId: number }> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  const id_usuario_ejecutor = session.user.id_usuario;

  return await db.transaction(async (tx) => {

    const [original] = await tx
      .select()
      .from(playlists)
      .where(eq(playlists.id_playlist, id_playlist));

    if (!original) {
      throw new Error(`Playlist ${id_playlist} no encontrada.`);
    }
    if (original.tipo !== "EVENTO" || original.estado !== "MAZO") {
      throw new Error(
        `Solo se puede clonar una lista EVENTO/MAZO. Recibido: ${original.tipo}/${original.estado}`
      );
    }

    const esReutilizacionPropia = original.id_usuario === id_usuario_ejecutor;

    const [nuevaCabecera] = await tx
      .insert(playlists)
      .values({
        id_usuario:       id_usuario_ejecutor,
        id_plataforma:    original.id_plataforma,
        nombre:           original.nombre,
        tipo:             esReutilizacionPropia ? "EVENTO"      : "PRESET",
        estado:           esReutilizacionPropia ? "PREPARACION" : null,
        fecha_programada: null,
      })
      .$returningId();

    const nuevaPlaylistId = nuevaCabecera.id_playlist;

    const cancionesOriginales = await tx
      .select()
      .from(lista_canciones)
      .where(eq(lista_canciones.id_playlist, id_playlist));

    if (cancionesOriginales.length > 0) {
      await tx.insert(lista_canciones).values(
        cancionesOriginales.map(({ id_cancion, orden, nota }) => ({
          id_playlist:  nuevaPlaylistId,
          id_cancion,
          orden,
          nota,
        }))
      );
    }

    return { nuevaPlaylistId };
  });
}
