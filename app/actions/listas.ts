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

async function assertEditable(id_playlist: number): Promise<void> {
  const [lista] = await db
    .select({ estado: playlists.estado, tipo: playlists.tipo })
    .from(playlists)
    .where(eq(playlists.id_playlist, id_playlist));

  if (!lista) {
    throw new Error(`Playlist ${id_playlist} no encontrada.`);
  }

  if (estadoPermiteEdicion(lista.tipo, lista.estado)) return;

  throw new Error(
    `La lista no es editable en su etapa actual (${lista.tipo}/${lista.estado ?? "null"}). ` +
    `Volvé a 'En preparación' o 'En ensayo' para modificarla.`
  );
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

  return db.transaction(async (tx) => {
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
      })
      .$returningId();

    return { id_lista_cancion: inserted.id_lista_cancion, orden };
  });
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
  if (!estadoPermiteEdicion(registro.tipo_playlist, registro.estado_playlist)) {
    throw new Error(
      `No se puede editar la nota en esta etapa (${registro.tipo_playlist}/${registro.estado_playlist ?? "null"}). Volvé a 'En preparación' o 'En ensayo'.`
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
  if (!estadoPermiteEdicion(registro.tipo_playlist, registro.estado_playlist)) {
    throw new Error(
      `No se puede eliminar una canción en esta etapa (${registro.tipo_playlist}/${registro.estado_playlist ?? "null"}). Volvé a 'En preparación' o 'En ensayo'.`
    );
  }

  await db
    .delete(lista_canciones)
    .where(eq(lista_canciones.id_lista_cancion, id_lista_cancion));
}
