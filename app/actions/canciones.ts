"use server";

import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface SugerirCancionInput {
  nombre:   string;
  artista:  string;
  bpm?:     number;
  metrica?: string;
  letra?:   string;
  charts?:  string;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Permite a cualquier usuario autenticado enviar una canción al catálogo.
 * El estado se fuerza siempre a PENDIENTE.
 */
export async function sugerirCancion(
  input: SugerirCancionInput
): Promise<{ id_cancion: number }> {
  const [inserted] = await db
    .insert(canciones)
    .values({
      nombre:            input.nombre,
      artista:           input.artista,
      bpm:               input.bpm     ?? null,
      metrica:           input.metrica ?? null,
      letra:             input.letra   ?? null,
      charts:            input.charts  ?? null,
      estado_aprobacion: "PENDIENTE",
    })
    .$returningId();

  return { id_cancion: inserted.id_cancion };
}

/**
 * Permite al Administrador o Líder resolver una sugerencia desde FormData.
 * - APROBADA: guarda letra y charts; limpia motivo_rechazo.
 * - RECHAZADA: limpia letra, charts y registra un motivo genérico.
 *
 * Los saltos de línea del browser (\r\n) se normalizan a \n antes de persistir.
 */
export async function resolverSugerencia(formData: FormData): Promise<void> {
  const id_cancion = Number(formData.get("id_cancion"));
  const decision   = formData.get("decision") as "APROBADA" | "RECHAZADA";

  if (!id_cancion || !decision) return;

  const normalize = (raw: FormDataEntryValue | null) =>
    typeof raw === "string" && raw.trim()
      ? raw.replace(/\r\n/g, "\n").trim()
      : null;

  const letra  = normalize(formData.get("letra"));
  const charts = normalize(formData.get("charts"));

  const [cancion] = await db
    .select({ id_cancion: canciones.id_cancion })
    .from(canciones)
    .where(eq(canciones.id_cancion, id_cancion));

  if (!cancion) throw new Error(`Canción ${id_cancion} no encontrada.`);

  if (decision === "APROBADA") {
    await db
      .update(canciones)
      .set({
        estado_aprobacion: "APROBADA",
        letra,
        charts,
        motivo_rechazo:    null,
      })
      .where(eq(canciones.id_cancion, id_cancion));
  } else {
    await db
      .update(canciones)
      .set({
        estado_aprobacion: "RECHAZADA",
        letra:             null,
        charts:            null,
        motivo_rechazo:    "No cumple los criterios del ministerio.",
      })
      .where(eq(canciones.id_cancion, id_cancion));
  }

  revalidatePath("/canciones");
  revalidatePath("/admin/canciones");
}
