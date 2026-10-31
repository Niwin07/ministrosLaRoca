import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { mejorar_categorias, mejorar_videos } from "@/db/schema";
import { consultaModulo, puedeEditarContenido } from "@/lib/modulos";
import { AvisoMigracion } from "@/components/zarza/ui";
import { MejorarVista } from "@/components/zarza/modulos/MejorarVista";

export const metadata = { title: "Quiero mejorar · Ministros La Roca" };

export default async function MejorarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const puedeEditar = puedeEditarContenido(session.user.rol);

  const { datos: categorias, faltaMigracion } = await consultaModulo(
    () =>
      db
        .select({
          id: mejorar_categorias.id_categoria,
          nombre: mejorar_categorias.nombre,
          icono: mejorar_categorias.icono,
          color: mejorar_categorias.color,
          videos: sql<number>`COUNT(${mejorar_videos.id_video})`,
        })
        .from(mejorar_categorias)
        .leftJoin(mejorar_videos, eq(mejorar_videos.id_categoria, mejorar_categorias.id_categoria))
        .groupBy(mejorar_categorias.id_categoria, mejorar_categorias.nombre, mejorar_categorias.icono, mejorar_categorias.color, mejorar_categorias.orden)
        .orderBy(asc(mejorar_categorias.orden), asc(mejorar_categorias.id_categoria)),
    [] as { id: number; nombre: string; icono: string; color: string; videos: number }[],
  );

  return (
    <>
      {puedeEditar && <div className="px-4 pt-4 md:px-0"><AvisoMigracion visible={faltaMigracion} /></div>}
      <MejorarVista
        puedeEditar={puedeEditar && !faltaMigracion}
        categorias={categorias.map((c) => ({ ...c, videos: Number(c.videos) }))}
      />
    </>
  );
}
