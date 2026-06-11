"use server";

import { db } from "@/db";
import { canciones, lista_canciones, lista_comentarios, playlists, usuario_plataforma } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { crearNotificacion } from "@/lib/notif";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ItemReorden {
  id_lista_cancion: number;
  orden: number;
}

// ── Helper privado ────────────────────────────────────────────────────────────

/**
 * Regla única de mutabilidad del contenido (canciones, orden, notas):
 * - PRESET (estado siempre null): editable sin restricciones.
 * - EVENTO en PREPARACION o ENSAYO: editable (la lista en ensayo está
 *   publicada pero todavía sujeta a modificaciones).
 * - EVENTO en DEFINITIVA o MAZO: bloqueado — hay que retroceder de etapa.
 */
function estadoPermiteEdicion(tipo: string, estado: string | null): boolean {
  if (tipo === "PRESET") return true;
  return tipo === "EVENTO" && (estado === "PREPARACION" || estado === "ENSAYO");
}

/** Exige sesión y devuelve el usuario; lanza si no hay nadie logueado. */
async function getUsuario() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  return session.user;
}

/**
 * Guard central de mutación: combina autenticación, permiso (dueño de la lista
 * o ADMINISTRADOR/LÍDER) y mutabilidad por etapa. Las acciones reciben el
 * dueño/tipo/estado ya cargados para no repetir el SELECT.
 */
function assertPuedeModificar(
  user: { id_usuario: number; rol: string },
  ownerId: number,
  tipo: string,
  estado: string | null
): void {
  const esDueño = user.id_usuario === ownerId;
  if (!esDueño && user.rol !== "ADMINISTRADOR" && user.rol !== "LIDER") {
    throw new Error("No tenés permisos para modificar esta lista.");
  }
  if (estadoPermiteEdicion(tipo, estado)) return;
  throw new Error(
    `La lista no es editable en su etapa actual (${tipo}/${estado ?? "null"}). ` +
    `Volvé a 'En preparación' o 'En ensayo' para modificarla.`
  );
}

async function assertEditable(id_playlist: number): Promise<void> {
  const user = await getUsuario();
  const [lista] = await db
    .select({ estado: playlists.estado, tipo: playlists.tipo, id_usuario: playlists.id_usuario })
    .from(playlists)
    .where(eq(playlists.id_playlist, id_playlist));

  if (!lista) {
    throw new Error(`Playlist ${id_playlist} no encontrada.`);
  }

  assertPuedeModificar(user, lista.id_usuario, lista.tipo, lista.estado);
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Agrega una canción a la lista.
 *
 * `ordenDeseado` es solo una preferencia de posición: se respeta únicamente si
 * es un entero válido y la posición está libre. Si está ocupada (p. ej. el
 * formulario mandó un número desactualizado y repetido) o no se pasa, la
 * canción se anexa al final (max + 1). Así nunca se viola el
 * UNIQUE(id_playlist, orden) ni se rompe la página por un orden duplicado.
 * Todo dentro de una transacción para evitar carreras en el cálculo del máximo.
 */
export async function agregarCancionALista(
  id_playlist: number,
  id_cancion: number,
  ordenDeseado?: number,
  nota?: string
): Promise<{ id_lista_cancion: number; orden: number }> {
  await assertEditable(id_playlist);

  const result = await db.transaction(async (tx) => {
    const filas = await tx
      .select({ orden: lista_canciones.orden })
      .from(lista_canciones)
      .where(eq(lista_canciones.id_playlist, id_playlist));

    const ocupados = new Set(filas.map((f) => f.orden));
    const maxOrden = filas.length ? Math.max(...filas.map((f) => f.orden)) : 0;

    const orden =
      ordenDeseado !== undefined &&
      Number.isInteger(ordenDeseado) &&
      ordenDeseado >= 1 &&
      !ocupados.has(ordenDeseado)
        ? ordenDeseado
        : maxOrden + 1;

    const [inserted] = await tx
      .insert(lista_canciones)
      .values({
        id_playlist,
        id_cancion,
        orden,
        nota: nota ?? null,
        // Timestamp explícito para el badge "Nuevo" (qué cambió desde tu
        // última visita).
        agregadoEn: new Date(),
      })
      .$returningId();

    return { id_lista_cancion: inserted.id_lista_cancion, orden };
  });

  // Notificar al equipo si la lista ya está publicada (fire & forget)
  notificarCancionAgregada(id_playlist, id_cancion).catch(() => {});

  return result;
}

/**
 * Notifica un cambio de contenido a todos los miembros de la plataforma de la
 * lista (excepto el autor), solo si la lista está publicada (ENSAYO o
 * DEFINITIVA). Fire & forget: los llamadores no esperan ni propagan errores.
 */
async function notificarCambioEnLista(
  id_playlist: number,
  tipo: "CANCION_AGREGADA" | "CANCION_QUITADA" | "TONO_CAMBIADO",
  titulo: string,
  cuerpo: (nombreLista: string) => string,
) {
  const session = await auth();
  if (!session?.user) return;

  const [lista] = await db
    .select({ estado: playlists.estado, id_plataforma: playlists.id_plataforma, nombre: playlists.nombre })
    .from(playlists)
    .where(eq(playlists.id_playlist, id_playlist));

  if (!lista || (lista.estado !== "ENSAYO" && lista.estado !== "DEFINITIVA")) return;

  const miembros = await db
    .select({ id_usuario: usuario_plataforma.id_usuario })
    .from(usuario_plataforma)
    .where(eq(usuario_plataforma.id_plataforma, lista.id_plataforma));

  await Promise.all(
    miembros
      .filter((u) => u.id_usuario !== session.user.id_usuario)
      .map((u) =>
        crearNotificacion(u.id_usuario, tipo, titulo, cuerpo(lista.nombre)).catch(() => {})
      )
  );
}

async function notificarCancionAgregada(id_playlist: number, id_cancion: number) {
  const [cancion] = await db
    .select({ nombre: canciones.nombre })
    .from(canciones)
    .where(eq(canciones.id_cancion, id_cancion));
  if (!cancion) return;

  await notificarCambioEnLista(
    id_playlist,
    "CANCION_AGREGADA",
    "Nueva canción en el setlist",
    (lista) => `Se agregó "${cancion.nombre}" a "${lista}".`,
  );
}

/**
 * Actualiza la tonalidad específica (nota) de una canción dentro de su lista.
 * El JOIN con playlists permite verificar el estado sin un parámetro extra.
 */
export async function actualizarNotaCancion(
  id_lista_cancion: number,
  nota: string
): Promise<void> {
  const user = await getUsuario();
  const [registro] = await db
    .select({
      id_lista_cancion: lista_canciones.id_lista_cancion,
      id_playlist:      lista_canciones.id_playlist,
      nota_anterior:    lista_canciones.nota,
      nombre_cancion:   canciones.nombre,
      estado_playlist:  playlists.estado,
      tipo_playlist:    playlists.tipo,
      owner:            playlists.id_usuario,
    })
    .from(lista_canciones)
    .innerJoin(
      playlists,
      eq(lista_canciones.id_playlist, playlists.id_playlist)
    )
    .innerJoin(
      canciones,
      eq(lista_canciones.id_cancion, canciones.id_cancion)
    )
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));

  if (!registro) {
    throw new Error(
      `Registro ${id_lista_cancion} no encontrado en ninguna lista.`
    );
  }
  assertPuedeModificar(user, registro.owner, registro.tipo_playlist, registro.estado_playlist);

  // notaActualizadaEn explícito (nunca ON UPDATE automático: reordenar
  // actualiza todas las filas y las marcaría como modificadas).
  await db
    .update(lista_canciones)
    .set({ nota, notaActualizadaEn: new Date() })
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));

  // Notificar solo si el tono realmente cambió (fire & forget)
  if ((registro.nota_anterior ?? "") !== nota) {
    notificarCambioEnLista(
      registro.id_playlist,
      "TONO_CAMBIADO",
      "Cambio de tono",
      (lista) =>
        nota
          ? `"${registro.nombre_cancion}" ahora va en ${nota} en "${lista}".`
          : `Se quitó el tono de "${registro.nombre_cancion}" en "${lista}".`,
    ).catch(() => {});
  }
}

/**
 * Reordena en bloque las canciones de una lista.
 *
 * MySQL valida el UNIQUE(id_playlist, orden) fila por fila durante el UPDATE,
 * no al finalizar el statement. Para evitar colisiones intermedias se usa
 * una estrategia de dos fases dentro de una transacción:
 *   Fase 1: desplazar todos los órdenes actuales a un rango alto (+1.000.000).
 *   Fase 2: asignar los valores finales uno por uno (ya sin colisión posible).
 */
export async function reordenarLista(
  id_playlist: number,
  reordenamientos: ItemReorden[]
): Promise<void> {
  if (reordenamientos.length === 0) return;

  await assertEditable(id_playlist);

  await db.transaction(async (tx) => {
    // Fase 1: mover todos los órdenes fuera del rango de trabajo
    await tx
      .update(lista_canciones)
      .set({ orden: sql`${lista_canciones.orden} + 1000000` })
      .where(eq(lista_canciones.id_playlist, id_playlist));

    // Fase 2: escribir el orden definitivo para cada ítem
    for (const item of reordenamientos) {
      await tx
        .update(lista_canciones)
        .set({ orden: item.orden })
        .where(
          and(
            eq(lista_canciones.id_lista_cancion, item.id_lista_cancion),
            eq(lista_canciones.id_playlist, id_playlist)
          )
        );
    }
  });
}

/**
 * Elimina una canción de la lista.
 * El JOIN con playlists verifica el estado antes de borrar.
 */
export async function eliminarCancionDeLista(
  id_lista_cancion: number
): Promise<void> {
  const user = await getUsuario();
  const [registro] = await db
    .select({
      id_lista_cancion: lista_canciones.id_lista_cancion,
      id_playlist:      lista_canciones.id_playlist,
      nombre_cancion:   canciones.nombre,
      estado_playlist:  playlists.estado,
      tipo_playlist:    playlists.tipo,
      owner:            playlists.id_usuario,
    })
    .from(lista_canciones)
    .innerJoin(
      playlists,
      eq(lista_canciones.id_playlist, playlists.id_playlist)
    )
    .innerJoin(
      canciones,
      eq(lista_canciones.id_cancion, canciones.id_cancion)
    )
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));

  if (!registro) {
    throw new Error(
      `Registro ${id_lista_cancion} no encontrado en ninguna lista.`
    );
  }
  assertPuedeModificar(user, registro.owner, registro.tipo_playlist, registro.estado_playlist);

  await db
    .delete(lista_canciones)
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));

  // Notificar al equipo si la lista está publicada (fire & forget)
  notificarCambioEnLista(
    registro.id_playlist,
    "CANCION_QUITADA",
    "Canción quitada del setlist",
    (lista) => `Se quitó "${registro.nombre_cancion}" de "${lista}".`,
  ).catch(() => {});
}

// ── Comentarios por canción ───────────────────────────────────────────────────
// Acuerdos del ensayo ("la arrancamos a capela"). Cualquier usuario autenticado
// puede comentar; borrar puede el autor o un ADMINISTRADOR/LÍDER.

export async function agregarComentario(
  id_lista_cancion: number,
  texto: string
): Promise<void> {
  const user = await getUsuario();

  const limpio = texto.trim().slice(0, 500);
  if (!limpio) throw new Error("El comentario no puede estar vacío.");

  const [registro] = await db
    .select({
      id_playlist:    lista_canciones.id_playlist,
      nombre_cancion: canciones.nombre,
      owner:          playlists.id_usuario,
      nombre_lista:   playlists.nombre,
    })
    .from(lista_canciones)
    .innerJoin(playlists, eq(lista_canciones.id_playlist, playlists.id_playlist))
    .innerJoin(canciones, eq(lista_canciones.id_cancion, canciones.id_cancion))
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));

  if (!registro) {
    throw new Error(`Registro ${id_lista_cancion} no encontrado en ninguna lista.`);
  }

  await db.insert(lista_comentarios).values({
    id_lista_cancion,
    id_usuario: user.id_usuario,
    texto: limpio,
  });

  // Avisar al dueño de la lista (no a todo el equipo) — fire & forget
  if (registro.owner !== user.id_usuario) {
    crearNotificacion(
      registro.owner,
      "COMENTARIO",
      "Nuevo comentario",
      `${user.name ?? "Alguien"} comentó "${registro.nombre_cancion}" en "${registro.nombre_lista}".`,
    ).catch(() => {});
  }
}

export async function eliminarComentario(id_comentario: number): Promise<void> {
  const user = await getUsuario();

  const [comentario] = await db
    .select({ id_usuario: lista_comentarios.id_usuario })
    .from(lista_comentarios)
    .where(eq(lista_comentarios.id_comentario, id_comentario));

  if (!comentario) return; // ya borrado — idempotente

  const esAutor = comentario.id_usuario === user.id_usuario;
  if (!esAutor && user.rol !== "ADMINISTRADOR" && user.rol !== "LIDER") {
    throw new Error("Solo el autor o un líder pueden borrar este comentario.");
  }

  await db
    .delete(lista_comentarios)
    .where(eq(lista_comentarios.id_comentario, id_comentario));
}
