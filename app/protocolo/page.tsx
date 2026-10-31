import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { protocolo_pasos } from "@/db/schema";
import { consultaModulo, puedeEditarContenido } from "@/lib/modulos";
import { AvisoMigracion } from "@/components/zarza/ui";
import { ProtocoloVista } from "@/components/zarza/modulos/ProtocoloVista";

export const metadata = { title: "Protocolo de sonido · Ministros La Roca" };

export default async function ProtocoloPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const puedeEditar = puedeEditarContenido(session.user.rol);

  const { datos: pasos, faltaMigracion } = await consultaModulo(
    () => db.select().from(protocolo_pasos).orderBy(asc(protocolo_pasos.orden), asc(protocolo_pasos.id_paso)),
    [] as (typeof protocolo_pasos.$inferSelect)[],
  );

  return (
    <>
      {puedeEditar && <div className="px-4 pt-4 md:px-0"><AvisoMigracion visible={faltaMigracion} /></div>}
      <ProtocoloVista
        puedeEditar={puedeEditar && !faltaMigracion}
        pasos={pasos.map((p) => ({ id: p.id_paso, titulo: p.titulo, detalle: p.detalle, youtube_id: p.youtube_id }))}
      />
    </>
  );
}
