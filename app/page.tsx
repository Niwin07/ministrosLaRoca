import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Music2, Plus, Tv2, Mic2 } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { cronograma, playlists, lista_canciones, canciones } from "@/db/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { HeroCard } from "@/components/HeroCard";
import { ESTADO_LABEL } from "@/lib/estados";

function formatFecha(d: Date | null): string {
  if (!d) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric", month: "short",
  }).format(d);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id_usuario } = session.user;
  const primerNombre = (session.user.name ?? "").split(" ")[0];

  const [esMiTurno, listaActiva, misListas] = await Promise.all([

    // ¿El usuario actual es el ministro activo esta semana?
    db
      .select({ id_turno: cronograma.id_turno })
      .from(cronograma)
      .where(and(
        eq(cronograma.id_usuario, id_usuario),
        eq(cronograma.estado_turno, "ACTIVO"),
      ))
      .limit(1)
      .then((r) => !!r[0]),

    // Lista activa del equipo (ENSAYO o DEFINITIVA)
    db
      .select({
        id_playlist: playlists.id_playlist,
        nombre:      playlists.nombre,
        estado:      playlists.estado,
        total:       sql<number>`COUNT(${lista_canciones.id_lista_cancion})`,
      })
      .from(playlists)
      .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
      .where(
        and(
          eq(playlists.tipo, "EVENTO"),
          or(eq(playlists.estado, "ENSAYO"), eq(playlists.estado, "DEFINITIVA"))
        )
      )
      .groupBy(playlists.id_playlist, playlists.nombre, playlists.estado)
      .orderBy(desc(playlists.actualizadoEn))
      .limit(1)
      .then((r) => r[0] ?? null),

    // Listas recientes del usuario
    db
      .select({
        id_playlist:      playlists.id_playlist,
        nombre:           playlists.nombre,
        tipo:             playlists.tipo,
        estado:           playlists.estado,
        fecha_programada: playlists.fecha_programada,
        total:            sql<number>`COUNT(${lista_canciones.id_lista_cancion})`,
      })
      .from(playlists)
      .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
      .where(eq(playlists.id_usuario, id_usuario))
      .groupBy(playlists.id_playlist, playlists.nombre, playlists.tipo, playlists.estado, playlists.fecha_programada)
      .orderBy(desc(playlists.id_playlist))
      .limit(4),
  ]);

  // Canciones de la lista activa (query secuencial: depende de listaActiva)
  const cancionesActivas = listaActiva
    ? await db
        .select({
          id_lista_cancion: lista_canciones.id_lista_cancion,
          orden:            lista_canciones.orden,
          nota:             lista_canciones.nota,
          nombre:           canciones.nombre,
          artista:          canciones.artista,
        })
        .from(lista_canciones)
        .innerJoin(canciones, eq(canciones.id_cancion, lista_canciones.id_cancion))
        .where(eq(lista_canciones.id_playlist, listaActiva.id_playlist))
        .orderBy(lista_canciones.orden)
    : [];

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <HeroCard
        listaActiva={listaActiva}
        primerNombre={primerNombre}
      />

      {/* ── ESTA SEMANA ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-content-secondary">
          Esta semana
        </h2>

        {/* Turno propio */}
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
          esMiTurno
            ? "border-lime-400/25 bg-lime-400/8"
            : "border-glass-base bg-glass-subtle"
        }`}>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            esMiTurno ? "bg-lime-400/20" : "bg-glass-elevated"
          }`}>
            <Mic2 size={15} className={esMiTurno ? "text-lime-400" : "text-content-muted"} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${esMiTurno ? "text-lime-400" : "text-content-secondary"}`}>
              {esMiTurno ? "Tu turno está activo" : "Esta semana descansás"}
            </p>
            <p className="text-[11px] text-content-muted">
              {esMiTurno
                ? "Sos el ministro en servicio esta semana."
                : "No sos el ministro principal esta semana."}
            </p>
          </div>
        </div>

        {/* Canciones del ensayo activo */}
        {cancionesActivas.length > 0 && listaActiva && (
          <div className="rounded-2xl border border-glass-base bg-glass-subtle overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-glass-base">
              <div>
                <p className="text-sm font-semibold text-content-primary">{listaActiva.nombre}</p>
                <p className="text-[11px] text-content-muted">
                  {ESTADO_LABEL[listaActiva.estado ?? ""] ?? listaActiva.estado}
                  {" · "}{cancionesActivas.length} canciones
                </p>
              </div>
              <Link
                href={`/escenario/mazo/${listaActiva.id_playlist}`}
                className="flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-[11px] font-semibold text-lime-400 transition-colors hover:bg-lime-400/20"
              >
                <Tv2 size={11} />
                Escenario
              </Link>
            </div>
            <ul className="divide-y divide-glass-base">
              {cancionesActivas.map((c) => (
                <li key={c.id_lista_cancion} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-5 shrink-0 text-right text-[11px] font-bold tabular-nums text-content-muted">
                    {String(c.orden).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-content-primary">{c.nombre}</p>
                    <p className="text-[11px] text-content-muted">{c.artista}</p>
                  </div>
                  {c.nota && (
                    <span className="shrink-0 text-sm font-bold text-lime-400">{c.nota}</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="px-4 py-2.5 border-t border-glass-base">
              <Link
                href={`/playlists/${listaActiva.id_playlist}`}
                className="flex items-center gap-1 text-[11px] text-purple-400/70 transition-colors hover:text-purple-300"
              >
                Ver letras y acordes <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        )}

        {cancionesActivas.length === 0 && !listaActiva && (
          <p className="rounded-2xl border border-glass-base bg-glass-subtle px-4 py-4 text-sm text-content-muted">
            No hay lista de ensayo activa esta semana.
          </p>
        )}
      </section>

      {/* ── MIS LISTAS ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">

        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-content-secondary">
            Mis listas
          </h2>
          <Link
            href="/playlists"
            className="flex items-center gap-0.5 text-[11px] text-purple-400/60 transition-colors hover:text-purple-300"
          >
            Ver todas <ChevronRight size={11} />
          </Link>
        </div>

        {misListas.length === 0 ? (
          <Link href="/playlists">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-glass-elevated py-8 transition-all duration-300 hover:border-glass-highlight hover:bg-glass-subtle">
              <Plus size={15} className="text-content-secondary" />
              <span className="text-sm text-content-secondary">Crear primera lista</span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col gap-1.5">
            {misListas.map((lista) => (
              <Link key={lista.id_playlist} href={`/playlists/${lista.id_playlist}`}>
                <div className="flex items-center gap-3 rounded-2xl border border-glass-base bg-glass-subtle px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:bg-glass-elevated active:scale-[0.98]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                    <Music2 size={15} className="text-purple-300/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-primary">{lista.nombre}</p>
                    <p className="mt-0.5 text-[11px] text-content-secondary">
                      {lista.tipo === "EVENTO" && lista.fecha_programada
                        ? formatFecha(lista.fecha_programada)
                        : lista.tipo}{" "}
                      · {Number(lista.total)} temas
                    </p>
                  </div>
                  {lista.estado && (
                    <span className="shrink-0 text-[10px] font-semibold text-content-muted">
                      {ESTADO_LABEL[lista.estado] ?? lista.estado}
                    </span>
                  )}
                  <ChevronRight size={13} className="shrink-0 text-content-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>
    </div>
  );
}
