import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Music2, Plus, Tv2, Mic2 } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { cronograma, playlists, lista_canciones, canciones, usuarios } from "@/db/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { HeroCard } from "@/components/HeroCard";
import { Avatar } from "@/components/Avatar";
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

  const [esMiTurno, listaActiva, misListas, miFoto] = await Promise.all([

    db
      .select({ id_turno: cronograma.id_turno })
      .from(cronograma)
      .where(and(
        eq(cronograma.id_usuario, id_usuario),
        eq(cronograma.estado_turno, "ACTIVO"),
      ))
      .limit(1)
      .then((r) => !!r[0]),

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

    db
      .select({ foto: usuarios.foto })
      .from(usuarios)
      .where(eq(usuarios.id_usuario, id_usuario))
      .limit(1)
      .then((r) => r[0]?.foto ?? null),
  ]);

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
    <div className="flex flex-col gap-7 px-4 pt-7 pb-4">

      {/* ── GREETING ──────────────────────────────────────────────── */}
      <div className="pb-1 animate-fade-in-down">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Portal de Alabanza</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-hi">
          Hola, {primerNombre}
        </h1>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <HeroCard listaActiva={listaActiva} primerNombre={primerNombre} />

      {/* ── ESTA SEMANA ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 animate-fade-in-up [animation-delay:120ms]">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-mid">
          Esta semana
        </h2>

        {/* Turno propio */}
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-card dark:shadow-none ${
          esMiTurno
            ? "border-violet-500/30 bg-violet-500/[0.08]"
            : "border-line bg-card"
        }`}>
          {esMiTurno ? (
            <Avatar foto={miFoto} nombre={session.user.name ?? ""} size={32} />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-input">
              <Mic2 size={15} className="text-lo" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${esMiTurno ? "text-violet-600" : "text-mid"}`}>
              {esMiTurno ? "Tu turno está activo" : "Esta semana descansás"}
            </p>
            <p className="text-[11px] text-lo">
              {esMiTurno
                ? "Sos el ministro en servicio esta semana."
                : "No sos el ministro principal esta semana."}
            </p>
          </div>
        </div>

        {/* Canciones del ensayo activo */}
        {cancionesActivas.length > 0 && listaActiva && (
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card dark:shadow-none">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-hi">{listaActiva.nombre}</p>
                <p className="text-[11px] text-lo">
                  {ESTADO_LABEL[listaActiva.estado ?? ""] ?? listaActiva.estado}
                  {" · "}{cancionesActivas.length} canciones
                </p>
              </div>
              <Link
                href={`/escenario/mazo/${listaActiva.id_playlist}`}
                className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-600 transition-colors hover:bg-violet-500/20"
              >
                <Tv2 size={11} />
                Escenario
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {cancionesActivas.map((c) => (
                <li key={c.id_lista_cancion} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 shrink-0 text-right text-[11px] font-medium tabular-nums text-gone">
                    {String(c.orden).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-hi">{c.nombre}</p>
                    <p className="text-[11px] text-lo">{c.artista}</p>
                  </div>
                  {c.nota && (
                    <span className="shrink-0 text-sm font-semibold text-violet-600">{c.nota}</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3">
              <Link
                href={`/playlists/${listaActiva.id_playlist}`}
                className="flex items-center gap-1 text-[11px] text-violet-600/70 transition-colors hover:text-violet-600"
              >
                Ver letras y acordes <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        )}

        {cancionesActivas.length === 0 && !listaActiva && (
          <p className="rounded-2xl border border-line bg-card px-4 py-5 text-sm text-lo">
            No hay lista de ensayo activa esta semana.
          </p>
        )}
      </section>

      {/* ── MIS LISTAS ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 animate-fade-in-up [animation-delay:240ms]">

        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-mid">
            Mis listas
          </h2>
          <Link
            href="/playlists"
            className="flex items-center gap-0.5 text-[11px] text-violet-600/70 transition-colors hover:text-violet-600"
          >
            Ver todas <ChevronRight size={11} />
          </Link>
        </div>

        {misListas.length === 0 ? (
          <Link href="/playlists">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-mark py-8 transition-all duration-200 hover:border-line hover:bg-card">
              <Plus size={15} className="text-lo" />
              <span className="text-sm text-lo">Crear primera lista</span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col gap-2">
            {misListas.map((lista) => (
              <Link key={lista.id_playlist} href={`/playlists/${lista.id_playlist}`}>
                <div className="flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-mark hover:bg-input active:scale-[0.98] dark:shadow-none">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-input">
                    <Music2 size={15} className="text-mid" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-hi">{lista.nombre}</p>
                    <p className="mt-0.5 text-[11px] text-lo">
                      {lista.tipo === "EVENTO" && lista.fecha_programada
                        ? formatFecha(lista.fecha_programada)
                        : lista.tipo}{" "}
                      · {Number(lista.total)} temas
                    </p>
                  </div>
                  {lista.estado && (
                    <span className="shrink-0 text-[10px] font-medium text-gone">
                      {ESTADO_LABEL[lista.estado] ?? lista.estado}
                    </span>
                  )}
                  <ChevronRight size={13} className="shrink-0 text-gone" />
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>
    </div>
  );
}
