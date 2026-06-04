"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Redirige al perfil con un mensaje (patrón redirect→?error=/?success=→banner).
function volver(params: string): never {
  redirect(`/perfil?${params}`);
}

/** Actualiza el nombre del usuario logueado (solo el propio). */
export async function actualizarMiNombre(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const nombre = (formData.get("nombre") as string | null)?.trim() ?? "";
  if (!nombre) {
    volver(`error=${encodeURIComponent("El nombre no puede quedar vacío.")}`);
  }

  await db
    .update(usuarios)
    .set({ nombre })
    .where(eq(usuarios.id_usuario, session.user.id_usuario));

  revalidatePath("/perfil");
  revalidatePath("/", "layout"); // el header muestra la inicial del nombre
  volver("success=perfil");
}

/**
 * Actualiza (o quita) la foto de perfil del usuario logueado.
 * La imagen llega como data URL (base64) ya redimensionada desde el cliente.
 * Si `foto` viene vacía, se borra la foto actual.
 */
export async function actualizarMiFoto(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const foto = (formData.get("foto") as string | null) ?? "";

  if (foto === "") {
    // Quitar la foto.
    await db
      .update(usuarios)
      .set({ foto: null })
      .where(eq(usuarios.id_usuario, session.user.id_usuario));
  } else {
    // Validamos que sea una imagen en data URL y que no sea desproporcionada
    // (el cliente la achica a ~256px; 1.5 MB de base64 es un techo holgado).
    if (!/^data:image\/(png|jpe?g|webp);base64,/.test(foto)) {
      volver(`error=${encodeURIComponent("Formato de imagen no válido.")}`);
    }
    if (foto.length > 1_500_000) {
      volver(`error=${encodeURIComponent("La imagen es demasiado pesada. Probá con otra.")}`);
    }
    await db
      .update(usuarios)
      .set({ foto })
      .where(eq(usuarios.id_usuario, session.user.id_usuario));
  }

  revalidatePath("/perfil");
  revalidatePath("/", "layout"); // el header muestra el avatar
  volver("success=foto");
}

/**
 * Cambia la contraseña del usuario logueado.
 * Exige la contraseña actual (verificada contra el hash) y confirmación de la
 * nueva. Nunca confía en un id del formulario: usa el de la sesión.
 */
export async function cambiarMiPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const actual    = (formData.get("actual")    as string | null) ?? "";
  const nueva      = (formData.get("nueva")     as string | null) ?? "";
  const confirmar = (formData.get("confirmar") as string | null) ?? "";

  if (!actual || !nueva || !confirmar) {
    volver(`error=${encodeURIComponent("Completá todos los campos.")}`);
  }
  if (nueva.length < 6) {
    volver(`error=${encodeURIComponent("La nueva contraseña debe tener al menos 6 caracteres.")}`);
  }
  if (nueva !== confirmar) {
    volver(`error=${encodeURIComponent("La confirmación no coincide con la nueva contraseña.")}`);
  }

  const [usuario] = await db
    .select({ password_hash: usuarios.password_hash })
    .from(usuarios)
    .where(eq(usuarios.id_usuario, session.user.id_usuario))
    .limit(1);

  if (!usuario) redirect("/login");

  const ok = await bcrypt.compare(actual, usuario.password_hash);
  if (!ok) {
    volver(`error=${encodeURIComponent("La contraseña actual es incorrecta.")}`);
  }

  const password_hash = await bcrypt.hash(nueva, 10);
  await db
    .update(usuarios)
    .set({ password_hash })
    .where(eq(usuarios.id_usuario, session.user.id_usuario));

  volver("success=password");
}
