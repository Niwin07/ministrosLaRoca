"use server";

import { db } from "@/db";
import { cronograma, plataformas } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolverPlataforma, PLATAFORMA_IDS } from "@/lib/plataforma";
import { getPlataformaActivaId } from "@/lib/get-plataforma-activa";
import { crearNotificacion } from "@/lib/notif";

// Solo ADMINISTRADOR o LÍDER gestionan la cola.
async function assertGestor(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") {
    throw new Error("Sin permisos para gestionar la cola.");
  }
}

function revalidar() {
  revalidatePath("/turnos");
  revalidatePath("/admin/turnos");
}

// Redirige a la cola con un mensaje de error (patrón redirect→?error=→banner).
// Devuelve `never` porque redirect() lanza internamente.
function errorCola(e: unknown, fallback: string): never {
  redirect(
    `/admin/turnos?error=${encodeURIComponent(e instanceof Error ? e.message : fallback)}`
  );
}

export async function agregarACola(formData: FormData) {
  try {
    await assertGestor();
    const id_usuario = Number(formData.get("id_usuario"));
    if (!id_usuario) return;

    // El admin elige la plataforma en el form; si no viene, usa la del usuario.
    const fromForm = resolverPlataforma(formData.get("id_plataforma") as string | undefined);
    const session2 = await auth();
    const id_plataforma = fromForm
      ?? (session2?.user ? await getPlataformaActivaId(session2.user.id_usuario, session2.user.rol) : undefined)
      ?? PLATAFORMA_IDS.general;

    const [{ max } = { max: 0 }] = await db
      .select({ max: sql<number>`COALESCE(MAX(${cronograma.orden}), 0)` })
      .from(cronograma)
      .where(and(eq(cronograma.id_plataforma, id_plataforma), eq(cronograma.estado_turno, "EN_ESPERA")));

    await db.insert(cronograma).values({
      id_usuario,
      id_plataforma,
      estado_turno: "EN_ESPERA",
      orden: Number(max) + 1,
    });

    revalidar();

    // Notificar al ministro agregado (fire & forget)
    const [plataforma] = await db
      .select({ nombre: plataformas.nombre })
      .from(plataformas)
      .where(eq(plataformas.id_plataforma, id_plataforma))
      .limit(1);

    crearNotificacion(
      id_usuario,
      "TURNO_ASIGNADO",
      "Te asignaron un turno",
      `Estás en la cola de ${plataforma?.nombre ?? "la plataforma"}.`,
    ).catch(() => {});
  } catch (e) {
    errorCola(e, "No se pudo agregar a la cola.");
  }
  redirect("/admin/turnos?success=agregado");
}

export async function marcarActivo(formData: FormData) {
  try {
    await assertGestor();
    const id_turno = Number(formData.get("id_turno"));
    if (!id_turno) return;

    // Leer la plataforma del turno que se va a activar para no tocar el activo
    // de la otra plataforma (cada plataforma tiene su propio activo independiente).
    const [turno] = await db
      .select({ id_plataforma: cronograma.id_plataforma })
      .from(cronograma)
      .where(eq(cronograma.id_turno, id_turno));
    if (!turno) return;

    await db.transaction(async (tx) => {
      await tx
        .update(cronograma)
        .set({ estado_turno: "COMPLETADO" })
        .where(and(
          eq(cronograma.estado_turno, "ACTIVO"),
          eq(cronograma.id_plataforma, turno.id_plataforma),
        ));

      await tx
        .update(cronograma)
        .set({ estado_turno: "ACTIVO" })
        .where(eq(cronograma.id_turno, id_turno));
    });

    revalidar();
  } catch (e) {
    errorCola(e, "No se pudo marcar al ministro como activo.");
  }
  redirect("/admin/turnos?success=activo");
}

/** Saca al director activo y lo devuelve al frente de la cola (para corregir).
 *  Recibe el id_turno del activo a desactivar para ser platform-aware. */
export async function desactivarActivo(formData: FormData) {
  try {
    await assertGestor();
    const id_turno = Number(formData.get("id_turno"));
    if (!id_turno) return;

    const [activo] = await db
      .select({ id_turno: cronograma.id_turno, id_plataforma: cronograma.id_plataforma })
      .from(cronograma)
      .where(and(
        eq(cronograma.id_turno, id_turno),
        eq(cronograma.estado_turno, "ACTIVO"),
      ))
      .limit(1);
    if (!activo) return;

    // El orden mínimo de la cola de ESA plataforma (para poner al frente).
    const [{ min } = { min: 1 }] = await db
      .select({ min: sql<number>`COALESCE(MIN(${cronograma.orden}), 1)` })
      .from(cronograma)
      .where(and(
        eq(cronograma.estado_turno, "EN_ESPERA"),
        eq(cronograma.id_plataforma, activo.id_plataforma),
      ));

    await db
      .update(cronograma)
      .set({ estado_turno: "EN_ESPERA", orden: Number(min) - 1 })
      .where(eq(cronograma.id_turno, activo.id_turno));

    revalidar();
  } catch (e) {
    errorCola(e, "No se pudo desactivar al director.");
  }
  redirect("/admin/turnos?success=desactivado");
}

/** Elimina un turno de la cola (o el activo). */
export async function quitarTurno(formData: FormData) {
  try {
    await assertGestor();
    const id_turno = Number(formData.get("id_turno"));
    if (!id_turno) return;

    await db.delete(cronograma).where(eq(cronograma.id_turno, id_turno));

    revalidar();
  } catch (e) {
    errorCola(e, "No se pudo quitar el turno.");
  }
  redirect("/admin/turnos?success=quitado");
}

/** Reordena la cola (drag). Recibe [{ id_turno, orden }]. */
export async function reordenarCola(formData: FormData) {
  try {
    await assertGestor();
    const raw = formData.get("reordenamientos");
    if (typeof raw !== "string") return;

    const items = JSON.parse(raw) as { id_turno: number; orden: number }[];
    if (items.length === 0) return;

    await db.transaction(async (tx) => {
      for (const it of items) {
        await tx
          .update(cronograma)
          .set({ orden: it.orden })
          .where(eq(cronograma.id_turno, it.id_turno));
      }
    });

    revalidar();
  } catch (e) {
    errorCola(e, "No se pudo reordenar la cola.");
  }
}
