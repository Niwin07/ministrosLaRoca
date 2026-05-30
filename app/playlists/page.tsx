import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, or } from "drizzle-orm";
import {
  Music2,
  ChevronRight,
  Plus,
  ListMusic,
  FlaskConical,
  Archive,
} from "lucide-react";
import { db } from "@/db";
import { playlists, usuarios } from "@/db/schema";
import { auth } from "@/auth";
import { crearPlaylist, instanciarPreset } from "@/app/actions/playlists";
import { promoverDefinitivasAMazo } from "@/lib/playlist-utils";

// ── Estilos compartidos ───────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  PREPARACION: "bg-lime-400/10 text-lime-400",
  ENSAYO:      "bg-yellow-400/10 text-yellow-400",
  DEFINITIVA:  "bg-blue-500/10 text-blue-400",
  MAZO:        "bg-zinc-800 text-zinc-500",
};

// ── Subcomponentes ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  titulo,
  descripcion,
  acento,
}: {
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  acento: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${acento}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-white">{titulo}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{descripcion}</p>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function PlaylistsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id_usuario } = session.user;

  // JIT: promover DEFINITIVA → MAZO si superan las 24 h (todas las playlists)
  await promoverDefinitivasAMazo();

  // ── Queries en paralelo ───────────────────────────────────────────────────

  const [misListas, ensayos, mazosArchivo] = await Promise.all([

    // 1. Mis listas (propias, todos los tipos y estados)
    db
      .select()
      .from(playlists)
      .where(eq(playlists.id_usuario, id_usuario))
      .orderBy(desc(playlists.id_playlist)),

    // 2. Ensayos de la semana — cualquier usuario, ENSAYO o DEFINITIVA
    db
      .select({
        id_playlist:    playlists.id_playlist,
        nombre:         playlists.nombre,
        estado:         playlists.estado,
        nombre_usuario: usuarios.nombre,
      })
      .from(playlists)
      .innerJoin(usuarios, eq(playlists.id_usuario, usuarios.id_usuario))
      .where(
        and(
          eq(playlists.tipo, "EVENTO"),
          or(eq(playlists.estado, "ENSAYO"), eq(playlists.estado, "DEFINITIVA"))
        )
      )
      .orderBy(desc(playlists.actualizadoEn)),

    // 3. Archivo de mazos — cualquier usuario, solo MAZO
    db
      .select({
        id_playlist:    playlists.id_playlist,
        nombre:         playlists.nombre,
        nombre_usuario: usuarios.nombre,
      })
      .from(playlists)
      .innerJoin(usuarios, eq(playlists.id_usuario, usuarios.id_usuario))
      .where(
        and(eq(playlists.tipo, "EVENTO"), eq(playlists.estado, "MAZO"))
      )
      .orderBy(desc(playlists.id_playlist)),
  ]);

  // ── Server Actions ────────────────────────────────────────────────────────

  async function handleInstanciarPreset(formData: FormData) {
    "use server";
    const id_preset = Number(formData.get("id_preset"));
    await instanciarPreset(id_preset);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 px-4 pt-8 pb-4">

      {/* ══ SECCIÓN 1: MIS LISTAS ══════════════════════════════════════════ */}
      <section className="flex flex-col gap-4">

        <SectionHeader
          icon={<ListMusic size={18} className="text-purple-400" />}
          titulo="Mis Listas"
          descripcion="Tus presets y eventos propios."
          acento="border-purple-800/30 bg-purple-950/20"
        />

        {/* Formulario: crear nueva lista */}
        <div className="rounded-2xl border border-purple-800/30 bg-gradient-to-br from-purple-950/60 via-zinc-900 to-zinc-900 p-5 shadow-lg shadow-purple-900/20">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-purple-400">
            Nueva Lista
          </p>
          <form action={crearPlaylist} className="flex gap-2">
            <input
              name="nombre"
              type="text"
              placeholder="Nombre de la lista…"
              required
              className="min-w-0 flex-1 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
            >
              <Plus size={16} strokeWidth={2.5} />
              Crear
            </button>
          </form>
        </div>

        {/* Listado */}
        {misListas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <ListMusic size={24} className="text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500">No tenés listas todavía.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {misListas.map((lista) => (
              <div
                key={lista.id_playlist}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-4 backdrop-blur-sm transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/60"
              >
                <Link
                  href={`/playlists/${lista.id_playlist}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                    <Music2 size={20} className="text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {lista.nombre}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                        {lista.tipo}
                      </span>
                      {lista.estado && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            ESTADO_BADGE[lista.estado] ?? "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {lista.estado}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  {lista.tipo === "PRESET" && (
                    <form action={handleInstanciarPreset}>
                      <input type="hidden" name="id_preset" value={lista.id_playlist} />
                      <button
                        type="submit"
                        className="rounded-lg border border-lime-500/30 bg-lime-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-lime-400 transition-colors hover:bg-lime-500/20 hover:text-lime-300"
                      >
                        Usar como Lista
                      </button>
                    </form>
                  )}
                  <ChevronRight size={16} className="text-zinc-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══ SECCIÓN 2: ENSAYOS DE LA SEMANA ═══════════════════════════════ */}
      <section className="flex flex-col gap-4">

        <SectionHeader
          icon={<FlaskConical size={18} className="text-yellow-400" />}
          titulo="Ensayos de la Semana"
          descripcion="Listas en preparación de cualquier ministro. Solo lectura."
          acento="border-yellow-500/20 bg-yellow-500/5"
        />

        {ensayos.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800/40 bg-zinc-900/40 px-5 py-5 text-sm text-zinc-600">
            No hay listas en ensayo esta semana.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {ensayos.map((lista) => (
              <Link
                key={lista.id_playlist}
                href={`/playlists/${lista.id_playlist}`}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-4 transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10">
                  <Music2 size={18} className="text-yellow-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {lista.nombre}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {lista.nombre_usuario}
                  </p>
                </div>
                {lista.estado && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      ESTADO_BADGE[lista.estado] ?? "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {lista.estado}
                  </span>
                )}
                <ChevronRight size={15} className="shrink-0 text-zinc-600" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══ SECCIÓN 3: ARCHIVO DE MAZOS ═══════════════════════════════════ */}
      <section className="flex flex-col gap-4">

        <SectionHeader
          icon={<Archive size={18} className="text-zinc-400" />}
          titulo="Archivo de Mazos"
          descripcion="Listas definitivas. Entrá, revisá y cloná para reutilizar."
          acento="border-zinc-700/30 bg-zinc-800/20"
        />

        {mazosArchivo.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800/40 bg-zinc-900/40 px-5 py-5 text-sm text-zinc-600">
            Todavía no hay mazos archivados.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {mazosArchivo.map((lista) => (
              <Link
                key={lista.id_playlist}
                href={`/playlists/${lista.id_playlist}`}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-4 transition-colors hover:border-zinc-700/60 hover:bg-zinc-800/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700/30 bg-zinc-800/60">
                  <Music2 size={18} className="text-zinc-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {lista.nombre}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {lista.nombre_usuario}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-medium text-zinc-500">
                  MAZO
                </span>
                <ChevronRight size={15} className="shrink-0 text-zinc-600" />
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
