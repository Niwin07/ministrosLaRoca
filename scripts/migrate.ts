// ============================================================================
// Aplica todas las migraciones SQL de scripts/sql/ en orden, usando las
// credenciales de .env.local. Pensado para Windows/PowerShell, donde el
// comando `mysql ... < archivo.sql` no funciona (el shell no soporta `<`).
//
// Es idempotente: las migraciones ya aplicadas (columna/índice existente) se
// saltean sin error, y los UPDATE de datos no afectan filas si ya corrieron.
//
// Uso:
//   npm run db:migrate
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

async function main() {
  const dir = resolve(process.cwd(), "scripts/sql");
  const archivos = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (archivos.length === 0) {
    console.log("No hay migraciones en scripts/sql/.");
    return;
  }

  const conn = await mysql.createConnection({
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

  try {
    for (const archivo of archivos) {
      const sql = readFileSync(resolve(dir, archivo), "utf8");
      try {
        await conn.query(sql);
        console.log(`✅ ${archivo}`);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "ER_DUP_FIELDNAME" || code === "ER_DUP_KEYNAME") {
          console.log(`ℹ️  ${archivo} — ya estaba aplicada, se saltea.`);
        } else {
          throw err;
        }
      }
    }
    console.log("Migraciones completas.");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("❌ Error aplicando migraciones:", e);
  process.exit(1);
});
