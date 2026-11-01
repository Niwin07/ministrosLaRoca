import { sql, type AnyColumn } from "drizzle-orm";
import { usuarios } from "@/db/schema";

/** La tabla usuarios o un alias suyo (p. ej. principal/auxiliar de sonido). */
type TablaUsuarios = { foto: AnyColumn; id_usuario: AnyColumn };

/**
 * En vez de mandar la foto (data URL en base64, decenas de KB por persona)
 * dentro de cada página, las consultas devuelven una URL corta a
 * /api/foto/[id]. La versión (`v`) es un hash de la foto calculado en la
 * base, así que el navegador la guarda una vez y sólo la vuelve a pedir
 * cuando la persona cambia su foto.
 */
export const fotoUrl = (t: TablaUsuarios = usuarios) =>
  sql<string | null>`CASE WHEN ${t.foto} IS NULL OR ${t.foto} = '' THEN NULL ELSE CONCAT('/api/foto/', ${t.id_usuario}, '?v=', CRC32(${t.foto})) END`;
