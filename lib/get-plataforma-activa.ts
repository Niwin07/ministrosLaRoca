import { cache } from "react";
import { cookies } from "next/headers";
import { resolverPlataforma, PLATAFORMA_IDS } from "./plataforma";
import { getMisPlataformas } from "./usuario-request-cache";

/**
 * Resuelve el id_plataforma activo para un usuario en este request.
 * Prioridad: cookie → plataforma principal → primera asignada → General.
 * Devuelve `undefined` para ADMINISTRADOR (ve todo sin filtro).
 *
 * Envuelta en React.cache(): se llama desde varias pages/actions distintas
 * dentro del mismo request (turnos, playlists, admin/turnos) — antes cada
 * una repetía la consulta a usuario_plataforma si la cookie no estaba seteada.
 */
export const getPlataformaActivaId = cache(async (
  id_usuario: number,
  rol: string,
): Promise<number | undefined> => {
  if (rol === "ADMINISTRADOR") return undefined;

  const jar = await cookies();
  const cookieId = resolverPlataforma(jar.get("plataforma_activa")?.value);
  if (cookieId) return cookieId;

  // Cookie no seteada: buscar en BD la plataforma del usuario.
  const rows = await getMisPlataformas(id_usuario);

  const principal = rows.find((r) => r.es_principal === 1);
  return principal?.id_plataforma ?? rows[0]?.id_plataforma ?? PLATAFORMA_IDS.general;
});
