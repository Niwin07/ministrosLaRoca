"use server";

import { db } from "@/db";
import { lista_canciones, playlists } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ItemReorden {
  id_lista_cancion: number;
  orden: number;
}

// ── Helper privado ────────────────────────────────────────────────────────────

/**
 * Verifica que la playlist sea editable:
 * - PRESET (estado siempre null): editable sin restricciones.
 * - EVENTO en PREPARACION: editable.
 * - EVENTO en cualquier otro estado: bloqueado.
 */
async function assertPreparacion(id_playlist: number): Promise<void> {
  const [lista] = await db
    .select({ estado: playlists.estado, tipo: playlists.tipo })
    .from(playlists)
    .where(eq(playlists.id_playlist, id_playlist));

  if (!lista) {
    throw new Error(`Playlist ${id_playlist} no encontrada.`);
  }

  // PRESET es siempre mutable — salir sin error
  if (lista.tipo === "PRESET") return;

  // EVENTO: solo editable en PREPARACION
  if (lista.tipo === "EVENTO" && lista.estado === "PREPARACION") return;

  throw new Error(
    `La lista no es editable. Solo se pueden modificar PLAYLISTs de tipo PRESET o EVENTOs en PREPARACION. Estado actual: ${lista.tipo}/${lista.estado ?? "null"}.`
  );
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Agrega una canción a la lista en la posición indicada.
 * El UNIQUE(id_playlist, orden) impide duplicar posiciones; el caller
 * debe garantizar que el orden no esté ocupado o hacer un reordenamiento previo.
 */
export async function agregarCancionALista(
  id_playlist: number,
  id_cancion: number,
  orden: number,
  nota?: string
): Promise<{ id_lista_cancion: number }> {
  await assertPreparacion(id_playlist);

  const [inserted] = await db
    .insert(lista_canciones)
    .values({
      id_playlist,
      id_cancion,
      orden,
      nota: nota ?? null,
    })
    .$returningId();

  return { id_lista_cancion: inserted.id_lista_cancion };
}

/**
 * Actualiza la tonalidad específica (nota) de una canción dentro de su lista.
 * El JOIN con playlists permite verificar el estado sin un parámetro extra.
 */
export async function actualizarNotaCancion(
  id_lista_cancion: number,
  nota: string
): Promise<void> {
  const [registro] = await db
    .select({
      id_lista_cancion: lista_canciones.id_lista_cancion,
      estado_playlist:  playlists.estado,
      tipo_playlist:    playlists.tipo,
    })
    .from(lista_canciones)
    .innerJoin(
      playlists,
      eq(lista_canciones.id_playlist, playlists.id_playlist)
    )
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));

  if (!registro) {
    throw new Error(
      `Registro ${id_lista_cancion} no encontrado en ninguna lista.`
    );
  }
  if (registro.estado_playlist !== "PREPARACION") {
    throw new Error(
      `Solo se puede editar la nota en una lista en estado PREPARACION. Estado actual: ${registro.tipo_playlist}/${registro.estado_playlist ?? "null"}.`
    );
  }

  await db
    .update(lista_canciones)
    .set({ nota })
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));
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

  await assertPreparacion(id_playlist);

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
  const [registro] = await db
    .select({
      id_lista_cancion: lista_canciones.id_lista_cancion,
      estado_playlist:  playlists.estado,
      tipo_playlist:    playlists.tipo,
    })
    .from(lista_canciones)
    .innerJoin(
      playlists,
      eq(lista_canciones.id_playlist, playlists.id_playlist)
    )
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));

  if (!registro) {
    throw new Error(
      `Registro ${id_lista_cancion} no encontrado en ninguna lista.`
    );
  }
  if (registro.estado_playlist !== "PREPARACION") {
    throw new Error(
      `Solo se puede eliminar una canción de una lista en estado PREPARACION. Estado actual: ${registro.tipo_playlist}/${registro.estado_playlist ?? "null"}.`
    );
  }

  await db
    .delete(lista_canciones)
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));
}
