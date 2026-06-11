import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { db } from "@/db";
import { canciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { CargarCancion } from "@/components/CargarCancion";
import { ErrorBanner } from "@/components/ErrorBanner";
import { actualizarCancion } from "@/app/actions/canciones";
import { METRICAS } from "@/lib/metricas";
import { Button } from "@/components/Button";
import { EliminarCancionButton } from "@/components/EliminarCancionButton";

export default async function EditarCancionPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR" && session.user.rol !== "LIDER") redirect("/");

  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const errorMsg = typeof searchParams.error === "string" ? searchParams.error : null;

  const [c] = await db.select().from(canciones).where(eq(canciones.id_cancion, id));
  if (!c) notFound();

  const inputCls =
    "w-full rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30";

  return (
    <main className="flex flex-col gap-5 px-4 pt-8 pb-10 md:max-w-2xl md:mx-auto">

      <Link
        href="/canciones"
        className="inline-flex items-center gap-1.5 text-xs text-lo transition-colors hover:text-hi"
      >
        <ArrowLeft size={13} />
        Catálogo
      </Link>

      <div>
        <h1 className="text-xl font-bold text-hi">Editar canción</h1>
        <p className="mt-0.5 text-xs text-lo">Corregí la letra, los acordes o los datos.</p>
      </div>

      <ErrorBanner message={errorMsg} />

      <form action={actualizarCancion} className="flex flex-col gap-3">
        <input type="hidden" name="id_cancion" value={c.id_cancion} />

        <input name="nombre" defaultValue={c.nombre} placeholder="Nombre de la canción *" required className={inputCls} />
        <input name="artista" defaultValue={c.artista} placeholder="Artista *" required className={inputCls} />

        <div className="flex gap-2">
          <select
            name="metrica"
            defaultValue={c.metrica ?? ""}
            className={`${inputCls} flex-1 [&>option]:bg-card`}
          >
            <option value="">Métrica…</option>
            {METRICAS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            name="bpm"
            type="number"
            min={1}
            max={300}
            defaultValue={c.bpm ?? ""}
            placeholder="BPM"
            className="w-24 rounded-xl border border-mark bg-input px-3 py-3 text-center text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          />
        </div>

        <CargarCancion defaultLetra={c.letra ?? ""} defaultCharts={c.charts ?? ""} nombre={c.nombre} artista={c.artista} />

        <Button type="submit" className="mt-1 self-start" icon={<Save size={14} />}>
          Guardar cambios
        </Button>
      </form>

      {/* ── Zona de peligro ─────────────────────────────────────────── */}
      {session.user.rol === "ADMINISTRADOR" && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-4 py-4">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">Zona de peligro</p>
          <p className="mt-1 text-xs text-lo">
            Eliminar borra la canción permanentemente. Solo es posible si no está en ninguna lista.
          </p>
          <EliminarCancionButton id={c.id_cancion} nombre={c.nombre} />
        </div>
      )}
    </main>
  );
}
