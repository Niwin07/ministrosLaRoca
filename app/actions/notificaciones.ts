"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { crearNotificacion } from "@/lib/notif";

/** Admin/Líder envía una notificación de prueba a un usuario específico. */
export async function probarNotificacion(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") {
    throw new Error("Sin permisos.");
  }

  const id_usuario = Number(formData.get("id_usuario")) || session.user.id_usuario;

  try {
    await crearNotificacion(
      id_usuario,
      "MENCION",
      "Notificación de prueba",
      "Si ves esto, las notificaciones funcionan correctamente en este dispositivo.",
    );
  } catch (e) {
    redirect(
      `/admin/turnos?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo enviar la prueba.",
      )}`,
    );
  }
  redirect("/admin/turnos?success=prueba");
}

/** Solo ADMINISTRADOR puede enviar menciones manuales a un usuario. */
export async function enviarMencion(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (session.user.rol !== "ADMINISTRADOR") throw new Error("Sin permisos.");

  const id_usuario = Number(formData.get("id_usuario"));
  const titulo = (formData.get("titulo") as string | null)?.trim();
  const cuerpo = (formData.get("cuerpo") as string | null)?.trim();

  if (!id_usuario || !titulo || !cuerpo) {
    redirect(`/admin/usuarios/${id_usuario}?error=Completá+todos+los+campos`);
  }

  try {
    await crearNotificacion(id_usuario, "MENCION", titulo, cuerpo);
  } catch (e) {
    redirect(
      `/admin/usuarios/${id_usuario}?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo enviar la mención.",
      )}`,
    );
  }
  redirect(`/admin/usuarios/${id_usuario}?success=mencion`);
}
