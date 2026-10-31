import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { calentamiento_ejercicios, calentamiento_videos } from "@/db/schema";
import { consultaModulo, puedeEditarContenido } from "@/lib/modulos";
import { AvisoMigracion } from "@/components/zarza/ui";
import { CalentamientoVista } from "@/components/zarza/modulos/CalentamientoVista";

export const metadata = { title: "Calentamiento de voces · Ministros La Roca" };

export default async function CalentamientoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const puedeEditar = puedeEditarContenido(session.user.rol);

  const { datos, faltaMigracion } = await consultaModulo(
    () =>
      Promise.all([
        db.select().from(calentamiento_ejercicios).orderBy(asc(calentamiento_ejercicios.orden), asc(calentamiento_ejercicios.id_ejercicio)),
        db.select().from(calentamiento_videos).orderBy(asc(calentamiento_videos.orden), asc(calentamiento_videos.id_video)),
      ]),
    [[], []] as [(typeof calentamiento_ejercicios.$inferSelect)[], (typeof calentamiento_videos.$inferSelect)[]],
  );
  const [ejercicios, videos] = datos;

  return (
    <>
      {puedeEditar && <div className="px-4 pt-4 md:px-0"><AvisoMigracion visible={faltaMigracion} /></div>}
      <CalentamientoVista
        puedeEditar={puedeEditar && !faltaMigracion}
        ejercicios={ejercicios.map((e) => ({ id: e.id_ejercicio, titulo: e.nombre, detalle: e.descripcion }))}
        videos={videos.map((v) => ({ id: v.id_video, youtube_id: v.youtube_id, titulo: v.titulo }))}
      />
    </>
  );
}
