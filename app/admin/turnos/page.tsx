import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mic2, X } from "lucide-react";
import { db } from "@/db";
import { cronograma, usuarios } from "@/db/schema";
import { auth } from "@/auth";
import { eq, asc } from "drizzle-orm";
import { agregarACola, marcarActivo, desactivarActivo, quitarTurno, reordenarCola } from "@/app/actions/turnos";
import { ColaTurnos } from "@/components/ColaTurnos";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";

const FEEDBACK: Record<string, string> = {
  agregado:    "Usuario agregado a la cola.",
  activo:      "Usuario marcado como activo.",
  desactivado: "Director desactivado y devuelto a la cola.",
  quitado:     "Turno quitado de la cola.",
};

export default async function AdminTurnosPage(props: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") {
    redirect("/");
  }

  const mensaje  = searchParams.success ? (FEEDBACK[searchParams.success] ?? null) : null;
  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

  const listaUsuarios = await db
    .select({ id_usuario: usuarios.id_usuario, nombre: usuarios.nombre })
    .from(usuarios)
    .orderBy(asc(usuarios.nombre));

  const [turnoActivo] = await db
    .select({
      id_turno:       cronograma.id_turno,
      nombre_usuario: usuarios.nombre,
    })
    .from(cronograma)
    .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
    .where(eq(cronograma.estado_turno, "ACTIVO"))
    .limit(1);

  const cola = await db
    .select({
      id_turno:       cronograma.id_turno,
      nombre_usuario: usuarios.nombre,
      orden:          cronograma.orden,
    })
    .from(cronograma)
    .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
    .where(eq(cronograma.estado_turno, "EN_ESPERA"))
    .orderBy(asc(cronograma.orden));

  return (
    <main className="space-y-6 px-4 pt-8 pb-6">

      <Link
        href="/turnos"
        className="inline-flex items-center gap-1.5 text-sm text-lo transition-colors hover:text-hi"
      >
        <ArrowLeft size={15} />
        Ver Cola
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-hi">Gestión de Cola</h1>
        <p className="mt-1 text-sm text-lo">Administrá la rotación de ministros en servicio.</p>
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────── */}
      <ErrorBanner message={errorMsg} />
      {mensaje && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {mensaje}
        </div>
      )}

      {/* ── Formulario: agregar a la cola ────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-mid">
          Agregar a la cola
        </p>
        <form action={agregarACola} className="flex gap-3">
          <select
            name="id_usuario"
            required
            className="flex-1 rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
          >
            <option value="">— Seleccionar ministro —</option>
            {listaUsuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombre}
              </option>
            ))}
          </select>
          <Button type="submit" className="shrink-0">
            Agregar
          </Button>
        </form>
      </div>

      {/* ── En Servicio Ahora ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mid">En Servicio Ahora</h2>
        {turnoActivo ? (
          <div className="flex items-center gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600">
              <Mic2 size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-violet-600">
                Activo
              </p>
              <p className="truncate text-base font-bold text-hi">{turnoActivo.nombre_usuario}</p>
            </div>
            <form action={desactivarActivo}>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="shrink-0"
                icon={<X size={12} />}
                title="Sacar de servicio y devolver a la cola"
              >
                Desactivar
              </Button>
            </form>
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-lo">
            Nadie está activo en este momento.
          </p>
        )}
      </section>

      {/* ── Cola de espera ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mid">Cola de Espera</h2>
        <p className="-mt-1 text-[11px] text-lo">Arrastrá para reordenar quién sigue.</p>
        <ColaTurnos
          turnos={cola}
          onReordenar={reordenarCola}
          onActivar={marcarActivo}
          onQuitar={quitarTurno}
        />
      </section>

    </main>
  );
}
