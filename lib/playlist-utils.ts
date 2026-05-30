import { db } from "@/db";
import { playlists } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";

/**
 * Promueve automáticamente de DEFINITIVA → MAZO las playlists de tipo EVENTO
 * cuyo campo actualizado_en supere las 24 horas sin cambio de estado.
 *
 * Sin argumentos: opera sobre todas las playlists del sistema (lista global).
 * Con id_playlist: aplica solo a esa lista (detalle individual).
 */
export async function promoverDefinitivasAMazo(id_playlist?: number): Promise<void> {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const condicionBase = and(
    eq(playlists.tipo, "EVENTO"),
    eq(playlists.estado, "DEFINITIVA"),
    lt(playlists.actualizadoEn, hace24h),
  );

  await db
    .update(playlists)
    .set({ estado: "MAZO" })
    .where(
      id_playlist !== undefined
        ? and(condicionBase, eq(playlists.id_playlist, id_playlist))
        : condicionBase
    );
}
