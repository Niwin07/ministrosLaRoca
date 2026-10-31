import { redirect } from "next/navigation";
import { db } from "@/db";
import { canciones, playlists } from "@/db/schema";
import { and, desc, eq, inArray, isNotNull, like, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { CheckCircle2, Sparkles } from "lucide-react";
import { CatalogoCanciones } from "@/components/CatalogoCanciones";
import { CargarCancion } from "@/components/CargarCancion";
import { ErrorBanner } from "@/components/ErrorBanner";
import { cls } from "@/components/zarza/ui";
import { agregarCancionALista } from "@/app/actions/listas";
import { sugerirCancion as crearSugerencia } from "@/app/actions/canciones";
import { METRICAS } from "@/lib/metricas";

const POR_PAGINA = 15;

export default async function CancionesPage(props: {
  searchParams: Promise<{
    sugerida?:  string;
    editada?:   string;
    error?:     string;
    q?:         string;
    artista?:   string;
    metrica?:   string;
    contenido?: string;
    pagina?:    string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

  const puedeEditar =
    session.user.rol === "ADMINISTRADOR" || session.user.rol === "LIDER";

  // Búsqueda/filtros/paginación en el servidor (antes se traía TODO el
  // catálogo con letra/charts incluidos y se filtraba/paginaba en el
  // cliente — crecía sin límite con cada canción nueva). El estado de los
  // filtros vive en la URL, así que es la única fuente de verdad tanto para
  // la query como para lo que ve CatalogoCanciones.
  const q         = (searchParams.q ?? "").trim();
  const artista   = searchParams.artista ?? "";
  const metrica   = searchParams.metrica ?? "";
  const contenido = searchParams.contenido === "charts" || searchParams.contenido === "letra"
    ? searchParams.contenido
    : null;
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);

  const condiciones = [eq(canciones.estado_aprobacion, "APROBADA")];

  if (q) {
    // Escapar comodines de LIKE para que una búsqueda tipo "50%" busque el
    // texto literal en vez de comportarse como patrón.
    const escapado = q.replace(/[%_\\]/g, (m) => `\\${m}`);
    const patron = `%${escapado}%`;
    const clause = or(like(canciones.nombre, patron), like(canciones.artista, patron));
    if (clause) condiciones.push(clause);
  }
  if (artista) condiciones.push(eq(canciones.artista, artista));
  if (metrica) condiciones.push(eq(canciones.metrica, metrica));
  if (contenido === "charts") {
    condiciones.push(isNotNull(canciones.charts), ne(canciones.charts, ""));
  }
  if (contenido === "letra") {
    condiciones.push(isNotNull(canciones.letra), ne(canciones.letra, ""));
  }

  const whereClause = and(...condiciones)!;

  const [aprobadas, totalRows, totalAprobadasRows, artistaRows, metricaRows] = await Promise.all([
    db
      .select({
        id_cancion: canciones.id_cancion,
        nombre:     canciones.nombre,
        artista:    canciones.artista,
        bpm:        canciones.bpm,
        metrica:    canciones.metrica,
        letra:      canciones.letra,
        charts:     canciones.charts,
      })
      .from(canciones)
      .where(whereClause)
      .orderBy(canciones.nombre)
      .limit(POR_PAGINA)
      .offset((pagina - 1) * POR_PAGINA),

    db.select({ count: sql<number>`COUNT(*)` }).from(canciones).where(whereClause),

    db.select({ count: sql<number>`COUNT(*)` })
      .from(canciones)
      .where(eq(canciones.estado_aprobacion, "APROBADA")),

    // Listas para los dropdowns de filtro — siempre sobre el catálogo
    // completo aprobado, no sobre el resultado ya filtrado (igual que antes).
    db.select({ artista: canciones.artista })
      .from(canciones)
      .where(eq(canciones.estado_aprobacion, "APROBADA"))
      .groupBy(canciones.artista)
      .orderBy(canciones.artista),

    db.select({ metrica: canciones.metrica })
      .from(canciones)
      .where(and(eq(canciones.estado_aprobacion, "APROBADA"), isNotNull(canciones.metrica)))
      .groupBy(canciones.metrica)
      .orderBy(canciones.metrica),
  ]);

  const total          = Number(totalRows[0]?.count ?? 0);
  const totalAprobadas = Number(totalAprobadasRows[0]?.count ?? 0);
  const totalPaginas   = Math.max(1, Math.ceil(total / POR_PAGINA));
  const artistas       = artistaRows.map((r) => r.artista);
  const metricas       = metricaRows.map((r) => r.metrica).filter((m): m is string => !!m);

  const sugeridaOk = searchParams.sugerida === "1";
  const editadaOk  = searchParams.editada === "1";

  async function handleSugerir(formData: FormData) {
    "use server";
    try {
      const nombre  = (formData.get("nombre")  as string)?.trim();
      const artista = (formData.get("artista") as string)?.trim();
      if (!nombre || !artista) return;

      const clean = (raw: FormDataEntryValue | null) =>
        typeof raw === "string" && raw.trim()
          ? raw.replace(/\r\n/g, "\n").trim()
          : undefined;

      const bpmRaw = formData.get("bpm");
      const bpm = typeof bpmRaw === "string" && bpmRaw.trim() ? Number(bpmRaw) : undefined;

      await crearSugerencia({
        nombre,
        artista,
        bpm:     bpm !== undefined && Number.isFinite(bpm) ? bpm : undefined,
        metrica: clean(formData.get("metrica")),
        letra:   clean(formData.get("letra")),
        charts:  clean(formData.get("charts")),
      });

      revalidatePath("/canciones");
    } catch (e) {
      redirect(
        `/canciones?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo enviar la sugerencia."
        )}`
      );
    }
    redirect("/canciones?sugerida=1");
  }

  // Listas propias editables para "Agregar a…" (servicios en preparación /
  // ensayo y plantillas). ADMIN/LÍDER también pueden editar las de otros,
  // pero el atajo muestra sólo las propias para no abrumar.
  const misListas = await db
    .select({ id_playlist: playlists.id_playlist, nombre: playlists.nombre, tipo: playlists.tipo, estado: playlists.estado })
    .from(playlists)
    .where(and(
      eq(playlists.id_usuario, session.user.id_usuario),
      or(
        eq(playlists.tipo, "PRESET"),
        and(eq(playlists.tipo, "EVENTO"), inArray(playlists.estado, ["PREPARACION", "ENSAYO"])),
      ),
    ))
    .orderBy(desc(playlists.actualizadoEn))
    .limit(8);

  async function handleAgregarALista(formData: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    try {
      await agregarCancionALista(Number(formData.get("id_playlist")), Number(formData.get("id_cancion")));
      revalidatePath(`/playlists/${Number(formData.get("id_playlist"))}`);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "No se pudo agregar." };
    }
  }

  return (
    <main className="flex flex-col gap-6 px-4 pb-8 pt-7 md:px-0 md:pt-2 xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">

      <section className="flex min-w-0 flex-col gap-4">
        <ErrorBanner message={errorMsg} />
        {editadaOk && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-800 dark:text-green-400">
            <CheckCircle2 size={15} className="shrink-0" aria-hidden /> Cambios guardados.
          </div>
        )}
        <div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-[26px] font-bold tracking-[-0.02em] text-hi">Repertorio</h1>
            <span className="text-xs text-lo">{totalAprobadas} canciones</span>
          </div>
          <p className="mt-1 text-sm text-lo">Buscá una canción y mirá su letra y acordes.</p>
        </div>

        <CatalogoCanciones
          canciones={aprobadas}
          total={total}
          totalAprobadas={totalAprobadas}
          artistas={artistas}
          metricas={metricas}
          pagina={pagina}
          totalPaginas={totalPaginas}
          filtros={{ q, artista, metrica, contenido }}
          puedeEditar={puedeEditar}
          misListas={misListas.map((l) => ({
            id_playlist: l.id_playlist,
            nombre: l.nombre,
            cuando: l.tipo === "PRESET" ? "Plantilla" : l.estado === "ENSAYO" ? "Servicio en ensayo" : "Servicio en preparación",
          }))}
          onAgregarALista={handleAgregarALista}
        />
      </section>

      {/* ── Sugerir canción ─────────────────────────────────────────── */}
      <section id="sugerir" aria-labelledby="t-sugerir" className="overflow-hidden rounded-2xl border border-line bg-card shadow-card dark:shadow-none xl:sticky xl:top-4">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fuego-600/10 text-fuego-600">
            <Sparkles size={17} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="t-sugerir" className="text-sm font-semibold text-hi">Sugerir canción</h2>
            <p className="mt-0.5 text-xs leading-snug text-mid">¿Tenés una canción que suena en tu corazón y no está en el repertorio? Sugerila al equipo.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
          {sugeridaOk && (
            <div role="status" className="flex items-center gap-2 rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-800 dark:text-green-400">
              <CheckCircle2 size={15} className="shrink-0" aria-hidden /> ¡Gracias! Tu sugerencia quedó pendiente de aprobación.
            </div>
          )}
          <form action={handleSugerir} className="flex flex-col gap-3">
            <label className={cls.etiqueta}>
              Nombre de la canción
              <input name="nombre" required className={cls.campo} />
            </label>
            <label className={cls.etiqueta}>
              Artista
              <input name="artista" required className={cls.campo} />
            </label>
            <div className="flex gap-2">
              <label className={`${cls.etiqueta} flex-1`}>
                Métrica
                <select name="metrica" defaultValue="" className={`${cls.campo} [&>option]:bg-card`}>
                  <option value="">Sin definir</option>
                  {METRICAS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className={`${cls.etiqueta} w-24`}>
                BPM
                <input name="bpm" type="number" min={1} max={300} inputMode="numeric" className={`${cls.campo} px-2 text-center`} />
              </label>
            </div>
            <CargarCancion />
            <p className="text-[11px] text-lo">Queda pendiente hasta que un líder la apruebe.</p>
            <button type="submit" className={`${cls.btnLlama} self-start`}>
              <Sparkles size={15} aria-hidden /> Sugerir
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
