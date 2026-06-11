import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Music2, Flame, Clock, UserCircle2 } from "lucide-react";
import { db } from "@/db";
import { canciones, lista_canciones, playlists, usuarios } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";

type Orden = "mas-usadas" | "menos-usadas" | "az" | "sin-usar";

function formatFecha(d: Date | string | null): string {
  if (!d) return "Nunca";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const dias = Math.floor(diff / 86_400_000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
  return `Hace ${Math.floor(dias / 365)} años`;
}

export default async function EstadisticasPage(props: {
  searchParams: Promise<{ orden?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") redirect("/");

  const orden: Orden =
    (["mas-usadas", "menos-usadas", "az", "sin-usar"] as const).includes(
      searchParams.orden as Orden
    )
      ? (searchParams.orden as Orden)
      : "mas-usadas";

  const rows = await db
    .select({
      id_cancion:      canciones.id_cancion,
      nombre:          canciones.nombre,
      artista:         canciones.artista,
      bpm:             canciones.bpm,
      metrica:         canciones.metrica,
      sugeridor:       usuarios.nombre,
      veces_usada:     sql<number>`COUNT(DISTINCT ${lista_canciones.id_lista_cancion})`,
      ultima_vez:      sql<string | null>`MAX(${playlists.actualizadoEn})`,
    })
    .from(canciones)
    .leftJoin(lista_canciones, eq(lista_canciones.id_cancion, canciones.id_cancion))
    .leftJoin(
      playlists,
      and(
        eq(playlists.id_playlist, lista_canciones.id_playlist),
        eq(playlists.tipo, "EVENTO"),
      ),
    )
    .leftJoin(usuarios, eq(usuarios.id_usuario, canciones.id_usuario_sugeridor))
    .where(eq(canciones.estado_aprobacion, "APROBADA"))
    .groupBy(
      canciones.id_cancion,
      canciones.nombre,
      canciones.artista,
      canciones.bpm,
      canciones.metrica,
      usuarios.nombre,
    );

  // Ordenar en JS para evitar duplicar la query por cada sort
  const datos = [...rows].sort((a, b) => {
    if (orden === "mas-usadas")   return Number(b.veces_usada) - Number(a.veces_usada) || a.nombre.localeCompare(b.nombre);
    if (orden === "menos-usadas") return Number(a.veces_usada) - Number(b.veces_usada) || a.nombre.localeCompare(b.nombre);
    if (orden === "az")           return a.nombre.localeCompare(b.nombre);
    if (orden === "sin-usar")     return Number(a.veces_usada) - Number(b.veces_usada) || a.nombre.localeCompare(b.nombre);
    return 0;
  });

  const lista = orden === "sin-usar" ? datos.filter((c) => Number(c.veces_usada) === 0) : datos;

  const total    = rows.length;
  const usadas   = rows.filter((c) => Number(c.veces_usada) > 0).length;
  const sinUsar  = total - usadas;
  const maxUsos  = Math.max(...rows.map((c) => Number(c.veces_usada)), 0);
  const top      = rows.find((c) => Number(c.veces_usada) === maxUsos);

  const ORDENES: { key: Orden; label: string }[] = [
    { key: "mas-usadas",   label: "Más tocadas"   },
    { key: "menos-usadas", label: "Menos tocadas" },
    { key: "az",           label: "A → Z"         },
    { key: "sin-usar",     label: "Sin usar"      },
  ];

  return (
    <main className="flex flex-col gap-6 px-4 pt-8 pb-24">

      <Link
        href="/admin/canciones"
        className="inline-flex items-center gap-1.5 text-xs text-lo transition-colors hover:text-hi"
      >
        <ArrowLeft size={13} />
        Moderación
      </Link>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10">
          <BarChart3 size={18} className="text-violet-600" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">Admin</p>
          <h1 className="text-xl font-bold text-hi">Estadísticas del repertorio</h1>
        </div>
      </div>

      {/* ── Layout 2-col en desktop ───────────────────────────────────── */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">

        {/* Col izquierda: lista ordenable */}
        <div className="flex flex-col gap-4">

          {/* Ordenar */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {ORDENES.map((o) => (
              <Link
                key={o.key}
                href={`/admin/estadisticas?orden=${o.key}`}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  orden === o.key
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-600"
                    : "border-mark bg-input text-mid hover:border-line hover:text-hi"
                }`}
              >
                {o.label}
                {o.key === "sin-usar" && sinUsar > 0 && (
                  <span className="ml-1.5 rounded-full bg-gone/30 px-1.5 text-[10px]">{sinUsar}</span>
                )}
              </Link>
            ))}
          </div>

          <p className="text-xs text-lo">{lista.length} canciones</p>

          {lista.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card px-4 py-8 text-center text-sm text-lo">
              Todas las canciones han sido usadas al menos una vez.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lista.map((c, i) => {
                const usos = Number(c.veces_usada);
                return (
                  <li key={c.id_cancion} className="overflow-hidden rounded-2xl border border-line bg-card shadow-card dark:shadow-none">
                    <div className="flex items-start gap-3 px-4 py-4">
                      {orden === "mas-usadas" && (
                        <span className={`mt-0.5 w-5 shrink-0 text-right text-xs font-bold tabular-nums ${
                          i === 0 ? "text-orange-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-600" : "text-gone"
                        }`}>
                          {i + 1}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-hi">{c.nombre}</p>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            usos === 0
                              ? "bg-input text-gone"
                              : usos >= 5
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                              : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                          }`}>
                            {usos === 0 ? "Sin usar" : `${usos}×`}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-lo">{c.artista}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {c.metrica && <span className="text-[11px] text-mid">{c.metrica}</span>}
                          {c.bpm && <span className="text-[11px] text-mid">{c.bpm} BPM</span>}
                          <span className="flex items-center gap-1 text-[11px] text-lo">
                            <Clock size={10} />
                            {formatFecha(c.ultima_vez)}
                          </span>
                          {c.sugeridor && (
                            <span className="flex items-center gap-1 text-[11px] text-lo">
                              <UserCircle2 size={10} />
                              {c.sugeridor}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/admin/canciones/${c.id_cancion}`} className="mt-0.5 shrink-0 text-[11px] text-violet-600/60 transition-colors hover:text-violet-600">
                        Editar
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Col derecha: resumen + más tocada (sticky) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-8">

          {/* Cards resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            <div className="flex flex-col gap-1 rounded-2xl border border-line bg-card p-4 shadow-card dark:shadow-none">
              <Music2 size={16} className="text-violet-500" />
              <p className="text-2xl font-black text-hi">{total}</p>
              <p className="text-[11px] text-lo leading-tight">Canciones aprobadas</p>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-line bg-card p-4 shadow-card dark:shadow-none">
              <Flame size={16} className="text-orange-500" />
              <p className="text-2xl font-black text-hi">{usadas}</p>
              <p className="text-[11px] text-lo leading-tight">Usadas en listas</p>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-line bg-card p-4 shadow-card dark:shadow-none">
              <Clock size={16} className="text-gone" />
              <p className="text-2xl font-black text-hi">{sinUsar}</p>
              <p className="text-[11px] text-lo leading-tight">Sin usar aún</p>
            </div>
          </div>

          {/* Canción más tocada */}
          {top && maxUsos > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] px-4 py-3.5">
              <Flame size={18} className="shrink-0 text-orange-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-600">Más tocada</p>
                <p className="truncate text-sm font-bold text-hi">{top.nombre}</p>
                <p className="text-[11px] text-lo">{top.artista} · {maxUsos} veces</p>
              </div>
            </div>
          )}

        </div>
      </div>

    </main>
  );
}
