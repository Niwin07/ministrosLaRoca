"use server";

import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { crearNotificacion } from "@/lib/notif";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

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
  const session = await auth();

  const [inserted] = await db
    .insert(canciones)
    .values({
      nombre:               input.nombre,
      artista:              input.artista,
      bpm:                  input.bpm     ?? null,
      metrica:              input.metrica ?? null,
      letra:                input.letra   ?? null,
      charts:               input.charts  ?? null,
      estado_aprobacion:    "PENDIENTE",
      id_usuario_sugeridor: session?.user?.id_usuario ?? null,
    })
    .$returningId();

  return { id_cancion: inserted.id_cancion };
}

/**
 * Edita una canción del catálogo (cualquier estado). Solo ADMINISTRADOR o LÍDER.
 * Normaliza los saltos de línea (\r\n → \n) de letra y charts.
 */
export async function actualizarCancion(formData: FormData): Promise<void> {
  const id_cancion = Number(formData.get("id_cancion"));
  try {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado.");
    if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") {
      throw new Error("Sin permisos para editar canciones.");
    }

    const nombre  = (formData.get("nombre")  as string | null)?.trim();
    const artista = (formData.get("artista") as string | null)?.trim();
    if (!id_cancion || !nombre || !artista) {
      throw new Error("Nombre y artista son obligatorios.");
    }

    const norm = (raw: FormDataEntryValue | null) =>
      typeof raw === "string" && raw.trim() ? raw.replace(/\r\n/g, "\n").trim() : null;

    const bpmRaw = formData.get("bpm");
    const bpm = typeof bpmRaw === "string" && bpmRaw.trim() ? Number(bpmRaw) : NaN;

    await db
      .update(canciones)
      .set({
        nombre,
        artista,
        bpm:     Number.isFinite(bpm) ? bpm : null,
        metrica: (formData.get("metrica") as string | null)?.trim() || null,
        letra:   norm(formData.get("letra")),
        charts:  norm(formData.get("charts")),
      })
      .where(eq(canciones.id_cancion, id_cancion));

    revalidatePath("/canciones");
    revalidatePath(`/admin/canciones/${id_cancion}`);
  } catch (e) {
    redirect(
      `/admin/canciones/${id_cancion}?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudieron guardar los cambios."
      )}`
    );
  }
  redirect("/canciones?editada=1");
}

/**
 * Permite al Administrador o Líder resolver una sugerencia desde FormData.
 * - APROBADA: guarda letra y charts; limpia motivo_rechazo.
 * - RECHAZADA: limpia letra, charts y registra un motivo genérico.
 *
 * Los saltos de línea del browser (\r\n) se normalizan a \n antes de persistir.
 */
export async function resolverSugerencia(formData: FormData): Promise<void> {
  try {
    // Guard de auth/permisos (antes faltaba — DT-12).
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado.");
    if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") {
      throw new Error("Sin permisos para moderar canciones.");
    }

    const id_cancion = Number(formData.get("id_cancion"));
    const decision   = formData.get("decision") as "APROBADA" | "RECHAZADA";

    if (!id_cancion || !decision) return;

    const normalize = (raw: FormDataEntryValue | null) =>
      typeof raw === "string" && raw.trim()
        ? raw.replace(/\r\n/g, "\n").trim()
        : null;

    const letra  = normalize(formData.get("letra"));
    const charts = normalize(formData.get("charts"));

    const [cancionCompleta] = await db
      .select({ id_cancion: canciones.id_cancion, nombre: canciones.nombre, id_usuario_sugeridor: canciones.id_usuario_sugeridor })
      .from(canciones)
      .where(eq(canciones.id_cancion, id_cancion));

    if (!cancionCompleta) throw new Error(`Canción ${id_cancion} no encontrada.`);

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

    // Notificar al sugeridor si existe
    if (cancionCompleta.id_usuario_sugeridor) {
      const aprobada = decision === "APROBADA";
      crearNotificacion(
        cancionCompleta.id_usuario_sugeridor,
        aprobada ? "CANCION_APROBADA" : "CANCION_RECHAZADA",
        aprobada ? "Canción aprobada" : "Canción no aprobada",
        `"${cancionCompleta.nombre}" fue ${aprobada ? "agregada al catálogo" : "rechazada por el liderazgo"}.`,
      ).catch(() => {});
    }

    revalidatePath("/canciones");
    revalidatePath("/admin/canciones");
  } catch (e) {
    redirect(
      `/admin/canciones?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo resolver la sugerencia."
      )}`
    );
  }
}
