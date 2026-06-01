import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { resolverSugerencia } from "@/app/actions/canciones";

export default async function AdminCancionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") redirect("/");

  const pendientes = await db
    .select()
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "PENDIENTE"))
    .orderBy(canciones.nombre);

  return (
    <main className="flex flex-col gap-6 px-4 pt-8 pb-6">

      <Link
        href="/canciones"
        className="inline-flex items-center gap-1.5 text-xs text-content-muted transition-colors hover:text-content-primary"
      >
        <ArrowLeft size={13} />
        Catálogo
      </Link>

      <div>
        <h1 className="text-xl font-bold text-white">Moderación</h1>
        <p className="mt-0.5 text-xs text-content-muted">
          {pendientes.length}{" "}
          {pendientes.length === 1 ? "canción pendiente" : "canciones pendientes"}
        </p>
      </div>

      {pendientes.length === 0 ? (
        <p className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-10 text-center text-sm text-content-muted">
          Sin canciones pendientes de revisión.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pendientes.map((c) => (
            <li key={c.id_cancion} className="overflow-hidden rounded-2xl border border-glass-base bg-glass-subtle">
              <details className="group">

                <summary className="flex cursor-pointer select-none list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.nombre}</p>
                    <p className="mt-0.5 text-xs text-content-muted">{c.artista}</p>
                  </div>
                  <ChevronDown
                    size={14}
                    className="shrink-0 text-content-muted transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>

                <div className="border-t border-glass-base px-5 py-5 space-y-4">

                  {/* Aprobar */}
                  <form action={resolverSugerencia} className="space-y-3">
                    <input type="hidden" name="id_cancion" value={c.id_cancion} />
                    <input type="hidden" name="decision"   value="APROBADA" />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-content-muted">
                        Letra
                      </label>
                      <textarea
                        name="letra"
                        rows={5}
                        placeholder="Pegá la letra aquí…"
                        className="w-full resize-y rounded-xl border border-glass-elevated bg-glass-base px-3 py-2.5 font-mono text-sm text-content-primary placeholder-content-muted outline-none focus:border-lime-500/40 focus:ring-2 focus:ring-lime-500/15"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-content-muted">
                        Charts
                      </label>
                      <textarea
                        name="charts"
                        rows={5}
                        placeholder="Cifra Nashville o acordes…"
                        className="w-full resize-y rounded-xl border border-glass-elevated bg-glass-base px-3 py-2.5 font-mono text-sm text-content-primary placeholder-content-muted outline-none focus:border-lime-500/40 focus:ring-2 focus:ring-lime-500/15"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300 active:bg-lime-500"
                    >
                      Aprobar
                    </button>
                  </form>

                  <form action={resolverSugerencia}>
                    <input type="hidden" name="id_cancion" value={c.id_cancion} />
                    <input type="hidden" name="decision"   value="RECHAZADA" />
                    <button
                      type="submit"
                      className="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:border-red-500/60 hover:text-red-300"
                    >
                      Rechazar
                    </button>
                  </form>

                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

    </main>
  );
}
