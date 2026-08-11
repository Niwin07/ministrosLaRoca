"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { usuarios, usuario_plataforma } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PLATAFORMAS_LIST } from "@/lib/plataforma";

// Estas tres actions se usan como `<form action={...}>` DIRECTO (no hay un
// wrapper inline en la página que capture el error, a diferencia de
// playlists.ts/listas.ts). Por eso cada una necesita su propio try/catch →
// redirect(?error=), igual que canciones.ts/turnos.ts.
//
// CRÍTICO: a diferencia de las páginas que las invocan, un Server Action es
// su propio endpoint HTTP invocable directamente (bypasseando el redirect de
// la página si el rol no es admin). Por eso cada action vuelve a verificar
// auth()+rol acá adentro — antes no lo hacían y cualquiera podía crear un
// usuario ADMINISTRADOR o reescribir el rol de otro sin sesión.

async function assertAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (session.user.rol !== "ADMINISTRADOR") throw new Error("Sin permisos de administrador.");
}

// No exponer el detalle crudo de un error de DB inesperado al cliente.
function mensajePublico(e: unknown, fallback: string, duplicado: string): string {
  if (e instanceof Error) {
    if (/unique|duplicate/i.test(e.message)) return duplicado;
    if (e.message === "No autenticado." || e.message === "Sin permisos de administrador.") return e.message;
  }
  return fallback;
}

export async function crearUsuario(formData: FormData) {
  try {
    await assertAdmin();

    const nombre   = (formData.get("nombre")   as string | null)?.trim() ?? "";
    const email    = (formData.get("email")    as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null) ?? "";
    const rol      = (formData.get("rol")      as string | null) ?? "";

    if (!nombre || !email || !password || !rol) {
      throw new Error("Completá todos los campos obligatorios.");
    }
    if (rol !== "ADMINISTRADOR" && rol !== "LIDER" && rol !== "MINISTRO") {
      throw new Error("Rol inválido.");
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.insert(usuarios).values({ nombre, email, password_hash, rol });
  } catch (e) {
    if (e instanceof Error && e.message !== "No autenticado." && e.message !== "Sin permisos de administrador." && !/unique|duplicate/i.test(e.message) && e.message !== "Rol inválido." && e.message !== "Completá todos los campos obligatorios.") {
      console.error("crearUsuario:", e);
    }
    redirect(
      `/admin/usuarios?error=${encodeURIComponent(
        mensajePublico(e, "No se pudo crear el usuario.", "Ya existe un usuario con ese email.")
      )}`
    );
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?success=creado");
}

export async function actualizarUsuario(formData: FormData) {
  const id_usuario = Number(formData.get("id_usuario"));
  try {
    await assertAdmin();

    const nombre   = (formData.get("nombre")   as string | null)?.trim() ?? "";
    const email    = (formData.get("email")    as string | null)?.trim() ?? "";
    const rol      = (formData.get("rol")      as string | null) ?? "";
    const password = (formData.get("password") as string | null)?.trim() ?? "";

    if (!id_usuario || !nombre || !email || !rol) {
      throw new Error("Completá todos los campos obligatorios.");
    }
    if (rol !== "ADMINISTRADOR" && rol !== "LIDER" && rol !== "MINISTRO") {
      throw new Error("Rol inválido.");
    }

    type Payload = {
      nombre:         string;
      email:          string;
      rol:            "ADMINISTRADOR" | "LIDER" | "MINISTRO";
      password_hash?: string;
    };

    const payload: Payload = { nombre, email, rol };

    if (password) {
      payload.password_hash = await bcrypt.hash(password, 10);
    }

    await db.update(usuarios).set(payload).where(eq(usuarios.id_usuario, id_usuario));
  } catch (e) {
    if (e instanceof Error && e.message !== "No autenticado." && e.message !== "Sin permisos de administrador." && !/unique|duplicate/i.test(e.message) && e.message !== "Rol inválido." && e.message !== "Completá todos los campos obligatorios.") {
      console.error("actualizarUsuario:", e);
    }
    redirect(
      `/admin/usuarios/${id_usuario}?error=${encodeURIComponent(
        mensajePublico(e, "No se pudieron guardar los cambios.", "Ya existe otro usuario con ese email.")
      )}`
    );
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?success=actualizado");
}

export async function actualizarPlataformasUsuario(formData: FormData) {
  const id_usuario = Number(formData.get("id_usuario"));
  try {
    await assertAdmin();
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
    const esperado =
      e instanceof Error &&
      (e.message === "No autenticado." || e.message === "Sin permisos de administrador." || e.message === "Usuario inválido.");
    if (!esperado) console.error("actualizarPlataformasUsuario:", e);

    redirect(
      `/admin/usuarios/${id_usuario}?error=${encodeURIComponent(
        e instanceof Error && esperado ? e.message : "No se pudieron guardar las plataformas."
      )}`
    );
  }

  revalidatePath(`/admin/usuarios/${id_usuario}`);
  redirect(`/admin/usuarios/${id_usuario}?success=plataformas`);
}
