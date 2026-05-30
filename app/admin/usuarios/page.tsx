import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { asc } from "drizzle-orm";
import { crearUsuario } from "@/app/actions/usuarios";

const FEEDBACK: Record<string, string> = {
  creado:       "Usuario creado exitosamente.",
  actualizado:  "Usuario actualizado exitosamente.",
};

const ROL_STYLE: Record<string, string> = {
  ADMINISTRADOR: "bg-purple-500/20 text-purple-400",
  LIDER:         "bg-blue-500/20 text-blue-400",
  MINISTRO:      "bg-zinc-800 text-zinc-400",
};

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR") redirect("/");

  const mensaje = searchParams.success ? (FEEDBACK[searchParams.success] ?? null) : null;

  const listaUsuarios = await db
    .select({
      id_usuario: usuarios.id_usuario,
      nombre:     usuarios.nombre,
      email:      usuarios.email,
      rol:        usuarios.rol,
    })
    .from(usuarios)
    .orderBy(asc(usuarios.nombre));

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
      >
        <ArrowLeft size={15} />
        Inicio
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Creá y administrá las cuentas del equipo.
        </p>
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────── */}
      {mensaje && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-sm text-lime-400">
          {mensaje}
        </div>
      )}

      {/* ── Formulario: crear usuario ────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Nuevo usuario
        </p>
        <form action={crearUsuario} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nombre"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              placeholder="Ej: Juan Pérez"
              className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="juan@iglesia.com"
              className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rol"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              required
              className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 [&>option]:bg-zinc-900"
            >
              <option value="">— Seleccionar rol —</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="LIDER">Líder</option>
              <option value="MINISTRO">Ministro</option>
            </select>
          </div>

          <button
            type="submit"
            className="self-start rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 active:bg-lime-500"
          >
            Crear Usuario
          </button>

        </form>
      </div>

      {/* ── Lista de usuarios ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Usuarios registrados ({listaUsuarios.length})
        </h2>

        {listaUsuarios.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-600">
            No hay usuarios registrados.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {listaUsuarios.map((u) => (
              <div
                key={u.id_usuario}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                  <span className="text-xs font-bold text-zinc-400">
                    {u.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {u.nombre}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {u.email}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${ROL_STYLE[u.rol] ?? ROL_STYLE.MINISTRO}`}
                >
                  {u.rol}
                </span>
                <Link
                  href={`/admin/usuarios/${u.id_usuario}`}
                  aria-label={`Editar ${u.nombre}`}
                  className="shrink-0 rounded-full p-2 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                >
                  <Pencil size={15} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
