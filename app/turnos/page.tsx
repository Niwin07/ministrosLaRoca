import { redirect } from "next/navigation";
import { db } from "@/db";
import { cronograma, usuarios } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { Mic2, Clock } from "lucide-react";

export default async function TurnosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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

  const hayDatos = !!turnoActivo || cola.length > 0;

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      <h1 className="text-2xl font-bold tracking-tight text-white">
        Turnos
      </h1>

      {!hayDatos ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-zinc-500">La cola de turnos está vacía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* En Servicio */}
          {turnoActivo && (
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                En Servicio
              </p>
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
            </section>
          )}

          {/* Cola */}
          {cola.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Cola de Espera
              </p>
              <div className="flex flex-col gap-2">
                {cola.map((t, idx) => (
                  <div
                    key={t.id_turno}
                    className="flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {t.nombre_usuario}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">En espera</p>
                    </div>
                    <Clock size={15} className="shrink-0 text-zinc-700" />
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
