"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db";
import { cronograma, lista_canciones, playlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { resolverPlataforma, PLATAFORMA_IDS } from "@/lib/plataforma";

async function getPlataformaActiva(): Promise<number> {
  const jar = await cookies();
  return resolverPlataforma(jar.get("plataforma_activa")?.value) ?? PLATAFORMA_IDS.general;
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

  const id_plataforma = await getPlataformaActiva();

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
    .select({ id_usuario: playlists.id_usuario, tipo: playlists.tipo })
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
    const [directorActivo] = await db
      .select({ id_usuario: cronograma.id_usuario })
      .from(cronograma)
      .where(eq(cronograma.estado_turno, "ACTIVO"))
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

export async function clonarMazo(
  id_playlist: number,
  id_usuario_ejecutor: number
): Promise<{ nuevaPlaylistId: number }> {
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
