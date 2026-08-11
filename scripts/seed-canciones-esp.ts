// ============================================================================
// Seed de canciones en español (repertorio La Roca) contra la BD de .env.local.
// La data vive en ./canciones-esp-data.ts (compartida con el generador de SQL).
// Charts en Nashville: BEST-EFFORT — se cargan como PENDIENTE para verificar en
// /admin/canciones (Moderación) antes de aprobar.
//
// Uso:  npm run db:seed-canciones-esp
// ============================================================================

import { inArray } from "drizzle-orm";
import { db } from "../db/index";
import { canciones } from "../db/schema";
import { DATA } from "./canciones-esp-data";

// Idempotente (por nombre) y batcheado — antes insertaba una por una sin
// chequear si ya existía, así que correrlo dos veces duplicaba el repertorio.
async function seed() {
  console.log(`\nSeed: ${DATA.length} canciones (español) — estado PENDIENTE\n`);

  const existentes = new Set(
    (await db
      .select({ nombre: canciones.nombre })
      .from(canciones)
      .where(inArray(canciones.nombre, DATA.map((c) => c.nombre))))
      .map((r) => r.nombre),
  );

  const nuevas = DATA.filter((c) => !existentes.has(c.nombre));

  for (const c of DATA) {
    console.log(existentes.has(c.nombre) ? `  = ${c.nombre} (ya existía, salteada)` : `  ✓ ${c.nombre}`);
  }

  if (nuevas.length > 0) {
    await db.insert(canciones).values(nuevas);
  }

  console.log(`\n${nuevas.length} canciones insertadas, ${existentes.size} salteadas. Revisá los charts en /admin/canciones (Moderación).\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
