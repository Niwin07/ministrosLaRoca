import Link from "next/link";
import { fotoUrl } from "@/lib/foto";
import { redirect } from "next/navigation";
import { Check, ChevronDown, ChevronRight, ListMusic, Plus } from "lucide-react";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { cronograma, playlists, lista_canciones, canciones, usuarios } from "@/db/schema";
import { Avatar } from "@/components/Avatar";
import { ActivarNotifBanner } from "@/components/ActivarNotifBanner";
import { PlataformaSwitcher } from "@/components/PlataformaSwitcher";
import { IconoMarca, type IconoMarcaNombre } from "@/components/zarza/IconoMarca";
import { cls } from "@/components/zarza/ui";
import { ESTADO_LABEL } from "@/lib/estados";
import { getPlataformaEfectivaId } from "@/lib/get-plataforma-activa";
import { getMisPlataformas } from "@/lib/usuario-request-cache";
import { getTurnosSonido } from "@/lib/sonido";
import { PLATAFORMAS_LIST } from "@/lib/plataforma";

// Colores de la etapa del servicio (funcionales del sistema Zarza).
const ETAPA: Record<string, string> = {
  PREPARACION: "border-[#eadbc6] bg-[#f3e7d6] text-[#6e4c40] dark:border-[#4a3530] dark:bg-[#211815] dark:text-[#d6c2a8]",
  ENSAYO:      "border-[#f8c98a] bg-[#ffeccc] text-[#9a3c0a] dark:border-[#3c2e1b] dark:bg-[#251d11] dark:text-[#f8894f]",
  DEFINITIVA:  "border-[#f5b9a0] bg-[#fde4d8] text-[#94402a] dark:border-[#5c382a] dark:bg-[#1e1513] dark:text-[#d9846d]",
};

const DIA = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "America/Argentina/Buenos_Aires" });

const EXCELENCIA: { href: string; titulo: string; sub: string; icono: IconoMarcaNombre }[] = [
  { href: "/calentamiento", titulo: "Calentamiento de voces", sub: "Ejercicios antes de cantar",          icono: "voz" },
  { href: "/protocolo",     titulo: "Protocolo de sonido",    sub: "Pasos para probar sonido",            icono: "consola" },
  { href: "/mejorar",       titulo: "Quiero mejorar",         sub: "Videos para cada parte del equipo",   icono: "mejorar" },
];

export default async function InicioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id_usuario } = session.user;
  const primerNombre = (session.user.name ?? "").split(" ")[0];

  const [plaId, misPlataformas] = await Promise.all([
    getPlataformaEfectivaId(id_usuario),
    getMisPlataformas(id_usuario),
  ]);
  // Pestañas General / Remanentes: administración y líderes ven todas; el resto, las suyas.
  const plataformasSwitch = session.user.rol === "ADMINISTRADOR" || session.user.rol === "LIDER"
    ? PLATAFORMAS_LIST.map((p) => ({ id: p.id, nombre: p.nombre }))
    : misPlataformas.map((p) => ({ id: p.id_plataforma, nombre: p.nombre }));

  // Quién dirige ahora, quién sigue, lo publicado, mi servicio en preparación
  // y el sonido de la semana: todo en una sola tanda en paralelo (antes eran
  // cinco idas y vueltas a la base, una detrás de otra).
  const [director, proximo, publicada, miPreparacion, sonido] = await Promise.all([
    db
      .select({ id: usuarios.id_usuario, nombre: usuarios.nombre, foto: fotoUrl() })
      .from(cronograma)
      .innerJoin(usuarios, eq(usuarios.id_usuario, cronograma.id_usuario))
      .where(and(eq(cronograma.id_plataforma, plaId), eq(cronograma.estado_turno, "ACTIVO")))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({ id: usuarios.id_usuario, nombre: usuarios.nombre, foto: fotoUrl() })
      .from(cronograma)
      .innerJoin(usuarios, eq(usuarios.id_usuario, cronograma.id_usuario))
      .where(and(eq(cronograma.id_plataforma, plaId), eq(cronograma.estado_turno, "EN_ESPERA")))
      .orderBy(asc(cronograma.orden))
      .limit(1)
      .then((r) => r[0] ?? null),
    // Servicio publicado para el equipo (en ensayo o definitivo).
    db
      .select({ id: playlists.id_playlist, nombre: playlists.nombre, estado: playlists.estado, fecha: playlists.fecha_programada })
      .from(playlists)
      .where(and(
        eq(playlists.tipo, "EVENTO"),
        eq(playlists.id_plataforma, plaId),
        inArray(playlists.estado, ["ENSAYO", "DEFINITIVA"]),
      ))
      .orderBy(desc(playlists.actualizadoEn))
      .limit(1)
      .then((r) => r[0] ?? null),
    // Mi servicio en preparación (se usa si me toca dirigir y no hay nada publicado).
    db
      .select({ id: playlists.id_playlist, nombre: playlists.nombre, estado: playlists.estado, fecha: playlists.fecha_programada })
      .from(playlists)
      .where(and(
        eq(playlists.tipo, "EVENTO"),
        eq(playlists.id_plataforma, plaId),
        eq(playlists.id_usuario, id_usuario),
        eq(playlists.estado, "PREPARACION"),
      ))
      .orderBy(desc(playlists.actualizadoEn))
      .limit(1)
      .then((r) => r[0] ?? null),
    getTurnosSonido(plaId, 1),
  ]);

  const dirijo = director?.id === id_usuario;
  const servicio = publicada ?? (dirijo ? miPreparacion : null);

  // Segunda (y última) tanda, también en paralelo.
  const [proximoTieneLista, cancionesServicio] = await Promise.all([
    // "Lista armada": el próximo director ya tiene un servicio con canciones.
    proximo
      ? db
          .select({ id: playlists.id_playlist })
          .from(playlists)
          .innerJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
          .where(and(
            eq(playlists.tipo, "EVENTO"),
            eq(playlists.id_plataforma, plaId),
            eq(playlists.id_usuario, proximo.id),
            inArray(playlists.estado, ["PREPARACION", "ENSAYO", "DEFINITIVA"]),
          ))
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
    servicio
      ? db
          .select({ id: lista_canciones.id_lista_cancion, orden: lista_canciones.orden, nota: lista_canciones.nota, nombre: canciones.nombre, artista: canciones.artista })
          .from(lista_canciones)
          .innerJoin(canciones, eq(canciones.id_cancion, lista_canciones.id_cancion))
          .where(eq(lista_canciones.id_playlist, servicio.id))
          .orderBy(lista_canciones.orden)
      : Promise.resolve([]),
  ]);

  const conCanciones = !!servicio && cancionesServicio.length > 0;
  const etapa = servicio?.estado ?? "PREPARACION";
  const dia = servicio?.fecha ? DIA.format(servicio.fecha) : null;
  const sonidoSemana = sonido.semanas[0];

  const listaCanciones = (
    <ol className="escalonar divide-y divide-[#f1e5d4] dark:divide-line">
      {cancionesServicio.map((c) => (
        <li key={c.id} className="flex items-center gap-3.5 px-[18px] py-3">
          <span className="w-[22px] shrink-0 text-right text-xs font-semibold tabular-nums text-[#b9998a]">
            {String(c.orden).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-hi">{c.nombre}</p>
            <p className="truncate text-xs text-lo">{c.artista}</p>
          </div>
          {c.nota && <span className={cls.chipTono}>{c.nota}</span>}
        </li>
      ))}
    </ol>
  );

  return (
    <div className="flex flex-col gap-6 px-4 pb-6 pt-7 md:px-0 md:pt-2">

      {/* ── Saludo ───────────────────────────────────────────────── */}
      <div>
        <p className="text-[15px] font-medium italic leading-snug tracking-[-0.005em] text-[#4a1408] dark:text-[#ecbf98]">
          Lo que Dios enciende, no se gasta.
        </p>
        <p className="mt-1 text-xs tracking-[0.01em] text-[#5c2a18] opacity-85 dark:text-[#ddcdb8]">Éxodo 3:2-5 · RVR1960</p>
        <h1 className="mt-2.5 font-display text-[30px] font-bold leading-[1.08] tracking-[-0.02em] text-hi">
          Hola, {primerNombre}
        </h1>
      </div>

      {plataformasSwitch.length >= 2 && (
        <PlataformaSwitcher plataformas={plataformasSwitch} activaId={plaId} />
      )}

      <ActivarNotifBanner />

      {/* Contenido de la plataforma: se vuelve a montar (y entra animado)
          al cambiar entre General y Remanentes. */}
      <div key={plaId} className="vista-plataforma flex flex-col gap-6">
      {/* ── Esta semana ──────────────────────────────────────────── */}
      <section
        aria-labelledby="servicio-semana"
        className={`tarjeta-brasa grid min-w-0 gap-x-9 gap-y-5 rounded-card border border-line bg-card p-4 shadow-card sm:p-6 dark:shadow-none ${conCanciones ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" : ""}`}
        style={{
          backgroundImage:
            "radial-gradient(120% 140% at 0% 0%, rgba(232,160,96,0.16) 0%, rgba(232,160,96,0) 45%), radial-gradient(90% 120% at 100% 100%, rgba(122,42,38,0.08) 0%, rgba(122,42,38,0) 50%)",
        }}
      >
        <div className="flex min-w-0 flex-col gap-[18px]">
          <div className="flex items-center justify-between gap-3">
            <p id="servicio-semana" className={`${cls.eyebrow} flex items-center gap-2`}>
              {servicio && <span aria-hidden className="punto-vivo" />}
              Esta semana{dia ? ` · ${dia}` : ""}
            </p>
            {servicio && (
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${ETAPA[etapa] ?? ETAPA.PREPARACION}`}>
                {ESTADO_LABEL[etapa] ?? etapa}
              </span>
            )}
          </div>

          {conCanciones ? (
            <h2 className="-mt-1.5 font-display text-[30px] font-bold leading-[1.08] tracking-[-0.02em] text-hi">{servicio!.nombre}</h2>
          ) : (
            <h2 className="-mt-1.5 font-display text-2xl font-bold leading-[1.08] tracking-[-0.02em] text-hi">
              {servicio ? `${servicio.nombre} todavía no tiene canciones` : "Este servicio todavía no tiene canciones"}
            </h2>
          )}

          <div className="flex items-center gap-3">
            {director ? (
              <Avatar foto={director.foto} nombre={director.nombre} size={40} />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-input text-lo">?</span>
            )}
            <div className="min-w-0">
              <p className="text-xs text-lo">Dirige</p>
              <p className="mt-px flex flex-wrap items-center gap-2 text-[15px] font-semibold text-hi">
                {director?.nombre ?? "Sin asignar"}
                {dirijo && (
                  <span className="rounded-full bg-fuego-600/[0.12] px-2 py-px text-[11px] font-semibold text-fuego-600 dark:text-[#df8067]">Sos vos</span>
                )}
              </p>
            </div>
          </div>

          {/* Canciones en línea (celular / tablet) */}
          {conCanciones && (
            <details className="group overflow-hidden rounded-2xl border border-line lg:hidden">
              <summary className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 bg-[#fbf3e8] px-4 py-3 dark:bg-input">
                <span className="flex items-center gap-2.5 text-sm font-semibold text-hi">
                  <IconoMarca nombre="canciones" size={18} />
                  {cancionesServicio.length} {cancionesServicio.length === 1 ? "canción" : "canciones"}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-fuego-600 dark:text-[#df8067]">
                  <span className="group-open:hidden">Ver canciones</span>
                  <span className="hidden group-open:inline">Ocultar</span>
                  <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
                </span>
              </summary>
              <div className="border-t border-line">
                {listaCanciones}
                <div className="px-4 py-3">
                  <Link href={`/playlists/${servicio!.id}`} className="text-xs font-medium text-fuego-600 hover:underline dark:text-[#ef7a4c]">
                    Ver el servicio completo ›
                  </Link>
                </div>
              </div>
            </details>
          )}

          {/* Sonido de esta semana */}
          <div className="flex items-start gap-3 rounded-[14px] bg-[#fbede6] px-3.5 py-3 dark:bg-[#1e1513]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center">
              <IconoMarca nombre="auriculares" size={24} />
            </span>
            <div className="flex flex-col gap-[3px] text-[13px] leading-snug text-[#5e280d] dark:text-[#e5cec7]">
              <p><strong className="font-bold">Sonidista:</strong> {sonidoSemana?.principal?.nombre ?? "Sin asignar"}</p>
              <p><strong className="font-bold">Auxiliar:</strong> {sonidoSemana?.auxiliar?.nombre ?? "Sin asignar"}</p>
            </div>
          </div>

          {conCanciones ? (
            <Link href={`/playlists/${servicio!.id}`} className={`${cls.btnLlama} min-h-[52px] rounded-2xl text-[15px]`}>
              <ListMusic size={18} aria-hidden /> Abrir lista
            </Link>
          ) : dirijo ? (
            <Link href={servicio ? `/playlists/${servicio.id}` : "/playlists"} className={`${cls.btnLlama} min-h-[52px] rounded-2xl text-[15px]`}>
              <Plus size={18} aria-hidden /> Armar el servicio
            </Link>
          ) : (
            <p className="text-sm text-mid">
              Cuando {director?.nombre ?? "quien dirija"} publique las canciones, las vas a ver acá.
            </p>
          )}
        </div>

        {/* Canciones al costado (desktop) */}
        {conCanciones && (
          <div className="hidden min-w-0 overflow-hidden rounded-[18px] border border-line bg-[#fbf3e8] lg:block dark:bg-input">
            <div className="flex items-center justify-between gap-3 border-b border-[#ecdcc6] px-[18px] py-3.5 dark:border-line">
              <span className="flex items-center gap-2.5 text-sm font-bold text-hi">
                <IconoMarca nombre="canciones" size={18} />
                {cancionesServicio.length} {cancionesServicio.length === 1 ? "canción" : "canciones"}
              </span>
              <Link href={`/playlists/${servicio!.id}`} className="text-[13px] font-medium text-fuego-600 hover:underline dark:text-[#ef7a4c]">
                Ver el servicio completo ›
              </Link>
            </div>
            {listaCanciones}
          </div>
        )}
      </section>

      {/* ── Preparándonos en oración ─────────────────────────────── */}
      {proximo && (
        <section aria-labelledby="en-oracion" className="flex flex-col gap-3">
          <h2 id="en-oracion" className={cls.seccion}>Preparándonos en oración</h2>
          <Link
            href="/turnos"
            aria-label={`La semana que viene dirige ${proximo.nombre}. Ver turnos`}
            className="flex items-center gap-3.5 rounded-[22px] px-5 py-[18px] text-[#fff7ec] shadow-[0_14px_30px_-12px_rgba(94,31,24,0.55)] tarjeta-viva hover:brightness-110"
            style={{ background: "radial-gradient(80% 140% at 100% 0%, rgba(217,134,74,0.6) 0%, rgba(217,134,74,0) 60%), linear-gradient(120deg, #5a1a12 0%, #7a2a26 45%, #a8492c 100%)" }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[rgba(255,247,236,0.6)] bg-[rgba(255,247,236,0.12)] text-[15px] font-bold">
              {proximo.nombre.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#f8c9a8]">La semana que viene dirige</span>
              <span className="mt-0.5 block truncate text-base font-bold">{proximo.nombre}</span>
              {proximoTieneLista && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[rgba(255,247,236,0.18)] px-2 py-px text-[11px] font-semibold">
                  <Check size={11} strokeWidth={3} aria-hidden /> Lista armada
                </span>
              )}
            </span>
            <span className="flex items-center gap-0.5 text-[13px] font-semibold">
              Turnos <ChevronRight size={16} aria-hidden />
            </span>
          </Link>
        </section>
      )}

      </div>

      {/* ── Con excelencia ───────────────────────────────────────── */}
      <section aria-labelledby="para-equipo" className="flex flex-col gap-3">
        <h2 id="para-equipo" className={cls.seccion}>Con excelencia</h2>
        <div className="escalonar grid gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {EXCELENCIA.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="tarjeta-viva flex items-center gap-3.5 rounded-2xl border border-line bg-card py-3.5 pl-4 pr-3.5 text-hi shadow-[0_1px_2px_rgba(43,22,17,0.06),0_8px_24px_-10px_rgba(120,45,15,0.18)] transition-transform hover:-translate-y-0.5 dark:shadow-none"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <IconoMarca nombre={e.icono} size={33} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{e.titulo}</span>
                <span className="mt-0.5 block text-xs text-lo">{e.sub}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-[#b9998a]" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
