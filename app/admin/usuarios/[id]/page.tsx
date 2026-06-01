import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { actualizarUsuario } from "@/app/actions/usuarios";

export default async function EditarUsuarioPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR") redirect("/");

  const id = Number(params.id);
  if (!id) redirect("/admin/usuarios");

  const [usuario] = await db
    .select({
      id_usuario: usuarios.id_usuario,
      nombre:     usuarios.nombre,
      email:      usuarios.email,
      rol:        usuarios.rol,
    })
    .from(usuarios)
    .where(eq(usuarios.id_usuario, id))
    .limit(1);

  if (!usuario) redirect("/admin/usuarios");

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content-primary"
      >
        <ArrowLeft size={15} />
        Usuarios
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Editar Usuario
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Modificá los datos de{" "}
          <span className="text-white">{usuario.nombre}</span>.
        </p>
      </div>

      {/* ── Formulario ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-glass-base bg-glass-subtle p-5">
        <form action={actualizarUsuario} className="flex flex-col gap-4">

          <input type="hidden" name="id_usuario" value={usuario.id_usuario} />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nombre"
              className="text-xs font-medium uppercase tracking-wider text-content-muted"
            >
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              defaultValue={usuario.nombre}
              className="rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-content-muted"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={usuario.email}
              className="rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-content-muted"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              placeholder="Dejar en blanco para mantener actual"
              className="rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rol"
              className="text-xs font-medium uppercase tracking-wider text-content-muted"
            >
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              required
              defaultValue={usuario.rol}
              className="rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 [&>option]:bg-glass-base"
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="LIDER">Líder</option>
              <option value="MINISTRO">Ministro</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 active:bg-lime-500"
            >
              Guardar cambios
            </button>
            <Link
              href="/admin/usuarios"
              className="rounded-full border border-glass-elevated px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:border-glass-highlight hover:text-content-primary"
            >
              Cancelar
            </Link>
          </div>

        </form>
      </div>

    </main>
  );
}
