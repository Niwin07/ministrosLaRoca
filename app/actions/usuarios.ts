"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { usuarios, usuario_plataforma } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PLATAFORMAS_LIST } from "@/lib/plataforma";

export async function crearUsuario(formData: FormData) {
  const nombre   = (formData.get("nombre")   as string | null)?.trim() ?? "";
  const email    = (formData.get("email")    as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const rol      = (formData.get("rol")      as string | null) ?? "";

  if (!nombre || !email || !password || !rol) return;

  const password_hash = await bcrypt.hash(password, 10);

  await db.insert(usuarios).values({
    nombre,
    email,
    password_hash,
    rol: rol as "ADMINISTRADOR" | "LIDER" | "MINISTRO",
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?success=creado");
}

export async function actualizarUsuario(formData: FormData) {
  const id_usuario = Number(formData.get("id_usuario"));
  const nombre     = (formData.get("nombre")   as string | null)?.trim() ?? "";
  const email      = (formData.get("email")    as string | null)?.trim() ?? "";
  const rol        = (formData.get("rol")      as string | null) ?? "";
  const password   = (formData.get("password") as string | null)?.trim() ?? "";

  if (!id_usuario || !nombre || !email || !rol) return;

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

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?success=actualizado");
}

export async function actualizarPlataformasUsuario(formData: FormData) {
  const id_usuario = Number(formData.get("id_usuario"));
  if (!id_usuario) return;

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

  revalidatePath(`/admin/usuarios/${id_usuario}`);
  redirect(`/admin/usuarios/${id_usuario}?success=plataformas`);
}
