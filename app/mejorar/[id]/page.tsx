import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { mejorar_categorias, mejorar_videos } from "@/db/schema";
import { consultaModulo, puedeEditarContenido } from "@/lib/modulos";
import { AvisoMigracion } from "@/components/zarza/ui";
import { CategoriaVista } from "@/components/zarza/modulos/CategoriaVista";

export default async function CategoriaPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const puedeEditar = puedeEditarContenido(session.user.rol);

  const id = Number((await props.params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { datos, faltaMigracion } = await consultaModulo(
    () =>
      Promise.all([
        db.select().from(mejorar_categorias).where(eq(mejorar_categorias.id_categoria, id)).limit(1),
        db.select().from(mejorar_videos).where(eq(mejorar_videos.id_categoria, id)).orderBy(asc(mejorar_videos.orden), asc(mejorar_videos.id_video)),
      ]),
    [[], []] as [(typeof mejorar_categorias.$inferSelect)[], (typeof mejorar_videos.$inferSelect)[]],
  );

  if (faltaMigracion) {
    return <div className="px-4 pt-6 md:px-0"><AvisoMigracion visible /></div>;
  }

  const [[categoria], videos] = datos;
  if (!categoria) notFound();

  return (
    <CategoriaVista
      puedeEditar={puedeEditar}
      categoria={{ id: categoria.id_categoria, nombre: categoria.nombre, icono: categoria.icono }}
      videos={videos.map((v) => ({ id: v.id_video, youtube_id: v.youtube_id, titulo: v.titulo, canal: v.canal }))}
    />
  );
}
