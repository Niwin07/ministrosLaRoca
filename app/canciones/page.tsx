import { redirect } from "next/navigation";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export default async function CancionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const aprobadas = await db
    .select()
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "APROBADA"));

  async function sugerirCancion(formData: FormData) {
    "use server";
    const nombre  = (formData.get("nombre")  as string)?.trim();
    const artista = (formData.get("artista") as string)?.trim();
    if (!nombre || !artista) return;
    await db.insert(canciones).values({ nombre, artista });
    revalidatePath("/canciones");
  }

  return (
    <main className="px-4 pt-8 pb-6 space-y-10">

      {/* ── Catálogo Público ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Catálogo
        </h1>
        {aprobadas.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay canciones aprobadas aún.</p>
        ) : (
          <ul className="space-y-2">
            {aprobadas.map((c) => (
              <li
                key={c.id_cancion}
                className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {c.nombre}
                  </p>
                  <p className="text-xs text-zinc-500">{c.artista}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Sugerir Canción ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Sugerir Canción</h2>
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5">
          <form action={sugerirCancion} className="flex flex-col gap-3">
            <input
              name="nombre"
              placeholder="Nombre de la canción"
              required
              className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
            <input
              name="artista"
              placeholder="Artista"
              required
              className="rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
            <button
              type="submit"
              className="self-start rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
            >
              Sugerir
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
