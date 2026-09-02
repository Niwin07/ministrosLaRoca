import { cache } from "react";
import { cookies } from "next/headers";
import { resolverPlataforma, PLATAFORMA_IDS } from "./plataforma";
import { getMisPlataformas } from "./usuario-request-cache";

/**
 * Resuelve el id_plataforma efectivamente seleccionado para este request.
 * Prioridad: cookie (si es válida) → plataforma principal → primera
 * asignada → General. A diferencia de `getPlataformaActivaId`, NUNCA
 * devuelve `undefined`: sirve para saber en qué plataforma está parado el
 * usuario (p. ej. para asignarle esa plataforma a contenido que crea), no
 * para filtrar un listado.
 *
 * Envuelta en React.cache(): se llama desde varias pages/actions distintas
 * dentro del mismo request.
 */
const resolverPlataformaEfectiva = cache(async (id_usuario: number): Promise<number> => {
  const jar = await cookies();
  const cookieId = resolverPlataforma(jar.get("plataforma_activa")?.value);
  if (cookieId) return cookieId;

  // Cookie no seteada: buscar en BD la plataforma del usuario.
  const rows = await getMisPlataformas(id_usuario);

  const principal = rows.find((r) => r.es_principal === 1);
  return principal?.id_plataforma ?? rows[0]?.id_plataforma ?? PLATAFORMA_IDS.general;
});

/**
 * Resuelve el id_plataforma activo para un usuario en este request, para
 * FILTRAR listados. Prioridad: cookie → plataforma principal → primera
 * asignada → General. Devuelve `undefined` para ADMINISTRADOR (ve todo sin
 * filtro).
 *
 * OJO: no usar esta función para decidir a qué plataforma pertenece algo
 * que el usuario está CREANDO (una lista, un turno) — para un ADMINISTRADOR
 * siempre devuelve `undefined`, así que un `?? PLATAFORMA_IDS.general` corriente
 * ignoraría la plataforma que el admin tiene seleccionada en el switcher y
 * todo lo que cree quedaría mal etiquetado como "General". Para eso usar
 * `getPlataformaEfectivaId`.
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
  return resolverPlataformaEfectiva(id_usuario);
});

/**
 * Resuelve la plataforma en la que el usuario está parado (para etiquetar
 * contenido nuevo), sin el atajo "sin filtro" de ADMINISTRADOR. Ver el
 * comentario de `getPlataformaActivaId` para el porqué.
 */
export const getPlataformaEfectivaId = cache(async (
  id_usuario: number,
): Promise<number> => {
  return resolverPlataformaEfectiva(id_usuario);
});
