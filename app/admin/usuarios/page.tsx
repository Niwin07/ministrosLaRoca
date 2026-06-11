import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pencil, UserPlus, Users } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { asc } from "drizzle-orm";
import { crearUsuario } from "@/app/actions/usuarios";
import { Button } from "@/components/Button";

const FEEDBACK: Record<string, string> = {
  creado:       "Usuario creado exitosamente.",
  actualizado:  "Usuario actualizado exitosamente.",
};

const ROL_STYLE: Record<string, string> = {
  ADMINISTRADOR: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  LIDER:         "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  MINISTRO:      "bg-input text-mid",
};

export default async function AdminUsuariosPage(props: {
  searchParams: Promise<{ success?: string }>;
}) {
  const searchParams = await props.searchParams;
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
      foto:       usuarios.foto,
    })
    .from(usuarios)
    .orderBy(asc(usuarios.nombre));

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-lo transition-colors hover:text-hi"
      >
        <ArrowLeft size={15} />
        Inicio
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-hi">
          Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-lo">
          Creá y administrá las cuentas del equipo.
        </p>
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────── */}
      {mensaje && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {mensaje}
        </div>
      )}

      {/* ── Layout 2-col en desktop ───────────────────────────────────── */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">

        {/* Col izquierda: lista de usuarios */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={13} className="shrink-0 text-violet-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-mid">
              Usuarios registrados ({listaUsuarios.length})
            </h2>
          </div>

          {listaUsuarios.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-lo">
              No hay usuarios registrados.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {listaUsuarios.map((u) => (
                <div
                  key={u.id_usuario}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-4 shadow-card dark:shadow-none"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-input">
                    {u.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.foto} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-mid">
                        {u.nombre.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-hi">{u.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-lo">{u.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${ROL_STYLE[u.rol] ?? ROL_STYLE.MINISTRO}`}>
                    {u.rol}
                  </span>
                  <Link
                    href={`/admin/usuarios/${u.id_usuario}`}
                    aria-label={`Editar ${u.nombre}`}
                    className="shrink-0 rounded-full p-2 text-lo transition-colors hover:bg-input hover:text-hi"
                  >
                    <Pencil size={15} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Col derecha: crear usuario (sticky en desktop) */}
        <div className="lg:sticky lg:top-8">
          <div className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus size={13} className="shrink-0 text-violet-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-mid">Nuevo usuario</p>
            </div>
            <form action={crearUsuario} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombre" className="text-xs font-medium uppercase tracking-wider text-lo">Nombre</label>
                <input
                  id="nombre" name="nombre" type="text" required placeholder="Ej: Juan Pérez"
                  className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder:text-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-lo">Email</label>
                <input
                  id="email" name="email" type="email" required placeholder="juan@iglesia.com"
                  className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder:text-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-lo">Contraseña</label>
                <input
                  id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres"
                  className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder:text-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rol" className="text-xs font-medium uppercase tracking-wider text-lo">Rol</label>
                <select
                  id="rol" name="rol" required
                  className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
                >
                  <option value="">— Seleccionar rol —</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="LIDER">Líder</option>
                  <option value="MINISTRO">Ministro</option>
                </select>
              </div>
              <Button type="submit" className="self-start" icon={<UserPlus size={14} />}>
                Crear Usuario
              </Button>
            </form>
          </div>
        </div>

      </div>

    </main>
  );
}
