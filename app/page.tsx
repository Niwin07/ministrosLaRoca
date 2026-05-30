import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Music2, Clock, Flame } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { playlists, lista_canciones } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type MazoReciente = {
  id:        number;
  nombre:    string;
  fecha:     string;
  canciones: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(d: Date | null): string {
  if (!d) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  }).format(d);
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function HeroCardMinistro() {
  return (
    <Link href="/turnos">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-400 to-purple-600 p-6 shadow-xl shadow-purple-900/40">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 -left-4 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={15} className="text-purple-200" />
            <span className="text-xs font-medium uppercase tracking-widest text-purple-200">
              Tu próximo servicio
            </span>
          </div>
          <p className="text-2xl font-bold text-white">Próximo Sábado</p>
          <p className="mt-1 text-sm text-purple-200">Estado · PENDIENTE</p>

          <div className="mt-5 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            Ver lista <ChevronRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function HeroCardAdmin() {
  return (
    <Link href="/playlists">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-400 to-purple-600 p-6 shadow-xl shadow-purple-900/40">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 -left-4 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Flame size={15} className="text-purple-200" />
            <span className="text-xs font-medium uppercase tracking-widest text-purple-200">
              Crear Pre-set
            </span>
          </div>
          <p className="text-2xl font-bold text-white">Nueva Plantilla</p>
          <p className="mt-1 text-sm text-purple-200">Armá tu lista reutilizable</p>

          <div className="mt-5 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            Empezar <ChevronRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function MazoCard({ mazo }: { mazo: MazoReciente }) {
  return (
    <Link href={`/playlists/${mazo.id}`}>
      <div className="flex items-center gap-4 rounded-2xl bg-zinc-900 px-4 py-4 transition-colors hover:bg-zinc-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
          <Music2 size={20} className="text-purple-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {mazo.nombre}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{mazo.fecha}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-zinc-500">
          <span className="text-xs">{mazo.canciones} temas</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id_usuario, rol } = session.user;
  const primerNombre = (session.user.name ?? "").split(" ")[0];
  const esMinistro = rol === "MINISTRO";

  const rows = await db
    .select({
      id_playlist:      playlists.id_playlist,
      nombre:           playlists.nombre,
      fecha_programada: playlists.fecha_programada,
      total:            sql<number>`COUNT(${lista_canciones.id_cancion})`,
    })
    .from(playlists)
    .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
    .where(eq(playlists.id_usuario, id_usuario))
    .groupBy(playlists.id_playlist, playlists.nombre, playlists.fecha_programada)
    .orderBy(desc(playlists.id_playlist))
    .limit(3);

  const mazos: MazoReciente[] = rows.map((r) => ({
    id:        r.id_playlist,
    nombre:    r.nombre,
    fecha:     formatFecha(r.fecha_programada),
    canciones: Number(r.total),
  }));

  return (
    <div className="flex flex-col gap-6 px-4 pt-10">

      {/* Saludo */}
      <div>
        <p className="text-sm text-zinc-500">Bienvenido de nuevo</p>
        <h1 className="text-2xl font-bold text-white">
          Hola, {primerNombre}
        </h1>
      </div>

      {/* Tarjeta hero */}
      {esMinistro ? <HeroCardMinistro /> : <HeroCardAdmin />}

      {/* Mazos recientes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400">
            Mazos recientes
          </h2>
          <Link
            href="/playlists"
            className="text-xs font-medium text-purple-400 hover:text-purple-300"
          >
            Ver todos
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {mazos.length === 0 ? (
            <p className="text-sm text-zinc-600 py-4 text-center">
              Aún no tenés listas creadas.
            </p>
          ) : (
            mazos.map((mazo) => <MazoCard key={mazo.id} mazo={mazo} />)
          )}
        </div>
      </section>

    </div>
  );
}
