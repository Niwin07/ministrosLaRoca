"use server";

// Turnos de sonido (sonidista principal y auxiliar por semana) y ajustes de
// planificación por plataforma. Sólo ADMINISTRADOR o LIDER.

import { db } from "@/db";
import { sonidistas, turnos_sonido, ajustes_plataforma } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { puedeEditarContenido, lunesDe } from "@/lib/modulos";
import { resolverPlataforma } from "@/lib/plataforma";
import type { ResultadoAccion } from "@/app/actions/contenido";

async function assertGestor() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!puedeEditarContenido(session.user.rol)) throw new Error("Sin permisos para gestionar turnos.");
}

function plataformaDe(fd: FormData): number {
  const id = resolverPlataforma(String(fd.get("id_plataforma") ?? ""));
  if (!id) throw new Error("Plataforma inválida.");
  return id;
}

async function ejecutar(fn: () => Promise<void>): Promise<ResultadoAccion> {
  try {
    await assertGestor();
    await fn();
    revalidatePath("/admin/turnos");
    revalidatePath("/turnos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("sonido:", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}

export async function agregarSonidista(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const id_plataforma = plataformaDe(fd);
    const id_usuario = Number(fd.get("id_usuario"));
    if (!id_usuario) throw new Error("Elegí una persona.");
    await db.insert(sonidistas).values({ id_usuario, id_plataforma }).onDuplicateKeyUpdate({ set: { id_usuario } });
  });
}

export async function quitarSonidista(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const id_plataforma = plataformaDe(fd);
    const id_usuario = Number(fd.get("id_usuario"));
    await db.delete(sonidistas).where(and(eq(sonidistas.id_usuario, id_usuario), eq(sonidistas.id_plataforma, id_plataforma)));
  });
}

/** Asigna (o limpia, con id_usuario vacío) el principal o el auxiliar de una semana. */
export async function asignarSonido(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const id_plataforma = plataformaDe(fd);
    const semanaIn = String(fd.get("semana") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(semanaIn)) throw new Error("Semana inválida.");
    // Siempre se guarda el lunes de la semana, y nunca semanas pasadas.
    const semana = lunesDe(new Date(`${semanaIn}T12:00:00-03:00`));
    if (semana < lunesDe(new Date())) throw new Error("No se pueden editar semanas pasadas.");
    const rol = fd.get("rol") === "auxiliar" ? "auxiliar" : "principal";
    const id_usuario = Number(fd.get("id_usuario")) || null;
    const set = rol === "principal" ? { id_principal: id_usuario } : { id_auxiliar: id_usuario };
    await db
      .insert(turnos_sonido)
      .values({ id_plataforma, semana, ...set })
      .onDuplicateKeyUpdate({ set });
  });
}

export async function guardarSemanasPlanificadas(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const id_plataforma = plataformaDe(fd);
    const n = Math.min(12, Math.max(1, Math.round(Number(fd.get("semanas")) || 6)));
    await db
      .insert(ajustes_plataforma)
      .values({ id_plataforma, semanas_planificadas: n })
      .onDuplicateKeyUpdate({ set: { semanas_planificadas: n } });
  });
}
