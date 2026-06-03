"use server";

import { db } from "@/db";
import { cronograma } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

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

export async function agregarACola(formData: FormData) {
  await assertGestor();
  const id_usuario = Number(formData.get("id_usuario"));
  if (!id_usuario) return;

  // Se agrega al final de la cola.
  const [{ max } = { max: 0 }] = await db
    .select({ max: sql<number>`COALESCE(MAX(${cronograma.orden}), 0)` })
    .from(cronograma);

  await db.insert(cronograma).values({
    id_usuario,
    estado_turno: "EN_ESPERA",
    orden: Number(max) + 1,
  });

  revalidar();
  redirect("/admin/turnos?success=agregado");
}

export async function marcarActivo(formData: FormData) {
  await assertGestor();
  const id_turno = Number(formData.get("id_turno"));
  if (!id_turno) return;

  // Atómico: el activo actual pasa a COMPLETADO y recién después se activa el
  // nuevo, para no violar nunca el índice único `uq_un_solo_activo`.
  await db.transaction(async (tx) => {
    await tx
      .update(cronograma)
      .set({ estado_turno: "COMPLETADO" })
      .where(eq(cronograma.estado_turno, "ACTIVO"));

    await tx
      .update(cronograma)
      .set({ estado_turno: "ACTIVO" })
      .where(eq(cronograma.id_turno, id_turno));
  });

  revalidar();
  redirect("/admin/turnos?success=activo");
}

/** Saca al director activo y lo devuelve al frente de la cola (para corregir). */
export async function desactivarActivo() {
  await assertGestor();

  const [activo] = await db
    .select({ id_turno: cronograma.id_turno })
    .from(cronograma)
    .where(eq(cronograma.estado_turno, "ACTIVO"))
    .limit(1);
  if (!activo) return;

  const [{ min } = { min: 1 }] = await db
    .select({ min: sql<number>`COALESCE(MIN(${cronograma.orden}), 1)` })
    .from(cronograma)
    .where(eq(cronograma.estado_turno, "EN_ESPERA"));

  await db
    .update(cronograma)
    .set({ estado_turno: "EN_ESPERA", orden: Number(min) - 1 })
    .where(eq(cronograma.id_turno, activo.id_turno));

  revalidar();
  redirect("/admin/turnos?success=desactivado");
}

/** Elimina un turno de la cola (o el activo). */
export async function quitarTurno(formData: FormData) {
  await assertGestor();
  const id_turno = Number(formData.get("id_turno"));
  if (!id_turno) return;

  await db.delete(cronograma).where(eq(cronograma.id_turno, id_turno));

  revalidar();
  redirect("/admin/turnos?success=quitado");
}

/** Reordena la cola (drag). Recibe [{ id_turno, orden }]. */
export async function reordenarCola(formData: FormData) {
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
}
