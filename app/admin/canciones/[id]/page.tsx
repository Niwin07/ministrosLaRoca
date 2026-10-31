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
import { ESTILOS, TONOS_CANCION } from "@/lib/estilos";
import { esColumnaFaltante } from "@/lib/modulos";
import { SelectorZarza } from "@/components/zarza/SelectorZarza";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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

  const campos = {
    id_cancion: canciones.id_cancion,
    nombre:     canciones.nombre,
    artista:    canciones.artista,
    bpm:        canciones.bpm,
    metrica:    canciones.metrica,
    letra:      canciones.letra,
    charts:     canciones.charts,
  };
  type Fila = {
    id_cancion: number; nombre: string; artista: string; bpm: number | null; metrica: string | null;
    letra: string | null; charts: string | null; estilo?: string | null; tono?: string | null;
  };
  let c: Fila | undefined;
  let sinEstilo = false;
  try {
    [c] = await db.select({ ...campos, estilo: canciones.estilo, tono: canciones.tono }).from(canciones).where(eq(canciones.id_cancion, id));
  } catch (e) {
    // Sin la migración 010 todavía: se edita sin estilo/tono.
    if (!esColumnaFaltante(e)) throw e;
    sinEstilo = true;
    [c] = await db.select(campos).from(canciones).where(eq(canciones.id_cancion, id));
  }
  if (!c) notFound();

  return (
    <main className="flex w-full max-w-2xl flex-col gap-5 px-4 pb-10 pt-7 md:px-0 md:pt-2">

      <Link
        href="/canciones"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-hi transition-opacity hover:opacity-75"
      >
        <ArrowLeft size={13} />
        Repertorio
      </Link>

      <div>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-hi">Editar canción</h1>
        <p className="mt-0.5 text-xs text-lo">Corregí la letra, los acordes o los datos.</p>
      </div>

      <ErrorBanner message={errorMsg} />

      <form action={actualizarCancion} className="flex flex-col gap-3">
        <input type="hidden" name="id_cancion" value={c.id_cancion} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input id="nombre" name="nombre" defaultValue={c.nombre} label="Nombre de la canción" required />
          <Input id="artista" name="artista" defaultValue={c.artista} label="Artista" required />
        </div>

        {!sinEstilo && (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectorZarza name="estilo" label="Estilo" opciones={ESTILOS} defaultValue={c.estilo ?? ""} />
            <SelectorZarza name="tono" label="Tono" opciones={TONOS_CANCION} defaultValue={c.tono ?? ""} />
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <Label htmlFor="metrica">Métrica</Label>
            <select
              id="metrica"
              name="metrica"
              defaultValue={c.metrica ?? ""}
              className="w-full rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 [&>option]:bg-card"
            >
              <option value="">Sin definir…</option>
              {METRICAS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <Input
            id="bpm"
            name="bpm"
            type="number"
            min={1}
            max={300}
            defaultValue={c.bpm ?? ""}
            label="BPM"
            wrapperClassName="w-24"
            className="text-center"
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
