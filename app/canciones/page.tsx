import { redirect } from "next/navigation";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ChevronDown } from "lucide-react";

export default async function CancionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const aprobadas = await db
    .select()
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "APROBADA"))
    .orderBy(canciones.nombre);

  async function sugerirCancion(formData: FormData) {
    "use server";
    const nombre  = (formData.get("nombre")  as string)?.trim();
    const artista = (formData.get("artista") as string)?.trim();
    if (!nombre || !artista) return;
    await db.insert(canciones).values({ nombre, artista });
    revalidatePath("/canciones");
  }

  return (
    <main className="flex flex-col gap-8 px-4 pt-8 pb-6">

      {/* ── Catálogo ──────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Catálogo</h1>
            <span className="text-xs text-content-secondary">{aprobadas.length} canciones</span>
          </div>
          <p className="mt-1 text-sm text-content-muted">
            Canciones aprobadas para agregar a tus listas.
          </p>
        </div>

        {aprobadas.length === 0 ? (
          <p className="text-sm text-content-secondary">Sin canciones aprobadas aún.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {aprobadas.map((c) => (
              <li
                key={c.id_cancion}
                className="flex items-center gap-3 rounded-xl border border-glass-base bg-glass-subtle px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content-primary">{c.nombre}</p>
                  <p className="mt-0.5 text-xs text-content-secondary">{c.artista}</p>
                </div>
                {(c.bpm || c.metrica) && (
                  <div className="flex shrink-0 items-center gap-2 text-[10px] text-content-muted">
                    {c.metrica && <span>{c.metrica}</span>}
                    {c.bpm && <span>{c.bpm} BPM</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Sugerir (colapsable) ──────────────────────────────────────── */}
      <details className="group overflow-hidden rounded-2xl border border-glass-base bg-glass-subtle">
        <summary className="flex cursor-pointer select-none list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
          <h2 className="text-sm font-semibold text-content-primary">Sugerir Canción</h2>
          <ChevronDown
            size={15}
            className="text-content-secondary transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        <div className="border-t border-glass-base px-5 pb-5 pt-4">
          <form action={sugerirCancion} className="flex flex-col gap-3">
            <input
              name="nombre"
              placeholder="Nombre de la canción"
              required
              className="rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary placeholder-content-muted outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
            />
            <input
              name="artista"
              placeholder="Artista"
              required
              className="rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-content-primary placeholder-content-muted outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
            />
            <button
              type="submit"
              className="self-start rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
            >
              Sugerir
            </button>
          </form>
        </div>
      </details>

    </main>
  );
}
