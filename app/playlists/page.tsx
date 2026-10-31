import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { ChevronRight, ListMusic, Archive } from "lucide-react";
import { ESTADO_LABEL } from "@/lib/estados";
import { db } from "@/db";
import { canciones, cronograma, lista_canciones, playlists, usuarios } from "@/db/schema";
import { auth } from "@/auth";
import { getPlataformaActivaId, getPlataformaEfectivaId } from "@/lib/get-plataforma-activa";
import { getMisPlataformas } from "@/lib/usuario-request-cache";
import { PLATAFORMAS_LIST } from "@/lib/plataforma";
import { crearPlaylist, crearServicio, instanciarPreset, clonarMazo, renombrarPlaylist, eliminarPlaylist } from "@/app/actions/playlists";
import { ListaAnimada } from "@/components/zarza/ListaAnimada";
import { NuevaListaPanel } from "@/components/zarza/servicios/NuevaListaPanel";
import { cls } from "@/components/zarza/ui";
import { HistorialListas } from "@/components/HistorialListas";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PlaylistRowItem } from "@/components/PlaylistRowItem";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/Badge";

function fmtFecha(d: Date | null): string {
  if (!d) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export default async function PlaylistsPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id_usuario, rol } = session.user;
  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

  const plaId = await getPlataformaActivaId(id_usuario, rol);

  // Plataformas donde el usuario puede crear contenido: para ADMINISTRADOR,
  // cualquiera; para el resto, solo las que le asignaron en usuario_plataforma.
  // Si tiene 2+, mostramos un selector explícito en "Nueva plantilla" — la
  // cookie del switcher no es confiable como única fuente para esto (ver
  // resolverPlataformaParaCrear en app/actions/playlists.ts).
  const plataformasParaCrear =
    rol === "ADMINISTRADOR"
      ? PLATAFORMAS_LIST.map((p) => ({ id: p.id, nombre: p.nombre }))
      : (await getMisPlataformas(id_usuario)).map((p) => ({ id: p.id_plataforma, nombre: p.nombre }));
  const plataformaParaCrearDefault = plaId ?? (await getPlataformaEfectivaId(id_usuario));

  // El director de la semana = único turno ACTIVO en el cronograma (filtrado por plataforma).
  const [directorActivo] = await db
    .select({ id_usuario: cronograma.id_usuario })
    .from(cronograma)
    .where(and(
      eq(cronograma.estado_turno, "ACTIVO"),
      ...(plaId ? [eq(cronograma.id_plataforma, plaId)] : []),
    ))
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
            foto:           usuarios.foto,
          })
          .from(playlists)
          .innerJoin(usuarios, eq(playlists.id_usuario, usuarios.id_usuario))
          .where(
            and(
              eq(playlists.tipo, "EVENTO"),
              or(eq(playlists.estado, "ENSAYO"), eq(playlists.estado, "DEFINITIVA")),
              eq(playlists.id_usuario, directorActivo.id_usuario),
              ...(plaId ? [eq(playlists.id_plataforma, plaId)] : []),
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
          ...(plaId ? [eq(playlists.id_plataforma, plaId)] : []),
        ),
      )
      .orderBy(desc(playlists.id_playlist)),

    // PLANTILLAS — moldes reutilizables PROPIOS.
    db
      .select({
        id_playlist: playlists.id_playlist,
        nombre:      playlists.nombre,
      })
      .from(playlists)
      .where(and(
        eq(playlists.tipo, "PRESET"),
        eq(playlists.id_usuario, id_usuario),
        ...(plaId ? [eq(playlists.id_plataforma, plaId)] : []),
      ))
      .orderBy(playlists.nombre),

    // HISTORIAL — servicios archivados, clonables.
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
      .where(and(
        eq(playlists.tipo, "EVENTO"),
        eq(playlists.estado, "MAZO"),
        ...(plaId ? [eq(playlists.id_plataforma, plaId)] : []),
      ))
      .groupBy(playlists.id_playlist, playlists.nombre, usuarios.nombre, playlists.actualizadoEn)
      .orderBy(desc(playlists.actualizadoEn))
      // Techo de seguridad: sin esto la query (y el HTML que arma) crecen sin
      // límite para siempre — cada servicio archivado se acumula acá. 100
      // archivados más recientes alcanza de sobra para el buscador de
      // HistorialListas; el resto del histórico sigue en la base, solo no
      // se lista en esta vista rápida.
      .limit(100),
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

  async function handleRenombrarPlantilla(formData: FormData) {
    "use server";
    try {
      const id     = Number(formData.get("id_playlist"));
      const nombre = (formData.get("nombre") as string | null) ?? "";
      await renombrarPlaylist(id, nombre);
    } catch (e) {
      redirect(`/playlists?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo renombrar la plantilla."
      )}`);
    }
    revalidatePath("/playlists");
  }

  async function handleEliminarLista(formData: FormData) {
    "use server";
    try {
      const id = Number(formData.get("id_playlist"));
      await eliminarPlaylist(id);
    } catch (e) {
      redirect(`/playlists?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo borrar la lista."
      )}`);
    }
    revalidatePath("/playlists");
  }

  // Clona una lista archivada. Si es propia → nuevo EVENTO en preparación;
  // si es de otro → plantilla (PRESET). Errores se muestran como banner.
  async function handleClonarMazo(formData: FormData) {
    "use server";
    let destino: string;
    try {
      const id = Number(formData.get("id_playlist"));
      const { nuevaPlaylistId } = await clonarMazo(id);
      destino = `/playlists/${nuevaPlaylistId}`;
    } catch (e) {
      destino = `/playlists?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo clonar la lista."
      )}`;
    }
    redirect(destino);
  }

  // ── Mis próximos servicios (rediseño Zarza) ─────────────────────────────────
  // Servicios propios en curso (preparación / ensayo / definitiva) y mi lugar
  // en la rotación, para rotular "Esta semana" / "En N semanas".
  const [misServicios, miTurno] = await Promise.all([
    db
      .select({
        id_playlist: playlists.id_playlist,
        nombre:      playlists.nombre,
        estado:      playlists.estado,
        total:       sql<number>`COUNT(${lista_canciones.id_lista_cancion})`,
      })
      .from(playlists)
      .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
      .where(and(
        eq(playlists.tipo, "EVENTO"),
        eq(playlists.id_usuario, id_usuario),
        inArray(playlists.estado, ["PREPARACION", "ENSAYO", "DEFINITIVA"]),
        ...(plaId ? [eq(playlists.id_plataforma, plaId)] : []),
      ))
      .groupBy(playlists.id_playlist, playlists.nombre, playlists.estado, playlists.actualizadoEn)
      .orderBy(desc(playlists.actualizadoEn)),
    (async () => {
      const filas = await db
        .select({ id_usuario: cronograma.id_usuario, estado: cronograma.estado_turno, orden: cronograma.orden })
        .from(cronograma)
        .where(and(
          inArray(cronograma.estado_turno, ["ACTIVO", "EN_ESPERA"]),
          ...(plaId ? [eq(cronograma.id_plataforma, plaId)] : []),
        ))
        .orderBy(cronograma.orden);
      if (filas.some((f) => f.estado === "ACTIVO" && f.id_usuario === id_usuario)) return 0;
      const cola = filas.filter((f) => f.estado === "EN_ESPERA");
      const i = cola.findIndex((f) => f.id_usuario === id_usuario);
      return i >= 0 ? i + 1 : null;
    })(),
  ]);

  const chipSemana = (n: number | null) =>
    n === 0 ? ["Esta", "semana"] : n === 1 ? ["Próxima", "semana"] : n ? [`En ${n}`, "semanas"] : ["Sin", "fecha"];
  const ETAPA_CHIP: Record<string, string> = {
    PREPARACION: "border-[#eadbc6] bg-[#f3e7d6] text-[#6e4c40] dark:border-[#4a3530] dark:bg-[#211815] dark:text-[#d6c2a8]",
    ENSAYO:      "border-[#f8c98a] bg-[#ffeccc] text-[#9a3c0a] dark:border-[#3c2e1b] dark:bg-[#251d11] dark:text-[#f8894f]",
    DEFINITIVA:  "border-[#f5b9a0] bg-[#fde4d8] text-[#94402a] dark:border-[#5c382a] dark:bg-[#1e1513] dark:text-[#d9846d]",
  };
  const sinListaParaMiTurno = miTurno !== null && misServicios.length === 0;

  async function handleCrearServicio(formData: FormData) {
    "use server";
    await crearServicio(formData);
  }

  return (
    <div className="flex flex-col gap-7 px-4 pb-8 pt-7 md:px-0 md:pt-2">

      {/* ── Encabezado + Armar lista nueva ────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-[1_1_260px]">
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-hi">Mis servicios</h1>
          <p className="mt-1.5 text-sm text-lo">Armá la lista de cada semana que te toca dirigir.</p>
        </div>
        <NuevaListaPanel
          abiertoInicial={false}
          plantillas={plantillas}
          anteriores={historialData.map((h) => ({ id_playlist: h.id_playlist, nombre: h.nombre, meta: `${h.nombre_usuario} · ${h.fecha}` }))}
          plataformas={plataformasParaCrear}
          plataformaDefault={plataformaParaCrearDefault}
          crearServicio={handleCrearServicio}
          crearPlantilla={crearPlaylist}
          usarPlantilla={handleInstanciarPreset}
          repetirServicio={handleClonarMazo}
        />
      </div>

      <ErrorBanner message={errorMsg} />

      {/* ── Tus próximos servicios ────────────────────────────────────── */}
      {misServicios.length > 0 || sinListaParaMiTurno ? (
        <section aria-labelledby="proximos" className="flex flex-col gap-3.5">
          <h2 id="proximos" className={cls.seccion}>Tus próximos servicios</h2>
          <div className="escalonar grid gap-3.5 lg:grid-cols-2">
            {misServicios.map((s) => {
              const [arriba, abajo] = chipSemana(miTurno);
              const publicado = s.estado !== "PREPARACION";
              const total = Number(s.total);
              return (
                <article key={s.id_playlist} className={`${cls.tarjeta} flex flex-wrap items-center gap-4 p-5`}>
                  <div className={`w-[76px] shrink-0 rounded-2xl px-1 py-2.5 text-center ${miTurno === 0 ? "bg-fuego-600/[0.12] text-fuego-600 dark:text-[#df8067]" : "bg-[rgba(110,76,64,0.08)] text-mid"}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">{arriba}</p>
                    <p className="mt-0.5 text-sm font-bold">{abajo}</p>
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold leading-tight text-hi">{s.nombre}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${ETAPA_CHIP[s.estado ?? "PREPARACION"]}`}>
                        {ESTADO_LABEL[s.estado ?? ""] ?? s.estado}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-lo">
                      {total} {total === 1 ? "canción" : "canciones"} · {publicado ? "El equipo ya la ve" : "Solo la ves vos"}
                    </p>
                  </div>
                  <Link
                    href={`/playlists/${s.id_playlist}`}
                    className={publicado
                      ? "inline-flex min-h-[44px] items-center rounded-full border border-fuego-600 bg-[#fcf5eb] px-[18px] text-sm font-semibold text-fuego-600 dark:bg-transparent dark:text-[#df8067] max-sm:w-full max-sm:justify-center"
                      : `${cls.btnLlama} shadow-none max-sm:w-full`}
                  >
                    {publicado ? "Ver lista" : "Seguir armando"}
                  </Link>
                </article>
              );
            })}
            {sinListaParaMiTurno && (() => {
              const [arriba, abajo] = chipSemana(miTurno);
              return (
                <article className={`${cls.tarjeta} flex flex-wrap items-center gap-4 p-5`}>
                  <div className="w-[76px] shrink-0 rounded-2xl bg-[rgba(110,76,64,0.08)] px-1 py-2.5 text-center text-mid">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">{arriba}</p>
                    <p className="mt-0.5 text-sm font-bold">{abajo}</p>
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-lo">Sin lista todavía</p>
                      <span className="rounded-full border border-line bg-[#fcf5eb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-lo dark:bg-input">Sin armar</span>
                    </div>
                    <p className="mt-1 text-[13px] text-lo">Podés armarla cuando quieras con “Armar lista nueva”.</p>
                  </div>
                </article>
              );
            })()}
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-start gap-3 rounded-[22px] border border-dashed border-mark bg-white/60 p-6 dark:bg-card/60">
          <p className="text-base font-semibold text-hi">No tenés servicios asignados por ahora</p>
          <p className="max-w-[640px] text-sm leading-relaxed text-mid">
            Cuando te asignen una semana en Turnos, va a aparecer acá. Mientras tanto, podés adelantar una lista guardándola como plantilla.
          </p>
        </section>
      )}

      {/* ── Esta semana (set publicado del ministro de turno) ─────────── */}
      {estaSemana.filter((l) => !misServicios.some((m) => m.id_playlist === l.id_playlist)).length > 0 && (
        <section aria-labelledby="esta-semana" className="flex flex-col gap-3.5">
          <h2 id="esta-semana" className={cls.seccion}>Esta semana en la plataforma</h2>
          {estaSemana
            .filter((l) => !misServicios.some((m) => m.id_playlist === l.id_playlist))
            .map((lista) => (
              <Link key={lista.id_playlist} href={`/playlists/${lista.id_playlist}`} className={`${cls.tarjeta} flex items-center gap-4 px-5 py-4 tarjeta-viva`}>
                <Avatar foto={lista.foto} nombre={lista.nombre_usuario} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-hi">{lista.nombre}</p>
                  <p className="truncate text-[13px] text-lo">Dirige {lista.nombre_usuario}</p>
                </div>
                <Badge tone={lista.estado === "DEFINITIVA" ? "info" : "warning"}>{ESTADO_LABEL[lista.estado ?? ""] ?? lista.estado}</Badge>
                <ChevronRight size={16} className="shrink-0 text-gone" aria-hidden />
              </Link>
            ))}
        </section>
      )}

      {/* ── Más opciones ──────────────────────────────────────────────── */}
      <nav aria-label="Más opciones de servicios" className="escalonar grid gap-2.5 sm:grid-cols-2">
        <a href="#plantillas" className="tarjeta-viva flex min-h-[72px] items-center gap-3.5 rounded-[18px] border border-line bg-card px-5 text-hi hover:border-mark">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-fuego-600"><ListMusic size={22} aria-hidden /></span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">Mis plantillas</span>
            <span className="block text-[13px] text-lo">{plantillas.length} {plantillas.length === 1 ? "guardada" : "guardadas"}</span>
          </span>
          <ChevronRight size={18} className="text-gone" aria-hidden />
        </a>
        <a href="#anteriores" className="tarjeta-viva flex min-h-[72px] items-center gap-3.5 rounded-[18px] border border-line bg-card px-5 text-hi hover:border-mark">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-mid"><Archive size={22} aria-hidden /></span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">Servicios anteriores</span>
            <span className="block text-[13px] text-lo">{historialData.length} {historialData.length === 1 ? "servicio" : "servicios"}</span>
          </span>
          <ChevronRight size={18} className="text-gone" aria-hidden />
        </a>
      </nav>

      <div className="grid gap-7 lg:grid-cols-2 lg:items-start">
        {/* ── Mis plantillas ──────────────────────────────────────────── */}
        <section id="plantillas" aria-labelledby="t-plantillas" className="flex scroll-mt-24 flex-col gap-3">
          <h2 id="t-plantillas" className={cls.seccion}>Mis plantillas</h2>
          <p className="-mt-1 text-[13px] text-lo">Tus sets reutilizables. Tocá “Usar” para armar un servicio, o renombralas y borralas.</p>
          {plantillas.length === 0 ? (
            <p className={`${cls.tarjeta} px-5 py-5 text-sm text-lo`}>No tenés plantillas todavía. Creá una con “Armar lista nueva” → Sin fecha.</p>
          ) : (
            <ListaAnimada className="escalonar flex flex-col gap-1.5">
              {plantillas.map((lista) => (
                <PlaylistRowItem
                  key={lista.id_playlist}
                  id_playlist={lista.id_playlist}
                  nombre={lista.nombre}
                  onUsar={handleInstanciarPreset}
                  onRenombrar={handleRenombrarPlantilla}
                  onEliminar={handleEliminarLista}
                  eliminarLabel="Borrar plantilla"
                />
              ))}
            </ListaAnimada>
          )}
          {enPreparacion.length > 0 && (
            <>
              <h3 className="mt-3 text-[13px] font-semibold text-mid">Borrar servicios en preparación</h3>
              <ListaAnimada className="escalonar flex flex-col gap-1.5">
                {enPreparacion.map((lista) => (
                  <PlaylistRowItem
                    key={lista.id_playlist}
                    id_playlist={lista.id_playlist}
                    nombre={lista.nombre}
                    subtitulo="En preparación"
                    destacada
                    onEliminar={handleEliminarLista}
                    eliminarLabel="Borrar lista en preparación"
                  />
                ))}
              </ListaAnimada>
            </>
          )}
        </section>

        {/* ── Servicios anteriores ────────────────────────────────────── */}
        <section id="anteriores" aria-labelledby="t-anteriores" className="flex scroll-mt-24 flex-col gap-3">
          <h2 id="t-anteriores" className={cls.seccion}>Servicios anteriores</h2>
          <p className="-mt-1 text-[13px] text-lo">Servicios finalizados. Mirá qué se tocó y repetilos como base para el próximo.</p>
          <HistorialListas listas={historialData} onClonar={handleClonarMazo} />
        </section>
      </div>
    </div>
  );
}
