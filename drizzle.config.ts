import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "mysql",
  dbCredentials: {
    host:     process.env.DB_HOST     ?? "localhost",
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? "root",
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME     ?? "ministros",
    ssl:
      process.env.DB_SSL === "true" || process.env.DB_SSL === "require"
        ? { rejectUnauthorized: false }
        : undefined,
  },
} satisfies Config;
