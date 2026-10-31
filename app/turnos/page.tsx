import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cronograma, usuarios } from "@/db/schema";
import { auth } from "@/auth";
import { Avatar } from "@/components/Avatar";
import { IconoMarca } from "@/components/zarza/IconoMarca";
import { Inicial } from "@/components/zarza/ui";
import { getPlataformaEfectivaId } from "@/lib/get-plataforma-activa";
import { getSemanasPlanificadas, getTurnosSonido } from "@/lib/sonido";

const etiqueta = (i: number) => (i === 0 ? "Próxima semana" : `En ${i + 1} semanas`);

export default async function TurnosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Los turnos son por plataforma: siempre mostramos la que el usuario tiene elegida.
  const plaId = await getPlataformaEfectivaId(session.user.id_usuario);
  const semanas = await getSemanasPlanificadas(plaId);

  const [[activo], cola, sonido] = await Promise.all([
    db
      .select({ nombre: usuarios.nombre, foto: usuarios.foto, id: usuarios.id_usuario })
      .from(cronograma)
      .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
      .where(and(eq(cronograma.estado_turno, "ACTIVO"), eq(cronograma.id_plataforma, plaId)))
      .limit(1),
    db
      .select({ id_turno: cronograma.id_turno, nombre: usuarios.nombre, foto: usuarios.foto, id: usuarios.id_usuario })
      .from(cronograma)
      .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
      .where(and(eq(cronograma.estado_turno, "EN_ESPERA"), eq(cronograma.id_plataforma, plaId)))
      .orderBy(asc(cronograma.orden))
      .limit(semanas),
    getTurnosSonido(plaId, semanas + 1),
  ]);

  const yo = session.user.id_usuario;
  const ahoraSonido = sonido.semanas[0];
  const proximoSonido = sonido.semanas.slice(1);

  const cabecera = (icono: "microfono" | "auriculares", id: string, titulo: string, sub: string) => (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center"><IconoMarca nombre={icono} size={34} /></span>
      <div>
        <h2 id={id} className="font-display text-[17px] font-bold leading-tight tracking-[-0.02em] text-hi">{titulo}</h2>
        <p className="text-xs leading-snug text-lo">{sub}</p>
      </div>
    </div>
  );

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-7 md:px-0 md:pt-2">
      <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-hi">Turnos</h1>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* ── Dirección ─────────────────────────────────────────────── */}
        <section aria-labelledby="t-direccion" className="flex min-w-0 flex-col gap-3">
          {cabecera("microfono", "t-direccion", "Dirección", "Quién dirige el servicio y arma la lista")}

          <div className="flex items-center gap-4 rounded-2xl border border-fuego-600/30 bg-[#fbe5d6] px-5 py-4 shadow-card dark:bg-[#1f1614] dark:shadow-none">
            {activo ? <Avatar foto={activo.foto} nombre={activo.nombre} size={44} /> : <Inicial nombre="?" size={44} />}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-fuego-600 dark:text-[#df8067]">Esta semana</p>
              <p className="mt-0.5 truncate text-[17px] font-bold text-hi">
                {activo?.nombre ?? "Sin asignar"}
                {activo?.id === yo && <span className="ml-2 align-middle text-xs font-semibold text-fuego-600">· Sos vos</span>}
              </p>
            </div>
          </div>

          <p className="mt-1 text-xs font-semibold text-mid">Próximas semanas</p>
          {cola.length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-mark px-4 py-4 text-[13px] text-lo">Todavía no hay próximos turnos cargados.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {cola.map((c, i) => (
                <li key={c.id_turno} className={`flex items-center gap-3 rounded-[14px] border bg-card px-3.5 py-3 ${c.id === yo ? "border-fuego-600/40" : "border-line"}`}>
                  <Avatar foto={c.foto} nombre={c.nombre} size={34} />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-hi">
                    {c.nombre}{c.id === yo && <span className="font-medium text-fuego-600"> · vos</span>}
                  </p>
                  <span className="shrink-0 text-xs text-lo">{etiqueta(i)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── Sonido ────────────────────────────────────────────────── */}
        <section aria-labelledby="t-sonido" className="flex min-w-0 flex-col gap-3">
          {cabecera("auriculares", "t-sonido", "Sonido", "Sonidista y auxiliar")}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[rgba(122,42,38,0.3)] bg-[#fbede6] p-3.5 dark:bg-[#1e1513]">
              <Inicial nombre={ahoraSonido?.principal?.nombre ?? "S"} size={36} tono="vino" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a2a26] dark:text-[#d69271]">Sonidista</p>
                <p className="mt-0.5 truncate text-sm font-bold text-hi">{ahoraSonido?.principal?.nombre ?? "Sin asignar"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-card p-3.5">
              <Inicial nombre={ahoraSonido?.auxiliar?.nombre ?? "A"} size={36} tono="arcilla" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a2a26] dark:text-[#d69271]">Auxiliar</p>
                <p className="mt-0.5 truncate text-sm font-bold text-hi">{ahoraSonido?.auxiliar?.nombre ?? "Sin asignar"}</p>
              </div>
            </div>
          </div>

          <p className="mt-1 text-xs font-semibold text-mid">Próximas semanas</p>
          <ol className="flex flex-col gap-2">
            {proximoSonido.map((s, i) => (
              <li key={s.semana} className="flex items-center gap-3 rounded-[14px] border border-line bg-card px-3.5 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-[13px] text-hi">
                  <p className="truncate"><strong className="font-bold text-[#7a2a26] dark:text-[#d69271]">Sonidista:</strong> {s.principal?.nombre ?? "Sin asignar"}</p>
                  <p className="truncate"><strong className="font-bold text-[#7a2a26] dark:text-[#d69271]">Auxiliar:</strong> {s.auxiliar?.nombre ?? "Sin asignar"}</p>
                </div>
                <span className="shrink-0 text-xs text-lo">{etiqueta(i)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
