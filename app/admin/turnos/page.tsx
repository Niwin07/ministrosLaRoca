import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { db } from "@/db";
import { cronograma, usuarios, plataformas } from "@/db/schema";
import { auth } from "@/auth";
import { and, eq, asc } from "drizzle-orm";
import { agregarACola, marcarActivo, desactivarActivo, quitarTurno, reordenarCola } from "@/app/actions/turnos";
import { probarNotificacion } from "@/app/actions/notificaciones";
import { Bell } from "lucide-react";
import { ColaTurnos } from "@/components/ColaTurnos";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { PLATAFORMAS_LIST } from "@/lib/plataforma";

const FEEDBACK: Record<string, string> = {
  agregado:    "Usuario agregado a la cola.",
  activo:      "Usuario marcado como activo.",
  desactivado: "Director desactivado y devuelto a la cola.",
  quitado:     "Turno quitado de la cola.",
  prueba:      "Notificación de prueba enviada.",
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

  // Admin ve TODOS los activos — puede haber uno por plataforma simultáneamente.
  const turnosActivos = await db
    .select({
      id_turno:          cronograma.id_turno,
      nombre_usuario:    usuarios.nombre,
      foto:              usuarios.foto,
      nombre_plataforma: plataformas.nombre,
    })
    .from(cronograma)
    .innerJoin(usuarios,    eq(cronograma.id_usuario,    usuarios.id_usuario))
    .innerJoin(plataformas, eq(cronograma.id_plataforma, plataformas.id_plataforma))
    .where(eq(cronograma.estado_turno, "ACTIVO"));

  // Cola separada por plataforma — el drag-and-drop no mezcla plataformas.
  const colasPromises = PLATAFORMAS_LIST.map((pla) =>
    db
      .select({
        id_turno:       cronograma.id_turno,
        nombre_usuario: usuarios.nombre,
        orden:          cronograma.orden,
        foto:           usuarios.foto,
      })
      .from(cronograma)
      .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
      .where(and(
        eq(cronograma.estado_turno, "EN_ESPERA"),
        eq(cronograma.id_plataforma, pla.id),
      ))
      .orderBy(asc(cronograma.orden))
  );

  const [colaJoven, colaGeneral] = await Promise.all(colasPromises);

  const colas = [
    { plataforma: PLATAFORMAS_LIST[0], items: colaJoven   },
    { plataforma: PLATAFORMAS_LIST[1], items: colaGeneral },
  ];

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

      {/* ── Layout 2-col en desktop ───────────────────────────────────── */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">

        {/* Col izquierda: activos + colas */}
        <div className="flex flex-col gap-6">

          {/* En Servicio Ahora */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-mid">En Servicio Ahora</h2>
            {turnosActivos.length === 0 ? (
              <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-lo">
                Nadie está activo en este momento.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {turnosActivos.map((t) => (
                  <div key={t.id_turno} className="flex items-center gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] px-5 py-4">
                    <Avatar foto={t.foto} nombre={t.nombre_usuario} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-violet-600">
                        {t.nombre_plataforma}
                      </p>
                      <p className="truncate text-base font-bold text-hi">{t.nombre_usuario}</p>
                    </div>
                    <form action={desactivarActivo}>
                      <input type="hidden" name="id_turno" value={t.id_turno} />
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
                ))}
              </div>
            )}
          </section>

          {/* Colas por plataforma */}
          {colas.map(({ plataforma, items }) => (
            <section key={plataforma.id} className="space-y-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-mid">
                  Cola — {plataforma.nombre}
                </h2>
                <p className="mt-0.5 text-[11px] text-lo">Arrastrá para reordenar quién sigue.</p>
              </div>
              <ColaTurnos
                turnos={items}
                onReordenar={reordenarCola}
                onActivar={marcarActivo}
                onQuitar={quitarTurno}
              />
            </section>
          ))}

        </div>

        {/* Col derecha: formulario agregar + test notificaciones */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-8">

          {/* Agregar a la cola */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-mid">
              Agregar a la cola
            </p>
            <form action={agregarACola} className="flex flex-col gap-3">
              <div className="flex gap-2">
                {PLATAFORMAS_LIST.map((pla, i) => (
                  <label key={pla.id} className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-mark bg-input px-4 py-3 text-sm has-[:checked]:border-violet-500 has-[:checked]:bg-violet-500/10 has-[:checked]:text-violet-600">
                    <input
                      type="radio"
                      name="id_plataforma"
                      value={pla.id}
                      defaultChecked={i === 0}
                      className="accent-violet-600"
                    />
                    {pla.nombre}
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
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
              </div>
            </form>
          </div>

          {/* Test de notificaciones */}
          <section className="rounded-2xl border border-line bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell size={14} className="text-violet-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-mid">
                Probar notificaciones
              </p>
            </div>
            <p className="mb-4 text-[11px] text-lo">
              Enviá una notificación de prueba a cualquier usuario para verificar que le llegue al dispositivo.
            </p>
            <form action={probarNotificacion} className="flex gap-3">
              <select
                name="id_usuario"
                required
                className="flex-1 rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
              >
                {listaUsuarios.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" className="shrink-0" icon={<Bell size={13} />}>
                Probar
              </Button>
            </form>
          </section>

        </div>
      </div>

    </main>
  );
}
