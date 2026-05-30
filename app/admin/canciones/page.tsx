import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { resolverSugerencia } from "@/app/actions/canciones";

export default async function AdminCancionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") {
    redirect("/");
  }

  const pendientes = await db
    .select()
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "PENDIENTE"));

  return (
    <main className="px-4 pt-8 pb-6 space-y-6">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <Link
        href="/canciones"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
      >
        <ArrowLeft size={15} />
        Catálogo
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Moderación
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {pendientes.length}{" "}
          {pendientes.length === 1 ? "canción pendiente" : "canciones pendientes"}
        </p>
      </div>

      {/* ── Lista de pendientes ───────────────────────────────────────── */}
      {pendientes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-zinc-500">
            No hay canciones pendientes de revisión.
          </p>
        </div>
      ) : (
        <ul className="space-y-6">
          {pendientes.map((c) => (
            <li
              key={c.id_cancion}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-5 py-5 space-y-5"
            >
              {/* Info canción */}
              <div>
                <p className="text-base font-semibold text-white">{c.nombre}</p>
                <p className="mt-0.5 text-sm text-zinc-400">{c.artista}</p>
              </div>

              {/* Formulario de Aprobación */}
              <form action={resolverSugerencia} className="space-y-4">
                <input type="hidden" name="id_cancion" value={c.id_cancion} />
                <input type="hidden" name="decision"   value="APROBADA" />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Letra
                  </label>
                  <textarea
                    name="letra"
                    rows={6}
                    placeholder="Pega la letra de la canción aquí..."
                    className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-lime-500/50 focus:ring-2 focus:ring-lime-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Charts / Acordes
                  </label>
                  <textarea
                    name="charts"
                    rows={6}
                    placeholder="Pega la cifra Nashville o los acordes aquí..."
                    className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-lime-500/50 focus:ring-2 focus:ring-lime-500/20"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300 active:bg-lime-500"
                >
                  Aprobar
                </button>
              </form>

              {/* Formulario de Rechazo */}
              <form action={resolverSugerencia}>
                <input type="hidden" name="id_cancion" value={c.id_cancion} />
                <input type="hidden" name="decision"   value="RECHAZADA" />
                <button
                  type="submit"
                  className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 transition-colors hover:border-red-500/70 hover:text-red-300"
                >
                  Rechazar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

    </main>
  );
}
