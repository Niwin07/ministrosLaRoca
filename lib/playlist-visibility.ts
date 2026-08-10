export interface PlaylistVisibilidad {
  id_usuario: number;
  tipo:       string;
  estado:     string | null;
}

/**
 * Una lista es privada (solo visible para su dueño o ADMINISTRADOR/LIDER) si:
 * - es una plantilla (PRESET) — "Plantillas privadas creadas libremente por
 *   el Ministro" según la especificación funcional, o
 * - es un EVENTO todavía en PREPARACION (el ministro la está armando).
 * Una vez publicada (ENSAYO/DEFINITIVA) o archivada (MAZO) es visible para
 * todo el equipo — coincide con lo que ya expone `/playlists` ("Esta semana"
 * e "Historial") a cualquier usuario autenticado.
 */
export function esListaPrivada(p: PlaylistVisibilidad): boolean {
  if (p.tipo === "PRESET") return true;
  return p.tipo === "EVENTO" && p.estado === "PREPARACION";
}

export function puedeVerLista(
  p: PlaylistVisibilidad,
  user: { id_usuario: number; rol: string },
): boolean {
  if (!esListaPrivada(p)) return true;
  return user.id_usuario === p.id_usuario || user.rol === "ADMINISTRADOR" || user.rol === "LIDER";
}
