import Link from "next/link";
import { SelectorZarza } from "@/components/zarza/SelectorZarza";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuarios, usuario_plataforma, plataformas } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { crearUsuario } from "@/app/actions/usuarios";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ErrorBanner";
import { nombrePlataforma } from "@/lib/plataforma";
import { ListaUsuarios } from "@/components/zarza/usuarios/ListaUsuarios";

const FEEDBACK: Record<string, string> = {
  creado:       "Usuario creado exitosamente.",
  actualizado:  "Usuario actualizado exitosamente.",
};

export default async function AdminUsuariosPage(props: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR") redirect("/");

  const mensaje = searchParams.success ? (FEEDBACK[searchParams.success] ?? null) : null;
  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

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

  const membresias = await db
    .select({ id_usuario: usuario_plataforma.id_usuario, nombre: plataformas.nombre })
    .from(usuario_plataforma)
    .innerJoin(plataformas, eq(plataformas.id_plataforma, usuario_plataforma.id_plataforma));
  const listaConPlataformas = listaUsuarios.map((u) => ({
    ...u,
    plataformas: membresias.filter((m) => m.id_usuario === u.id_usuario).map((m) => nombrePlataforma(m.nombre)),
  }));

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-7 md:px-0 md:pt-2">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-hi transition-opacity hover:opacity-75"
      >
        <ArrowLeft size={15} />
        Inicio
      </Link>

      <div>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-hi">
          Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-lo">
          Creá y administrá las cuentas del equipo.
        </p>
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────── */}
      <ErrorBanner message={errorMsg} />
      {mensaje && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {mensaje}
        </div>
      )}

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[360px_1fr] lg:items-start lg:gap-6">

      {/* ── Formulario: crear usuario ────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus size={14} className="shrink-0 text-[#c7613a]" />
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-hi">
            Nuevo usuario
          </p>
        </div>
        <form action={crearUsuario} className="flex flex-col gap-4">

          <Input id="nombre" name="nombre" type="text" required label="Nombre" placeholder="Ej: Juan Pérez" />

          <Input id="email" name="email" type="email" required label="Email" placeholder="juan@iglesia.com" />

          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
          />

          <div className="flex flex-col gap-1.5">
            <SelectorZarza name="rol" label="Rol" required vacio="Seleccionar rol" opciones={[{ valor: "ADMINISTRADOR", texto: "Administrador" }, { valor: "LIDER", texto: "Líder" }, { valor: "MINISTRO", texto: "Ministro" }]} />
            <span className="text-[11px] text-lo">El rol define qué puede hacer en la app.</span>
          </div>

          <Button type="submit" className="self-start" icon={<UserPlus size={14} />}>
            Crear usuario
          </Button>

        </form>
      </div>

      <ListaUsuarios usuarios={listaConPlataformas} />

      </div>

    </main>
  );
}
