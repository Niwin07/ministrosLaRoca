"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/** Acción de usuario: cambia la plataforma activa e invalida el layout. */
export async function setPlataforma(id_plataforma: number) {
  (await cookies()).set("plataforma_activa", String(id_plataforma), { path: "/" });
  revalidatePath("/", "layout");
}

/** Persiste la cookie sin revalidar — solo para sincronía silenciosa al cargar. */
export async function setPlataformaEnCookie(id_plataforma: number) {
  (await cookies()).set("plataforma_activa", String(id_plataforma), { path: "/" });
}
