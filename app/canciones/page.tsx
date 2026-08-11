import { redirect } from "next/navigation";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { and, eq, isNotNull, like, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ChevronDown, CheckCircle2, Sparkles } from "lucide-react";
import { CatalogoCanciones } from "@/components/CatalogoCanciones";
import { CargarCancion } from "@/components/CargarCancion";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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

  return (
    <main className="px-4 pt-8 pb-6 flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">

      {/* ── COLUMNA IZQUIERDA: Catálogo ───────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <ErrorBanner message={errorMsg} />

        {editadaOk && (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 size={15} className="shrink-0" />
            Cambios guardados.
          </div>
        )}

        {/* ── Catálogo ──────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4 animate-fade-in-up">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-hi">Catálogo</h1>
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
          />
        </section>
      </div>

      {/* ── COLUMNA DERECHA: Sugerir ──────────────────────────────────── */}
      {/* Mobile: colapsable. Desktop: siempre visible como panel lateral */}
      <details className="group overflow-hidden rounded-2xl border border-line bg-card shadow-card animate-fade-in-up [animation-delay:120ms] dark:shadow-none lg:block lg:[&[open]]:block" open={sugeridaOk}>
        <summary className="flex cursor-pointer select-none list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
              <Sparkles size={16} className="text-violet-600" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-hi">Sugerir canción</h2>
              <p className="mt-0.5 text-[11px] text-lo">Queda pendiente de aprobación de un líder.</p>
            </div>
          </div>
          <ChevronDown
            size={15}
            className="shrink-0 text-lo transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        {/* Header del panel (solo visible en desktop) */}
        <div className="hidden lg:flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
            <Sparkles size={16} className="text-violet-600" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-hi">Sugerir canción</h2>
            <p className="mt-0.5 text-[11px] text-lo">Queda pendiente de aprobación.</p>
          </div>
        </div>

        <div className="border-t border-line px-5 pb-5 pt-4 lg:border-t-0">
          {sugeridaOk && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 size={15} className="shrink-0" />
              ¡Gracias! Tu sugerencia quedó pendiente de aprobación.
            </div>
          )}

          <form action={handleSugerir} className="flex flex-col gap-3">
            <Input id="nombre" name="nombre" label="Nombre de la canción" required />
            <Input id="artista" name="artista" label="Artista" required />

            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label htmlFor="metrica">Métrica (opcional)</Label>
                <select
                  id="metrica"
                  name="metrica"
                  defaultValue=""
                  className="w-full rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
                >
                  <option value="">Sin definir…</option>
                  {METRICAS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <Input
                id="bpm"
                name="bpm"
                type="number"
                min={1}
                max={300}
                label="BPM"
                wrapperClassName="w-24"
                className="text-center"
              />
            </div>

            <CargarCancion />

            <Button type="submit" className="self-start" icon={<Sparkles size={14} />}>
              Sugerir
            </Button>
          </form>
        </div>
      </details>

    </main>
  );
}
