import { sql } from "drizzle-orm";
import { usuarios } from "@/db/schema";

/**
 * En vez de mandar la foto (data URL en base64, decenas de KB por persona)
 * dentro de cada página, las consultas devuelven una URL corta a
 * /api/foto/[id]. La versión (`v`) es un hash de la foto calculado en la
 * base, así que el navegador la guarda una vez y sólo la vuelve a pedir
 * cuando la persona cambia su foto.
 */
export const fotoUrl = () =>
  sql<string | null>`CASE WHEN ${usuarios.foto} IS NULL OR ${usuarios.foto} = '' THEN NULL ELSE CONCAT('/api/foto/', ${usuarios.id_usuario}, '?v=', CRC32(${usuarios.foto})) END`;
