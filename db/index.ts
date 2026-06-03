import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// En desarrollo, Next.js re-evalúa módulos en cada hot reload.
// Sin este singleton, cada reload crea un nuevo pool sin cerrar el anterior,
// agotando el max_connections de MySQL.
const globalForDb = globalThis as unknown as { pool: mysql.Pool | undefined };

const pool =
  globalForDb.pool ??
  mysql.createPool({
    host:     process.env.DB_HOST     ?? "localhost",
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? "root",
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME     ?? "ministros",
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
