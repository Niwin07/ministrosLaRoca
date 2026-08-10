"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { usuarios, usuario_plataforma } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PLATAFORMAS_LIST } from "@/lib/plataforma";

// Estas tres actions se usan como `<form action={...}>` DIRECTO (no hay un
// wrapper inline en la página que capture el error, a diferencia de
// playlists.ts/listas.ts). Por eso cada una necesita su propio try/catch →
// redirect(?error=), igual que canciones.ts/turnos.ts, para que un fallo
// (ej. email duplicado → UNIQUE constraint de MySQL) se vea como banner en
// vez de la pantalla de error genérica.

export async function crearUsuario(formData: FormData) {
  try {
    const nombre   = (formData.get("nombre")   as string | null)?.trim() ?? "";
    const email    = (formData.get("email")    as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null) ?? "";
    const rol      = (formData.get("rol")      as string | null) ?? "";

    if (!nombre || !email || !password || !rol) {
      throw new Error("Completá todos los campos obligatorios.");
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.insert(usuarios).values({
      nombre,
      email,
      password_hash,
      rol: rol as "ADMINISTRADOR" | "LIDER" | "MINISTRO",
    });
  } catch (e) {
    const msg =
      e instanceof Error && /unique|duplicate/i.test(e.message)
        ? "Ya existe un usuario con ese email."
        : e instanceof Error
          ? e.message
          : "No se pudo crear el usuario.";
    redirect(`/admin/usuarios?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?success=creado");
}

export async function actualizarUsuario(formData: FormData) {
  const id_usuario = Number(formData.get("id_usuario"));
  try {
    const nombre   = (formData.get("nombre")   as string | null)?.trim() ?? "";
    const email    = (formData.get("email")    as string | null)?.trim() ?? "";
    const rol      = (formData.get("rol")      as string | null) ?? "";
    const password = (formData.get("password") as string | null)?.trim() ?? "";

    if (!id_usuario || !nombre || !email || !rol) {
      throw new Error("Completá todos los campos obligatorios.");
    }

    type Payload = {
      nombre:         string;
      email:          string;
      rol:            "ADMINISTRADOR" | "LIDER" | "MINISTRO";
      password_hash?: string;
    };

    const payload: Payload = {
      nombre,
      email,
      rol: rol as "ADMINISTRADOR" | "LIDER" | "MINISTRO",
    };

    if (password) {
      payload.password_hash = await bcrypt.hash(password, 10);
    }

    await db.update(usuarios).set(payload).where(eq(usuarios.id_usuario, id_usuario));
  } catch (e) {
    const msg =
      e instanceof Error && /unique|duplicate/i.test(e.message)
        ? "Ya existe otro usuario con ese email."
        : e instanceof Error
          ? e.message
          : "No se pudieron guardar los cambios.";
    redirect(`/admin/usuarios/${id_usuario}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?success=actualizado");
}

export async function actualizarPlataformasUsuario(formData: FormData) {
  const id_usuario = Number(formData.get("id_usuario"));
  try {
    if (!id_usuario) throw new Error("Usuario inválido.");

    const seleccionadas = formData.getAll("plataformas").map(Number).filter(Boolean);
    const principalRaw  = Number(formData.get("principal"));
    const principal     = seleccionadas.includes(principalRaw) ? principalRaw : (seleccionadas[0] ?? null);

    const idsValidos = new Set(PLATAFORMAS_LIST.map((p) => p.id));

    await db.transaction(async (tx) => {
      // Borrar todas las asignaciones actuales y reescribir.
      await tx.delete(usuario_plataforma).where(eq(usuario_plataforma.id_usuario, id_usuario));

      if (seleccionadas.length > 0) {
        await tx.insert(usuario_plataforma).values(
          seleccionadas
            .filter((id) => idsValidos.has(id as 1 | 2))
            .map((id_plataforma) => ({
              id_usuario,
              id_plataforma,
              es_principal: id_plataforma === principal ? 1 : 0,
            })),
        );
      }
    });
  } catch (e) {
    redirect(
      `/admin/usuarios/${id_usuario}?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudieron guardar las plataformas."
      )}`
    );
  }

  revalidatePath(`/admin/usuarios/${id_usuario}`);
  redirect(`/admin/usuarios/${id_usuario}?success=plataformas`);
}
