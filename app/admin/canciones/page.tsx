import Link from "next/link";
import { BotonConfirmado } from "@/components/zarza/Confirmacion";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronDown, Check } from "lucide-react";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { resolverSugerencia } from "@/app/actions/canciones";
import { CargarCancion } from "@/components/CargarCancion";
import { ErrorBanner } from "@/components/ErrorBanner";
import { cls } from "@/components/zarza/ui";
import { IconoMarca } from "@/components/zarza/IconoMarca";
import { X } from "lucide-react";

export default async function AdminCancionesPage(props: {
  searchParams: Promise<{ error?: string; eliminada?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") redirect("/");

  const errorMsg   = typeof searchParams.error    === "string" ? searchParams.error    : null;
  const eliminada  = searchParams.eliminada === "1";

  // Solo las columnas que esta página renderiza/pasa a CargarCancion.
  const pendientes = await db
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
    .where(eq(canciones.estado_aprobacion, "PENDIENTE"))
    .orderBy(canciones.nombre);

  return (
    <main className="flex w-full max-w-3xl flex-col gap-6 px-4 pb-8 pt-7 md:px-0 md:pt-2">

      <div className="flex items-center justify-between">
        <Link
          href="/canciones"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-hi transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={13} />
          Repertorio
        </Link>
        <Link
          href="/admin/estadisticas"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fuego-600 hover:underline dark:text-[#ef7a4c]"
        >
          Estadísticas →
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center">
          <IconoMarca nombre="escudo" size={40} />
        </span>
        <div>
          <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-hi">Moderación</h1>
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
        <p className="rounded-[22px] border border-dashed border-mark bg-card/60 px-5 py-10 text-center text-sm text-lo">
          Sin canciones pendientes de revisión.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pendientes.map((c) => (
            <li key={c.id_cancion} className="overflow-hidden rounded-2xl border border-line border-l-2 border-l-[rgba(217,134,74,0.6)] bg-card">
              <details className="group">

                <summary className="flex cursor-pointer select-none list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-hi">{c.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {c.metrica && (
                      <span className="rounded-full bg-input px-2 py-0.5 text-[10px] font-medium text-mid">{c.metrica}</span>
                    )}
                    {c.bpm && (
                      <span className="rounded-full bg-input px-2 py-0.5 text-[10px] font-medium text-mid">{c.bpm} BPM</span>
                    )}
                    {(c.letra || c.charts) && (
                      <span className="rounded-full border border-fuego-600/30 bg-fuego-600/10 px-2 py-0.5 text-[10px] font-medium text-fuego-600 dark:text-[#df8067]">
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

                    <button type="submit" className={cls.btnLlama}>
                      <Check size={15} aria-hidden /> Aprobar
                    </button>
                  </form>

                  <form action={resolverSugerencia}>
                    <input type="hidden" name="id_cancion" value={c.id_cancion} />
                    <input type="hidden" name="decision"   value="RECHAZADA" />
                    <BotonConfirmado
                      confirmacion={{
                        titulo: "¿Rechazar la sugerencia?",
                        mensaje: `“${c.nombre}” no se suma al repertorio y se le avisa a quien la sugirió.`,
                        confirmar: "Rechazar",
                      }}
                      className={`${cls.btnSec} text-mid`}
                    >
                      <X size={15} aria-hidden /> Rechazar
                    </BotonConfirmado>
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
