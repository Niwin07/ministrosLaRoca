"use server";

// Prepara la base de datos para los módulos nuevos (Calentamiento, Protocolo,
// Quiero mejorar, Turnos de sonido y estilo/tono del repertorio) desde la app, para no depender de correr
// `npm run db:migrate` en una consola. Sólo ADMINISTRADOR.

import mysql from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SQL_CANCIONES_ESTILO, SQL_MODULOS_ZARZA } from "@/lib/migracion-modulos";
import type { ResultadoAccion } from "@/app/actions/contenido";

export async function prepararModulos(): Promise<ResultadoAccion> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado." };
  if (session.user.rol !== "ADMINISTRADOR") {
    return { ok: false, error: "Sólo un administrador puede preparar la base de datos." };
  }

  // Conexión aparte (no el pool): la migración necesita varias sentencias juntas.
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     ?? "localhost",
      port:     Number(process.env.DB_PORT ?? 3306),
      user:     process.env.DB_USER     ?? "root",
      password: process.env.DB_PASSWORD || undefined,
      database: process.env.DB_NAME     ?? "ministros",
      ssl:
        process.env.DB_SSL === "true" || process.env.DB_SSL === "require"
          ? { rejectUnauthorized: false }
          : undefined,
      multipleStatements: true,
    });
    await conn.query(SQL_MODULOS_ZARZA);
    try {
      await conn.query(SQL_CANCIONES_ESTILO);
    } catch (e) {
      // Ya aplicada (columna o índice existente): se saltea.
      const code = (e as { code?: string }).code;
      if (code !== "ER_DUP_FIELDNAME" && code !== "ER_DUP_KEYNAME") throw e;
    }
  } catch (e) {
    console.error("[prepararModulos]", e);
    return { ok: false, error: "No se pudo preparar la base de datos. Revisá los logs del servidor." };
  } finally {
    await conn?.end().catch(() => {});
  }

  for (const ruta of ["/canciones", "/calentamiento", "/protocolo", "/mejorar", "/admin/turnos", "/turnos", "/"]) {
    revalidatePath(ruta);
  }
  return { ok: true };
}
