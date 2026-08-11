import { cache } from "react";
import { db } from "@/db";
import { usuarios, usuario_plataforma, plataformas } from "@/db/schema";
import { eq } from "drizzle-orm";

// Helpers envueltos en React.cache(): memoizan por request (no entre
// requests), así que si dos puntos del árbol de render (ej. app/layout.tsx y
// app/page.tsx) piden lo mismo para el mismo usuario dentro del mismo
// request, la query a MySQL se ejecuta una sola vez. Antes cada uno hacía su
// propio `db.select` independiente.

export const getUsuarioFoto = cache(async (id_usuario: number): Promise<string | null> => {
  const [row] = await db
    .select({ foto: usuarios.foto })
    .from(usuarios)
    .where(eq(usuarios.id_usuario, id_usuario))
    .limit(1);
  return row?.foto ?? null;
});

export interface PlataformaUsuario {
  id_plataforma: number;
  nombre:        string;
  es_principal:  number;
}

export const getMisPlataformas = cache(async (id_usuario: number): Promise<PlataformaUsuario[]> => {
  return db
    .select({
      id_plataforma: plataformas.id_plataforma,
      nombre:        plataformas.nombre,
      es_principal:  usuario_plataforma.es_principal,
    })
    .from(usuario_plataforma)
    .innerJoin(plataformas, eq(usuario_plataforma.id_plataforma, plataformas.id_plataforma))
    .where(eq(usuario_plataforma.id_usuario, id_usuario));
});
