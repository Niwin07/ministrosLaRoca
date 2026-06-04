import { redirect } from "next/navigation";
import { db } from "@/db";
import { cronograma, usuarios } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { Mic2, Clock } from "lucide-react";
import { Avatar } from "@/components/Avatar";

export default async function TurnosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [turnoActivo] = await db
    .select({
      id_turno:       cronograma.id_turno,
      nombre_usuario: usuarios.nombre,
      foto:           usuarios.foto,
    })
    .from(cronograma)
    .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
    .where(eq(cronograma.estado_turno, "ACTIVO"))
    .limit(1);

  const cola = await db
    .select({
      id_turno:       cronograma.id_turno,
      nombre_usuario: usuarios.nombre,
      foto:           usuarios.foto,
    })
    .from(cronograma)
    .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
    .where(eq(cronograma.estado_turno, "EN_ESPERA"))
    .orderBy(asc(cronograma.orden));

  const hayDatos = !!turnoActivo || cola.length > 0;

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      <h1 className="text-2xl font-bold tracking-tight text-hi">
        Turnos
      </h1>

      {!hayDatos ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-lo">La cola de turnos está vacía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* En Servicio */}
          {turnoActivo && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Mic2 size={13} className="shrink-0 text-violet-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-mid">
                  En Servicio
                </p>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] px-5 py-4 shadow-card dark:shadow-none">
                <Avatar foto={turnoActivo.foto} nombre={turnoActivo.nombre_usuario} size={40} />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-violet-600">
                    Activo
                  </p>
                  <p className="text-base font-bold text-hi">
                    {turnoActivo.nombre_usuario}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Cola */}
          {cola.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={13} className="shrink-0 text-violet-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-mid">
                  Cola de Espera
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {cola.map((t, idx) => (
                  <div
                    key={t.id_turno}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-4 shadow-card dark:shadow-none"
                  >
                    <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-gone">
                      {idx + 1}
                    </span>
                    <Avatar foto={t.foto} nombre={t.nombre_usuario} size={36} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-hi">
                        {t.nombre_usuario}
                      </p>
                      <p className="mt-0.5 text-xs text-lo">En espera</p>
                    </div>
                    <Clock size={15} className="shrink-0 text-gone" />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

    </main>
  );
}
