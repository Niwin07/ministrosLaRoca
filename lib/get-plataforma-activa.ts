import { cookies } from "next/headers";
import { db } from "@/db";
import { usuario_plataforma } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolverPlataforma, PLATAFORMA_IDS } from "./plataforma";

/**
 * Resuelve el id_plataforma activo para un usuario en este request.
 * Prioridad: cookie → plataforma principal → primera asignada → General.
 * Devuelve `undefined` para ADMINISTRADOR (ve todo sin filtro).
 */
export async function getPlataformaActivaId(
  id_usuario: number,
  rol: string,
): Promise<number | undefined> {
  if (rol === "ADMINISTRADOR") return undefined;

  const jar = await cookies();
  const cookieId = resolverPlataforma(jar.get("plataforma_activa")?.value);
  if (cookieId) return cookieId;

  // Cookie no seteada: buscar en BD la plataforma del usuario.
  const rows = await db
    .select({ id_plataforma: usuario_plataforma.id_plataforma, es_principal: usuario_plataforma.es_principal })
    .from(usuario_plataforma)
    .where(eq(usuario_plataforma.id_usuario, id_usuario));

  const principal = rows.find((r) => r.es_principal === 1);
  return principal?.id_plataforma ?? rows[0]?.id_plataforma ?? PLATAFORMA_IDS.general;
}
