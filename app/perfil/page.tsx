import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, KeyRound, Mail, Bell } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FotoPerfil } from "@/components/FotoPerfil";
import { IconoMarca } from "@/components/zarza/IconoMarca";
import { Avatar } from "@/components/Avatar";
import { actualizarMiNombre, cambiarMiPassword, actualizarMiFoto } from "@/app/actions/perfil";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";
import { ROL_LABEL } from "@/lib/roles";

const SUCCESS_MSG: Record<string, string> = {
  perfil:   "Perfil actualizado.",
  password: "Contraseña actualizada.",
  foto:     "Foto actualizada.",
  mencion:  "Mención enviada.",
};

export default async function PerfilPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [usuario] = await db
    .select({
      nombre: usuarios.nombre,
      email:  usuarios.email,
      rol:    usuarios.rol,
      foto:   usuarios.foto,
    })
    .from(usuarios)
    .where(eq(usuarios.id_usuario, session.user.id_usuario))
    .limit(1);

  if (!usuario) redirect("/login");

  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;
  const successMsg = searchParams.success ? (SUCCESS_MSG[searchParams.success] ?? null) : null;

  return (
    <main className="space-y-6 px-4 pt-8 pb-6">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-hi transition-opacity hover:opacity-75"
      >
        <ArrowLeft size={15} />
        Inicio
      </Link>

      <div className="flex items-center gap-4">
        <Avatar foto={usuario.foto} nombre={usuario.nombre} size={56} />
        <div className="min-w-0">
          <h1 className="font-display truncate text-[26px] font-bold tracking-[-0.02em] text-hi">{usuario.nombre}</h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-lo">
            <IconoMarca nombre="escudo" size={13} />
            {ROL_LABEL[usuario.rol] ?? usuario.rol}
          </p>
        </div>
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────── */}
      <ErrorBanner message={errorMsg} />
      {successMsg && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {successMsg}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">

      {/* ── Datos de la cuenta ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <User size={14} className="text-[#c7613a]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-hi">Datos de la cuenta</h2>
        </div>

        <div className="mb-5 border-b border-line pb-5">
          <FotoPerfil foto={usuario.foto} nombre={usuario.nombre} onActualizar={actualizarMiFoto} />
        </div>

        <form action={actualizarMiNombre} className="flex flex-col gap-4">
          <Input id="nombre" name="nombre" type="text" required defaultValue={usuario.nombre} label="Nombre" />

          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <div className="flex items-center gap-2 rounded-xl border border-mark bg-[#fbf1e4] px-4 py-3 text-sm text-mid dark:bg-input">
              <Mail size={13} className="shrink-0 text-gone" />
              <span className="truncate">{usuario.email}</span>
            </div>
            <p className="text-[11px] text-gone">El email solo lo puede cambiar un administrador.</p>
          </div>

          <Button type="submit" className="w-fit" icon={<User size={14} />}>
            Guardar nombre
          </Button>
        </form>
      </section>

      <div className="flex flex-col gap-6">

      {/* ── Notificaciones push ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={14} className="text-[#c7613a]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-hi">Notificaciones</h2>
        </div>
        <p className="mb-4 text-xs text-lo">
          Recibí alertas en este dispositivo cuando te asignen un turno, se publique una lista o moderen tus canciones.
        </p>
        <PushSubscribeButton />
      </section>

      {/* ── Cambiar contraseña ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={14} className="text-[#c7613a]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-hi">Cambiar contraseña</h2>
        </div>

        <form action={cambiarMiPassword} className="flex flex-col gap-4">
          <Input id="actual" name="actual" type="password" required autoComplete="current-password" label="Contraseña actual" />
          <Input id="nueva" name="nueva" type="password" required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" label="Nueva contraseña" />
          <Input id="confirmar" name="confirmar" type="password" required minLength={6} autoComplete="new-password" label="Repetir nueva contraseña" />

          <Button type="submit" className="w-fit" icon={<KeyRound size={14} />}>
            Actualizar contraseña
          </Button>
        </form>
      </section>

      </div>
      </div>

    </main>
  );
}
