import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// En desarrollo, Next.js re-evalúa módulos en cada hot reload.
// Sin este singleton, cada reload crea un nuevo pool sin cerrar el anterior,
// agotando el max_connections de MySQL.
const globalForDb = globalThis as unknown as { pool: mysql.Pool | undefined };

// SSL para proveedores cloud (Aiven, etc.) que exigen conexión cifrada.
// `DB_SSL=true` activa TLS; `rejectUnauthorized: false` matchea el modo REQUIRED
// (cifra el tránsito sin verificar CA). En dev local (sin DB_SSL) queda sin SSL.
const ssl =
  process.env.DB_SSL === "true" || process.env.DB_SSL === "require"
    ? { rejectUnauthorized: false }
    : undefined;

const pool =
  globalForDb.pool ??
  mysql.createPool({
    host:     process.env.DB_HOST     ?? "localhost",
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? "root",
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME     ?? "ministros",
    ssl,
    // Acotado para serverless: muchas instancias × pool no deben agotar el
    // max_connections del MySQL gestionado.
    connectionLimit: 5,
  });

// Cachear el pool en el global también en producción: en serverless (Vercel)
// permite reusarlo entre invocaciones "calientes" de la misma instancia.
globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
