import Link from "next/link";
import { fotoUrl } from "@/lib/foto";
import { redirect } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { db } from "@/db";
import { cronograma, usuarios, plataformas } from "@/db/schema";
import { auth } from "@/auth";
import { and, eq, asc } from "drizzle-orm";
import { agregarACola, marcarActivo, desactivarActivo, quitarTurno, reordenarCola } from "@/app/actions/turnos";
import { probarNotificacion } from "@/app/actions/notificaciones";
import { ColaTurnos } from "@/components/ColaTurnos";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Avatar } from "@/components/Avatar";
import { cls, AvisoMigracion } from "@/components/zarza/ui";
import { IconoMarca } from "@/components/zarza/IconoMarca";
import { GestionSonido, SemanasPlanificadas } from "@/components/zarza/turnos/GestionSonido";
import { armarSemanas, getFilasSonido, getSemanasPlanificadas, getSonidistas } from "@/lib/sonido";
import { PLATAFORMAS_LIST, nombrePlataforma } from "@/lib/plataforma";
import { PlataformaSwitcher } from "@/components/PlataformaSwitcher";
import { BotonConfirmado } from "@/components/zarza/Confirmacion";
import { SelectorPersona } from "@/components/zarza/SelectorPersona";
import { getPlataformaEfectivaId } from "@/lib/get-plataforma-activa";

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

  // Plataforma elegida en las pestañas (General / Remanentes): sale de la
  // cookie, así que se resuelve sin esperar a la base.
  const plaCookie = await getPlataformaEfectivaId(session.user.id_usuario);
  const plaSel = PLATAFORMAS_LIST.find((p) => p.id === plaCookie) ?? PLATAFORMAS_LIST[1];

  // Todo en paralelo: antes eran 6 idas y vueltas a la base, una tras otra.
  const [listaUsuarios, turnosActivosPorPla, colaSelItems, semanasPlan, filasSonido, sonidistasPla] = await Promise.all([
    db
      .select({ id_usuario: usuarios.id_usuario, nombre: usuarios.nombre })
      .from(usuarios)
      .orderBy(asc(usuarios.nombre)),
    // Admin ve TODOS los activos — puede haber uno por plataforma simultáneamente.
    db
      .select({
        id_turno:          cronograma.id_turno,
        id_plataforma:     cronograma.id_plataforma,
        nombre_usuario:    usuarios.nombre,
        foto:              fotoUrl(),
        nombre_plataforma: plataformas.nombre,
      })
      .from(cronograma)
      .innerJoin(usuarios,    eq(cronograma.id_usuario,    usuarios.id_usuario))
      .innerJoin(plataformas, eq(cronograma.id_plataforma, plataformas.id_plataforma))
      .where(eq(cronograma.estado_turno, "ACTIVO")),
    // Cola de la plataforma elegida (el drag-and-drop no mezcla plataformas).
    db
      .select({
        id_turno:       cronograma.id_turno,
        nombre_usuario: usuarios.nombre,
        orden:          cronograma.orden,
        foto:           fotoUrl(),
      })
      .from(cronograma)
      .innerJoin(usuarios, eq(cronograma.id_usuario, usuarios.id_usuario))
      .where(and(
        eq(cronograma.estado_turno, "EN_ESPERA"),
        eq(cronograma.id_plataforma, plaSel.id),
      ))
      .orderBy(asc(cronograma.orden)),
    getSemanasPlanificadas(plaSel.id),
    getFilasSonido(plaSel.id),
    getSonidistas(plaSel.id),
  ]);

  const colaSel = { plataforma: plaSel, items: colaSelItems };
  const activoSel = turnosActivosPorPla.find((t) => t.id_plataforma === plaSel.id) ?? null;
  const sonido = { semanas: armarSemanas(filasSonido.filas, semanasPlan + 1), faltaMigracion: filasSonido.faltaMigracion };
  const plaNombre = nombrePlataforma(plaSel.nombre);

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-6 md:px-0 md:pt-2">
      <Link href="/turnos" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-hi transition-opacity hover:opacity-75">
        <ArrowLeft size={15} aria-hidden /> Ver turnos
      </Link>

      <div>
        <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-hi">Gestión de turnos</h1>
        <p className="mt-1 text-sm text-lo">Administrá la rotación de ministros en servicio.</p>
      </div>

      <PlataformaSwitcher
        plataformas={PLATAFORMAS_LIST.map((p) => ({ id: p.id, nombre: p.nombre }))}
        activaId={plaSel.id}
      />

      <ErrorBanner message={errorMsg} />
      {mensaje && (
        <div role="status" className="rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-800 dark:text-green-400">{mensaje}</div>
      )}
      {sonido.faltaMigracion && <AvisoMigracion visible />}

      {/* Se vuelve a montar (y entra animado) al cambiar de plataforma. */}
      <div key={plaSel.id} className="vista-plataforma grid items-start gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          {/* ── Agregar a los turnos ───────────────────────────────────── */}
          <section className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-5 shadow-card dark:shadow-none">
            <p className="text-sm font-semibold text-hi">Agregar a los turnos de {plaNombre}</p>
            <form action={agregarACola} className="flex flex-col gap-2">
              <input type="hidden" name="id_plataforma" value={plaSel.id} />
              <div className={cls.etiqueta}>
                Ministro
                <div className="relative flex gap-2">
                  <SelectorPersona
                    name="id_usuario"
                    required
                    titulo="Elegir ministro"
                    vacio="Seleccionar ministro…"
                    permitirVacio={false}
                    opciones={listaUsuarios.map((u) => ({ id: u.id_usuario, nombre: u.nombre }))}
                    tono="arcilla"
                    className="flex-1"
                  />
                  <button type="submit" className={cls.btnLlama}>Agregar</button>
                </div>
              </div>
            </form>
          </section>

          {/* ── Dirección · en servicio ahora ──────────────────────────── */}
          <section aria-labelledby="g-activo" className="flex flex-col gap-3">
            <h2 id="g-activo" className={cls.seccion}>Dirección · en servicio ahora</h2>
            {activoSel ? (
              <div key={activoSel.id_turno} className="animate-desplegar relative flex items-center gap-4 overflow-hidden rounded-2xl border border-fuego-600/30 bg-[#fbe5d6] px-5 py-4 dark:bg-[#1f1614]">
                {/* Destello cuando cambia quién dirige */}
                <span aria-hidden className="animate-destello pointer-events-none absolute inset-0 bg-fuego-500/25" />
                <span className="animate-pop relative flex"><Avatar foto={activoSel.foto} nombre={activoSel.nombre_usuario} size={44} /></span>
                <div className="relative min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-fuego-600 dark:text-[#df8067]">{plaNombre}</p>
                  <p className="truncate text-[17px] font-bold text-hi">{activoSel.nombre_usuario}</p>
                </div>
                <form action={desactivarActivo} className="relative">
                  <input type="hidden" name="id_turno" value={activoSel.id_turno} />
                  <BotonConfirmado
                    confirmacion={{
                      titulo: "¿Sacar de servicio?",
                      mensaje: `${activoSel.nombre_usuario} deja de dirigir ahora y vuelve a la cola de ${plaNombre}.`,
                      confirmar: "Desactivar",
                      tono: "llama",
                      icono: "microfono",
                    }}
                    title="Sacar de servicio y devolver a la cola"
                    className={`${cls.btnSec} relative min-h-[40px] text-[13px]`}
                  >
                    <X size={14} aria-hidden /> Desactivar
                  </BotonConfirmado>
                </form>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-mark px-5 py-4 text-sm text-lo">Nadie está dirigiendo en {plaNombre} ahora.</p>
            )}
          </section>

          <SemanasPlanificadas id_plataforma={plaSel.id} semanas={semanasPlan} />

          {/* ── Dirección: cola ────────────────────────────────────────── */}
          <section aria-labelledby="g-cola" className="flex flex-col gap-3">
            <div>
              <h2 id="g-cola" className={cls.seccion}>Dirección — {plaNombre}</h2>
              <p className="mt-1 text-xs text-lo">Arrastrá para cambiar quién dirige cada semana.</p>
            </div>
            {colaSel.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-mark px-5 py-4 text-sm text-lo">No hay próximos turnos. Agregá ministros arriba.</p>
            ) : (
              <ColaTurnos turnos={colaSel.items} onReordenar={reordenarCola} onActivar={marcarActivo} onQuitar={quitarTurno} />
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {!sonido.faltaMigracion && (
            <GestionSonido
              id_plataforma={plaSel.id}
              plataformaNombre={plaNombre}
              semanas={sonido.semanas}
              sonidistas={sonidistasPla.map((s) => ({ id: s.id, nombre: s.nombre }))}
              usuarios={listaUsuarios.map((u) => ({ id: u.id_usuario, nombre: u.nombre }))}
            />
          )}

          {/* ── Probar notificaciones ──────────────────────────────────── */}
          <section className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-5">
            <div className="flex items-center gap-2.5">
              <IconoMarca nombre="campana" size={18} />
              <p className="text-sm font-semibold text-hi">Probar notificaciones</p>
            </div>
            <p className="text-xs text-lo">Enviá una notificación de prueba a cualquier usuario para verificar que le llegue al dispositivo.</p>
            <form action={probarNotificacion} className="flex gap-2">
              <SelectorPersona
                name="id_usuario"
                required
                titulo="Probar notificaciones a…"
                vacio="Elegir persona…"
                permitirVacio={false}
                opciones={listaUsuarios.map((u) => ({ id: u.id_usuario, nombre: u.nombre }))}
                tono="arcilla"
                className="flex-1"
              />
              <button type="submit" className={cls.btnSec}>Probar</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
