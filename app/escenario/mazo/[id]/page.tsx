import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { canciones, lista_canciones, playlists } from "@/db/schema";
import { auth } from "@/auth";
import { LectorEscenario } from "@/components/LectorEscenario";

export default async function EscenarioMazoPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const rows = await db
    .select({
      nombre_lista:     playlists.nombre,
      id_lista_cancion: lista_canciones.id_lista_cancion,
      orden:            lista_canciones.orden,
      nota:             lista_canciones.nota,
      nombre:           canciones.nombre,
      artista:          canciones.artista,
      letra:            canciones.letra,
      charts:           canciones.charts,
    })
    .from(playlists)
    .leftJoin(lista_canciones, eq(lista_canciones.id_playlist, playlists.id_playlist))
    .leftJoin(canciones, eq(canciones.id_cancion, lista_canciones.id_cancion))
    .where(eq(playlists.id_playlist, id))
    .orderBy(lista_canciones.orden);

  if (rows.length === 0) notFound();

  const items = rows
    .filter((r) => r.id_lista_cancion !== null)
    .map((r) => ({
      id_lista_cancion: r.id_lista_cancion!,
      orden:            r.orden!,
      nota:             r.nota,
      nombre:           r.nombre!,
      artista:          r.artista!,
      letra:            r.letra,
      charts:           r.charts,
    }));

  return (
    <LectorEscenario
      nombre_lista={rows[0].nombre_lista}
      canciones={items}
    />
  );
}
