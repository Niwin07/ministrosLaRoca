import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mic2 } from "lucide-react";
import { db } from "@/db";
import { cronograma, usuarios } from "@/db/schema";
import { auth } from "@/auth";
import { eq, asc } from "drizzle-orm";
import { agregarACola, marcarActivo } from "@/app/actions/turnos";

const FEEDBACK: Record<string, string> = {
  agregado: "Usuario agregado a la cola.",
  activo:   "Usuario marcado como activo.",
};

export default async function AdminTurnosPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") {
    redirect("/");
  }

  const mensaje = searchParams.success ? (FEEDBACK[searchParams.success] ?? null) : null;

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
    })
    .from(cronograma)
    .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
    .where(eq(cronograma.estado_turno, "EN_ESPERA"))
    .orderBy(asc(cronograma.id_turno));

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/turnos"
        className="inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content-primary"
      >
        <ArrowLeft size={15} />
        Ver Cola
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Gestión de Cola
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Administrá la rotación de ministros en servicio.
        </p>
      </div>

      {/* ── Feedback ─────────────────────────────────────────────────── */}
      {mensaje && (
        <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 px-4 py-3 text-sm text-lime-400">
          {mensaje}
        </div>
      )}

      {/* ── Formulario: agregar a la cola ────────────────────────────── */}
      <div className="rounded-2xl border border-glass-base bg-glass-subtle p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-content-muted">
          Agregar a la cola
        </p>
        <form action={agregarACola} className="flex gap-3">
          <select
            name="id_usuario"
            required
            className="flex-1 rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 [&>option]:bg-glass-base"
          >
            <option value="">— Seleccionar ministro —</option>
            {listaUsuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 active:bg-lime-500"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* ── En Servicio Ahora ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-content-muted">
          En Servicio Ahora
        </h2>
        {turnoActivo ? (
          <div className="flex items-center gap-4 rounded-2xl border border-lime-400/30 bg-lime-400/10 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-400/20 ring-2 ring-lime-400/40">
              <Mic2 size={18} className="text-lime-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-lime-400/70">
                Activo
              </p>
              <p className="text-base font-bold text-white">
                {turnoActivo.nombre_usuario}
              </p>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-4 text-sm text-content-muted">
            Nadie está activo en este momento.
          </p>
        )}
      </section>

      {/* ── Cola de espera ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-content-muted">
          Cola de Espera
        </h2>
        {cola.length === 0 ? (
          <p className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-4 text-sm text-content-muted">
            La cola está vacía.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {cola.map((t, idx) => (
              <div
                key={t.id_turno}
                className="flex items-center gap-4 rounded-2xl border border-glass-base bg-glass-subtle px-4 py-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-glass-elevated text-xs font-bold text-content-secondary">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm font-semibold text-white">
                  {t.nombre_usuario}
                </p>
                <form action={marcarActivo}>
                  <input type="hidden" name="id_turno" value={t.id_turno} />
                  <button
                    type="submit"
                    className="rounded-full bg-purple-600/80 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
                  >
                    Pasar al servicio
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
