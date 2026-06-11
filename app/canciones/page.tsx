import { redirect } from "next/navigation";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ChevronDown, CheckCircle2, Sparkles } from "lucide-react";
import { CatalogoCanciones } from "@/components/CatalogoCanciones";
import { CargarCancion } from "@/components/CargarCancion";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";
import { sugerirCancion as crearSugerencia } from "@/app/actions/canciones";
import { METRICAS } from "@/lib/metricas";

export default async function CancionesPage(props: {
  searchParams: Promise<{ sugerida?: string; editada?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

  const puedeEditar =
    session.user.rol === "ADMINISTRADOR" || session.user.rol === "LIDER";

  const aprobadas = await db
    .select()
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "APROBADA"))
    .orderBy(canciones.nombre);

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
        bpm:             bpm !== undefined && Number.isFinite(bpm) ? bpm : undefined,
        metrica:         clean(formData.get("metrica")),
        letra:           clean(formData.get("letra")),
        charts:          clean(formData.get("charts")),
        link_referencia: clean(formData.get("link_referencia")),
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
              <span className="text-xs text-lo">{aprobadas.length} canciones</span>
            </div>
            <p className="mt-1 text-sm text-lo">Buscá una canción y mirá su letra y acordes.</p>
          </div>

          <CatalogoCanciones canciones={aprobadas} puedeEditar={puedeEditar} />
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
            <input
              name="nombre"
              placeholder="Nombre de la canción *"
              required
              className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />
            <input
              name="artista"
              placeholder="Artista *"
              required
              className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />

            <div className="flex gap-2">
              <select
                name="metrica"
                defaultValue=""
                className="flex-1 rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
              >
                <option value="">Métrica (opcional)…</option>
                {METRICAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                name="bpm"
                type="number"
                min={1}
                max={300}
                placeholder="BPM"
                className="w-24 rounded-xl border border-mark bg-input px-3 py-3 text-center text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <input
              name="link_referencia"
              type="url"
              placeholder="Link de YouTube/Spotify (opcional)…"
              className="rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />

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
