import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { ChevronRight, Plus, ListMusic, Mic2, Archive, Music2 } from "lucide-react";
import { ESTADO_LABEL } from "@/lib/estados";
import { db } from "@/db";
import { canciones, cronograma, lista_canciones, playlists, usuarios } from "@/db/schema";
import { auth } from "@/auth";
import { crearPlaylist, instanciarPreset, clonarMazo } from "@/app/actions/playlists";
import { HistorialListas } from "@/components/HistorialListas";
import { ErrorBanner } from "@/components/ErrorBanner";

function fmtFecha(d: Date | null): string {
  if (!d) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export default async function PlaylistsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id_usuario } = session.user;
  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

  // El director de la semana = único turno ACTIVO en el cronograma.
  const [directorActivo] = await db
    .select({ id_usuario: cronograma.id_usuario })
    .from(cronograma)
    .where(eq(cronograma.estado_turno, "ACTIVO"))
    .limit(1);

  const [estaSemana, enPreparacion, plantillas, historial] = await Promise.all([
    // ESTA SEMANA — el set publicado del director activo (en ensayo o definitiva).
    directorActivo
      ? db
          .select({
            id_playlist:    playlists.id_playlist,
            nombre:         playlists.nombre,
            estado:         playlists.estado,
            nombre_usuario: usuarios.nombre,
          })
          .from(playlists)
          .innerJoin(usuarios, eq(playlists.id_usuario, usuarios.id_usuario))
          .where(
            and(
              eq(playlists.tipo, "EVENTO"),
              or(eq(playlists.estado, "ENSAYO"), eq(playlists.estado, "DEFINITIVA")),
              eq(playlists.id_usuario, directorActivo.id_usuario),
            ),
          )
          .orderBy(desc(playlists.actualizadoEn))
      : Promise.resolve([]),

    // EN PREPARACIÓN — servicios que estás armando vos.
    db
      .select({ id_playlist: playlists.id_playlist, nombre: playlists.nombre })
      .from(playlists)
      .where(
        and(
          eq(playlists.tipo, "EVENTO"),
          eq(playlists.estado, "PREPARACION"),
          eq(playlists.id_usuario, id_usuario),
        ),
      )
      .orderBy(desc(playlists.id_playlist)),

    // PLANTILLAS — moldes reutilizables del equipo.
    db
      .select({
        id_playlist:    playlists.id_playlist,
        nombre:         playlists.nombre,
        nombre_usuario: usuarios.nombre,
      })
      .from(playlists)
      .innerJoin(usuarios, eq(playlists.id_usuario, usuarios.id_usuario))
      .where(eq(playlists.tipo, "PRESET"))
      .orderBy(playlists.nombre),

    // HISTORIAL — servicios archivados, clonables. Con cantidad de temas y
    // fecha de archivado (actualizadoEn) para darle contexto a cada entrada.
    db
      .select({
        id_playlist:    playlists.id_playlist,
        nombre:         playlists.nombre,
        nombre_usuario: usuarios.nombre,
        actualizado_en: playlists.actualizadoEn,
        total:          sql<number>`COUNT(${lista_canciones.id_lista_cancion})`,
      })
      .from(playlists)
      .innerJoin(usuarios, eq(playlists.id_usuario, usuarios.id_usuario))
      .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
      .where(and(eq(playlists.tipo, "EVENTO"), eq(playlists.estado, "MAZO")))
      .groupBy(playlists.id_playlist, playlists.nombre, usuarios.nombre, playlists.actualizadoEn)
      .orderBy(desc(playlists.actualizadoEn)),
  ]);

  // Canciones de las listas archivadas (una sola query) para el preview inline.
  const historialIds = historial.map((h) => h.id_playlist);
  const historialCanciones = historialIds.length
    ? await db
        .select({
          id_playlist: lista_canciones.id_playlist,
          orden:       lista_canciones.orden,
          nota:        lista_canciones.nota,
          nombre:      canciones.nombre,
          artista:     canciones.artista,
        })
        .from(lista_canciones)
        .innerJoin(canciones, eq(canciones.id_cancion, lista_canciones.id_cancion))
        .where(inArray(lista_canciones.id_playlist, historialIds))
        .orderBy(lista_canciones.orden)
    : [];

  const historialData = historial.map((h) => ({
    id_playlist:    h.id_playlist,
    nombre:         h.nombre,
    nombre_usuario: h.nombre_usuario,
    fecha:          fmtFecha(h.actualizado_en),
    total:          Number(h.total),
    canciones: historialCanciones
      .filter((c) => c.id_playlist === h.id_playlist)
      .map((c) => ({ orden: c.orden, nota: c.nota, nombre: c.nombre, artista: c.artista })),
  }));

  async function handleInstanciarPreset(formData: FormData) {
    "use server";
    const id_preset = Number(formData.get("id_preset"));
    await instanciarPreset(id_preset);
  }

  // Clona una lista archivada. Si es propia → nuevo EVENTO en preparación;
  // si es de otro → plantilla (PRESET). Errores se muestran como banner.
  async function handleClonarMazo(formData: FormData) {
    "use server";
    let destino: string;
    try {
      const id = Number(formData.get("id_playlist"));
      const { nuevaPlaylistId } = await clonarMazo(id, id_usuario);
      destino = `/playlists/${nuevaPlaylistId}`;
    } catch (e) {
      destino = `/playlists?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo clonar la lista."
      )}`;
    }
    redirect(destino);
  }

  return (
    <div className="flex flex-col gap-8 px-4 pt-8 pb-6">

      {/* Encabezado */}
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold text-hi">Listas</h1>
        <p className="mt-1 text-sm text-lo">El servicio de la semana, lo que estás armando y tus plantillas.</p>
      </div>

      {/* Banner de error (p. ej. clonado fallido) */}
      <ErrorBanner message={errorMsg} />

      {/* ══ ESTA SEMANA ════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 animate-fade-in-up [animation-delay:80ms]">
        <div className="flex items-center gap-2">
          <Mic2 size={14} className="shrink-0 text-violet-500" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mid">Esta semana</h2>
        </div>
        <p className="-mt-1 text-[11px] text-lo">El set publicado del ministro de turno (en ensayo o definitiva).</p>

        {estaSemana.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card px-5 py-5 text-sm text-lo">
            {directorActivo
              ? "El ministro de turno todavía no publicó su lista."
              : "Nadie está dirigiendo esta semana."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {estaSemana.map((lista) => (
              <Link
                key={lista.id_playlist}
                href={`/playlists/${lista.id_playlist}`}
                className="flex items-center gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] px-5 py-5 shadow-card transition-all duration-200 hover:bg-violet-500/[0.12] active:scale-[0.98] dark:shadow-none"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600">
                  <Mic2 size={16} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-hi">{lista.nombre}</p>
                  <p className="mt-0.5 truncate text-xs text-lo">{lista.nombre_usuario}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    lista.estado === "DEFINITIVA"
                      ? "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-400"
                      : "border-yellow-200 bg-yellow-100 text-yellow-700 dark:border-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-400"
                  }`}
                >
                  {ESTADO_LABEL[lista.estado ?? ""] ?? lista.estado}
                </span>
                <ChevronRight size={15} className="shrink-0 text-gone" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══ EN PREPARACIÓN ═════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 animate-fade-in-up [animation-delay:160ms]">
        <div className="flex items-center gap-2">
          <Music2 size={13} className="shrink-0 text-lo" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mid">En preparación</h2>
        </div>
        <p className="-mt-1 text-[11px] text-lo">Servicios que estás armando. Editables hasta pasarlos a ensayo.</p>

        {enPreparacion.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card px-5 py-5 text-sm text-lo">
            No tenés servicios en preparación. Usá una plantilla de abajo para empezar uno.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {enPreparacion.map((lista) => (
              <Link
                key={lista.id_playlist}
                href={`/playlists/${lista.id_playlist}`}
                className="flex items-center gap-3 rounded-xl border-l-2 border-l-violet-500 bg-card px-4 py-3.5 transition-all duration-200 hover:bg-input active:scale-[0.98]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-hi">{lista.nombre}</p>
                  <p className="mt-0.5 text-[11px] text-violet-600/80">Seguí armándola</p>
                </div>
                <ChevronRight size={13} className="shrink-0 text-gone" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══ PLANTILLAS ═════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 animate-fade-in-up [animation-delay:240ms]">
        <div className="flex items-center gap-2">
          <ListMusic size={13} className="shrink-0 text-lo" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mid">Plantillas</h2>
        </div>
        <p className="-mt-1 text-[11px] text-lo">Moldes reutilizables. Tocá &ldquo;Usar&rdquo; para armar un servicio nuevo a partir de uno.</p>

        {plantillas.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card px-5 py-5 text-sm text-lo">
            No hay plantillas todavía. Creá la primera abajo.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {plantillas.map((lista) => (
              <div
                key={lista.id_playlist}
                className="flex items-center gap-3 rounded-xl border-l-2 border-l-line bg-card px-4 py-3.5 transition-all duration-200 hover:bg-input"
              >
                <Link
                  href={`/playlists/${lista.id_playlist}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-hi">{lista.nombre}</p>
                    <p className="mt-0.5 truncate text-[11px] text-lo">{lista.nombre_usuario}</p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={handleInstanciarPreset}>
                    <input type="hidden" name="id_preset" value={lista.id_playlist} />
                    <button
                      type="submit"
                      title="Armar un servicio a partir de esta plantilla"
                      className="rounded-lg border border-mark bg-input px-2.5 py-1 text-[10px] font-medium text-mid transition-all duration-200 hover:border-line hover:text-hi"
                    >
                      Usar
                    </button>
                  </form>
                  <ChevronRight size={13} className="text-gone" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Crear nueva plantilla — colapsable */}
        <details className="group mt-1">
          <summary className="flex cursor-pointer select-none list-none items-center [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-mark px-4 py-2.5 transition-all duration-200 hover:border-line group-open:border-violet-500/50">
              <Plus size={13} strokeWidth={2.5} className="text-lo group-open:text-violet-600" />
              <span className="text-sm font-medium text-lo group-open:text-violet-600">Nueva plantilla</span>
            </div>
          </summary>

          <div className="mt-3 rounded-2xl border border-line bg-card p-5 shadow-card dark:shadow-none">
            <form action={crearPlaylist} className="flex gap-2">
              <input
                name="nombre"
                type="text"
                placeholder="Nombre de la plantilla…"
                required
                className="min-w-0 flex-1 rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:scale-95"
              >
                <Plus size={15} strokeWidth={2.5} />
                Crear
              </button>
            </form>
          </div>
        </details>
      </section>

      {/* ══ HISTORIAL ══════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-3 animate-fade-in-up [animation-delay:320ms]">
        <div className="flex items-center gap-2">
          <Archive size={13} className="shrink-0 text-lo" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-mid">Historial</h2>
          {historialData.length > 0 && (
            <span className="rounded-full bg-input px-1.5 py-0.5 text-[10px] font-medium text-mid">
              {historialData.length}
            </span>
          )}
        </div>
        <p className="-mt-1 text-[11px] text-lo">Servicios finalizados. Mirá qué se tocó y reutilizalos como base para el próximo.</p>

        <HistorialListas listas={historialData} onClonar={handleClonarMazo} />
      </section>

    </div>
  );
}
