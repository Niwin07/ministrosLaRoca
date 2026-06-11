import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, KeyRound, Mail, ShieldCheck, Bell } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";
import { FotoPerfil } from "@/components/FotoPerfil";
import { actualizarMiNombre, cambiarMiPassword, actualizarMiFoto } from "@/app/actions/perfil";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  LIDER:         "Líder",
  MINISTRO:      "Ministro",
};

const SUCCESS_MSG: Record<string, string> = {
  perfil:   "Perfil actualizado.",
  password: "Contraseña actualizada.",
  foto:     "Foto actualizada.",
  mencion:  "Mención enviada.",
};

const inputCls =
  "rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder:text-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30";
const labelCls = "text-xs font-medium uppercase tracking-wider text-lo";

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
    <main className="space-y-6 px-4 pt-8 pb-6 md:max-w-2xl md:mx-auto">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-lo transition-colors hover:text-hi"
      >
        <ArrowLeft size={15} />
        Inicio
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600">
          {usuario.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={usuario.foto} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-white">
              {usuario.nombre.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-hi">{usuario.nombre}</h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-lo">
            <ShieldCheck size={12} />
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

      {/* ── Datos de la cuenta ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <User size={14} className="text-violet-500" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mid">Datos de la cuenta</h2>
        </div>

        <div className="mb-5 border-b border-line pb-5">
          <FotoPerfil foto={usuario.foto} nombre={usuario.nombre} onActualizar={actualizarMiFoto} />
        </div>

        <form action={actualizarMiNombre} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className={labelCls}>Nombre</label>
            <input id="nombre" name="nombre" type="text" required defaultValue={usuario.nombre} className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-mark bg-input/50 px-4 py-3 text-sm text-mid">
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

      {/* ── Notificaciones push ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={14} className="text-violet-500" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mid">Notificaciones</h2>
        </div>
        <p className="mb-4 text-xs text-lo">
          Recibí alertas en este dispositivo cuando te asignen un turno, se publique una lista o moderen tus canciones.
        </p>
        <PushSubscribeButton />
      </section>

      {/* ── Cambiar contraseña ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={14} className="text-violet-500" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mid">Cambiar contraseña</h2>
        </div>

        <form action={cambiarMiPassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="actual" className={labelCls}>Contraseña actual</label>
            <input id="actual" name="actual" type="password" required autoComplete="current-password" className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nueva" className={labelCls}>Nueva contraseña</label>
            <input id="nueva" name="nueva" type="password" required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmar" className={labelCls}>Repetir nueva contraseña</label>
            <input id="confirmar" name="confirmar" type="password" required minLength={6} autoComplete="new-password" className={inputCls} />
          </div>

          <Button type="submit" className="w-fit" icon={<KeyRound size={14} />}>
            Actualizar contraseña
          </Button>
        </form>
      </section>

    </main>
  );
}
