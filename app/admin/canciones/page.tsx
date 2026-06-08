import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronDown, ShieldCheck, Check } from "lucide-react";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { resolverSugerencia } from "@/app/actions/canciones";
import { CargarCancion } from "@/components/CargarCancion";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/Button";

export default async function AdminCancionesPage(props: {
  searchParams: Promise<{ error?: string; eliminada?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") redirect("/");

  const errorMsg   = typeof searchParams.error    === "string" ? searchParams.error    : null;
  const eliminada  = searchParams.eliminada === "1";

  const pendientes = await db
    .select()
    .from(canciones)
    .where(eq(canciones.estado_aprobacion, "PENDIENTE"))
    .orderBy(canciones.nombre);

  return (
    <main className="flex flex-col gap-6 px-4 pt-8 pb-6">

      <div className="flex items-center justify-between">
        <Link
          href="/canciones"
          className="inline-flex items-center gap-1.5 text-xs text-lo transition-colors hover:text-hi"
        >
          <ArrowLeft size={13} />
          Catálogo
        </Link>
        <Link
          href="/admin/estadisticas"
          className="inline-flex items-center gap-1.5 text-xs text-violet-600/70 transition-colors hover:text-violet-600"
        >
          Estadísticas →
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
          <ShieldCheck size={16} className="text-violet-600" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-hi">Moderación</h1>
          <p className="mt-0.5 text-xs text-lo">
            {pendientes.length}{" "}
            {pendientes.length === 1 ? "canción pendiente" : "canciones pendientes"}
          </p>
        </div>
      </div>

      <ErrorBanner message={errorMsg} />
      {eliminada && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <Check size={13} className="text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Canción eliminada correctamente.</span>
        </div>
      )}

      {pendientes.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-10 text-center text-sm text-lo">
          Sin canciones pendientes de revisión.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pendientes.map((c) => (
            <li key={c.id_cancion} className="overflow-hidden rounded-2xl border border-line border-l-2 border-l-amber-500/60 bg-card">
              <details className="group">

                <summary className="flex cursor-pointer select-none list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-hi">{c.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {c.metrica && (
                      <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-mid">{c.metrica}</span>
                    )}
                    {c.bpm && (
                      <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-mid">{c.bpm} BPM</span>
                    )}
                    {(c.letra || c.charts) && (
                      <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                        con datos
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className="shrink-0 text-lo transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>

                <div className="space-y-4 border-t border-line px-5 py-5">

                  {/* Aprobar */}
                  <form action={resolverSugerencia} className="space-y-3">
                    <input type="hidden" name="id_cancion" value={c.id_cancion} />
                    <input type="hidden" name="decision"   value="APROBADA" />

                    <CargarCancion
                      defaultLetra={c.letra ?? ""}
                      defaultCharts={c.charts ?? ""}
                    />

                    <Button type="submit" variant="success" icon={<Check size={14} />}>
                      Aprobar
                    </Button>
                  </form>

                  <form action={resolverSugerencia}>
                    <input type="hidden" name="id_cancion" value={c.id_cancion} />
                    <input type="hidden" name="decision"   value="RECHAZADA" />
                    <button
                      type="submit"
                      className="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-600 transition-colors hover:border-red-500/50 hover:bg-red-500/10 dark:text-red-400"
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
