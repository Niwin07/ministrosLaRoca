"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
