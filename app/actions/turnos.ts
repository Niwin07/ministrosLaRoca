"use server";

import { db } from "@/db";
import { cronograma } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function agregarACola(formData: FormData) {
  const id_usuario = Number(formData.get("id_usuario"));
  if (!id_usuario) return;

  await db.insert(cronograma).values({
    id_usuario,
    estado_turno: "EN_ESPERA",
  });

  revalidatePath("/admin/turnos");
  redirect("/admin/turnos?success=agregado");
}

export async function marcarActivo(formData: FormData) {
  const id_turno = Number(formData.get("id_turno"));
  if (!id_turno) return;

  // Todos los ACTIVO pasan a COMPLETADO antes de activar al nuevo
  await db
    .update(cronograma)
    .set({ estado_turno: "COMPLETADO" })
    .where(eq(cronograma.estado_turno, "ACTIVO"));

  await db
    .update(cronograma)
    .set({ estado_turno: "ACTIVO" })
    .where(eq(cronograma.id_turno, id_turno));

  revalidatePath("/turnos");
  revalidatePath("/admin/turnos");
  redirect("/admin/turnos?success=activo");
}
