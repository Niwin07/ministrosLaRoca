import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { usuarios, usuario_plataforma } from "@/db/schema";
import { eq } from "drizzle-orm";
import { actualizarUsuario, actualizarPlataformasUsuario } from "@/app/actions/usuarios";
import { enviarMencion } from "@/app/actions/notificaciones";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { PLATAFORMAS_LIST } from "@/lib/plataforma";
import { ErrorBanner } from "@/components/ErrorBanner";

const SUCCESS_MSG: Record<string, string> = {
  mencion: "Mención enviada.",
};

export default async function EditarUsuarioPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await props.params;
  const sp = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR") redirect("/");

  const id = Number(params.id);
  if (!id) redirect("/admin/usuarios");

  const [[usuario], plataformasUsuario] = await Promise.all([
    db
      .select({ id_usuario: usuarios.id_usuario, nombre: usuarios.nombre, email: usuarios.email, rol: usuarios.rol })
      .from(usuarios)
      .where(eq(usuarios.id_usuario, id))
      .limit(1),
    db
      .select({ id_plataforma: usuario_plataforma.id_plataforma, es_principal: usuario_plataforma.es_principal })
      .from(usuario_plataforma)
      .where(eq(usuario_plataforma.id_usuario, id)),
  ]);

  if (!usuario) redirect("/admin/usuarios");

  const plataformasActivas = new Set(plataformasUsuario.map((p) => p.id_plataforma));
  const principalId = plataformasUsuario.find((p) => p.es_principal)?.id_plataforma ?? null;

  const errorMsg   = typeof sp.error   === "string" ? sp.error   : null;
  const successMsg = sp.success ? (SUCCESS_MSG[sp.success] ?? null) : null;

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-lo transition-colors hover:text-hi"
      >
        <ArrowLeft size={15} />
        Usuarios
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-hi">
          Editar Usuario
        </h1>
        <p className="mt-1 text-sm text-lo">
          Modificá los datos de{" "}
          <span className="text-hi">{usuario.nombre}</span>.
        </p>
      </div>

      <ErrorBanner message={errorMsg} />
      {successMsg && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {successMsg}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">

      {/* ── Formulario ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <form action={actualizarUsuario} className="flex flex-col gap-4">

          <input type="hidden" name="id_usuario" value={usuario.id_usuario} />

          <Input id="nombre" name="nombre" type="text" required defaultValue={usuario.nombre} label="Nombre" />

          <Input id="email" name="email" type="email" required defaultValue={usuario.email} label="Email" />

          <Input
            id="password"
            name="password"
            type="password"
            minLength={6}
            placeholder="Dejar en blanco para mantener actual"
            label="Contraseña"
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rol">Rol</Label>
            <select
              id="rol"
              name="rol"
              required
              defaultValue={usuario.rol}
              className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="LIDER">Líder</option>
              <option value="MINISTRO">Ministro</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit">
              Guardar cambios
            </Button>
            <Link
              href="/admin/usuarios"
              className="rounded-full border border-mark px-5 py-2.5 text-sm font-medium text-mid transition-colors hover:border-line hover:text-hi"
            >
              Cancelar
            </Link>
          </div>

        </form>
      </div>

      <div className="flex flex-col gap-6">

      {/* ── Plataformas ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-mid">Plataformas</p>
        <p className="mb-4 text-[11px] text-lo">En cuáles participa este ministro. La principal determina su vista por defecto.</p>

        <form action={actualizarPlataformasUsuario} className="flex flex-col gap-4">
          <input type="hidden" name="id_usuario" value={usuario.id_usuario} />

          <div className="flex flex-col gap-3">
            {PLATAFORMAS_LIST.map((pla) => {
              const activa = plataformasActivas.has(pla.id);
              return (
                <label key={pla.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="plataformas"
                    value={pla.id}
                    defaultChecked={activa}
                    className="h-4 w-4 rounded border-mark accent-violet-600"
                  />
                  <span className="text-sm text-hi">{pla.nombre}</span>
                  {activa && principalId === pla.id && (
                    <Badge tone="violet">Principal</Badge>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="principal">Plataforma principal</Label>
            <select
              id="principal"
              name="principal"
              defaultValue={principalId ?? ""}
              className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
            >
              <option value="">— Sin definir —</option>
              {PLATAFORMAS_LIST.map((pla) => (
                <option key={pla.id} value={pla.id}>{pla.nombre}</option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="secondary">
            Guardar plataformas
          </Button>
        </form>
      </div>

      {/* ── Enviar mención ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare size={14} className="text-violet-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-mid">Enviar notificación</p>
        </div>
        <p className="mb-4 text-[11px] text-lo">
          Enviá un mensaje personalizado al dispositivo de {usuario.nombre}.
        </p>
        <form action={enviarMencion} className="flex flex-col gap-3">
          <input type="hidden" name="id_usuario" value={usuario.id_usuario} />
          <Input id="titulo" name="titulo" type="text" required maxLength={80} label="Título" />
          <Textarea id="cuerpo" name="cuerpo" required rows={3} maxLength={300} label="Mensaje" className="resize-none" />
          <Button type="submit" variant="secondary" icon={<MessageSquare size={13} />} className="w-fit">
            Enviar
          </Button>
        </form>
      </div>

      </div>
      </div>

    </main>
  );
}
