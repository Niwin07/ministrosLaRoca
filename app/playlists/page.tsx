import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, or } from "drizzle-orm";
import { ChevronRight, Plus, ListMusic, FlaskConical, Archive, Copy } from "lucide-react";
import { ESTADO_LABEL } from "@/lib/estados";
import { db } from "@/db";
import { playlists, usuarios } from "@/db/schema";
import { auth } from "@/auth";
import { crearPlaylist, instanciarPreset } from "@/app/actions/playlists";

const ESTADO_DOT: Record<string, string> = {
  PREPARACION: "bg-lime-400",
  ENSAYO:      "bg-yellow-400",
  DEFINITIVA:  "bg-blue-400",
  MAZO:        "bg-glass-highlight",
};

const ESTADO_TEXT: Record<string, string> = {
  PREPARACION: "text-lime-400",
  ENSAYO:      "text-yellow-400",
  DEFINITIVA:  "text-blue-400",
  MAZO:        "text-content-secondary",
};

export default async function PlaylistsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id_usuario } = session.user;

  const [misListas, ensayos, mazosArchivo] = await Promise.all([
    db
      .select()
      .from(playlists)
      .where(eq(playlists.id_usuario, id_usuario))
      .orderBy(desc(playlists.id_playlist)),

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

    db
      .select({
        id_playlist:    playlists.id_playlist,
        nombre:         playlists.nombre,
        nombre_usuario: usuarios.nombre,
      })
      .from(playlists)
      .innerJoin(usuarios, eq(playlists.id_usuario, usuarios.id_usuario))
      .where(and(eq(playlists.tipo, "EVENTO"), eq(playlists.estado, "MAZO")))
      .orderBy(desc(playlists.id_playlist)),
  ]);

  async function handleInstanciarPreset(formData: FormData) {
    "use server";
    const id_preset = Number(formData.get("id_preset"));
    await instanciarPreset(id_preset);
  }

  return (
    <div className="flex flex-col gap-8 px-4 pt-8 pb-6">

      {/* Encabezado de página */}
      <div>
        <h1 className="text-2xl font-bold text-white">Listas</h1>
        <p className="mt-1 text-sm text-content-muted">
          Organizá las canciones de cada servicio.
        </p>
      </div>

      {/* ══ ENSAYOS DE LA SEMANA ═══════════════════════════════════ */}
      <section className="flex flex-col gap-3">

        <div>
          <div className="flex items-center gap-2">
            <FlaskConical size={13} className="text-yellow-400/70" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-400/80">
              Ensayos de la Semana
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-content-muted pl-5">
            Listas que el equipo está practicando ahora.
          </p>
        </div>

        {ensayos.length === 0 ? (
          <p className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-6 text-sm text-content-secondary">
            Sin listas en ensayo esta semana.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {ensayos.map((lista) => (
              <Link
                key={lista.id_playlist}
                href={`/playlists/${lista.id_playlist}`}
                className="flex items-center gap-4 rounded-2xl border border-glass-highlight bg-glass-base px-5 py-5 backdrop-blur-sm transition-all duration-300 ease-out hover:border-glass-highlight hover:bg-glass-elevated active:scale-[0.98]"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    lista.estado ? (ESTADO_DOT[lista.estado] ?? "bg-glass-highlight") : "bg-glass-highlight"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">{lista.nombre}</p>
                  <p className="mt-0.5 truncate text-xs text-content-secondary">{lista.nombre_usuario}</p>
                </div>
                {lista.estado && (
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      lista.estado === "DEFINITIVA"
                        ? "border-blue-400/30 bg-blue-400/10 text-blue-400"
                        : "border-yellow-400/30 bg-yellow-400/10 text-yellow-400"
                    }`}
                  >
                    {ESTADO_LABEL[lista.estado!] ?? lista.estado}
                  </span>
                )}
                <ChevronRight size={15} className="shrink-0 text-content-muted" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══ MIS LISTAS ══════════════════════════════════════════════ */}
      <section className="flex flex-col gap-2">

        <div>
          <div className="flex items-center gap-2">
            <ListMusic size={12} className="text-content-muted" />
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-content-muted">
              Mis Listas
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-content-muted pl-4">
            Las listas que creaste vos.
          </p>
        </div>

        {misListas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ListMusic size={24} className="text-glass-highlight" />
            <p className="text-sm text-content-secondary">No tenés listas todavía.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {misListas.map((lista) => (
              <div
                key={lista.id_playlist}
                className="flex items-center gap-3 rounded-xl border border-transparent bg-glass-subtle px-3.5 py-3 transition-all duration-200 hover:bg-glass-base active:scale-[0.98]"
              >
                <Link
                  href={`/playlists/${lista.id_playlist}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      lista.estado ? (ESTADO_DOT[lista.estado] ?? "bg-glass-highlight") : "bg-glass-highlight"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-primary">{lista.nombre}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-content-secondary">
                      <span>{lista.tipo === "EVENTO" ? "Evento" : lista.tipo === "PRESET" ? "Plantilla" : lista.tipo}</span>
                      {lista.estado && (
                        <>
                          <span>·</span>
                          <span className={ESTADO_TEXT[lista.estado] ?? "text-content-secondary"}>
                            {ESTADO_LABEL[lista.estado] ?? lista.estado}
                          </span>
                        </>
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
                        title="Usar como lista de evento"
                        className="rounded-lg border border-glass-elevated bg-glass-subtle px-2.5 py-1 text-[10px] font-medium text-content-secondary transition-all duration-200 hover:border-glass-highlight hover:text-content-primary"
                      >
                        Usar
                      </button>
                    </form>
                  )}
                  <ChevronRight size={13} className="text-content-muted" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══ SERVICIOS ANTERIORES ════════════════════════════════════ */}
      <section className="flex flex-col gap-2">

        <div>
          <div className="flex items-center gap-2">
            <Archive size={12} className="text-content-muted" />
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-content-muted">
              Servicios Anteriores
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-content-muted pl-4">
            Servicios finalizados. Podés clonarlos como base.
          </p>
        </div>

        {mazosArchivo.length === 0 ? (
          <p className="rounded-2xl border border-glass-base bg-glass-subtle px-5 py-5 text-sm text-content-secondary">
            Sin mazos archivados.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {mazosArchivo.map((lista) => (
              <Link
                key={lista.id_playlist}
                href={`/playlists/${lista.id_playlist}`}
                className="flex items-center gap-3 rounded-xl border border-transparent bg-glass-subtle px-3.5 py-3 transition-all duration-200 hover:bg-glass-base active:scale-[0.98]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-glass-highlight" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content-primary">{lista.nombre}</p>
                  <p className="mt-0.5 truncate text-[11px] text-content-secondary">{lista.nombre_usuario}</p>
                </div>
                {/* Affordance: el usuario sabe que puede clonar antes de entrar */}
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-glass-elevated bg-glass-subtle px-2 py-0.5 text-[10px] text-content-secondary">
                  <Copy size={9} />
                  Clonable
                </span>
                <ChevronRight size={13} className="shrink-0 text-content-muted" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══ CREAR NUEVA LISTA — AL FONDO, COLAPSABLE ════════════════ */}
      <section>
        <details className="group">
          <summary className="flex cursor-pointer select-none list-none items-center [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-glass-elevated px-4 py-2.5 transition-all duration-200 hover:border-glass-highlight group-open:border-purple-500/30">
              <Plus size={13} strokeWidth={2.5} className="text-content-secondary group-open:text-purple-400" />
              <span className="text-sm font-medium text-content-secondary group-open:text-purple-300">
                Nueva lista
              </span>
            </div>
          </summary>

          <form action={crearPlaylist} className="mt-3 flex gap-2">
            <input
              name="nombre"
              type="text"
              placeholder="Nombre de la lista…"
              required
              className="min-w-0 flex-1 rounded-xl border border-glass-elevated bg-glass-base px-4 py-3 text-sm text-white placeholder-content-muted outline-none backdrop-blur-sm transition-all duration-300 focus:border-purple-500/50 focus:bg-glass-elevated focus:ring-2 focus:ring-purple-500/20"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-600/80 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 ease-out hover:bg-purple-500/80 active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              Crear
            </button>
          </form>
        </details>
      </section>

    </div>
  );
}
